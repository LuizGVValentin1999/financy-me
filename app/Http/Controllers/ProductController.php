<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $house = $request->user()->getCurrentHouse();

        return Inertia::render('Products/Index', [
            'categories' => $house->categories()
                ->orderBy('name')
                ->get(['id', 'name', 'color']),
            'units' => [
                ['value' => 'un', 'label' => 'Unidade'],
                ['value' => 'kg', 'label' => 'Quilo'],
                ['value' => 'g', 'label' => 'Grama'],
                ['value' => 'l', 'label' => 'Litro'],
                ['value' => 'ml', 'label' => 'Mililitro'],
                ['value' => 'cx', 'label' => 'Caixa'],
            ],
            'products' => $house->products()
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
                    'type' => $product->type,
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

    public function store(StoreProductRequest $request): RedirectResponse|JsonResponse
    {
        $house = $request->user()->getCurrentHouse();
        $product = $house->products()->create([
            ...$request->validated(),
            'current_stock' => 0,
            'is_active' => true,
        ]);

        if ($request->expectsJson()) {
            $product->load('category:id,name');

            return response()->json([
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'current_stock' => (float) $product->current_stock,
                    'category' => $product->category?->name,
                    'category_id' => $product->category_id,
                ],
            ], 201);
        }

        return back()->with('success', 'Produto criado com sucesso.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $house = $request->user()->getCurrentHouse();
        
        $validated = $request->validate([
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('house_id', $house->id),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')->where('house_id', $house->id),
            ],
            'unit' => ['required', Rule::in(['un', 'kg', 'g', 'l', 'ml', 'cx'])],
            'type' => ['required', Rule::in(['stockable', 'non_stockable'])],
        ]);

        $product = $house->products()->create([
            ...$validated,
            'brand' => null,
            'sku' => null,
            'minimum_stock' => 0,
            'current_stock' => 0,
            'is_active' => true,
            'notes' => 'Criado rapidamente na compra manual.',
        ]);

        $product->load('category:id,name');

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'unit' => $product->unit,
                'current_stock' => (float) $product->current_stock,
                'category' => $product->category?->name,
                'category_id' => $product->category_id,
            ],
        ], 201);
    }

    public function update(
        StoreProductRequest $request,
        Product $product,
    ): RedirectResponse {
        $product->update($request->validated());

        return back()->with('success', 'Produto atualizado com sucesso.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
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
                Rule::exists('products', 'id'),
            ],
        ]);

        $products = Product::withCount('purchaseEntries')
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

        Product::whereIn('id', $products->pluck('id'))->delete();

        return back()->with(
            'success',
            $deleted === 1
                ? '1 produto removido.'
                : "{$deleted} produtos removidos.",
        );
    }
}
