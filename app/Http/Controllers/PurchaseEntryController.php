<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseEntryRequest;
use App\Models\Product;
use App\Models\PurchaseEntry;
use App\Models\PurchaseInvoice;
use App\Services\ParanaNfceImporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PurchaseEntryController extends Controller
{
    private const IMPORT_SESSION_KEY = 'purchase_import_preview';
    private const IMPORT_DISCOUNT_PRODUCT_NAME = 'Desconto da nota';

    public function index(Request $request): Response
    {
        $user = $request->user();
        $products = $user->products()
            ->with('category:id,name,color')
            ->orderBy('name')
            ->get();

        $categories = $user->categories()
            ->where('kind', 'produto')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('Purchases/Index', [
            'products' => $products
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'current_stock' => (float) $product->current_stock,
                    'category' => $product->category?->name,
                    'category_id' => $product->category_id,
                ]),
            'categories' => $categories,
            'sources' => [
                ['value' => 'manual', 'label' => 'Manual'],
                ['value' => 'nota_fiscal', 'label' => 'Nota fiscal'],
            ],
            'importPreview' => $this->previewFromSession(
                $request,
                $products,
            ),
            'entries' => $user->purchaseEntries()
                ->with('product:id,name,unit')
                ->latest('purchased_at')
                ->limit(30)
                ->get()
                ->map(fn (PurchaseEntry $entry) => [
                    'id' => $entry->id,
                    'product' => $entry->product?->name,
                    'unit' => $entry->product?->unit,
                    'quantity' => (float) $entry->quantity,
                    'unit_price' => (float) $entry->unit_price,
                    'total_amount' => (float) $entry->total_amount,
                    'source' => $entry->source,
                    'invoice_reference' => $entry->invoice_reference,
                    'notes' => $entry->notes,
                    'purchased_at' => $entry->purchased_at?->toDateString(),
                    'created_at' => $entry->created_at?->toDateString(),
                ]),
        ]);
    }

    public function store(StorePurchaseEntryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated) {
            $product = $request->user()
                ->products()
                ->findOrFail($validated['product_id']);

            $totalAmount = round(
                (float) $validated['quantity'] * (float) $validated['unit_price'],
                2,
            );

            $request->user()->purchaseEntries()->create([
                ...$validated,
                'total_amount' => $totalAmount,
            ]);

            $product->update([
                'current_stock' => (float) $product->current_stock + (float) $validated['quantity'],
            ]);
        });

        return back()->with('success', 'Compra registrada com sucesso.');
    }

    public function importFromLink(
        Request $request,
        ParanaNfceImporter $importer,
    ): RedirectResponse {
        $validated = $request->validate([
            'receipt_url' => ['required', 'string', 'max:2000'],
        ]);

        if (! preg_match('/^https?:\/\//i', trim($validated['receipt_url']))) {
            return back()->withErrors([
                'receipt_url' => 'Informe um link HTTP ou HTTPS valido da NFC-e.',
            ]);
        }

        try {
            $preview = $importer->import($validated['receipt_url']);
        } catch (Throwable $exception) {
            return back()->with('error', $exception->getMessage());
        }

        $preview['items'] = $this->appendDiscountItem($preview);

        $request->session()->put(self::IMPORT_SESSION_KEY, [
            'token' => (string) Str::uuid(),
            'receipt_url' => $validated['receipt_url'],
            ...$preview,
        ]);

        return redirect()
            ->route('purchases.index')
            ->with('success', 'NFC-e importada. Revise os itens e confirme a classificacao.');
    }

    public function confirmImported(
        Request $request,
        ParanaNfceImporter $importer,
    ): RedirectResponse {
        $preview = $request->session()->get(self::IMPORT_SESSION_KEY);

        if (! is_array($preview) || ! isset($preview['items'], $preview['token'])) {
            return back()->with('error', 'A importacao da NFC-e expirou. Importe o link novamente.');
        }

        $user = $request->user();
        $itemsCount = count($preview['items']);

        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
            'items' => ['required', 'array', 'size:'.$itemsCount],
            'items.*.include' => ['required', 'boolean'],
            'items.*.product_id' => [
                'nullable',
                'integer',
                Rule::exists('products', 'id')->where('user_id', $user->id),
            ],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['nullable'],
            'items.*.category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $user->id),
            ],
        ])->after(function ($validator) use ($request, $preview) {
            if ($request->string('token')->toString() !== $preview['token']) {
                $validator->errors()->add('token', 'A revisao dessa importacao ficou desatualizada.');
            }

            $includedItems = 0;

            foreach ((array) $request->input('items', []) as $index => $item) {
                if (! ($item['include'] ?? true)) {
                    continue;
                }

                $includedItems++;
                $isDiscountItem = (bool) ($preview['items'][$index]['is_discount'] ?? false);

                if (! $isDiscountItem && (
                    blank($item['quantity'] ?? null)
                    || ! is_numeric($item['quantity'])
                    || (float) $item['quantity'] <= 0
                )) {
                    $validator->errors()->add(
                        "items.$index.quantity",
                        'Informe uma quantidade maior que zero.',
                    );
                }

                if (blank($item['product_id'] ?? null) && blank($item['product_name'] ?? null)) {
                    $validator->errors()->add(
                        "items.$index.product_name",
                        'Escolha um produto existente ou informe um nome.',
                    );
                }
            }

            if ($includedItems === 0) {
                $validator->errors()->add('items', 'Selecione ao menos um item para confirmar a NFC-e.');
            }
        });

        $validated = $validator->validate();

        DB::transaction(function () use ($user, $preview, $validated, $importer) {
            $invoice = $this->createImportedInvoice($user, $preview);

            foreach (array_values($preview['items']) as $index => $previewItem) {
                $payload = $validated['items'][$index];

                if (! $payload['include']) {
                    continue;
                }

                $isDiscountItem = (bool) ($previewItem['is_discount'] ?? false);

                $product = ! empty($payload['product_id'])
                    ? $user->products()->findOrFail($payload['product_id'])
                    : $this->firstOrCreateImportedProduct(
                        $user,
                        trim($payload['product_name']),
                        $isDiscountItem ? null : ($payload['category_id'] ?? null),
                        $previewItem['code'] ?? null,
                        $isDiscountItem
                            ? 'un'
                            : $importer->normalizeUnit($previewItem['unit'] ?? null),
                    );

                if (
                    ! $isDiscountItem
                    && ! empty($payload['category_id'])
                    && $product->category_id !== (int) $payload['category_id']
                ) {
                    $product->update([
                        'category_id' => $payload['category_id'],
                    ]);
                }

                $totalAmount = round(
                    (float) ($previewItem['total_amount']
                        ?? ((float) $previewItem['quantity'] * (float) $previewItem['unit_price'])),
                    2,
                );
                $quantity = $isDiscountItem
                    ? 0.0
                    : round((float) $payload['quantity'], 3);
                $unitPrice = $isDiscountItem
                    ? $totalAmount
                    : ($quantity > 0 ? round($totalAmount / $quantity, 2) : 0.0);

                $user->purchaseEntries()->create([
                    'product_id' => $product->id,
                    'purchase_invoice_id' => $invoice->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_amount' => $totalAmount,
                    'purchased_at' => $preview['issued_at'] ?? now()->toDateString(),
                    'source' => 'nota_fiscal',
                    'invoice_reference' => $preview['access_key'] ?? $preview['invoice_number'],
                    'notes' => sprintf(
                        'Importado via NFC-e de %s. Item: %s%s',
                        $preview['store_name'],
                        $previewItem['name'],
                        ! empty($previewItem['code']) ? ' (codigo '.$previewItem['code'].')' : '',
                    ),
                ]);

                if (! $isDiscountItem) {
                    $product->update([
                        'current_stock' => (float) $product->current_stock + $quantity,
                    ]);
                }
            }
        });

        $request->session()->forget(self::IMPORT_SESSION_KEY);

        return redirect()
            ->route('purchases.index')
            ->with('success', 'NFC-e confirmada e compras lancadas no estoque.');
    }

    public function clearImported(Request $request): RedirectResponse
    {
        $request->session()->forget(self::IMPORT_SESSION_KEY);

        return back()->with('success', 'Rascunho da importacao removido.');
    }

    public function destroy(Request $request, PurchaseEntry $purchaseEntry): RedirectResponse
    {
        abort_unless($purchaseEntry->user_id === $request->user()->id, 404);

        DB::transaction(function () use ($purchaseEntry) {
            $product = $purchaseEntry->product;

            if ($product) {
                $product->update([
                    'current_stock' => max(
                        0,
                        (float) $product->current_stock - (float) $purchaseEntry->quantity,
                    ),
                ]);
            }

            $purchaseEntry->delete();
        });

        return back()->with('success', 'Registro de compra removido.');
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, Product>  $products
     * @return array<string, mixed>|null
     */
    private function previewFromSession(
        Request $request,
        $products,
    ): ?array {
        $preview = $request->session()->get(self::IMPORT_SESSION_KEY);

        if (! is_array($preview) || ! isset($preview['items'])) {
            return null;
        }

        return [
            'token' => $preview['token'],
            'receipt_url' => $preview['receipt_url'] ?? null,
            'store_name' => $preview['store_name'] ?? null,
            'cnpj' => $preview['cnpj'] ?? null,
            'address' => $preview['address'] ?? null,
            'invoice_number' => $preview['invoice_number'] ?? null,
            'series' => $preview['series'] ?? null,
            'issued_at' => $preview['issued_at'] ?? null,
            'issued_at_label' => $preview['issued_at_label'] ?? null,
            'access_key' => $preview['access_key'] ?? null,
            'total_items' => $preview['total_items'] ?? 0,
            'total_amount' => (float) ($preview['total_amount'] ?? 0),
            'discount_amount' => (float) ($preview['discount_amount'] ?? 0),
            'amount_paid' => (float) ($preview['amount_paid'] ?? 0),
            'payment_methods' => $preview['payment_methods'] ?? [],
            'items' => collect($preview['items'])
                ->values()
                ->map(function (array $item, int $index) use ($products) {
                    $suggestion = $this->suggestProduct($products, $item['name']);
                    $matchedProduct = $suggestion['product'] ?? null;

                    return [
                        'index' => $index,
                        'name' => $item['name'],
                        'code' => $item['code'] ?? null,
                        'quantity' => (float) $item['quantity'],
                        'unit' => $item['unit'],
                        'unit_price' => (float) $item['unit_price'],
                        'total_amount' => (float) $item['total_amount'],
                        'is_discount' => (bool) ($item['is_discount'] ?? false),
                        'suggested_product_id' => $matchedProduct?->id,
                        'suggested_product_name' => $matchedProduct?->name ?? $item['name'],
                        'suggested_category_id' => $matchedProduct?->category_id,
                        'suggestion_score' => $suggestion['score'] ?? null,
                    ];
                }),
        ];
    }

    private function firstOrCreateImportedProduct(
        $user,
        string $name,
        ?int $categoryId,
        ?string $sku,
        string $unit,
    ): Product {
        $existingProduct = $user->products()
            ->whereRaw('LOWER(name) = ?', [Str::lower($name)])
            ->first();

        if ($existingProduct) {
            return $existingProduct;
        }

        return $user->products()->create([
            'name' => $name,
            'category_id' => $categoryId,
            'brand' => null,
            'sku' => $sku,
            'unit' => $unit,
            'minimum_stock' => 0,
            'current_stock' => 0,
            'is_active' => true,
            'notes' => 'Criado automaticamente pela importacao da NFC-e.',
        ]);
    }

    private function normalizeName(string $value): string
    {
        return Str::of(Str::ascii($value))
            ->replaceMatches('/[^A-Za-z0-9]+/', ' ')
            ->lower()
            ->squish()
            ->toString();
    }

    /**
     * @param  array<string, mixed>  $preview
     * @return array<int, array<string, mixed>>
     */
    private function appendDiscountItem(array $preview): array
    {
        $items = array_values((array) ($preview['items'] ?? []));
        $discountAmount = round((float) ($preview['discount_amount'] ?? 0), 2);

        if ($discountAmount <= 0) {
            return $items;
        }

        $items[] = [
            'name' => self::IMPORT_DISCOUNT_PRODUCT_NAME,
            'code' => null,
            'quantity' => 0,
            'unit' => 'UN',
            'unit_price' => -$discountAmount,
            'total_amount' => -$discountAmount,
            'is_discount' => true,
        ];

        return $items;
    }

    /**
     * @param  array<string, mixed>  $preview
     */
    private function createImportedInvoice($user, array $preview): PurchaseInvoice
    {
        return $user->purchaseInvoices()->create([
            'store_name' => $preview['store_name'] ?? 'Nota fiscal importada',
            'cnpj' => $preview['cnpj'] ?? null,
            'address' => $preview['address'] ?? null,
            'invoice_number' => $preview['invoice_number'] ?? null,
            'series' => $preview['series'] ?? null,
            'access_key' => $preview['access_key'] ?? null,
            'receipt_url' => $preview['receipt_url'] ?? null,
            'issued_at' => $preview['issued_at'] ?? now()->toDateString(),
            'items_count' => collect($preview['items'] ?? [])
                ->reject(fn (array $item) => (bool) ($item['is_discount'] ?? false))
                ->count(),
            'gross_amount' => round((float) ($preview['total_amount'] ?? 0), 2),
            'discount_amount' => round((float) ($preview['discount_amount'] ?? 0), 2),
            'paid_amount' => round((float) ($preview['amount_paid'] ?? 0), 2),
        ]);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, Product>  $products
     * @return array{product: Product, score: float}|null
     */
    private function suggestProduct($products, string $itemName): ?array
    {
        $normalizedItemName = $this->normalizeName($itemName);

        if ($normalizedItemName === '') {
            return null;
        }

        $bestProduct = null;
        $bestScore = 0.0;

        foreach ($products as $product) {
            $score = $this->nameSimilarityScore(
                $normalizedItemName,
                $this->normalizeName($product->name),
            );

            if ($score <= $bestScore) {
                continue;
            }

            $bestProduct = $product;
            $bestScore = $score;
        }

        if (! $bestProduct || $bestScore < 58.0) {
            return null;
        }

        return [
            'product' => $bestProduct,
            'score' => round($bestScore, 1),
        ];
    }

    private function nameSimilarityScore(string $left, string $right): float
    {
        if ($left === '' || $right === '') {
            return 0.0;
        }

        if ($left === $right) {
            return 100.0;
        }

        similar_text($left, $right, $characterScore);

        $leftTokens = array_values(array_filter(explode(' ', $left)));
        $rightTokens = array_values(array_filter(explode(' ', $right)));
        $sharedTokens = array_intersect($leftTokens, $rightTokens);
        $tokenScore = 0.0;

        if ($leftTokens !== [] || $rightTokens !== []) {
            $tokenScore = (count($sharedTokens) / max(count(array_unique([
                ...$leftTokens,
                ...$rightTokens,
            ])), 1)) * 100;
        }

        if (str_contains($left, $right) || str_contains($right, $left)) {
            $tokenScore = max($tokenScore, 85.0);
        }

        return max(
            $characterScore,
            $tokenScore,
            (($characterScore * 0.65) + ($tokenScore * 0.35)),
        );
    }
}
