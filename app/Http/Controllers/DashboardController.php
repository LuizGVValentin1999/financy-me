<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\PurchaseEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $user = $request->user();
        $startDate = $validated['start_date'] ?? now()->subDays(30)->toDateString();
        $endDate = $validated['end_date'] ?? now()->toDateString();

        $products = Product::query()
            ->whereBelongsTo($user)
            ->with('category:id,name,color')
            ->withSum([
                'purchaseEntries as period_quantity' => fn ($query) => $query
                    ->whereBetween('purchased_at', [$startDate, $endDate]),
            ], 'quantity')
            ->withSum([
                'purchaseEntries as period_spent' => fn ($query) => $query
                    ->whereBetween('purchased_at', [$startDate, $endDate]),
            ], 'total_amount')
            ->withMax([
                'purchaseEntries as last_purchase_at' => fn ($query) => $query
                    ->whereDate('purchased_at', '<=', $endDate),
            ], 'purchased_at')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'unit' => $product->unit,
                'current_stock' => (float) $product->current_stock,
                'minimum_stock' => (float) $product->minimum_stock,
                'category' => $product->category
                    ? [
                        'name' => $product->category->name,
                        'color' => $product->category->color,
                    ]
                    : null,
                'period_quantity' => (float) ($product->period_quantity ?? 0),
                'period_spent' => (float) ($product->period_spent ?? 0),
                'last_purchase_at' => $product->last_purchase_at
                    ? Carbon::parse($product->last_purchase_at)->toDateString()
                    : null,
            ]);

        $recentEntries = PurchaseEntry::query()
            ->whereBelongsTo($user)
            ->with('product:id,name,unit')
            ->latest('purchased_at')
            ->limit(6)
            ->get()
            ->map(fn (PurchaseEntry $entry) => [
                'id' => $entry->id,
                'product' => $entry->product?->name,
                'unit' => $entry->product?->unit,
                'quantity' => (float) $entry->quantity,
                'total_amount' => (float) $entry->total_amount,
                'source' => $entry->source,
                'invoice_reference' => $entry->invoice_reference,
                'purchased_at' => $entry->purchased_at?->toDateString(),
            ]);

        $periodEntries = PurchaseEntry::query()
            ->whereBelongsTo($user)
            ->whereBetween('purchased_at', [$startDate, $endDate]);

        return Inertia::render('Dashboard', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'range_label' => sprintf(
                    '%s a %s',
                    Carbon::parse($startDate)->format('d/m/Y'),
                    Carbon::parse($endDate)->format('d/m/Y'),
                ),
            ],
            'stats' => [
                'categories' => $user->categories()->count(),
                'products' => $user->products()->count(),
                'current_stock' => (float) $user->products()->sum('current_stock'),
                'period_quantity' => (float) $periodEntries->sum('quantity'),
                'period_spent' => (float) $periodEntries->sum('total_amount'),
            ],
            'products' => $products,
            'recentEntries' => $recentEntries,
            'categoryBreakdown' => $user->categories()
                ->withCount('products')
                ->orderBy('name')
                ->get()
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'kind' => $category->kind,
                    'color' => $category->color,
                    'products_count' => $category->products_count,
                ]),
        ]);
    }
}
