<?php

use App\Models\Account;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;

test('catalog index pages render for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('categories.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Categories/Index'));

    $this->actingAs($user)
        ->get(route('accounts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Accounts/Index'));

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Products/Index'));
});

test('category can be created updated deleted and bulk deletion ignores other house ids', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'code' => 'CAT-01',
            'name' => 'Mercado',
            'color' => '#1F7A8C',
            'description' => 'Categoria principal',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'code' => 'CAT-02',
            'name' => 'Limpeza',
            'color' => '#E07A5F',
            'description' => null,
        ])
        ->assertRedirect();

    $foreignCategory = $otherUser->categories()->create([
        'code' => 'CAT-X',
        'name' => 'Outra casa',
        'color' => '#123456',
        'description' => null,
    ]);

    $firstCategory = $user->categories()->where('code', 'CAT-01')->firstOrFail();
    $secondCategory = $user->categories()->where('code', 'CAT-02')->firstOrFail();

    $this->actingAs($user)
        ->patch(route('categories.update', $firstCategory), [
            'code' => 'CAT-01',
            'name' => 'Mercado Atualizado',
            'color' => '#1F7A8C',
            'description' => 'Atualizada',
        ])
        ->assertRedirect();

    expect($firstCategory->fresh()->name)->toBe('Mercado Atualizado');

    $this->actingAs($user)
        ->delete(route('categories.destroy', $secondCategory))
        ->assertRedirect();

    expect($user->categories()->whereKey($secondCategory->id)->exists())->toBeFalse();

    $this->actingAs($user)
        ->delete(route('categories.destroy-many'), [
            'ids' => [$firstCategory->id, $foreignCategory->id],
        ])
        ->assertRedirect();

    expect($user->categories()->whereKey($firstCategory->id)->exists())->toBeFalse();
    expect(Category::withoutGlobalScopes()->whereKey($foreignCategory->id)->exists())->toBeTrue();
});

test('account can be created updated deleted and bulk deletion ignores other house ids', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $this->actingAs($user)
        ->post(route('accounts.store'), [
            'code' => 'ACC-01',
            'name' => 'Conta principal',
            'initial_balance' => 150.75,
            'initial_balance_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('accounts.store'), [
            'code' => 'ACC-02',
            'name' => 'Carteira',
            'initial_balance' => 50,
            'initial_balance_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    $foreignAccount = $otherUser->accounts()->create([
        'code' => 'ACC-X',
        'name' => 'Conta estrangeira',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $firstAccount = $user->accounts()->where('code', 'ACC-01')->firstOrFail();
    $secondAccount = $user->accounts()->where('code', 'ACC-02')->firstOrFail();

    $this->actingAs($user)
        ->patch(route('accounts.update', $firstAccount), [
            'code' => 'ACC-01',
            'name' => 'Conta principal atualizada',
            'initial_balance' => 200,
            'initial_balance_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    expect($firstAccount->fresh()->name)->toBe('Conta principal atualizada');

    $this->actingAs($user)
        ->delete(route('accounts.destroy', $secondAccount))
        ->assertRedirect();

    expect($user->accounts()->whereKey($secondAccount->id)->exists())->toBeFalse();

    $this->actingAs($user)
        ->delete(route('accounts.destroy-many'), [
            'ids' => [$firstAccount->id, $foreignAccount->id],
        ])
        ->assertRedirect();

    expect($user->accounts()->whereKey($firstAccount->id)->exists())->toBeFalse();
    expect(Account::withoutGlobalScopes()->whereKey($foreignAccount->id)->exists())->toBeTrue();
});

test('product quick store returns json and product deletion rules are enforced', function () {
    $user = User::factory()->create();

    $category = $user->categories()->create([
        'code' => 'CAT-PRD',
        'name' => 'Categoria Produto',
        'color' => '#334455',
        'description' => null,
    ]);

    $quickStoreResponse = $this->actingAs($user)
        ->postJson(route('products.quick-store'), [
            'category_id' => $category->id,
            'name' => 'Produto rapido',
            'unit' => 'un',
            'type' => 'stockable',
        ]);

    $quickStoreResponse
        ->assertCreated()
        ->assertJsonPath('product.name', 'Produto rapido')
        ->assertJsonPath('product.unit', 'un');

    $quickProduct = Product::query()->where('name', 'Produto rapido')->firstOrFail();

    $this->actingAs($user)
        ->patch(route('products.update', $quickProduct), [
            'category_id' => $category->id,
            'name' => 'Produto rapido editado',
            'brand' => 'Marca X',
            'sku' => 'SKU-X',
            'unit' => 'kg',
            'type' => 'stockable',
            'minimum_stock' => 2,
            'notes' => 'Atualizado via teste',
        ])
        ->assertRedirect();

    expect($quickProduct->fresh()->name)->toBe('Produto rapido editado');
    expect($quickProduct->fresh()->unit)->toBe('kg');

    $blockedProduct = $user->products()->create([
        'name' => 'Produto com compras',
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

    $freeProduct = $user->products()->create([
        'name' => 'Produto sem compras',
        'category_id' => $category->id,
        'brand' => null,
        'sku' => null,
        'unit' => 'un',
        'type' => 'stockable',
        'minimum_stock' => 0,
        'current_stock' => 0,
        'is_active' => true,
        'notes' => null,
    ]);

    $user->purchaseEntries()->create([
        'product_id' => $blockedProduct->id,
        'purchase_invoice_id' => null,
        'account_id' => null,
        'quantity' => 1,
        'unit_price' => 5,
        'total_amount' => 5,
        'purchased_at' => now()->toDateString(),
        'source' => 'manual',
        'invoice_reference' => null,
        'notes' => null,
    ]);

    $this->actingAs($user)
        ->delete(route('products.destroy', $blockedProduct))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($user->products()->whereKey($blockedProduct->id)->exists())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('products.destroy-many'), [
            'ids' => [$freeProduct->id, $blockedProduct->id],
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($user->products()->whereKey($freeProduct->id)->exists())->toBeTrue();
    expect($user->products()->whereKey($blockedProduct->id)->exists())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('products.destroy-many'), [
            'ids' => [$freeProduct->id],
        ])
        ->assertRedirect();

    expect($user->products()->whereKey($freeProduct->id)->exists())->toBeFalse();
});

test('route model binding prevents editing resources from another house', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $foreignCategory = $otherUser->categories()->create([
        'code' => 'FOR-CAT',
        'name' => 'Categoria externa',
        'color' => '#778899',
        'description' => null,
    ]);

    $foreignAccount = $otherUser->accounts()->create([
        'code' => 'FOR-ACC',
        'name' => 'Conta externa',
        'initial_balance' => 0,
        'initial_balance_date' => now()->toDateString(),
    ]);

    $foreignProduct = $otherUser->products()->create([
        'name' => 'Produto externo',
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

    $this->actingAs($user)
        ->patch(route('categories.update', $foreignCategory), [
            'code' => 'X',
            'name' => 'X',
            'color' => '#112233',
            'description' => null,
        ])
        ->assertNotFound();

    $this->actingAs($user)
        ->patch(route('accounts.update', $foreignAccount), [
            'code' => 'X',
            'name' => 'X',
            'initial_balance' => 0,
            'initial_balance_date' => now()->toDateString(),
        ])
        ->assertNotFound();

    $this->actingAs($user)
        ->patch(route('products.update', $foreignProduct), [
            'category_id' => null,
            'name' => 'X',
            'brand' => null,
            'sku' => null,
            'unit' => 'un',
            'type' => 'stockable',
            'minimum_stock' => 0,
            'notes' => null,
        ])
        ->assertNotFound();
});
