<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $accounts = $request->user()
            ->accounts()
            ->latest()
            ->get()
            ->map(fn (Account $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'initial_balance' => (float) $account->initial_balance,
                'initial_balance_date' => $account->initial_balance_date,
                'created_at' => $account->created_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Accounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $request->user()->accounts()->create($request->validated());

        return back()->with('success', 'Conta criada com sucesso.');
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 404);

        $account->update($request->validated());

        return back()->with('success', 'Conta atualizada com sucesso.');
    }

    public function destroy(Request $request, Account $account): RedirectResponse
    {
        abort_unless($account->user_id === $request->user()->id, 404);

        $account->delete();

        return back()->with('success', 'Conta removida.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        $request->user()
            ->accounts()
            ->whereIn('id', $ids)
            ->delete();

        return back()->with('success', 'Contas removidas com sucesso.');
    }
}
