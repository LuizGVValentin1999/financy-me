<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $house = $request->user()->getCurrentHouse();

        $products = Product::where('house_id', $house->id)
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

        $inflows = $house->purchaseEntries()
            ->whereHas('product', fn ($query) => $query->where('type', 'stockable'))
            ->with('product:id,name,unit')
            ->latest('purchased_at')
            ->latest('id')
            ->get()
            ->map(fn ($entry) => [
                'id' => 'purchase-'.$entry->id,
                'product_id' => $entry->product_id,
                'product_name' => $entry->product?->name,
                'unit' => $entry->product?->unit,
                'direction' => 'inflow',
                'origin' => $entry->source === 'invoice' ? 'invoice_purchase' : 'manual_purchase',
                'quantity' => (float) $entry->quantity,
                'moved_at' => $entry->purchased_at?->toDateString(),
                'notes' => $entry->notes,
                'reference' => $entry->invoice_reference,
            ]);

        $outflows = $house->stockMovements()
            ->where('direction', 'outflow')
            ->whereHas('product', fn ($query) => $query->where('type', 'stockable'))
            ->with('product:id,name,unit')
            ->latest('moved_at')
            ->latest('id')
            ->get()
            ->map(fn (StockMovement $movement) => [
                'id' => 'movement-'.$movement->id,
                'product_id' => $movement->product_id,
                'product_name' => $movement->product?->name,
                'unit' => $movement->product?->unit,
                'direction' => $movement->direction,
                'origin' => $movement->origin,
                'quantity' => (float) $movement->quantity,
                'moved_at' => $movement->moved_at?->toDateString(),
                'notes' => $movement->notes,
                'reference' => null,
            ]);

        return Inertia::render('Stock/Index', [
            'products' => $products,
            'movements' => $inflows
                ->concat($outflows)
                ->sortByDesc(fn (array $movement) => sprintf(
                    '%s-%s',
                    $movement['moved_at'] ?? '0000-00-00',
                    $movement['id'],
                ))
                ->values(),
        ]);
    }

    public function withdraw(Request $request): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();

        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where('house_id', $house->id),
            ],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $product = Product::where('house_id', $house->id)
            ->findOrFail($validated['product_id']);

        if ($product->type !== 'stockable') {
            return back()->with('error', 'Somente produtos estocaveis podem ter retirada.');
        }

        $quantity = (float) $validated['quantity'];
        $currentStock = (float) $product->current_stock;

        if ($quantity > $currentStock) {
            return back()->with('error', 'A quantidade de retirada nao pode ser maior que o estoque atual.');
        }

        DB::transaction(function () use ($house, $product, $quantity, $currentStock, $validated) {
            $product->update([
                'current_stock' => round($currentStock - $quantity, 3),
            ]);

            $house->stockMovements()->create([
                'product_id' => $product->id,
                'direction' => 'outflow',
                'origin' => 'manual_withdrawal',
                'quantity' => $quantity,
                'moved_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);
        });

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
