<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Category;
use App\Models\FinancialEntry;
use App\Models\House;
use App\Models\Product;
use App\Models\PurchaseEntry;
use App\Models\PurchaseInvoice;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoSystemSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $this->cleanupExistingDemo();

            $user = User::create([
                'name' => 'DEMO',
                'email' => 'demo@financyme.local',
                'password' => 'DEMO123',
                'email_verified_at' => now(),
            ]);

            $house = House::create([
                'name' => 'DEMO',
                'code' => 'demo',
                'password' => 'DEMO123',
                'description' => 'Casa demonstracao com dados ficticios para explorar o sistema.',
            ]);

            $user->houses()->attach($house->id, ['role' => 'admin']);
            $user->update(['active_house_id' => $house->id]);

            $categories = collect([
                ['code' => 'CAT-MERCADO', 'name' => 'Mercado', 'color' => '#1F7A8C', 'description' => 'Compras gerais de mercado'],
                ['code' => 'CAT-LIMPEZA', 'name' => 'Limpeza', 'color' => '#E07A5F', 'description' => 'Itens de limpeza da casa'],
                ['code' => 'CAT-HORTI', 'name' => 'Hortifruti', 'color' => '#6AA56A', 'description' => 'Frutas e legumes'],
                ['code' => 'CAT-SERV', 'name' => 'Servicos', 'color' => '#6F8EA8', 'description' => 'Servicos recorrentes e pontuais'],
                ['code' => 'CAT-TRANS', 'name' => 'Transporte', 'color' => '#C59B5D', 'description' => 'Combustivel e deslocamentos'],
                ['code' => 'CAT-SAUDE', 'name' => 'Saude', 'color' => '#BE3D2A', 'description' => 'Consultas e farmacia'],
                ['code' => 'CAT-ASSIN', 'name' => 'Assinaturas', 'color' => '#8B7DB2', 'description' => 'Assinaturas mensais'],
            ])->mapWithKeys(fn (array $payload) => [
                $payload['code'] => $house->categories()->create($payload),
            ]);

            $accounts = collect([
                ['code' => 'NUBANK', 'name' => 'Cartao Nubank', 'initial_balance' => 1800, 'initial_balance_date' => Carbon::today()->subDays(45)->toDateString()],
                ['code' => 'INTER', 'name' => 'Conta Inter', 'initial_balance' => 950, 'initial_balance_date' => Carbon::today()->subDays(45)->toDateString()],
                ['code' => 'CAIXA', 'name' => 'Carteira da Casa', 'initial_balance' => 300, 'initial_balance_date' => Carbon::today()->subDays(45)->toDateString()],
            ])->mapWithKeys(fn (array $payload) => [
                $payload['code'] => $house->accounts()->create($payload),
            ]);

            $products = collect([
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Arroz Tipo 1',
                    'brand' => 'Bom Grao',
                    'sku' => 'ARZ-001',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 2,
                    'notes' => 'Pacote de 5kg',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Feijao Carioca',
                    'brand' => 'Da Terra',
                    'sku' => 'FEJ-002',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Pacote tradicional',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Cafe Torrado',
                    'brand' => 'Serra Alta',
                    'sku' => 'CAF-003',
                    'unit' => 'pct',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Cafe de uso diario',
                ],
                [
                    'category' => 'CAT-LIMPEZA',
                    'name' => 'Detergente Neutro',
                    'brand' => 'Casa Limpa',
                    'sku' => 'DET-004',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 2,
                    'notes' => 'Uso da cozinha',
                ],
                [
                    'category' => 'CAT-LIMPEZA',
                    'name' => 'Papel Higienico',
                    'brand' => 'Folha Leve',
                    'sku' => 'PAP-005',
                    'unit' => 'pct',
                    'type' => 'stockable',
                    'minimum_stock' => 2,
                    'notes' => 'Pacote com 12 rolos',
                ],
                [
                    'category' => 'CAT-HORTI',
                    'name' => 'Banana Prata',
                    'brand' => null,
                    'sku' => 'BAN-006',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Fruta para cafe da manha',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Peito de Frango',
                    'brand' => 'Granja Sul',
                    'sku' => 'FRG-007',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Proteina congelada',
                ],
                [
                    'category' => 'CAT-SERV',
                    'name' => 'Faxina Quinzenal',
                    'brand' => null,
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Servico terceirizado',
                ],
                [
                    'category' => 'CAT-SERV',
                    'name' => 'Internet Fibra',
                    'brand' => 'Fibra Max',
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Plano residencial',
                ],
                [
                    'category' => 'CAT-ASSIN',
                    'name' => 'Streaming de Filmes',
                    'brand' => 'Stream Box',
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Assinatura mensal',
                ],
                [
                    'category' => 'CAT-SAUDE',
                    'name' => 'Consulta Clinica',
                    'brand' => null,
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Consulta eventual',
                ],
            ])->mapWithKeys(function (array $payload) use ($house, $categories) {
                $product = $house->products()->create([
                    'category_id' => $categories[$payload['category']]->id,
                    'name' => $payload['name'],
                    'brand' => $payload['brand'],
                    'sku' => $payload['sku'],
                    'unit' => $payload['unit'],
                    'type' => $payload['type'],
                    'minimum_stock' => $payload['minimum_stock'],
                    'current_stock' => 0,
                    'is_active' => true,
                    'notes' => $payload['notes'],
                ]);

                return [$payload['name'] => $product];
            });

            $today = Carbon::today();

            $this->createManualPurchase($house, $products['Arroz Tipo 1'], $accounts['NUBANK'], 3, 28.90, $today->copy()->subDays(24), 'Reposicao do armario');
            $this->createManualPurchase($house, $products['Feijao Carioca'], $accounts['INTER'], 4, 8.40, $today->copy()->subDays(22), 'Compra mensal de feijao');
            $this->createManualPurchase($house, $products['Cafe Torrado'], $accounts['NUBANK'], 2, 16.50, $today->copy()->subDays(18), 'Cafe para o mes');
            $this->createManualPurchase($house, $products['Faxina Quinzenal'], $accounts['INTER'], 1, 180.00, $today->copy()->subDays(14), 'Faxina geral do apartamento');
            $this->createManualPurchase($house, $products['Internet Fibra'], $accounts['NUBANK'], 1, 119.90, $today->copy()->subDays(8), 'Mensalidade da internet');
            $this->createManualPurchase($house, $products['Streaming de Filmes'], $accounts['NUBANK'], 1, 39.90, $today->copy()->subDays(5), 'Assinatura renovada');
            $this->createManualPurchase($house, $products['Banana Prata'], $accounts['CAIXA'], 6, 5.20, $today->copy()->subDays(4), 'Feira do bairro');
            $this->createManualPurchase($house, $products['Consulta Clinica'], $accounts['INTER'], 1, 220.00, $today->copy()->subDays(2), 'Consulta de rotina');

            $this->createInvoicePurchase(
                $house,
                $accounts['NUBANK'],
                [
                    'store_name' => 'Supermercado Bom Preco',
                    'cnpj' => '12.345.678/0001-90',
                    'address' => 'Rua Central, 100',
                    'invoice_number' => '45128',
                    'series' => '1',
                    'access_key' => '35260412345678000190550010000451281000000010',
                    'receipt_url' => 'https://nfce.example.com/demo/supermercado-bom-preco',
                    'issued_at' => $today->copy()->subDays(11),
                ],
                [
                    ['product' => $products['Peito de Frango'], 'quantity' => 2.0, 'unit_price' => 18.00, 'notes' => 'Compra da semana'],
                    ['product' => $products['Detergente Neutro'], 'quantity' => 4, 'unit_price' => 3.50, 'notes' => 'Reposicao da pia'],
                    ['product' => $products['Papel Higienico'], 'quantity' => 2, 'unit_price' => 16.00, 'notes' => 'Pacote promocional'],
                ],
                'Compra importada da NFC-e - Supermercado Bom Preco'
            );

            $this->createInvoicePurchase(
                $house,
                $accounts['INTER'],
                [
                    'store_name' => 'Atacadao da Casa',
                    'cnpj' => '98.765.432/0001-11',
                    'address' => 'Avenida das Compras, 550',
                    'invoice_number' => '98217',
                    'series' => '2',
                    'access_key' => '35260498765432000111550020000982171000000022',
                    'receipt_url' => 'https://nfce.example.com/demo/atacadao-da-casa',
                    'issued_at' => $today->copy()->subDays(6),
                ],
                [
                    ['product' => $products['Arroz Tipo 1'], 'quantity' => 1, 'unit_price' => 30.50, 'notes' => 'Pacote extra'],
                    ['product' => $products['Banana Prata'], 'quantity' => 3.5, 'unit_price' => 4.80, 'notes' => 'Frutas da semana'],
                ],
                'Compra importada da NFC-e - Atacadao da Casa'
            );

            $this->createStockOutflow($house, $products['Arroz Tipo 1'], 1.200, $today->copy()->subDays(7), 'Almocos da semana');
            $this->createStockOutflow($house, $products['Feijao Carioca'], 1.000, $today->copy()->subDays(6), 'Feijao da semana');
            $this->createStockOutflow($house, $products['Cafe Torrado'], 0.500, $today->copy()->subDays(3), 'Consumo diario');
            $this->createStockOutflow($house, $products['Detergente Neutro'], 1.000, $today->copy()->subDays(2), 'Uso da cozinha');
            $this->createStockOutflow($house, $products['Banana Prata'], 4.000, $today->copy()->subDays(1), 'Cafe da manha');
            $this->createStockOutflow($house, $products['Peito de Frango'], 1.000, $today->copy()->subDays(5), 'Jantar da familia');

            $this->createFinancialEntry($house, $accounts['INTER'], null, 'inflow', 3500.00, $today->copy()->subDays(20), 'Salario principal');
            $this->createFinancialEntry($house, $accounts['NUBANK'], $categories['CAT-MERCADO'], 'inflow', 220.00, $today->copy()->subDays(4), 'Reembolso de compras');
            $this->createFinancialEntry($house, $accounts['CAIXA'], $categories['CAT-TRANS'], 'outflow', 90.00, $today->copy()->subDays(2), 'Combustivel do carro');
            $this->createFinancialEntry($house, $accounts['INTER'], $categories['CAT-SAUDE'], 'outflow', 65.00, $today->copy()->subDays(1), 'Medicamentos');
            $this->createFinancialEntry($house, $accounts['NUBANK'], $categories['CAT-SERV'], 'inflow', 40.00, $today->copy()->subDays(1), 'Cashback do cartao');
        });
    }

    private function cleanupExistingDemo(): void
    {
        House::query()->where('code', 'demo')->each(function (House $house): void {
            $house->delete();
        });

        User::query()->where('email', 'demo@financyme.local')->delete();
    }

    private function createManualPurchase(
        House $house,
        Product $product,
        ?Account $account,
        float $quantity,
        float $unitPrice,
        Carbon $purchasedAt,
        ?string $notes = null,
    ): PurchaseEntry {
        $entry = $house->purchaseEntries()->create([
            'product_id' => $product->id,
            'account_id' => $account?->id,
            'quantity' => $quantity,
            'unit_price' => round($unitPrice, 2),
            'total_amount' => round($quantity * $unitPrice, 2),
            'purchased_at' => $purchasedAt->toDateString(),
            'source' => 'manual',
            'invoice_reference' => null,
            'notes' => $notes,
        ]);

        if ($product->type === 'stockable') {
            $product->update([
                'current_stock' => round((float) $product->current_stock + $quantity, 3),
            ]);
        }

        $entry->financialEntries()->create([
            'house_id' => $house->id,
            'account_id' => $account?->id,
            'category_id' => $product->category_id,
            'direction' => 'outflow',
            'origin' => 'manual_purchase',
            'amount' => round($quantity * $unitPrice, 2),
            'moved_at' => $purchasedAt->toDateString(),
            'description' => $notes ?: 'Compra: '.$product->name,
        ]);

        return $entry;
    }

    /**
     * @param  array<string, mixed>  $invoiceData
     * @param  array<int, array{product: Product, quantity: float|int, unit_price: float|int, notes?: string|null}>  $items
     */
    private function createInvoicePurchase(
        House $house,
        Account $account,
        array $invoiceData,
        array $items,
        ?string $description = null,
    ): PurchaseInvoice {
        $grossAmount = collect($items)->sum(fn (array $item) => (float) $item['quantity'] * (float) $item['unit_price']);

        $invoice = $house->purchaseInvoices()->create([
            'store_name' => $invoiceData['store_name'],
            'cnpj' => $invoiceData['cnpj'] ?? null,
            'address' => $invoiceData['address'] ?? null,
            'invoice_number' => $invoiceData['invoice_number'] ?? null,
            'series' => $invoiceData['series'] ?? null,
            'access_key' => $invoiceData['access_key'] ?? null,
            'receipt_url' => $invoiceData['receipt_url'] ?? null,
            'issued_at' => ($invoiceData['issued_at'] ?? Carbon::today())->toDateString(),
            'items_count' => count($items),
            'gross_amount' => round($grossAmount, 2),
            'discount_amount' => 0,
            'paid_amount' => round($grossAmount, 2),
        ]);

        foreach ($items as $item) {
            $product = $item['product'];
            $quantity = (float) $item['quantity'];
            $unitPrice = (float) $item['unit_price'];

            $house->purchaseEntries()->create([
                'product_id' => $product->id,
                'purchase_invoice_id' => $invoice->id,
                'account_id' => $account->id,
                'quantity' => $quantity,
                'unit_price' => round($unitPrice, 2),
                'total_amount' => round($quantity * $unitPrice, 2),
                'purchased_at' => $invoice->issued_at?->toDateString() ?? Carbon::today()->toDateString(),
                'source' => 'invoice',
                'invoice_reference' => $invoice->invoice_number,
                'notes' => $item['notes'] ?? null,
            ]);

            if ($product->type === 'stockable') {
                $product->update([
                    'current_stock' => round((float) $product->current_stock + $quantity, 3),
                ]);
            }
        }

        $invoice->financialEntries()->create([
            'house_id' => $house->id,
            'account_id' => $account->id,
            'purchase_invoice_id' => $invoice->id,
            'direction' => 'outflow',
            'origin' => 'invoice_purchase',
            'amount' => round($grossAmount, 2),
            'moved_at' => $invoice->issued_at?->toDateString() ?? Carbon::today()->toDateString(),
            'description' => $description ?: 'Compra importada da nota fiscal',
        ]);

        return $invoice;
    }

    private function createStockOutflow(
        House $house,
        Product $product,
        float $quantity,
        Carbon $movedAt,
        ?string $notes = null,
    ): StockMovement {
        $product->update([
            'current_stock' => round(max(0, (float) $product->current_stock - $quantity), 3),
        ]);

        return $house->stockMovements()->create([
            'product_id' => $product->id,
            'direction' => 'outflow',
            'origin' => 'manual_withdrawal',
            'quantity' => $quantity,
            'moved_at' => $movedAt->toDateTimeString(),
            'notes' => $notes,
        ]);
    }

    private function createFinancialEntry(
        House $house,
        ?Account $account,
        ?Category $category,
        string $direction,
        float $amount,
        Carbon $movedAt,
        ?string $description = null,
    ): FinancialEntry {
        return $house->financialEntries()->create([
            'account_id' => $account?->id,
            'category_id' => $category?->id,
            'direction' => $direction,
            'origin' => 'manual',
            'amount' => round($amount, 2),
            'moved_at' => $movedAt->toDateString(),
            'description' => $description,
        ]);
    }
}
