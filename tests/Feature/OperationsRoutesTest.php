<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    Config::set('operations.route_enabled', true);
    Config::set('operations.route_token', 'deploy-secret');
});

test('operations migrate route rejects invalid token', function () {
    $this->getJson('/api/ops/migrate')
        ->assertForbidden()
        ->assertJson([
            'ok' => false,
            'message' => 'Unauthorized.',
        ]);
});

test('operations migrate route is hidden when disabled', function () {
    Config::set('operations.route_enabled', false);

    $this->getJson('/api/ops/migrate?token=deploy-secret')
        ->assertNotFound()
        ->assertJson([
            'ok' => false,
            'message' => 'Not found.',
        ]);
});

test('operations migrate route runs migrate command with valid token in get request', function () {
    Artisan::spy();

    $this->getJson('/api/ops/migrate?token=deploy-secret')
        ->assertOk()
        ->assertJson([
            'ok' => true,
            'command' => 'migrate --force',
        ]);

    Artisan::shouldHaveReceived('call')
        ->once()
        ->with('migrate', ['--force' => true]);
});

test('operations optimize clear route runs clear command with valid token', function () {
    Artisan::spy();

    $this->getJson('/api/ops/optimize-clear?token=deploy-secret')
        ->assertOk()
        ->assertJson([
            'ok' => true,
            'command' => 'optimize:clear',
        ]);

    Artisan::shouldHaveReceived('call')
        ->once()
        ->with('optimize:clear');
});

test('operations route returns readable error payload when artisan command fails', function () {
    Artisan::shouldReceive('call')
        ->once()
        ->with('migrate', ['--force' => true])
        ->andThrow(new RuntimeException('migration exploded'));

    $this->getJson('/api/ops/migrate?token=deploy-secret')
        ->assertStatus(500)
        ->assertJson([
            'ok' => false,
            'command' => 'migrate --force',
            'error' => 'RuntimeException',
            'message' => 'migration exploded',
        ]);
});
