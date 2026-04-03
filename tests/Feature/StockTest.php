<?php

use App\Models\StockMovement;
use App\Models\User;

test('authenticated user can access stock page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stock.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Stock/Index')
            ->has('movements')
        );
});

test('stock page lists only stockable products', function () {
    $user = User::factory()->create();

    $stockable = $user->products()->create([
        'name' => 'Arroz',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 10,
        'is_active' => true,
        'notes' => null,
    ]);

    $user->products()->create([
        'name' => 'Servico de entrega',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'non_stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->get(route('stock.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Stock/Index')
            ->has('products', 1)
            ->where('products.0.id', $stockable->id)
            ->where('products.0.type', 'stockable')
        );
});

test('user can withdraw quantity from stockable product', function () {
    $user = User::factory()->create();

    $product = $user->products()->create([
        'name' => 'Arroz',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 10,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->post(route('stock.withdraw'), [
            'product_id' => $product->id,
            'quantity' => 2.5,
            'notes' => 'Consumo interno',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect((float) $product->fresh()->current_stock)->toBe(7.5);
    expect(StockMovement::query()->count())->toBe(1);
    expect(StockMovement::query()->first())->not->toBeNull()
        ->and((float) StockMovement::query()->first()->quantity)->toBe(2.5)
        ->and(StockMovement::query()->first()->origin)->toBe('manual_withdrawal')
        ->and(StockMovement::query()->first()->notes)->toBe('Consumo interno');
});

test('user cannot withdraw more than current stock', function () {
    $user = User::factory()->create();

    $product = $user->products()->create([
        'name' => 'Feijao',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'kg',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 1,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->from(route('stock.index'))
        ->post(route('stock.withdraw'), [
            'product_id' => $product->id,
            'quantity' => 2,
        ])
        ->assertRedirect(route('stock.index'))
        ->assertSessionHas('error');

    expect((float) $product->fresh()->current_stock)->toBe(1.0);
});

test('user cannot withdraw from non stockable product', function () {
    $user = User::factory()->create();

    $product = $user->products()->create([
        'name' => 'Servico de entrega',
        'category_id' => null,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'non_stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->post(route('stock.withdraw'), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('stock page includes purchase inflows and withdrawal outflows in movement history', function () {
    $user = User::factory()->create();

    $product = $user->products()->create([
        'name' => 'Arroz',
        'category_id' => null,
        'brand' => 'Marca Boa',
        'sku' => 'ARZ-01',
        'unit' => 'kg',
        'type' => 'stockable',
        'minimum_stock' => 1,
        'current_stock' => 4,
        'is_active' => true,
        'notes' => null,
    ]);

    $user->purchaseEntries()->create([
        'product_id' => $product->id,
        'quantity' => 5,
        'unit_price' => 6.5,
        'total_amount' => 32.5,
        'purchased_at' => '2026-04-01',
        'source' => 'manual',
        'invoice_reference' => 'NF-001',
        'notes' => 'Reposição do mês',
    ]);

    $user->stockMovements()->create([
        'product_id' => $product->id,
        'direction' => 'outflow',
        'origin' => 'manual_withdrawal',
        'quantity' => 1,
        'moved_at' => '2026-04-02 10:00:00',
        'notes' => 'Uso interno',
    ]);

    $this->actingAs($user)
        ->get(route('stock.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Stock/Index')
            ->has('movements', 2)
            ->where('movements.0.direction', 'outflow')
            ->where('movements.0.origin', 'manual_withdrawal')
            ->where('movements.1.direction', 'inflow')
            ->where('movements.1.reference', 'NF-001')
        );
});
