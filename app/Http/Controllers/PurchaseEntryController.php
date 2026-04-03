<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseEntryRequest;
use App\Models\Product;
use App\Models\PurchaseEntry;
use App\Models\PurchaseInvoice;
use App\Services\ParanaNfceImporter;
use Carbon\Carbon;
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
        $house = $request->user()->getCurrentHouse();
        $products = $house->products()
            ->with('category:id,name,color')
            ->orderBy('name')
            ->get();

        $categories = $house->categories()
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        $accounts = $house->accounts()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

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
            'accounts' => $accounts,
            'sources' => [
                ['value' => 'manual', 'label' => 'Manual'],
                ['value' => 'invoice', 'label' => 'Nota fiscal'],
            ],
            'importUnits' => [
                ['value' => 'un', 'label' => 'UN'],
                ['value' => 'kg', 'label' => 'KG'],
            ],
            'importPreview' => $this->previewFromSession($request, $products),
            'entries' => $house->purchaseEntries()
                ->with('product:id,name,unit', 'account:id,code,name')
                ->latest('purchased_at')
                ->latest('id')
                ->get()
                ->map(fn (PurchaseEntry $entry) => [
                    'id' => $entry->id,
                    'product_id' => $entry->product_id,
                    'product' => $entry->product?->name,
                    'unit' => $entry->product?->unit,
                    'account_id' => $entry->account_id,
                    'account' => $entry->account ? [
                        'id' => $entry->account->id,
                        'code' => $entry->account->code,
                        'name' => $entry->account->name,
                    ] : null,
                    'quantity' => (float) $entry->quantity,
                    'unit_price' => (float) $entry->unit_price,
                    'total_amount' => (float) $entry->total_amount,
                    'source' => $entry->source,
                    'invoice_reference' => $entry->invoice_reference,
                    'notes' => $entry->notes,
                    'purchased_at' => $entry->purchased_at,
                    'created_at' => $entry->created_at?->toDateString(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();

        if (is_array($request->input('items'))) {
            return $this->storeWizard($request, $house);
        }

        $validated = Validator::make($request->all(), $this->simpleStoreRules($house->id))->validate();

        DB::transaction(function () use ($house, $validated) {
            $product = $house->products()->findOrFail($validated['product_id']);

            $totalAmount = round((float) $validated['quantity'] * (float) $validated['unit_price'], 2);

            $purchaseEntry = $house->purchaseEntries()->create([
                ...$validated,
                'total_amount' => $totalAmount,
            ]);

            $this->syncPurchaseFinancialEntry($house->id, $purchaseEntry);

            if ($product->type === 'stockable') {
                $product->update([
                    'current_stock' => (float) $product->current_stock + (float) $validated['quantity'],
                ]);
            }
        });

        return back()->with('success', 'Compra registrada com sucesso.');
    }

    public function update(
        StorePurchaseEntryRequest $request,
        PurchaseEntry $purchaseEntry,
    ): RedirectResponse {
        $house = $request->user()->getCurrentHouse();
        abort_unless($purchaseEntry->house_id === $house->id, 404);

        $validated = $request->validated();

        DB::transaction(function () use ($house, $purchaseEntry, $validated) {
            $previousProduct = $purchaseEntry->product;
            $nextProduct = $house->products()
                ->findOrFail($validated['product_id']);

            if ($previousProduct && $previousProduct->type === 'stockable') {
                $previousProduct->update([
                    'current_stock' => max(
                        0,
                        (float) $previousProduct->current_stock - (float) $purchaseEntry->quantity,
                    ),
                ]);
            }

            $totalAmount = round(
                (float) $validated['quantity'] * (float) $validated['unit_price'],
                2,
            );

            $purchaseEntry->update([
                ...$validated,
                'total_amount' => $totalAmount,
            ]);

            $this->syncPurchaseFinancialEntry($house->id, $purchaseEntry);

            if ($nextProduct->type === 'stockable') {
                $nextProduct->update([
                    'current_stock' => (float) $nextProduct->current_stock + (float) $validated['quantity'],
                ]);
            }
        });

        return back()->with('success', 'Compra atualizada com sucesso.');
    }

    private function storeWizard(Request $request, $house): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'invoice' => ['required', 'array'],
            'invoice.has_invoice' => ['required', 'boolean'],
            'invoice.issued_at' => ['required', 'date'],
            'invoice.store_name' => ['nullable', 'string', 'max:255'],
            'invoice.cnpj' => ['nullable', 'string', 'max:255'],
            'invoice.invoice_number' => ['nullable', 'string', 'max:255'],
            'invoice.series' => ['nullable', 'string', 'max:255'],
            'invoice.access_key' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'nullable',
                'integer',
                Rule::exists('products', 'id')->where('house_id', $house->id),
            ],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.brand' => ['nullable', 'string', 'max:255'],
            'items.*.sku' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('house_id', $house->id),
            ],
            'items.*.unit' => ['nullable', Rule::in(['un', 'kg', 'g', 'l', 'ml', 'cx'])],
            'items.*.type' => ['nullable', Rule::in(['stockable', 'non_stockable'])],
            'items.*.minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where('house_id', $house->id),
            ],
            'payments.*.type' => ['required', Rule::in(['cash', 'installment'])],
            'payments.*.principal_amount' => ['required', 'numeric', 'gt:0'],
            'payments.*.first_due_date' => ['nullable', 'date'],
            'payments.*.installments' => ['nullable', 'integer', 'min:2', 'max:120'],
            'payments.*.interest_type' => ['nullable', Rule::in(['rate', 'fixed_installment'])],
            'payments.*.interest_rate' => ['nullable', 'numeric', 'min:0'],
            'payments.*.installment_amount' => ['nullable', 'numeric', 'gt:0'],
        ])->after(function ($validator) use ($request) {
            foreach ((array) $request->input('items', []) as $index => $item) {
                if (blank($item['product_id'] ?? null) && blank($item['product_name'] ?? null)) {
                    $validator->errors()->add(
                        "items.$index.product_name",
                        'Escolha um produto existente ou informe um nome.',
                    );
                }

                if (blank($item['product_id'] ?? null) && blank($item['type'] ?? null)) {
                    $validator->errors()->add(
                        "items.$index.type",
                        'Escolha o tipo para o novo produto.',
                    );
                }

                if (blank($item['product_id'] ?? null) && blank($item['unit'] ?? null)) {
                    $validator->errors()->add(
                        "items.$index.unit",
                        'Escolha a unidade para o novo produto.',
                    );
                }
            }

            foreach ((array) $request->input('payments', []) as $paymentIndex => $payment) {
                if (($payment['type'] ?? null) !== 'installment') {
                    continue;
                }

                if (
                    blank($payment['installments'] ?? null)
                    || ! is_numeric($payment['installments'])
                    || (int) $payment['installments'] < 2
                ) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.installments",
                        'Informe no minimo 2 parcelas.',
                    );
                }

                if (blank($payment['interest_type'] ?? null)) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.interest_type",
                        'Escolha como informar os juros do parcelamento.',
                    );
                    continue;
                }

                if (($payment['interest_type'] ?? null) === 'rate' && blank($payment['interest_rate'] ?? null)) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.interest_rate",
                        'Informe o percentual de juros.',
                    );
                }

                if (($payment['interest_type'] ?? null) === 'fixed_installment' && blank($payment['installment_amount'] ?? null)) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.installment_amount",
                        'Informe o valor da parcela.',
                    );
                }
            }

            $principalTotal = collect((array) $request->input('payments', []))
                ->sum(fn ($payment) => (float) ($payment['principal_amount'] ?? 0));
            $itemsTotal = collect((array) $request->input('items', []))
                ->sum(fn ($item) => ((float) ($item['quantity'] ?? 0)) * ((float) ($item['unit_price'] ?? 0)));

            if (abs(round($principalTotal, 2) - round($itemsTotal, 2)) > 0.01) {
                $validator->errors()->add(
                    'payments',
                    sprintf(
                        'A soma dos valores por conta (%s) deve ser igual ao total da compra (%s).',
                        number_format($principalTotal, 2, ',', '.'),
                        number_format($itemsTotal, 2, ',', '.'),
                    ),
                );
            }
        });

        $validated = $validator->validate();

        DB::transaction(function () use ($house, $validated) {
            $items = array_values($validated['items']);
            $payments = array_values($validated['payments']);
            $invoiceData = $validated['invoice'];
            $itemsTotal = round(collect($items)->sum(
                fn ($item) => ((float) $item['quantity']) * ((float) $item['unit_price'])
            ), 2);
            $hasInvoiceMetadata = (bool) ($invoiceData['has_invoice'] ?? false)
                || filled($invoiceData['store_name'] ?? null)
                || filled($invoiceData['invoice_number'] ?? null)
                || filled($invoiceData['series'] ?? null)
                || filled($invoiceData['access_key'] ?? null)
                || filled($invoiceData['cnpj'] ?? null);
            $requiresBatchInvoice = $hasInvoiceMetadata
                || count($items) > 1
                || count($payments) > 1
                || collect($payments)->contains(fn ($payment) => ($payment['type'] ?? 'cash') === 'installment');

            $invoice = $requiresBatchInvoice
                ? $this->createManualInvoice($house, $invoiceData, $items, $itemsTotal, $payments)
                : null;

            $createdEntries = [];

            foreach ($items as $item) {
                $product = ! empty($item['product_id'])
                    ? $house->products()->findOrFail($item['product_id'])
                    : $this->firstOrCreateManualProduct(
                        $house,
                        trim($item['product_name']),
                        $item['category_id'] ?? null,
                        $item['brand'] ?? null,
                        $item['sku'] ?? null,
                        $item['unit'] ?? 'un',
                        $item['type'] ?? 'stockable',
                        (float) ($item['minimum_stock'] ?? 0),
                        $item['notes'] ?? null,
                    );

                $quantity = round((float) $item['quantity'], 3);
                $unitPrice = round((float) $item['unit_price'], 2);
                $totalAmount = round($quantity * $unitPrice, 2);

                $purchaseEntry = $house->purchaseEntries()->create([
                    'product_id' => $product->id,
                    'purchase_invoice_id' => $invoice?->id,
                    'account_id' => $invoice ? null : (int) $payments[0]['account_id'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_amount' => $totalAmount,
                    'purchased_at' => $invoiceData['issued_at'],
                    'source' => $hasInvoiceMetadata ? 'invoice' : 'manual',
                    'invoice_reference' => $this->buildInvoiceReference($invoiceData),
                    'notes' => null,
                ]);

                $createdEntries[] = $purchaseEntry;

                if ($product->type === 'stockable') {
                    $product->update([
                        'current_stock' => (float) $product->current_stock + $quantity,
                    ]);
                }
            }

            if ($invoice) {
                $this->syncManualInvoiceFinancialEntries(
                    $house->id,
                    $invoice,
                    $payments,
                    $hasInvoiceMetadata ? 'invoice_purchase' : 'manual_purchase',
                );

                return;
            }

            if ($createdEntries !== []) {
                $this->syncPurchaseFinancialEntry(
                    $house->id,
                    $createdEntries[0],
                    $hasInvoiceMetadata ? 'invoice_purchase' : 'manual_purchase',
                );
            }
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

        $house = $request->user()->getCurrentHouse();
        $itemsCount = count($preview['items']);

        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
            'items' => ['required', 'array', 'size:'.$itemsCount],
            'items.*.include' => ['required', 'boolean'],
            'items.*.product_id' => [
                'nullable',
                'integer',
                Rule::exists('products', 'id')->where('house_id', $house->id),
            ],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.brand' => ['nullable', 'string', 'max:255'],
            'items.*.sku' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['nullable'],
            'items.*.category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('house_id', $house->id),
            ],
            'items.*.unit' => ['nullable', Rule::in(['un', 'kg', 'g', 'l', 'ml', 'cx'])],
            'items.*.type' => ['nullable', Rule::in(['stockable', 'non_stockable'])],
            'items.*.minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where('house_id', $house->id),
            ],
            'payments.*.type' => ['required', Rule::in(['cash', 'installment'])],
            'payments.*.principal_amount' => ['required', 'numeric', 'gt:0'],
            'payments.*.first_due_date' => ['nullable', 'date'],
            'payments.*.installments' => ['nullable', 'integer', 'min:2', 'max:120'],
            'payments.*.interest_type' => ['nullable', Rule::in(['rate', 'fixed_installment'])],
            'payments.*.interest_rate' => ['nullable', 'numeric', 'min:0'],
            'payments.*.installment_amount' => ['nullable', 'numeric', 'gt:0'],
        ])->after(function ($validator) use ($request, $preview) {
            if ($request->string('token')->toString() !== $preview['token']) {
                $validator->errors()->add('token', 'A revisao dessa importacao ficou desatualizada.');
            }

            $includedItems = 0;

            foreach ((array) $request->input('payments', []) as $paymentIndex => $payment) {
                $type = $payment['type'] ?? null;
                $interestType = $payment['interest_type'] ?? null;

                if ($type !== 'installment') {
                    continue;
                }

                if (
                    blank($payment['installments'] ?? null)
                    || ! is_numeric($payment['installments'])
                    || (int) $payment['installments'] < 2
                ) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.installments",
                        'Informe no minimo 2 parcelas.',
                    );
                }

                if (blank($interestType)) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.interest_type",
                        'Escolha como informar os juros do parcelamento.',
                    );
                    continue;
                }

                if ($interestType === 'rate' && blank($payment['interest_rate'] ?? null)) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.interest_rate",
                        'Informe o percentual de juros.',
                    );
                }

                if ($interestType === 'fixed_installment' && blank($payment['installment_amount'] ?? null)) {
                    $validator->errors()->add(
                        "payments.$paymentIndex.installment_amount",
                        'Informe o valor da parcela.',
                    );
                }
            }

            $principalTotal = collect((array) $request->input('payments', []))
                ->sum(fn ($payment) => (float) ($payment['principal_amount'] ?? 0));
            $invoicePaidAmount = round((float) ($preview['amount_paid'] ?? 0), 2);

            if (abs(round($principalTotal, 2) - $invoicePaidAmount) > 0.01) {
                $validator->errors()->add(
                    'payments',
                    sprintf(
                        'A soma dos valores por conta (%s) deve ser igual ao valor pago da nota (%s).',
                        number_format($principalTotal, 2, ',', '.'),
                        number_format($invoicePaidAmount, 2, ',', '.'),
                    ),
                );
            }

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

                if (! $isDiscountItem && blank($item['unit'] ?? null)) {
                    $validator->errors()->add(
                        "items.$index.unit",
                        'Escolha o tipo de unidade do item.',
                    );
                }

                if (! $isDiscountItem && blank($item['product_id'] ?? null) && blank($item['product_name'] ?? null)) {
                    $validator->errors()->add(
                        "items.$index.product_name",
                        'Escolha um produto existente ou informe um nome.',
                    );
                }

                if (
                    ! $isDiscountItem
                    && blank($item['product_id'] ?? null)
                    && blank($item['type'] ?? null)
                ) {
                    $validator->errors()->add(
                        "items.$index.type",
                        'Escolha o tipo para o novo produto.',
                    );
                }
            }

            if ($includedItems === 0) {
                $validator->errors()->add('items', 'Selecione ao menos um item para confirmar a NFC-e.');
            }
        });

        $validated = $validator->validate();

        DB::transaction(function () use ($house, $preview, $validated, $importer) {
            $invoice = $this->createImportedInvoice($house, $preview);

            foreach (array_values($preview['items']) as $index => $previewItem) {
                $payload = $validated['items'][$index];

                if (! $payload['include']) {
                    continue;
                }

                $isDiscountItem = (bool) ($previewItem['is_discount'] ?? false);
                $selectedType = $isDiscountItem
                    ? 'non_stockable'
                    : (($payload['type'] ?? null) ?: 'stockable');
                $unit = $isDiscountItem
                    ? 'un'
                    : (($payload['unit'] ?? null) ?: $importer->normalizeUnit($previewItem['unit'] ?? null));

                $totalAmount = round(
                    (float) ($previewItem['total_amount']
                        ?? ((float) $previewItem['quantity'] * (float) $previewItem['unit_price'])),
                    2,
                );

                if ($isDiscountItem) {
                    continue;
                }

                $product = ! empty($payload['product_id'])
                    ? $house->products()->findOrFail($payload['product_id'])
                    : $this->firstOrCreateImportedProduct(
                        $house,
                        trim($payload['product_name']),
                        $payload['category_id'] ?? null,
                        $payload['brand'] ?? null,
                        $payload['sku'] ?? ($previewItem['code'] ?? null),
                        $unit,
                        $selectedType,
                        (float) ($payload['minimum_stock'] ?? 0),
                        $payload['notes'] ?? null,
                    );

                if (
                    ! empty($payload['category_id'])
                    && $product->category_id !== (int) $payload['category_id']
                ) {
                    $product->update([
                        'category_id' => $payload['category_id'],
                    ]);
                }

                if ($product->unit !== $unit) {
                    $product->update([
                        'unit' => $unit,
                    ]);
                }

                if (! empty($payload['brand']) && $product->brand !== $payload['brand']) {
                    $product->update([
                        'brand' => $payload['brand'],
                    ]);
                }

                if (! empty($payload['sku']) && $product->sku !== $payload['sku']) {
                    $product->update([
                        'sku' => $payload['sku'],
                    ]);
                }

                if (
                    isset($payload['minimum_stock'])
                    && $product->type === 'stockable'
                    && (float) $product->minimum_stock !== (float) $payload['minimum_stock']
                ) {
                    $product->update([
                        'minimum_stock' => round((float) $payload['minimum_stock'], 3),
                    ]);
                }

                if (! empty($payload['notes']) && $product->notes !== $payload['notes']) {
                    $product->update([
                        'notes' => $payload['notes'],
                    ]);
                }

                $quantity = round((float) $payload['quantity'], 3);
                $unitPrice = $quantity > 0 ? round($totalAmount / $quantity, 2) : 0.0;

                $purchaseEntry = $house->purchaseEntries()->create([
                    'product_id' => $product->id,
                    'purchase_invoice_id' => $invoice->id,
                    'account_id' => null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_amount' => $totalAmount,
                    'purchased_at' => $preview['issued_at'] ?? now()->toDateString(),
                    'source' => 'invoice',
                    'invoice_reference' => $preview['access_key'] ?? $preview['invoice_number'],
                    'notes' => sprintf(
                        'Importado via NFC-e de %s. Item: %s%s',
                        $preview['store_name'],
                        $previewItem['name'],
                        ! empty($previewItem['code']) ? ' (codigo '.$previewItem['code'].')' : '',
                    ),
                ]);

                if ($product->type === 'stockable') {
                    $product->update([
                        'current_stock' => (float) $product->current_stock + (float) $purchaseEntry->quantity,
                    ]);
                }
            }

            $this->syncImportedInvoiceFinancialEntry(
                $house->id,
                $invoice,
                $validated['payments'],
            );
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
        $house = $request->user()->getCurrentHouse();
        abort_unless($purchaseEntry->house_id === $house->id, 404);

        DB::transaction(function () use ($purchaseEntry) {
            $product = $purchaseEntry->product;

            if ($product && $product->type === 'stockable') {
                $product->update([
                    'current_stock' => max(
                        0,
                        (float) $product->current_stock - (float) $purchaseEntry->quantity,
                    ),
                ]);
            }

            $purchaseEntry->financialEntries()->delete();

            $purchaseEntry->delete();
        });

        return back()->with('success', 'Registro de compra removido.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'required',
                'integer',
                Rule::exists('purchase_entries', 'id')->where(
                    'house_id',
                    $house->id,
                ),
            ],
        ]);

        $entries = $house->purchaseEntries()
            ->with('product')
            ->whereIn('id', $validated['ids'])
            ->get();

        DB::transaction(function () use ($entries) {
            foreach ($entries as $entry) {
                $product = $entry->product;

                if ($product && $product->type === 'stockable') {
                    $product->update([
                        'current_stock' => max(
                            0,
                            (float) $product->current_stock - (float) $entry->quantity,
                        ),
                    ]);
                }

                $entry->financialEntries()->delete();

                $entry->delete();
            }
        });

        $count = $entries->count();

        return back()->with(
            'success',
            $count === 1
                ? '1 registro de compra removido.'
                : "{$count} registros de compra removidos.",
        );
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
                    $suggestion = $this->suggestProduct(
                        $products,
                        $item['name'],
                        $item['code'] ?? null,
                    );
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
                        'suggested_unit' => $matchedProduct?->unit
                            ?? $this->normalizeImportUnit($item['unit'] ?? null),
                    ];
                }),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function simpleStoreRules(int $houseId): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where('house_id', $houseId),
            ],
            'account_id' => [
                'nullable',
                'integer',
                Rule::exists('accounts', 'id')->where('house_id', $houseId),
            ],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'purchased_at' => ['required', 'date'],
            'source' => ['required', Rule::in(['manual', 'invoice'])],
            'invoice_reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function normalizeImportUnit(?string $unit): string
    {
        return match (Str::lower(trim((string) $unit))) {
            'kg' => 'kg',
            default => 'un',
        };
    }

    private function firstOrCreateImportedProduct(
        $house,
        string $name,
        ?int $categoryId,
        ?string $brand,
        ?string $sku,
        string $unit,
        string $type = 'stockable',
        float $minimumStock = 0,
        ?string $notes = null,
    ): Product {
        $existingProduct = $house->products()
            ->whereRaw('LOWER(name) = ?', [Str::lower($name)])
            ->first();

        if ($existingProduct) {
            return $existingProduct;
        }

        return $house->products()->create([
            'name' => $name,
            'category_id' => $categoryId,
            'brand' => $brand,
            'sku' => $sku,
            'unit' => $unit,
            'type' => $type,
            'minimum_stock' => $type === 'stockable' ? round($minimumStock, 3) : 0,
            'current_stock' => 0,
            'is_active' => true,
            'notes' => $notes ?: 'Criado automaticamente pela importacao da NFC-e.',
        ]);
    }

    private function firstOrCreateManualProduct(
        $house,
        string $name,
        ?int $categoryId,
        ?string $brand,
        ?string $sku,
        string $unit,
        string $type = 'stockable',
        float $minimumStock = 0,
        ?string $notes = null,
    ): Product {
        $existingProduct = $house->products()
            ->whereRaw('LOWER(name) = ?', [Str::lower($name)])
            ->first();

        if ($existingProduct) {
            return $existingProduct;
        }

        return $house->products()->create([
            'name' => $name,
            'category_id' => $categoryId,
            'brand' => $brand,
            'sku' => $sku,
            'unit' => $unit,
            'type' => $type,
            'minimum_stock' => $type === 'stockable' ? round($minimumStock, 3) : 0,
            'current_stock' => 0,
            'is_active' => true,
            'notes' => $notes ?: 'Criado durante um lancamento manual.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $invoiceData
     * @param  array<int, array<string, mixed>>  $items
     * @param  array<int, array<string, mixed>>  $payments
     */
    private function createManualInvoice(
        $house,
        array $invoiceData,
        array $items,
        float $itemsTotal,
        array $payments,
    ): PurchaseInvoice {
        return $house->purchaseInvoices()->create([
            'store_name' => $invoiceData['has_invoice']
                ? ($invoiceData['store_name'] ?: 'Nota fiscal manual')
                : 'Compra manual',
            'cnpj' => $invoiceData['cnpj'] ?? null,
            'address' => null,
            'invoice_number' => $invoiceData['invoice_number'] ?? null,
            'series' => $invoiceData['series'] ?? null,
            'access_key' => $invoiceData['access_key'] ?? null,
            'receipt_url' => null,
            'issued_at' => $invoiceData['issued_at'] ?? now()->toDateString(),
            'items_count' => count($items),
            'gross_amount' => $itemsTotal,
            'discount_amount' => 0,
            'paid_amount' => round(collect($payments)->sum(
                fn ($payment) => (float) ($payment['principal_amount'] ?? 0)
            ), 2),
        ]);
    }

    /**
     * @param  array<string, mixed>  $invoiceData
     */
    private function buildInvoiceReference(array $invoiceData): ?string
    {
        $accessKey = trim((string) ($invoiceData['access_key'] ?? ''));

        if ($accessKey !== '') {
            return $accessKey;
        }

        $number = trim((string) ($invoiceData['invoice_number'] ?? ''));
        $series = trim((string) ($invoiceData['series'] ?? ''));

        if ($number === '' && $series === '') {
            return null;
        }

        if ($number !== '' && $series !== '') {
            return $number.' / serie '.$series;
        }

        return $number !== '' ? $number : $series;
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

    private function syncPurchaseFinancialEntry(
        int $houseId,
        PurchaseEntry $purchaseEntry,
        string $origin = 'manual_purchase',
    ): void {
        /** @var \App\Models\FinancialEntry|null $existingEntry */
        $existingEntry = $purchaseEntry->financialEntries()->first();

        if (! $purchaseEntry->account_id) {
            $existingEntry?->delete();

            return;
        }

        $payload = [
            'house_id' => $houseId,
            'account_id' => $purchaseEntry->account_id,
            'category_id' => $purchaseEntry->product?->category_id,
            'purchase_invoice_id' => $purchaseEntry->purchase_invoice_id,
            'direction' => 'outflow',
            'origin' => $origin,
            'amount' => round((float) $purchaseEntry->total_amount, 2),
            'moved_at' => $purchaseEntry->purchased_at ?? now()->toDateString(),
            'description' => $purchaseEntry->notes ?: sprintf(
                'Compra: %s',
                $purchaseEntry->product?->name ?? 'Item removido',
            ),
        ];

        if ($existingEntry) {
            $existingEntry->update($payload);

            return;
        }

        $purchaseEntry->financialEntries()->create($payload);
    }

    /**
     * @param  array<int, array<string, mixed>>  $payments
     */
    private function syncImportedInvoiceFinancialEntry(
        int $houseId,
        PurchaseInvoice $invoice,
        array $payments,
        string $origin = 'invoice_purchase',
        ?string $descriptionBase = null,
    ): void {
        $invoice->financialEntries()
            ->where('origin', $origin)
            ->delete();

        $label = $descriptionBase
            ?: ($origin === 'manual_purchase'
                ? 'Compra manual'
                : 'Compra da nota fiscal');

        foreach ($payments as $payment) {
            $accountId = (int) $payment['account_id'];
            $paymentType = (string) $payment['type'];
            $principalAmount = round((float) $payment['principal_amount'], 2);
            $firstDueDate = $payment['first_due_date']
                ?: ($invoice->issued_at ?? now()->toDateString());

            if ($paymentType === 'cash') {
                $invoice->financialEntries()->create([
                    'house_id' => $houseId,
                    'account_id' => $accountId,
                    'purchase_invoice_id' => $invoice->id,
                    'direction' => 'outflow',
                    'origin' => $origin,
                    'amount' => $principalAmount,
                    'moved_at' => $firstDueDate,
                    'description' => sprintf(
                        '%s%s - pagamento a vista',
                        $label,
                        $invoice->store_name ? ' - '.$invoice->store_name : '',
                    ),
                ]);

                continue;
            }

            $installments = max(2, (int) ($payment['installments'] ?? 2));
            $interestType = (string) ($payment['interest_type'] ?? 'rate');
            $interestRate = (float) ($payment['interest_rate'] ?? 0);
            $installmentAmount = $interestType === 'fixed_installment'
                ? round((float) ($payment['installment_amount'] ?? 0), 2)
                : $this->calculateInstallmentAmount(
                    $principalAmount,
                    $interestRate,
                    $installments,
                );

            for ($installment = 1; $installment <= $installments; $installment++) {
                $invoice->financialEntries()->create([
                    'house_id' => $houseId,
                    'account_id' => $accountId,
                    'purchase_invoice_id' => $invoice->id,
                    'direction' => 'outflow',
                    'origin' => $origin,
                    'amount' => $installmentAmount,
                    'moved_at' => Carbon::parse($firstDueDate)
                        ->addMonthsNoOverflow($installment - 1)
                        ->toDateString(),
                    'description' => sprintf(
                        '%s%s - parcela %d/%d',
                        $label,
                        $invoice->store_name ? ' - '.$invoice->store_name : '',
                        $installment,
                        $installments,
                    ),
                ]);
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $payments
     */
    private function syncManualInvoiceFinancialEntries(
        int $houseId,
        PurchaseInvoice $invoice,
        array $payments,
        string $origin = 'manual_purchase',
    ): void {
        $this->syncImportedInvoiceFinancialEntry(
            $houseId,
            $invoice,
            $payments,
            $origin,
            $origin === 'invoice_purchase' ? 'Compra da nota fiscal' : 'Compra manual',
        );
    }

    private function calculateInstallmentAmount(
        float $principalAmount,
        float $interestRatePercent,
        int $installments,
    ): float {
        $principal = max(0, $principalAmount);

        if ($principal <= 0 || $installments <= 0) {
            return 0.0;
        }

        $rate = max(0, $interestRatePercent) / 100;

        if ($rate <= 0) {
            return round($principal / $installments, 2);
        }

        $factor = pow(1 + $rate, $installments);
        $amount = $principal * (($rate * $factor) / ($factor - 1));

        return round($amount, 2);
    }

    /**
     * @param  array<string, mixed>  $preview
     */
    private function createImportedInvoice($house, array $preview): PurchaseInvoice
    {
        return $house->purchaseInvoices()->create([
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
    private function suggestProduct(
        $products,
        string $itemName,
        ?string $itemCode = null,
    ): ?array {
        $normalizedItemCode = $this->normalizeSkuOrCode($itemCode);

        if ($normalizedItemCode !== '') {
            foreach ($products as $product) {
                if ($this->normalizeSkuOrCode($product->sku) === $normalizedItemCode) {
                    return [
                        'product' => $product,
                        'score' => 100.0,
                    ];
                }
            }
        }

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

    private function normalizeSkuOrCode(?string $value): string
    {
        return Str::of(Str::upper((string) $value))
            ->replaceMatches('/[^A-Z0-9]+/', '')
            ->toString();
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
