<?php

use App\Models\User;

test('authenticated user can create category product and purchase entries', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'code' => 'CAT-MERCADO',
            'name' => 'Mercado',
            'color' => '#1F7A8C',
            'description' => 'Itens do mercado',
        ])
        ->assertRedirect();

    $category = $user->categories()->firstOrFail();

    $this->actingAs($user)
        ->post(route('products.store'), [
            'category_id' => $category->id,
            'name' => 'Arroz',
            'brand' => 'Bom Grao',
            'sku' => 'ARZ-01',
            'unit' => 'kg',
            'type' => 'stockable',
            'minimum_stock' => 1,
            'notes' => 'Pacote tradicional',
        ])
        ->assertRedirect();

    $product = $user->products()->firstOrFail();

    $this->actingAs($user)
        ->post(route('purchases.store'), [
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => 6.5,
            'purchased_at' => now()->toDateString(),
            'source' => 'manual',
            'invoice_reference' => 'NF-123',
            'notes' => 'Compra do mes',
        ])
        ->assertRedirect();

    expect($user->categories()->count())->toBe(1);
    expect($user->products()->count())->toBe(1);
    expect($user->purchaseEntries()->count())->toBe(1);
    expect((float) $product->fresh()->current_stock)->toBe(5.0);
});

test('dashboard shows registered inventory information', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'code' => 'CAT-LIMPEZA',
        'name' => 'Limpeza',
        'color' => '#E07A5F',
        'description' => 'Itens de limpeza',
    ]);

    $product = $user->products()->create([
        'category_id' => $category->id,
        'name' => 'Detergente',
        'brand' => 'Casa',
        'sku' => 'DET-01',
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 2,
        'current_stock' => 3,
        'notes' => 'Uso diario',
    ]);

    $user->purchaseEntries()->create([
        'product_id' => $product->id,
        'quantity' => 3,
        'unit_price' => 2.9,
        'total_amount' => 8.7,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertSee('Detergente')
        ->assertSee('Limpeza');
});

test('dashboard includes entries created on the selected end date even when stored with time', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'code' => 'CAT-SERV',
        'name' => 'Servicos',
        'color' => '#0F766E',
        'description' => 'Servicos recorrentes',
    ]);

    $account = $user->accounts()->create([
        'code' => 'ACC-SERV',
        'name' => 'Conta servicos',
        'initial_balance' => 200,
        'initial_balance_date' => '2026-04-01',
    ]);

    $product = $user->products()->create([
        'category_id' => $category->id,
        'name' => 'Servico de limpeza',
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'non_stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'notes' => null,
    ]);

    $entry = $user->purchaseEntries()->create([
        'product_id' => $product->id,
        'account_id' => $account->id,
        'quantity' => 1,
        'unit_price' => 30,
        'total_amount' => 30,
        'purchased_at' => '2026-04-01 00:00:00',
        'source' => 'manual',
        'invoice_reference' => 'NF-SERV-001',
        'notes' => 'Servico de limpeza mensal',
    ]);

    $entry->financialEntries()->create([
        'house_id' => $user->active_house_id,
        'account_id' => $account->id,
        'purchase_entry_id' => $entry->id,
        'direction' => 'outflow',
        'origin' => 'manual_purchase',
        'amount' => 30,
        'moved_at' => '2026-04-01 00:00:00',
        'description' => 'Compra: Servico de limpeza',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard', [
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-01',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('stats.entries_count', 1)
            ->where('stats.period_spent', 30)
            ->where('entries.0.product_name', 'Servico de limpeza')
        );
});
