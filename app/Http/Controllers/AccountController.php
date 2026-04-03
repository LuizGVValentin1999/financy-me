<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $accounts = Account::latest()
            ->get()
            ->map(fn (Account $account) => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'initial_balance' => (float) $account->initial_balance,
                'initial_balance_date' => $account->initial_balance_date?->toDateString(),
                'created_at' => $account->created_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Accounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse|JsonResponse
    {
        $house = $request->user()->getCurrentHouse();
        $account = $house->accounts()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'account' => [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                ],
            ], 201);
        }

        return back()->with('success', 'Conta criada com sucesso.');
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        $account->update($request->validated());

        return back()->with('success', 'Conta atualizada com sucesso.');
    }

    public function destroy(Request $request, Account $account): RedirectResponse
    {
        $account->delete();

        return back()->with('success', 'Conta removida.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);

        Account::whereIn('id', $ids)->delete();

        return back()->with('success', 'Contas removidas com sucesso.');
    }
}
