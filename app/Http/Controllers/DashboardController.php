<?php

namespace App\Http\Controllers;

use App\Models\FinancialEntry;
use App\Models\PurchaseEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $house = $request->user()->getCurrentHouse();

        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => [
                'integer',
                Rule::exists('categories', 'id')->where('house_id', $house->id),
            ],
            'account_ids' => ['nullable', 'array'],
            'account_ids.*' => [
                'integer',
                Rule::exists('accounts', 'id')->where('house_id', $house->id),
            ],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => [
                'integer',
                Rule::exists('products', 'id')->where('house_id', $house->id),
            ],
        ]);

        $startDate = $validated['start_date'] ?? now()->subDays(30)->toDateString();
        $endDate = $validated['end_date'] ?? now()->toDateString();
        $startDateTime = Carbon::parse($startDate)->startOfDay()->toDateTimeString();
        $endDateTime = Carbon::parse($endDate)->endOfDay()->toDateTimeString();
        $selectedCategoryIds = array_map('intval', $validated['category_ids'] ?? []);
        $selectedAccountIds = array_map('intval', $validated['account_ids'] ?? []);
        $selectedProductIds = array_map('intval', $validated['product_ids'] ?? []);

        $entriesQuery = PurchaseEntry::query()
            ->where('house_id', $house->id)
            ->whereBetween('purchased_at', [$startDateTime, $endDateTime])
            ->with([
                'product:id,name,unit,type,category_id',
                'product.category:id,name,color',
                'account:id,code,name',
            ]);

        if ($selectedCategoryIds !== []) {
            $entriesQuery->whereHas('product', fn ($query) => $query
                ->whereIn('category_id', $selectedCategoryIds));
        }

        if ($selectedAccountIds !== []) {
            $entriesQuery->whereIn('account_id', $selectedAccountIds);
        }

        if ($selectedProductIds !== []) {
            $entriesQuery->whereIn('product_id', $selectedProductIds);
        }

        $entries = $entriesQuery
            ->orderByDesc('purchased_at')
            ->orderByDesc('id')
            ->get();

        $tableEntries = $entries->map(fn (PurchaseEntry $entry) => [
            'id' => $entry->id,
            'product_name' => $entry->product?->name ?? 'Item removido',
            'product_type' => $entry->product?->type ?? 'stockable',
            'category' => $entry->product?->category
                ? [
                    'id' => $entry->product->category->id,
                    'name' => $entry->product->category->name,
                    'color' => $entry->product->category->color,
                ]
                : null,
            'account' => $entry->account
                ? [
                    'id' => $entry->account->id,
                    'code' => $entry->account->code,
                    'name' => $entry->account->name,
                ]
                : null,
            'quantity' => (float) $entry->quantity,
            'unit' => $entry->product?->unit ?? 'un',
            'total_amount' => (float) $entry->total_amount,
            'source' => $entry->source,
            'invoice_reference' => $entry->invoice_reference,
            'purchased_at' => $entry->purchased_at
                ? Carbon::parse($entry->purchased_at)->toDateString()
                : null,
        ])->values();

        $periodOutflowQuery = FinancialEntry::query()
            ->where('house_id', $house->id)
            ->where('direction', 'outflow')
            ->whereBetween('moved_at', [$startDateTime, $endDateTime]);

        if ($selectedAccountIds !== []) {
            $periodOutflowQuery->whereIn('account_id', $selectedAccountIds);
        }

        if ($selectedCategoryIds !== []) {
            $periodOutflowQuery->where(function ($query) use ($selectedCategoryIds) {
                $query->whereIn('category_id', $selectedCategoryIds)
                    ->orWhereHas('purchaseEntry.product', fn ($relation) => $relation
                        ->whereIn('category_id', $selectedCategoryIds))
                    ->orWhereHas('purchaseInvoice.purchaseEntries.product', fn ($relation) => $relation
                        ->whereIn('category_id', $selectedCategoryIds));
            });
        }

        if ($selectedProductIds !== []) {
            $periodOutflowQuery->where(function ($query) use ($selectedProductIds) {
                $query->whereHas('purchaseEntry', fn ($relation) => $relation
                    ->whereIn('product_id', $selectedProductIds))
                    ->orWhereHas('purchaseInvoice.purchaseEntries', fn ($relation) => $relation
                        ->whereIn('product_id', $selectedProductIds));
            });
        }

        $periodOutflows = (clone $periodOutflowQuery)
            ->with([
                'category:id,name,color',
                'purchaseEntry.product:id,category_id,name',
                'purchaseEntry.product.category:id,name,color',
                'purchaseInvoice.purchaseEntries.product:id,category_id,name',
                'purchaseInvoice.purchaseEntries.product.category:id,name,color',
            ])
            ->get();

        $totalSpent = (float) round((float) $periodOutflowQuery->sum('amount'), 2);
        $totalQuantity = (float) $entries->sum('quantity');
        $entriesCount = $entries->count();

        $productEntries = $entries->filter(fn (PurchaseEntry $entry) =>
            ($entry->product?->type ?? 'stockable') === 'stockable');
        $serviceEntries = $entries->filter(fn (PurchaseEntry $entry) =>
            ($entry->product?->type ?? 'stockable') === 'non_stockable');

        $productSpent = (float) round($productEntries->sum('total_amount'), 2);
        $serviceSpent = (float) round($serviceEntries->sum('total_amount'), 2);
        $productCount = $productEntries
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->count();
        $serviceCount = $serviceEntries
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->count();
        $distinctItems = $entries
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->count();

        $selectedCategorySet = $selectedCategoryIds !== []
            ? array_fill_keys($selectedCategoryIds, true)
            : null;
        $selectedProductSet = $selectedProductIds !== []
            ? array_fill_keys($selectedProductIds, true)
            : null;

        $matchesEntryFilters = function (PurchaseEntry $entry) use (
            $selectedCategorySet,
            $selectedProductSet,
        ): bool {
            if ($selectedProductSet !== null && ! isset($selectedProductSet[(int) $entry->product_id])) {
                return false;
            }

            $categoryId = (int) ($entry->product?->category_id ?? 0);

            if ($selectedCategorySet !== null && ! isset($selectedCategorySet[$categoryId])) {
                return false;
            }

            return true;
        };

        $categorySpendAccumulator = [];

        $accumulateCategory = function (
            string $id,
            string $name,
            string $color,
            float $spent,
            float $quantity,
            int $entriesCount
        ) use (&$categorySpendAccumulator): void {
            if (! isset($categorySpendAccumulator[$id])) {
                $categorySpendAccumulator[$id] = [
                    'id' => $id,
                    'name' => $name,
                    'color' => $color,
                    'spent' => 0.0,
                    'quantity' => 0.0,
                    'entries_count' => 0,
                ];
            }

            $categorySpendAccumulator[$id]['spent'] += $spent;
            $categorySpendAccumulator[$id]['quantity'] += $quantity;
            $categorySpendAccumulator[$id]['entries_count'] += $entriesCount;
        };

        foreach ($periodOutflows as $outflow) {
            $amount = (float) $outflow->amount;

            if ($amount <= 0) {
                continue;
            }

            if ($outflow->purchaseEntry) {
                $purchaseEntry = $outflow->purchaseEntry;

                if (! $matchesEntryFilters($purchaseEntry)) {
                    continue;
                }

                $category = $purchaseEntry->product?->category;

                $accumulateCategory(
                    (string) ($category?->id ?? 'uncategorized'),
                    $category?->name ?? 'Sem categoria',
                    $category?->color ?? '#94A3B8',
                    $amount,
                    (float) $purchaseEntry->quantity,
                    1,
                );

                continue;
            }

            if ($outflow->purchaseInvoice) {
                $invoiceEntries = $outflow->purchaseInvoice->purchaseEntries
                    ->filter($matchesEntryFilters)
                    ->values();

                $invoiceBaseAmount = (float) $invoiceEntries->sum('total_amount');

                if ($invoiceEntries->isEmpty() || $invoiceBaseAmount <= 0) {
                    continue;
                }

                $paymentFactor = $amount / $invoiceBaseAmount;

                $invoiceEntries
                    ->groupBy(fn (PurchaseEntry $entry) => (string) ($entry->product?->category?->id ?? 'uncategorized'))
                    ->each(function ($groupedEntries) use (
                        $amount,
                        $invoiceBaseAmount,
                        $paymentFactor,
                        $accumulateCategory
                    ): void {
                        /** @var \Illuminate\Support\Collection<int, \App\Models\PurchaseEntry> $groupedEntries */
                        $firstEntry = $groupedEntries->first();
                        $category = $firstEntry?->product?->category;
                        $groupBaseAmount = (float) $groupedEntries->sum('total_amount');

                        if ($groupBaseAmount <= 0) {
                            return;
                        }

                        $accumulateCategory(
                            (string) ($category?->id ?? 'uncategorized'),
                            $category?->name ?? 'Sem categoria',
                            $category?->color ?? '#94A3B8',
                            $amount * ($groupBaseAmount / $invoiceBaseAmount),
                            (float) $groupedEntries->sum('quantity') * $paymentFactor,
                            1,
                        );
                    });

                continue;
            }

            if ($selectedProductSet !== null) {
                continue;
            }

            $categoryId = $outflow->category?->id;

            if ($selectedCategorySet !== null && ! isset($selectedCategorySet[(int) ($categoryId ?? 0)])) {
                continue;
            }

            $accumulateCategory(
                (string) ($categoryId ?? 'uncategorized'),
                $outflow->category?->name ?? 'Sem categoria',
                $outflow->category?->color ?? '#94A3B8',
                $amount,
                0.0,
                1,
            );
        }

        $categorySpend = collect($categorySpendAccumulator)
            ->map(fn (array $item) => [
                'id' => $item['id'],
                'name' => $item['name'],
                'color' => $item['color'],
                'spent' => (float) round((float) $item['spent'], 2),
                'quantity' => (float) round((float) $item['quantity'], 3),
                'entries_count' => (int) $item['entries_count'],
            ])
            ->sortByDesc('spent')
            ->values();

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
                'category_ids' => $selectedCategoryIds,
                'account_ids' => $selectedAccountIds,
                'product_ids' => $selectedProductIds,
            ],
            'stats' => [
                'entries_count' => $entriesCount,
                'distinct_items' => $distinctItems,
                'period_quantity' => $totalQuantity,
                'period_spent' => $totalSpent,
                'products_spent' => $productSpent,
                'services_spent' => $serviceSpent,
                'products_count' => $productCount,
                'services_count' => $serviceCount,
                'average_ticket' => $entriesCount > 0
                    ? (float) round($totalSpent / $entriesCount, 2)
                    : 0.0,
                'accounts_balance' => (float) $accountsBalance,
            ],
            'entries' => $tableEntries,
            'recentEntries' => $tableEntries->take(6)->values(),
            'categories' => $house->categories()
                ->orderBy('name')
                ->get()
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                ]),
            'accounts' => $house->accounts()
                ->orderBy('name')
                ->get()
                ->map(fn ($account) => [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                ]),
            'products' => $house->products()
                ->with('category:id,name,color')
                ->orderBy('name')
                ->get()
                ->map(fn ($product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'type' => $product->type,
                    'category' => $product->category
                        ? [
                            'id' => $product->category->id,
                            'name' => $product->category->name,
                            'color' => $product->category->color,
                        ]
                        : null,
                ]),
            'categoryBreakdown' => $categorySpend,
        ]);
    }
}
