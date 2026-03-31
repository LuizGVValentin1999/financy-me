<?php

namespace App\Http\Controllers;

use App\Models\FinancialEntry;
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

        $house = $request->user()->getCurrentHouse();
        $startDate = $validated['start_date'] ?? now()->subDays(30)->toDateString();
        $endDate = $validated['end_date'] ?? now()->toDateString();

        $products = Product::query()
            ->where('house_id', $house->id)
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
            ->where('house_id', $house->id)
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
                'purchased_at' => $entry->purchased_at,
            ]);

        $periodEntries = PurchaseEntry::query()
            ->where('house_id', $house->id)
            ->whereBetween('purchased_at', [$startDate, $endDate]);

        $periodFinancialEntries = FinancialEntry::query()
            ->where('house_id', $house->id)
            ->whereBetween('moved_at', [$startDate, $endDate]);

        $periodIncome = (float) (clone $periodFinancialEntries)
            ->where('direction', 'inflow')
            ->sum('amount');

        $periodExpense = (float) (clone $periodFinancialEntries)
            ->where('direction', 'outflow')
            ->sum('amount');

        $accountsBalance = $house->accounts()
            ->get()
            ->sum(function ($account) {
                $income = (float) $account->financialEntries()->where('direction', 'inflow')->sum('amount');
                $expense = (float) $account->financialEntries()->where('direction', 'outflow')->sum('amount');

                return (float) $account->initial_balance + $income - $expense;
            });

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
                'categories' => $house->categories()->count(),
                'accounts' => $house->accounts()->count(),
                'products' => $house->products()->count(),
                'current_stock' => (float) $house->products()->sum('current_stock'),
                'period_quantity' => (float) $periodEntries->sum('quantity'),
                'period_spent' => (float) $periodEntries->sum('total_amount'),
                'period_income' => $periodIncome,
                'period_expense' => $periodExpense,
                'accounts_balance' => (float) $accountsBalance,
            ],
            'products' => $products,
            'recentEntries' => $recentEntries,
            'accounts' => $house->accounts()
                ->orderBy('name')
                ->get()
                ->map(fn ($account) => [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'initial_balance' => (float) $account->initial_balance,
                    'initial_balance_date' => $account->initial_balance_date,
                    'income_sum' => (float) $account->financialEntries()->where('direction', 'inflow')->sum('amount'),
                    'expense_sum' => (float) $account->financialEntries()->where('direction', 'outflow')->sum('amount'),
                ]),
            'categoryBreakdown' => $house->categories()
                ->withCount('products')
                ->orderBy('name')
                ->get()
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                    'products_count' => $category->products_count,
                ]),
        ]);
    }
}
