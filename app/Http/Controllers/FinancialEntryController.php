<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFinancialEntryRequest;
use App\Http\Requests\UpdateFinancialEntryRequest;
use App\Models\FinancialEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancialEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Financial/Index', [
            'accounts' => $user->accounts()
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'categories' => $user->categories()
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'color']),
            'entries' => $user->financialEntries()
                ->with('account:id,code,name', 'category:id,code,name,color')
                ->latest('moved_at')
                ->latest('id')
                ->get()
                ->map(fn (FinancialEntry $entry) => [
                    'id' => $entry->id,
                    'account_id' => $entry->account_id,
                    'account' => $entry->account ? [
                        'id' => $entry->account->id,
                        'code' => $entry->account->code,
                        'name' => $entry->account->name,
                    ] : null,
                    'category_id' => $entry->category_id,
                    'category' => $entry->category ? [
                        'id' => $entry->category->id,
                        'code' => $entry->category->code,
                        'name' => $entry->category->name,
                        'color' => $entry->category->color,
                    ] : null,
                    'direction' => $entry->direction,
                    'origin' => $entry->origin,
                    'amount' => (float) $entry->amount,
                    'moved_at' => $entry->moved_at?->toDateString(),
                    'description' => $entry->description,
                    'created_at' => $entry->created_at?->toDateString(),
                ]),
        ]);
    }

    public function store(StoreFinancialEntryRequest $request): RedirectResponse
    {
        $request->user()->financialEntries()->create([
            ...$request->validated(),
            'origin' => 'manual',
        ]);

        return back()->with('success', 'Lançamento financeiro criado com sucesso.');
    }

    public function update(
        UpdateFinancialEntryRequest $request,
        FinancialEntry $financialEntry,
    ): RedirectResponse {
        abort_unless($financialEntry->user_id === $request->user()->id, 404);

        if ($financialEntry->origin !== 'manual') {
            return back()->with('error', 'Somente lançamentos manuais podem ser editados.');
        }

        $financialEntry->update($request->validated());

        return back()->with('success', 'Lançamento financeiro atualizado com sucesso.');
    }

    public function destroy(Request $request, FinancialEntry $financialEntry): RedirectResponse
    {
        abort_unless($financialEntry->user_id === $request->user()->id, 404);

        if ($financialEntry->origin !== 'manual') {
            return back()->with('error', 'Somente lançamentos manuais podem ser removidos.');
        }

        $financialEntry->delete();

        return back()->with('success', 'Lançamento financeiro removido.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        $request->user()
            ->financialEntries()
            ->where('origin', 'manual')
            ->whereIn('id', $ids)
            ->delete();

        return back()->with('success', 'Lançamentos financeiros removidos com sucesso.');
    }
}
