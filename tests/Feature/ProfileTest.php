<?php

use App\Models\House;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame('test@example.com', $user->email);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});

test('user can delete account together with active house when sole admin', function () {
    $user = User::factory()->create();
    $houseId = $user->active_house_id;

    $response = $this
        ->actingAs($user)
        ->delete('/profile/with-house', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($user->fresh());
    $this->assertNull(House::find($houseId));
});

test('non admin cannot delete active house together with account', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    $member->houses()->detach();
    $member->update(['active_house_id' => null]);

    $house = $owner->getCurrentHouse();
    $member->houses()->attach($house->id, ['role' => 'member']);
    $member->update(['active_house_id' => $house->id]);

    $this->actingAs($member)
        ->from('/profile')
        ->delete('/profile/with-house', [
            'password' => 'password',
        ])
        ->assertRedirect('/profile')
        ->assertSessionHas('error');

    $this->assertNotNull($member->fresh());
    $this->assertNotNull($house->fresh());
});

test('house with multiple members cannot be deleted together with account', function () {
    $owner = User::factory()->create();
    $house = $owner->getCurrentHouse();

    $member = User::query()->create([
        'name' => 'Member User',
        'email' => 'member-'.uniqid().'@example.com',
        'password' => Hash::make('password'),
    ]);

    $member->houses()->attach($house->id, ['role' => 'member']);
    $member->update(['active_house_id' => $house->id]);

    $this->actingAs($owner)
        ->from('/profile')
        ->delete('/profile/with-house', [
            'password' => 'password',
        ])
        ->assertRedirect('/profile')
        ->assertSessionHas('error');

    $this->assertNotNull($owner->fresh());
    $this->assertNotNull($house->fresh());
});
