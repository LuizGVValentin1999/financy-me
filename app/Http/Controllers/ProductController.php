<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Products/Index', [
            'categories' => $user->categories()
                ->orderBy('name')
                ->get(['id', 'name', 'color', 'kind']),
            'units' => [
                ['value' => 'un', 'label' => 'Unidade'],
                ['value' => 'kg', 'label' => 'Quilo'],
                ['value' => 'g', 'label' => 'Grama'],
                ['value' => 'l', 'label' => 'Litro'],
                ['value' => 'ml', 'label' => 'Mililitro'],
                ['value' => 'cx', 'label' => 'Caixa'],
            ],
            'products' => $user->products()
                ->with('category:id,name,color')
                ->withSum('purchaseEntries as total_spent', 'total_amount')
                ->withMax('purchaseEntries as last_purchase_at', 'purchased_at')
                ->latest()
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'category_id' => $product->category_id,
                    'name' => $product->name,
                    'brand' => $product->brand,
                    'sku' => $product->sku,
                    'unit' => $product->unit,
                    'minimum_stock' => (float) $product->minimum_stock,
                    'current_stock' => (float) $product->current_stock,
                    'is_active' => $product->is_active,
                    'notes' => $product->notes,
                    'category' => $product->category
                        ? [
                            'name' => $product->category->name,
                            'color' => $product->category->color,
                        ]
                        : null,
                    'total_spent' => (float) ($product->total_spent ?? 0),
                    'last_purchase_at' => $product->last_purchase_at,
                ]),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $request->user()->products()->create([
            ...$request->validated(),
            'current_stock' => 0,
            'is_active' => true,
        ]);

        return back()->with('success', 'Produto criado com sucesso.');
    }

    public function update(
        StoreProductRequest $request,
        Product $product,
    ): RedirectResponse {
        abort_unless($product->user_id === $request->user()->id, 404);

        $product->update($request->validated());

        return back()->with('success', 'Produto atualizado com sucesso.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        abort_unless($product->user_id === $request->user()->id, 404);

        if ($product->purchaseEntries()->exists()) {
            return back()->with('error', 'Remova os registros de compra antes de excluir o produto.');
        }

        $product->delete();

        return back()->with('success', 'Produto removido.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(
                    'user_id',
                    $request->user()->id,
                ),
            ],
        ]);

        $products = $request->user()
            ->products()
            ->withCount('purchaseEntries')
            ->whereIn('id', $validated['ids'])
            ->get();

        $blocked = $products
            ->filter(fn (Product $product) => $product->purchase_entries_count > 0)
            ->count();

        if ($blocked > 0) {
            return back()->with(
                'error',
                $blocked === 1
                    ? '1 produto selecionado possui compras registradas e nao pode ser excluido.'
                    : "{$blocked} produtos selecionados possuem compras registradas e nao podem ser excluidos.",
            );
        }

        $deleted = $products->count();

        $request->user()
            ->products()
            ->whereIn('id', $products->pluck('id'))
            ->delete();

        return back()->with(
            'success',
            $deleted === 1
                ? '1 produto removido.'
                : "{$deleted} produtos removidos.",
        );
    }
}
