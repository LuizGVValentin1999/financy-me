<?php

use App\Models\User;

test('authenticated user can create category product and purchase entries', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'Mercado',
            'kind' => 'produto',
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
        'name' => 'Limpeza',
        'kind' => 'produto',
        'color' => '#E07A5F',
        'description' => 'Itens de limpeza',
    ]);

    $product = $user->products()->create([
        'category_id' => $category->id,
        'name' => 'Detergente',
        'brand' => 'Casa',
        'sku' => 'DET-01',
        'unit' => 'un',
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
