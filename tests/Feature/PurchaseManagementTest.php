<?php

use App\Models\FinancialEntry;
use App\Models\PurchaseEntry;
use App\Models\User;

test('manual purchase increases stock and creates synced financial entry when account is provided', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'code' => 'CAT-COMPRA',
        'name' => 'Compras gerais',
        'color' => '#1A9B77',
        'description' => null,
    ]);

    $account = $user->accounts()->create([
        'code' => 'ACC-COMPRA',
        'name' => 'Conta compras',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $product = $user->products()->create([
        'name' => 'Produto compra manual',
        'category_id' => $category->id,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 1,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->post(route('purchases.store'), [
            'product_id' => $product->id,
            'account_id' => $account->id,
            'quantity' => 2,
            'unit_price' => 11.50,
            'purchased_at' => now()->toDateString(),
            'source' => 'manual',
            'invoice_reference' => 'NF-001',
            'notes' => 'Compra manual de teste',
        ])
        ->assertRedirect();

    $entry = $user->purchaseEntries()->firstOrFail();
    $financialEntry = FinancialEntry::query()->where('purchase_entry_id', $entry->id)->firstOrFail();

    expect((float) $entry->total_amount)->toBe(23.0);
    expect((float) $product->fresh()->current_stock)->toBe(3.0);
    expect($financialEntry->origin)->toBe('manual_purchase');
    expect($financialEntry->account_id)->toBe($account->id);
    expect((float) $financialEntry->amount)->toBe(23.0);
});

test('updating purchase moves stock between products and updates synced financial entry', function () {
    $user = User::factory()->create();

    $accountA = $user->accounts()->create([
        'code' => 'ACC-A',
        'name' => 'Conta A',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $accountB = $user->accounts()->create([
        'code' => 'ACC-B',
        'name' => 'Conta B',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $sourceProduct = $user->products()->create([
        'name' => 'Produto origem',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $targetProduct = $user->products()->create([
        'name' => 'Produto destino',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 5,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)->post(route('purchases.store'), [
        'product_id' => $sourceProduct->id,
        'account_id' => $accountA->id,
        'quantity' => 3,
        'unit_price' => 4,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => 'Entrada inicial',
    ])->assertRedirect();

    $entry = $user->purchaseEntries()->firstOrFail();

    $this->actingAs($user)->patch(route('purchases.update', $entry), [
        'product_id' => $targetProduct->id,
        'account_id' => $accountB->id,
        'quantity' => 1,
        'unit_price' => 9,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => 'NF-UPDATE',
        'notes' => 'Compra atualizada',
    ])->assertRedirect();

    $entry->refresh();

    $financialEntry = FinancialEntry::query()->where('purchase_entry_id', $entry->id)->firstOrFail();

    expect((float) $sourceProduct->fresh()->current_stock)->toBe(0.0);
    expect((float) $targetProduct->fresh()->current_stock)->toBe(6.0);
    expect((float) $entry->total_amount)->toBe(9.0);
    expect($entry->product_id)->toBe($targetProduct->id);
    expect($financialEntry->account_id)->toBe($accountB->id);
    expect((float) $financialEntry->amount)->toBe(9.0);
});

test('destroying purchase reverts stock and removes linked financial entry', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-DEL',
        'name' => 'Conta delete',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $product = $user->products()->create([
        'name' => 'Produto para exclusao',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)->post(route('purchases.store'), [
        'product_id' => $product->id,
        'account_id' => $account->id,
        'quantity' => 4,
        'unit_price' => 3,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => null,
    ])->assertRedirect();

    $entry = $user->purchaseEntries()->firstOrFail();

    $this->actingAs($user)
        ->delete(route('purchases.destroy', $entry))
        ->assertRedirect();

    expect(PurchaseEntry::query()->whereKey($entry->id)->exists())->toBeFalse();
    expect(FinancialEntry::query()->where('purchase_entry_id', $entry->id)->exists())->toBeFalse();
    expect((float) $product->fresh()->current_stock)->toBe(0.0);
});

test('bulk destroy on purchases removes entries and adjusts stock for each item', function () {
    $user = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-BULK',
        'name' => 'Conta bulk',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $firstProduct = $user->products()->create([
        'name' => 'Produto bulk 1',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $secondProduct = $user->products()->create([
        'name' => 'Produto bulk 2',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)->post(route('purchases.store'), [
        'product_id' => $firstProduct->id,
        'account_id' => $account->id,
        'quantity' => 2,
        'unit_price' => 5,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => null,
    ]);

    $this->actingAs($user)->post(route('purchases.store'), [
        'product_id' => $secondProduct->id,
        'account_id' => $account->id,
        'quantity' => 3,
        'unit_price' => 2,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => null,
    ]);

    $entries = $user->purchaseEntries()->orderBy('id')->get();

    $this->actingAs($user)
        ->delete(route('purchases.destroy-many'), [
            'ids' => $entries->pluck('id')->all(),
        ])
        ->assertRedirect();

    expect($user->purchaseEntries()->count())->toBe(0);
    expect($user->financialEntries()->count())->toBe(0);
    expect((float) $firstProduct->fresh()->current_stock)->toBe(0.0);
    expect((float) $secondProduct->fresh()->current_stock)->toBe(0.0);
});

test('purchase import draft can be cleared from session', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withSession([
            'purchase_import_preview' => [
                'token' => 'draft-token',
                'items' => [],
            ],
        ])
        ->delete(route('purchases.import-clear'));

    $response
        ->assertRedirect()
        ->assertSessionMissing('purchase_import_preview');
});

test('import from link rejects non-http url', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('purchases.index'))
        ->post(route('purchases.import-link'), [
            'receipt_url' => 'nfce-sem-protocolo',
        ])
        ->assertRedirect(route('purchases.index'))
        ->assertSessionHasErrors('receipt_url');
});

test('bulk purchase deletion validates ids scoped by house', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $foreignProduct = $otherUser->products()->create([
        'name' => 'Produto externo compra',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 1,
        'is_active' => true,
        'notes' => null,
    ]);

    $foreignEntry = $otherUser->purchaseEntries()->create([
        'product_id' => $foreignProduct->id,
        'purchase_invoice_id' => null,
        'account_id' => null,
        'quantity' => 1,
        'unit_price' => 1,
        'total_amount' => 1,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->from(route('purchases.index'))
        ->delete(route('purchases.destroy-many'), [
            'ids' => [$foreignEntry->id],
        ])
        ->assertRedirect(route('purchases.index'))
        ->assertSessionHasErrors('ids.0');

    expect(PurchaseEntry::withoutGlobalScopes()->whereKey($foreignEntry->id)->exists())->toBeTrue();
});
