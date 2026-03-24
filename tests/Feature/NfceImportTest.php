<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

test('user can import nfce from parana public link and review items', function () {
    $user = User::factory()->create();
    $receiptUrl = 'https://www.fazenda.pr.gov.br/nfce/qrcode?p=41260376189406004628651260003094931004085409|2|1|1|32D7052D8E169C149194A35193D5187134762527';

    Http::fake([
        'https://www.fazenda.pr.gov.br/*' => Http::response(
            file_get_contents(base_path('tests/Fixtures/parana_nfce_sample.html')),
            200,
        ),
    ]);

    $this->actingAs($user)
        ->post(route('purchases.import-link'), [
            'receipt_url' => $receiptUrl,
        ])
        ->assertRedirect(route('purchases.index'));

    $this->actingAs($user)
        ->get(route('purchases.index'))
        ->assertOk()
        ->assertSee('MERCADO TESTE LTDA')
        ->assertSee('ARROZ TIPO 1')
        ->assertSee('FEIJAO PRETO');
});

test('user can confirm imported nfce and create products and purchase entries', function () {
    $user = User::factory()->create();
    $receiptUrl = 'https://www.fazenda.pr.gov.br/nfce/qrcode?p=41260376189406004628651260003094931004085409|2|1|1|32D7052D8E169C149194A35193D5187134762527';

    $category = $user->categories()->create([
        'name' => 'Mercado',
        'kind' => 'produto',
        'color' => '#1F7A8C',
        'description' => 'Compras do mercado',
    ]);

    Http::fake([
        'https://www.fazenda.pr.gov.br/*' => Http::response(
            file_get_contents(base_path('tests/Fixtures/parana_nfce_sample.html')),
            200,
        ),
    ]);

    $this->actingAs($user)->post(route('purchases.import-link'), [
        'receipt_url' => $receiptUrl,
    ]);

    $preview = session('purchase_import_preview');

    $this->actingAs($user)
        ->post(route('purchases.import-confirm'), [
            'token' => $preview['token'],
            'items' => [
                [
                    'product_id' => '',
                    'product_name' => 'Arroz Tipo 1',
                    'category_id' => (string) $category->id,
                ],
                [
                    'product_id' => '',
                    'product_name' => 'Feijao Preto',
                    'category_id' => (string) $category->id,
                ],
            ],
        ])
        ->assertRedirect(route('purchases.index'));

    expect($user->products()->count())->toBe(2);
    expect($user->purchaseEntries()->count())->toBe(2);
    expect((float) $user->products()->where('name', 'Arroz Tipo 1')->firstOrFail()->current_stock)
        ->toBe(1.0);
    expect((float) $user->products()->where('name', 'Feijao Preto')->firstOrFail()->current_stock)
        ->toBe(2.0);
});
