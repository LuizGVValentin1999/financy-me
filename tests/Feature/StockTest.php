<?php

use App\Models\User;

test('authenticated user can access stock page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stock.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Stock/Index')
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
