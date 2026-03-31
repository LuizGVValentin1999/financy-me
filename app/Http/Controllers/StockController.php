<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $products = $request->user()->products()
            ->where('type', 'stockable')
            ->with('category:id,name,color')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'brand' => $product->brand,
                'sku' => $product->sku,
                'unit' => $product->unit,
                'type' => $product->type,
                'minimum_stock' => (float) $product->minimum_stock,
                'current_stock' => (float) $product->current_stock,
                'category' => $product->category
                    ? [
                        'name' => $product->category->name,
                        'color' => $product->category->color,
                    ]
                    : null,
            ]);

        return Inertia::render('Stock/Index', [
            'products' => $products,
        ]);
    }

    public function withdraw(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where('user_id', $request->user()->id),
            ],
            'quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $product = $request->user()->products()->findOrFail($validated['product_id']);

        if ($product->type !== 'stockable') {
            return back()->with('error', 'Somente produtos estocaveis podem ter retirada.');
        }

        $quantity = (float) $validated['quantity'];
        $currentStock = (float) $product->current_stock;

        if ($quantity > $currentStock) {
            return back()->with('error', 'A quantidade de retirada nao pode ser maior que o estoque atual.');
        }

        $product->update([
            'current_stock' => round($currentStock - $quantity, 3),
        ]);

        return back()->with(
            'success',
            sprintf(
                'Retirada registrada: %s %s de %s.',
                number_format($quantity, 3, ',', '.'),
                $product->unit,
                $product->name,
            ),
        );
    }
}
