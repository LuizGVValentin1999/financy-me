<?php

use App\Models\House;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('authenticated user can access house chooser and list screens', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('house.choose'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('House/Choose'));

    $this->actingAs($user)
        ->get(route('houses.list'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('House/List')
            ->has('houses', 1)
            ->where('active_house_id', $user->fresh()->active_house_id)
        );
});

test('user can create a house and become admin with active house updated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('house.store'), [
            'name' => 'Casa Nova',
            'code' => 'Casa_Nova',
            'house_password' => 'segredo123',
            'house_password_confirmation' => 'segredo123',
        ])
        ->assertRedirect(route('dashboard', absolute: false));

    $createdHouse = House::query()
        ->where('code', 'casa_nova')
        ->firstOrFail();

    $user->refresh();

    expect($user->active_house_id)->toBe($createdHouse->id);
    expect($user->houses()->where('houses.id', $createdHouse->id)->exists())->toBeTrue();
    expect($user->houses()->where('houses.id', $createdHouse->id)->firstOrFail()->pivot->role)
        ->toBe('admin');
});

test('user can join existing house and active house is set when missing', function () {
    $user = User::factory()->create();
    $user->update(['active_house_id' => null]);

    $house = House::create([
        'name' => 'Casa Compartilhada',
        'code' => 'compartilhada',
        'password' => Hash::make('senha-casa-123'),
    ]);

    $this->actingAs($user)
        ->post(route('house.join'), [
            'code' => 'compartilhada',
            'password' => 'senha-casa-123',
        ])
        ->assertRedirect(route('dashboard', absolute: false));

    $user->refresh();

    expect($user->active_house_id)->toBe($house->id);
    expect($user->houses()->where('houses.id', $house->id)->exists())->toBeTrue();
    expect($user->houses()->where('houses.id', $house->id)->firstOrFail()->pivot->role)
        ->toBe('member');
});

test('join house fails with invalid house password', function () {
    $user = User::factory()->create();

    House::create([
        'name' => 'Casa Segura',
        'code' => 'casa_segura',
        'password' => Hash::make('senha-correta'),
    ]);

    $this->actingAs($user)
        ->from(route('house.choose'))
        ->post(route('house.join'), [
            'code' => 'casa_segura',
            'password' => 'senha-errada',
        ])
        ->assertRedirect(route('house.choose'))
        ->assertSessionHasErrors('password');
});

test('user can set one of their houses as active', function () {
    $user = User::factory()->create();

    $secondaryHouse = House::create([
        'name' => 'Casa Secundaria',
        'code' => 'casa_secundaria',
        'password' => Hash::make('senha12345'),
    ]);

    $user->houses()->attach($secondaryHouse->id, ['role' => 'member']);

    $this->actingAs($user)
        ->from(route('houses.list'))
        ->patch(route('house.set-active', $secondaryHouse))
        ->assertRedirect(route('houses.list'));

    expect($user->fresh()->active_house_id)->toBe($secondaryHouse->id);
});

test('user cannot set active house when not a member', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $foreignHouse = $otherUser->getCurrentHouse();

    $this->actingAs($user)
        ->patch(route('house.set-active', $foreignHouse))
        ->assertForbidden();
});

test('house middleware assigns first house when active house is null', function () {
    $user = User::factory()->create();
    $user->update(['active_house_id' => null]);

    $firstHouseId = (int) $user->houses()->value('houses.id');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();

    expect((int) $user->fresh()->active_house_id)->toBe($firstHouseId);
});

test('house middleware redirects to chooser when user has no houses', function () {
    $user = User::query()->create([
        'name' => 'No House User',
        'email' => 'no-house-'.uniqid().'@example.com',
        'password' => Hash::make('password'),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('house.choose'));
});
