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
        $house = $request->user()->getCurrentHouse();
        $perPage = 12;

        $invoicePage = PurchaseInvoice::query()
            ->where('house_id', $house->id)
            ->with([
                'purchaseEntries' => fn ($query) => $query
                    ->with('product:id,name,unit')
                    ->orderByDesc('total_amount')
                    ->orderBy('id'),
            ])
            ->latest('issued_at')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $invoices = collect($invoicePage->items())
            ->map(fn (PurchaseInvoice $invoice) => [
                'id' => $invoice->id,
                'store_name' => $invoice->store_name,
                'cnpj' => $invoice->cnpj,
                'address' => $invoice->address,
                'invoice_number' => $invoice->invoice_number,
                'series' => $invoice->series,
                'access_key' => $invoice->access_key,
                'receipt_url' => $invoice->receipt_url,
                'issued_at' => $invoice->issued_at,
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
                ])->values(),
            ])
            ->values();

        $allInvoices = PurchaseInvoice::query()
            ->where('house_id', $house->id)
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('COALESCE(SUM(gross_amount), 0) as gross_amount')
            ->selectRaw('COALESCE(SUM(discount_amount), 0) as discount_amount')
            ->selectRaw('COALESCE(SUM(paid_amount), 0) as paid_amount')
            ->first();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'pagination' => [
                'current_page' => $invoicePage->currentPage(),
                'last_page' => $invoicePage->lastPage(),
                'per_page' => $invoicePage->perPage(),
                'total' => $invoicePage->total(),
                'from' => $invoicePage->firstItem(),
                'to' => $invoicePage->lastItem(),
            ],
            'stats' => [
                'count' => (int) ($allInvoices->count ?? 0),
                'gross_amount' => round((float) ($allInvoices->gross_amount ?? 0), 2),
                'discount_amount' => round((float) ($allInvoices->discount_amount ?? 0), 2),
                'paid_amount' => round((float) ($allInvoices->paid_amount ?? 0), 2),
            ],
        ]);
    }

    public function destroy(Request $request, PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        $house = $request->user()->getCurrentHouse();
        abort_unless($purchaseInvoice->house_id === $house->id, 404);

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
