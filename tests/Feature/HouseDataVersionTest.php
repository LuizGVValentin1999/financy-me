<?php

use App\Models\User;
use App\Services\HouseDataVersion;

test('inertia responses expose house data version in headers and shared props', function () {
    $user = User::factory()->create();
    $house = $user->getCurrentHouse();
    $version = app(HouseDataVersion::class)->current((int) $house->id);

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertOk()
        ->assertHeader('X-House-Id', (string) $house->id)
        ->assertHeader('X-House-Data-Version', $version)
        ->assertInertia(fn ($page) => $page->where('cache.houseDataVersion', $version));
});

test('successful product quick store bumps house data version and next response reflects the new value', function () {
    $user = User::factory()->create();
    $house = $user->getCurrentHouse();
    $versionService = app(HouseDataVersion::class);
    $previousVersion = $versionService->current((int) $house->id);

    $response = $this->actingAs($user)->postJson(route('products.quick-store'), [
        'category_id' => null,
        'name' => 'Produto cache '.uniqid(),
        'unit' => 'un',
        'type' => 'stockable',
    ]);

    $nextVersion = $versionService->current((int) $house->id);

    $response->assertCreated();

    expect($nextVersion)->not->toBe($previousVersion);

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertOk()
        ->assertHeader('X-House-Data-Version', $nextVersion)
        ->assertInertia(fn ($page) => $page->where('cache.houseDataVersion', $nextVersion));
});

test('failed product quick store validation does not bump house data version', function () {
    $user = User::factory()->create();
    $house = $user->getCurrentHouse();
    $versionService = app(HouseDataVersion::class);
    $previousVersion = $versionService->current((int) $house->id);

    $this->actingAs($user)
        ->postJson(route('products.quick-store'), [
            'category_id' => null,
            'name' => '',
            'unit' => 'un',
            'type' => 'stockable',
        ])
        ->assertStatus(422);

    expect($versionService->current((int) $house->id))->toBe($previousVersion);
});

test('purchase mutations bump only the active house data version', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $account = $user->accounts()->create([
        'code' => 'ACC-CACHE',
        'name' => 'Conta cache',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $product = $user->products()->create([
        'name' => 'Produto cache compra',
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

    $versionService = app(HouseDataVersion::class);
    $userHouseVersionBefore = $versionService->current((int) $user->getCurrentHouse()->id);
    $otherHouseVersionBefore = $versionService->current((int) $otherUser->getCurrentHouse()->id);

    $this->actingAs($user)
        ->post(route('purchases.store'), [
            'product_id' => $product->id,
            'account_id' => $account->id,
            'quantity' => 1,
            'unit_price' => 9.90,
            'purchased_at' => now()->toDateString(),
            'source' => 'manual',
            'invoice_reference' => 'CACHE-001',
            'notes' => 'Compra para testar cache',
        ])
        ->assertRedirect();

    $userHouseVersionAfter = $versionService->current((int) $user->getCurrentHouse()->id);
    $otherHouseVersionAfter = $versionService->current((int) $otherUser->getCurrentHouse()->id);

    expect($userHouseVersionAfter)->not->toBe($userHouseVersionBefore);
    expect($otherHouseVersionAfter)->toBe($otherHouseVersionBefore);
});
