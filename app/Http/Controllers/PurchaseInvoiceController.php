<?php

namespace App\Http\Controllers;

use App\Models\FinancialEntry;
use App\Models\PurchaseInvoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseInvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = PurchaseInvoice::query()
            ->whereBelongsTo($request->user())
            ->with([
                'purchaseEntries' => fn ($query) => $query
                    ->with('product:id,name,unit')
                    ->orderByDesc('total_amount')
                    ->orderBy('id'),
            ])
            ->latest('issued_at')
            ->latest()
            ->get()
            ->map(fn (PurchaseInvoice $invoice) => [
                'id' => $invoice->id,
                'store_name' => $invoice->store_name,
                'cnpj' => $invoice->cnpj,
                'address' => $invoice->address,
                'invoice_number' => $invoice->invoice_number,
                'series' => $invoice->series,
                'access_key' => $invoice->access_key,
                'receipt_url' => $invoice->receipt_url,
                'issued_at' => $invoice->issued_at?->toDateString(),
                'items_count' => (int) $invoice->items_count,
                'gross_amount' => (float) $invoice->gross_amount,
                'discount_amount' => (float) $invoice->discount_amount,
                'paid_amount' => (float) $invoice->paid_amount,
                'items' => $invoice->purchaseEntries->map(fn ($entry) => [
                    'id' => $entry->id,
                    'product' => $entry->product?->name,
                    'unit' => $entry->product?->unit,
                    'quantity' => (float) $entry->quantity,
                    'unit_price' => (float) $entry->unit_price,
                    'total_amount' => (float) $entry->total_amount,
                    'is_discount' => (float) $entry->total_amount < 0,
                    'notes' => $entry->notes,
                ]),
            ]);

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'stats' => [
                'count' => $invoices->count(),
                'gross_amount' => round($invoices->sum('gross_amount'), 2),
                'discount_amount' => round($invoices->sum('discount_amount'), 2),
                'paid_amount' => round($invoices->sum('paid_amount'), 2),
            ],
        ]);
    }

    public function destroy(Request $request, PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        abort_unless($purchaseInvoice->user_id === $request->user()->id, 404);

        DB::transaction(function () use ($purchaseInvoice) {
            $entries = $purchaseInvoice->purchaseEntries()
                ->with('product:id,type,current_stock')
                ->get();

            foreach ($entries as $entry) {
                $product = $entry->product;

                if (! $product || $product->type !== 'stockable') {
                    continue;
                }

                $product->update([
                    'current_stock' => max(
                        0,
                        (float) $product->current_stock - (float) $entry->quantity,
                    ),
                ]);
            }

            $entryIds = $entries->pluck('id')->all();

            if ($entryIds !== []) {
                FinancialEntry::query()
                    ->whereIn('purchase_entry_id', $entryIds)
                    ->delete();
            }

            $purchaseInvoice->purchaseEntries()->delete();
            $purchaseInvoice->financialEntries()->delete();
            $purchaseInvoice->delete();
        });

        return back()->with('success', 'Nota fiscal excluida com sucesso.');
    }
}
