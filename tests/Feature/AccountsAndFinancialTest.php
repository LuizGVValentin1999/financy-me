<?php

use App\Models\User;
use Carbon\Carbon;

test('account code uniqueness is scoped per house', function () {
    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();

    $payload = [
        'code' => 'ACC-001',
        'name' => 'Main account',
        'initial_balance' => 100,
        'initial_balance_date' => now()->toDateString(),
    ];

    $firstUser->getCurrentHouse()?->accounts()->create($payload);
    $secondUser->getCurrentHouse()?->accounts()->create($payload);

    expect($firstUser->getCurrentHouse()?->accounts()->count())->toBe(1);
    expect($secondUser->getCurrentHouse()?->accounts()->count())->toBe(1);
});

test('user can create and update a manual financial entry', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-001',
        'name' => 'Main account',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $this->actingAs($user)
        ->post(route('financial.store'), [
            'account_id' => $account->id,
            'category_id' => null,
            'direction' => 'inflow',
            'amount' => 250.50,
            'moved_at' => now()->toDateString(),
            'description' => 'Salary',
        ])
        ->assertRedirect();

    $entry = $user->financialEntries()->firstOrFail();

    expect($entry->origin)->toBe('manual');
    expect($entry->direction)->toBe('inflow');

    $this->actingAs($user)
        ->patch(route('financial.update', $entry), [
            'account_id' => $account->id,
            'category_id' => null,
            'direction' => 'outflow',
            'amount' => 100,
            'moved_at' => now()->toDateString(),
            'description' => 'Bill',
        ])
        ->assertRedirect();

    $entry->refresh();

    expect($entry->direction)->toBe('outflow');
    expect((float) $entry->amount)->toBe(100.0);
    expect($entry->description)->toBe('Bill');
});

test('auto-generated financial entries cannot be edited or deleted directly', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-001',
        'name' => 'Main account',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $entry = $user->financialEntries()->create([
        'account_id' => $account->id,
        'category_id' => null,
        'purchase_entry_id' => null,
        'purchase_invoice_id' => null,
        'direction' => 'outflow',
        'origin' => 'invoice_purchase',
        'amount' => 199.90,
        'moved_at' => now()->toDateString(),
        'description' => 'Auto generated',
    ]);

    $this->actingAs($user)
        ->patch(route('financial.update', $entry), [
            'account_id' => $account->id,
            'category_id' => null,
            'direction' => 'outflow',
            'amount' => 120,
            'moved_at' => now()->toDateString(),
            'description' => 'Attempted edit',
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    $this->actingAs($user)
        ->delete(route('financial.destroy', $entry))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($user->financialEntries()->whereKey($entry->id)->exists())->toBeTrue();
});

test('bulk delete in financial removes only manual entries', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-001',
        'name' => 'Main account',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $manual = $user->financialEntries()->create([
        'account_id' => $account->id,
        'category_id' => null,
        'purchase_entry_id' => null,
        'purchase_invoice_id' => null,
        'direction' => 'inflow',
        'origin' => 'manual',
        'amount' => 50,
        'moved_at' => now()->toDateString(),
        'description' => 'Manual',
    ]);

    $auto = $user->financialEntries()->create([
        'account_id' => $account->id,
        'category_id' => null,
        'purchase_entry_id' => null,
        'purchase_invoice_id' => null,
        'direction' => 'outflow',
        'origin' => 'invoice_purchase',
        'amount' => 20,
        'moved_at' => now()->toDateString(),
        'description' => 'Auto',
    ]);

    $this->actingAs($user)
        ->delete(route('financial.destroy-many'), [
            'ids' => [$manual->id, $auto->id],
        ])
        ->assertRedirect();

    expect($user->financialEntries()->whereKey($manual->id)->exists())->toBeFalse();
    expect($user->financialEntries()->whereKey($auto->id)->exists())->toBeTrue();
});

test('account and financial dates are serialized as plain local dates for inertia', function () {
    Carbon::setTestNow('2026-04-03 01:30:00');

    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-001',
        'name' => 'Main account',
        'initial_balance' => 500,
        'initial_balance_date' => '2026-04-03',
    ]);

    $user->financialEntries()->create([
        'account_id' => $account->id,
        'category_id' => null,
        'purchase_entry_id' => null,
        'purchase_invoice_id' => null,
        'direction' => 'inflow',
        'origin' => 'manual',
        'amount' => 120,
        'moved_at' => '2026-04-03',
        'description' => 'Ajuste de saldo',
    ]);

    $this->actingAs($user)
        ->get(route('accounts.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Accounts/Index')
            ->where('accounts.0.initial_balance_date', '2026-04-03'));

    $this->actingAs($user)
        ->get(route('financial.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Financial/Index')
            ->where('entries.0.moved_at', '2026-04-03'));

    Carbon::setTestNow();
});
