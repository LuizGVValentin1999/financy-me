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
                ['code' => 'MPAGO', 'name' => 'Carteira Mercado Pago', 'initial_balance' => 640, 'initial_balance_date' => Carbon::today()->subDays(45)->toDateString()],
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
                    'category' => 'CAT-MERCADO',
                    'name' => 'Macarrao Espaguete',
                    'brand' => 'Massa Nobre',
                    'sku' => 'MAC-008',
                    'unit' => 'pct',
                    'type' => 'stockable',
                    'minimum_stock' => 2,
                    'notes' => 'Macarrao para refeicoes rapidas',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Leite Integral',
                    'brand' => 'Parmalat',
                    'sku' => 'LEI-009',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 4,
                    'notes' => 'Caixa de 1 litro',
                ],
                [
                    'category' => 'CAT-HORTI',
                    'name' => 'Tomate Italiano',
                    'brand' => null,
                    'sku' => 'TOM-010',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Uso em saladas e molho',
                ],
                [
                    'category' => 'CAT-HORTI',
                    'name' => 'Alho a Granel',
                    'brand' => null,
                    'sku' => 'ALH-011',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 0.3,
                    'notes' => 'Tempero base',
                ],
                [
                    'category' => 'CAT-HORTI',
                    'name' => 'Cebola Roxa',
                    'brand' => null,
                    'sku' => 'CEB-014',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 0.5,
                    'notes' => 'Base para refogados e saladas',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Oleo de Soja',
                    'brand' => 'Soya',
                    'sku' => 'OLE-015',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 2,
                    'notes' => 'Garrafa de 900ml',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Acucar Refinado',
                    'brand' => 'Doce Dia',
                    'sku' => 'ACU-016',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Uso diario em bebidas e receitas',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Iogurte Natural',
                    'brand' => 'Vigor',
                    'sku' => 'IOG-017',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 4,
                    'notes' => 'Pote individual para cafe da manha',
                ],
                [
                    'category' => 'CAT-MERCADO',
                    'name' => 'Queijo Mussarela',
                    'brand' => 'Laticinios Serra',
                    'sku' => 'QUE-018',
                    'unit' => 'kg',
                    'type' => 'stockable',
                    'minimum_stock' => 0.5,
                    'notes' => 'Fatiado para lanches',
                ],
                [
                    'category' => 'CAT-LIMPEZA',
                    'name' => 'Sabao em Po',
                    'brand' => 'Brilho Max',
                    'sku' => 'SAB-012',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Pacote de 1,6kg',
                ],
                [
                    'category' => 'CAT-LIMPEZA',
                    'name' => 'Desinfetante',
                    'brand' => 'Casa Limpa',
                    'sku' => 'DES-013',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 2,
                    'notes' => 'Uso em banheiros',
                ],
                [
                    'category' => 'CAT-LIMPEZA',
                    'name' => 'Agua Sanitaria',
                    'brand' => 'Clara',
                    'sku' => 'AGU-019',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 1,
                    'notes' => 'Limpeza pesada e roupas brancas',
                ],
                [
                    'category' => 'CAT-LIMPEZA',
                    'name' => 'Esponja Multiuso',
                    'brand' => 'Brilho Max',
                    'sku' => 'ESP-020',
                    'unit' => 'un',
                    'type' => 'stockable',
                    'minimum_stock' => 3,
                    'notes' => 'Pacote com varias esponjas',
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
                [
                    'category' => 'CAT-SERV',
                    'name' => 'Manutencao do Ar Condicionado',
                    'brand' => null,
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Servico eventual de manutencao',
                ],
                [
                    'category' => 'CAT-SERV',
                    'name' => 'Lavagem do Sofa',
                    'brand' => null,
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Higienizacao eventual da sala',
                ],
                [
                    'category' => 'CAT-SERV',
                    'name' => 'Academia Mensal',
                    'brand' => 'Blue Fitness',
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Plano recorrente mensal',
                ],
                [
                    'category' => 'CAT-TRANS',
                    'name' => 'Gasolina Comum',
                    'brand' => 'Posto Central',
                    'sku' => null,
                    'unit' => 'l',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Abastecimento do carro',
                ],
                [
                    'category' => 'CAT-TRANS',
                    'name' => 'Transporte por App',
                    'brand' => 'Mobilidade Go',
                    'sku' => null,
                    'unit' => 'un',
                    'type' => 'non_stockable',
                    'minimum_stock' => 0,
                    'notes' => 'Deslocamentos eventuais na cidade',
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
            $this->createManualPurchase($house, $products['Leite Integral'], $accounts['CAIXA'], 8, 5.89, $today->copy()->subDays(17), 'Reposicao da despensa');
            $this->createManualPurchase($house, $products['Macarrao Espaguete'], $accounts['INTER'], 5, 4.99, $today->copy()->subDays(15), 'Compra do mes');
            $this->createManualPurchase($house, $products['Sabao em Po'], $accounts['NUBANK'], 2, 18.75, $today->copy()->subDays(12), 'Lavanderia da casa');
            $this->createManualPurchase($house, $products['Gasolina Comum'], $accounts['CAIXA'], 1, 120.00, $today->copy()->subDays(9), 'Abastecimento semanal');
            $this->createManualPurchase($house, $products['Manutencao do Ar Condicionado'], $accounts['INTER'], 1, 260.00, $today->copy()->subDays(3), 'Limpeza e revisao');
            $this->createManualPurchase($house, $products['Oleo de Soja'], $accounts['MPAGO'], 3, 8.79, $today->copy()->subDays(21), 'Reposicao para cozinhar');
            $this->createManualPurchase($house, $products['Acucar Refinado'], $accounts['CAIXA'], 2, 5.99, $today->copy()->subDays(19), 'Acucar para cafe e sobremesa');
            $this->createManualPurchase($house, $products['Queijo Mussarela'], $accounts['NUBANK'], 1.2, 34.90, $today->copy()->subDays(13), 'Frios da semana');
            $this->createManualPurchase($house, $products['Iogurte Natural'], $accounts['MPAGO'], 10, 3.79, $today->copy()->subDays(11), 'Cafe da manha da semana');
            $this->createManualPurchase($house, $products['Cebola Roxa'], $accounts['CAIXA'], 1.6, 7.80, $today->copy()->subDays(10), 'Legumes para a semana');
            $this->createManualPurchase($house, $products['Agua Sanitaria'], $accounts['INTER'], 2, 6.49, $today->copy()->subDays(7), 'Limpeza pesada do mes');
            $this->createManualPurchase($house, $products['Esponja Multiuso'], $accounts['CAIXA'], 4, 2.90, $today->copy()->subDays(6), 'Reposicao da cozinha');
            $this->createManualPurchase($house, $products['Academia Mensal'], $accounts['MPAGO'], 1, 109.90, $today->copy()->subDays(5), 'Mensalidade da academia');
            $this->createManualPurchase($house, $products['Transporte por App'], $accounts['NUBANK'], 3, 24.50, $today->copy()->subDays(4), 'Corridas da semana');
            $this->createManualPurchase($house, $products['Lavagem do Sofa'], $accounts['INTER'], 1, 210.00, $today->copy()->subDays(1), 'Higienizacao agendada');

            $invoiceScenarios = [
                [
                    'account' => 'NUBANK',
                    'store_name' => 'Supermercado Bom Preco',
                    'cnpj' => '12.345.678/0001-90',
                    'address' => 'Rua Central, 100',
                    'invoice_number' => '45128',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(28),
                    'slug' => 'supermercado-bom-preco',
                    'items' => [
                        ['product' => 'Peito de Frango', 'quantity' => 2.0, 'unit_price' => 18.00, 'notes' => 'Compra da semana'],
                        ['product' => 'Detergente Neutro', 'quantity' => 4, 'unit_price' => 3.50, 'notes' => 'Reposicao da pia'],
                        ['product' => 'Papel Higienico', 'quantity' => 2, 'unit_price' => 16.00, 'notes' => 'Pacote promocional'],
                    ],
                ],
                [
                    'account' => 'INTER',
                    'store_name' => 'Atacadao da Casa',
                    'cnpj' => '98.765.432/0001-11',
                    'address' => 'Avenida das Compras, 550',
                    'invoice_number' => '98217',
                    'series' => '2',
                    'issued_at' => $today->copy()->subDays(26),
                    'slug' => 'atacadao-da-casa',
                    'items' => [
                        ['product' => 'Arroz Tipo 1', 'quantity' => 1, 'unit_price' => 30.50, 'notes' => 'Pacote extra'],
                        ['product' => 'Banana Prata', 'quantity' => 3.5, 'unit_price' => 4.80, 'notes' => 'Frutas da semana'],
                    ],
                ],
                [
                    'account' => 'CAIXA',
                    'store_name' => 'Mercado Vila Nova',
                    'cnpj' => '44.112.330/0001-08',
                    'address' => 'Rua das Flores, 88',
                    'invoice_number' => '70031',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(24),
                    'slug' => 'mercado-vila-nova',
                    'items' => [
                        ['product' => 'Leite Integral', 'quantity' => 12, 'unit_price' => 4.99],
                        ['product' => 'Cafe Torrado', 'quantity' => 2, 'unit_price' => 15.90],
                        ['product' => 'Acucar Refinado', 'quantity' => 2, 'unit_price' => 5.49],
                    ],
                ],
                [
                    'account' => 'NUBANK',
                    'store_name' => 'Horti do Bairro',
                    'cnpj' => '55.981.004/0001-70',
                    'address' => 'Rua do Comercio, 45',
                    'invoice_number' => '18291',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(22),
                    'slug' => 'horti-do-bairro',
                    'items' => [
                        ['product' => 'Tomate Italiano', 'quantity' => 2.3, 'unit_price' => 7.50],
                        ['product' => 'Banana Prata', 'quantity' => 4.1, 'unit_price' => 4.70],
                        ['product' => 'Alho a Granel', 'quantity' => 0.4, 'unit_price' => 21.90],
                    ],
                ],
                [
                    'account' => 'INTER',
                    'store_name' => 'Casa da Limpeza',
                    'cnpj' => '32.908.444/0001-66',
                    'address' => 'Avenida Norte, 301',
                    'invoice_number' => '22304',
                    'series' => '4',
                    'issued_at' => $today->copy()->subDays(20),
                    'slug' => 'casa-da-limpeza',
                    'items' => [
                        ['product' => 'Sabao em Po', 'quantity' => 1, 'unit_price' => 19.90],
                        ['product' => 'Desinfetante', 'quantity' => 3, 'unit_price' => 7.20],
                        ['product' => 'Agua Sanitaria', 'quantity' => 2, 'unit_price' => 5.95],
                        ['product' => 'Esponja Multiuso', 'quantity' => 3, 'unit_price' => 2.69],
                    ],
                ],
                [
                    'account' => 'NUBANK',
                    'store_name' => 'Emporio Massa Fina',
                    'cnpj' => '13.477.220/0001-55',
                    'address' => 'Rua Italia, 410',
                    'invoice_number' => '50391',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(18),
                    'slug' => 'emporio-massa-fina',
                    'items' => [
                        ['product' => 'Macarrao Espaguete', 'quantity' => 6, 'unit_price' => 5.15],
                        ['product' => 'Molho', 'quantity' => 2, 'unit_price' => 8.90, 'new' => true, 'category' => 'CAT-MERCADO', 'unit' => 'un', 'type' => 'stockable'],
                    ],
                ],
                [
                    'account' => 'CAIXA',
                    'store_name' => 'Mercado da Esquina',
                    'cnpj' => '61.222.119/0001-03',
                    'address' => 'Rua Aurora, 22',
                    'invoice_number' => '88201',
                    'series' => '3',
                    'issued_at' => $today->copy()->subDays(16),
                    'slug' => 'mercado-da-esquina',
                    'items' => [
                        ['product' => 'Arroz Tipo 1', 'quantity' => 2, 'unit_price' => 29.80],
                        ['product' => 'Feijao Carioca', 'quantity' => 3, 'unit_price' => 8.90],
                        ['product' => 'Leite Integral', 'quantity' => 6, 'unit_price' => 5.29],
                        ['product' => 'Oleo de Soja', 'quantity' => 2, 'unit_price' => 8.49],
                    ],
                ],
                [
                    'account' => 'INTER',
                    'store_name' => 'Feira Organica Sul',
                    'cnpj' => '14.400.777/0001-21',
                    'address' => 'Praca Verde, 9',
                    'invoice_number' => '12990',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(14),
                    'slug' => 'feira-organica-sul',
                    'items' => [
                        ['product' => 'Tomate Italiano', 'quantity' => 1.8, 'unit_price' => 8.20],
                        ['product' => 'Banana Prata', 'quantity' => 2.7, 'unit_price' => 5.10],
                        ['product' => 'Cebola Roxa', 'quantity' => 1.2, 'unit_price' => 7.95],
                    ],
                ],
                [
                    'account' => 'NUBANK',
                    'store_name' => 'Açougue Bom Corte',
                    'cnpj' => '10.105.990/0001-31',
                    'address' => 'Rua das Acacias, 144',
                    'invoice_number' => '60011',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(12),
                    'slug' => 'acougue-bom-corte',
                    'items' => [
                        ['product' => 'Peito de Frango', 'quantity' => 3.4, 'unit_price' => 17.80],
                    ],
                ],
                [
                    'account' => 'INTER',
                    'store_name' => 'Mercantil Central',
                    'cnpj' => '70.500.118/0001-14',
                    'address' => 'Avenida Brasil, 780',
                    'invoice_number' => '77552',
                    'series' => '2',
                    'issued_at' => $today->copy()->subDays(10),
                    'slug' => 'mercantil-central',
                    'items' => [
                        ['product' => 'Papel Higienico', 'quantity' => 2, 'unit_price' => 18.90],
                        ['product' => 'Detergente Neutro', 'quantity' => 6, 'unit_price' => 3.90],
                        ['product' => 'Desinfetante', 'quantity' => 2, 'unit_price' => 7.60],
                    ],
                ],
                [
                    'account' => 'CAIXA',
                    'store_name' => 'Mini Mercado Horizonte',
                    'cnpj' => '11.840.225/0001-99',
                    'address' => 'Rua Horizonte, 500',
                    'invoice_number' => '40122',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(8),
                    'slug' => 'mini-mercado-horizonte',
                    'items' => [
                        ['product' => 'Cafe Torrado', 'quantity' => 1, 'unit_price' => 17.40],
                        ['product' => 'Leite Integral', 'quantity' => 10, 'unit_price' => 5.49],
                        ['product' => 'Iogurte Natural', 'quantity' => 8, 'unit_price' => 3.69],
                    ],
                ],
                [
                    'account' => 'NUBANK',
                    'store_name' => 'Super Loja Popular',
                    'cnpj' => '28.994.100/0001-42',
                    'address' => 'Rua Principal, 1212',
                    'invoice_number' => '93220',
                    'series' => '5',
                    'issued_at' => $today->copy()->subDays(6),
                    'slug' => 'super-loja-popular',
                    'items' => [
                        ['product' => 'Arroz Tipo 1', 'quantity' => 1, 'unit_price' => 31.90],
                        ['product' => 'Macarrao Espaguete', 'quantity' => 4, 'unit_price' => 4.85],
                        ['product' => 'Sabao em Po', 'quantity' => 1, 'unit_price' => 20.10],
                        ['product' => 'Acucar Refinado', 'quantity' => 1, 'unit_price' => 5.79],
                    ],
                ],
                [
                    'account' => 'MPAGO',
                    'store_name' => 'Distribuidora Prime',
                    'cnpj' => '39.871.776/0001-61',
                    'address' => 'Rua das Industrias, 90',
                    'invoice_number' => '12004',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(5),
                    'slug' => 'distribuidora-prime',
                    'items' => [
                        ['product' => 'Papel Higienico', 'quantity' => 3, 'unit_price' => 17.50],
                        ['product' => 'Detergente Neutro', 'quantity' => 8, 'unit_price' => 3.30],
                        ['product' => 'Esponja Multiuso', 'quantity' => 5, 'unit_price' => 2.30],
                    ],
                ],
                [
                    'account' => 'CAIXA',
                    'store_name' => 'Frutaria Sabor',
                    'cnpj' => '82.123.450/0001-67',
                    'address' => 'Rua do Pomar, 60',
                    'invoice_number' => '33217',
                    'series' => '2',
                    'issued_at' => $today->copy()->subDays(3),
                    'slug' => 'frutaria-sabor',
                    'items' => [
                        ['product' => 'Banana Prata', 'quantity' => 5.8, 'unit_price' => 4.95],
                        ['product' => 'Tomate Italiano', 'quantity' => 1.6, 'unit_price' => 8.40],
                        ['product' => 'Cebola Roxa', 'quantity' => 0.9, 'unit_price' => 7.70],
                    ],
                ],
                [
                    'account' => 'NUBANK',
                    'store_name' => 'Mercado Familiar',
                    'cnpj' => '19.555.332/0001-10',
                    'address' => 'Rua da Paz, 73',
                    'invoice_number' => '14883',
                    'series' => '1',
                    'issued_at' => $today->copy()->subDays(1),
                    'slug' => 'mercado-familiar',
                    'items' => [
                        ['product' => 'Feijao Carioca', 'quantity' => 2, 'unit_price' => 9.10],
                        ['product' => 'Leite Integral', 'quantity' => 8, 'unit_price' => 5.39],
                        ['product' => 'Alho a Granel', 'quantity' => 0.35, 'unit_price' => 24.90],
                        ['product' => 'Queijo Mussarela', 'quantity' => 0.6, 'unit_price' => 36.90],
                    ],
                ],
            ];

            foreach ($invoiceScenarios as $index => $scenario) {
                $invoiceItems = array_map(function (array $item) use ($products, $house, $categories) {
                    if (! empty($item['new'])) {
                        $product = $house->products()->firstOrCreate(
                            ['name' => $item['product']],
                            [
                                'category_id' => $categories[$item['category']]->id,
                                'brand' => null,
                                'sku' => null,
                                'unit' => $item['unit'],
                                'type' => $item['type'],
                                'minimum_stock' => 1,
                                'current_stock' => 0,
                                'is_active' => true,
                                'notes' => 'Produto extra da base demo',
                            ],
                        );
                    } else {
                        $product = $products[$item['product']];
                    }

                    return [
                        'product' => $product,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'notes' => $item['notes'] ?? null,
                    ];
                }, $scenario['items']);

                $accessKey = sprintf('352604%014d55001%03d%09d', 10000000000000 + $index, ($index % 5) + 1, 400000000 + $index);

                $this->createInvoicePurchase(
                    $house,
                    $accounts[$scenario['account']],
                    [
                        'store_name' => $scenario['store_name'],
                        'cnpj' => $scenario['cnpj'],
                        'address' => $scenario['address'],
                        'invoice_number' => $scenario['invoice_number'],
                        'series' => $scenario['series'],
                        'access_key' => $accessKey,
                        'receipt_url' => 'https://nfce.example.com/demo/'.$scenario['slug'],
                        'issued_at' => $scenario['issued_at'],
                    ],
                    $invoiceItems,
                    'Compra importada da NFC-e - '.$scenario['store_name']
                );
            }

            $this->createStockOutflow($house, $products['Arroz Tipo 1'], 1.200, $today->copy()->subDays(7), 'Almocos da semana');
            $this->createStockOutflow($house, $products['Feijao Carioca'], 1.000, $today->copy()->subDays(6), 'Feijao da semana');
            $this->createStockOutflow($house, $products['Cafe Torrado'], 0.500, $today->copy()->subDays(3), 'Consumo diario');
            $this->createStockOutflow($house, $products['Detergente Neutro'], 1.000, $today->copy()->subDays(2), 'Uso da cozinha');
            $this->createStockOutflow($house, $products['Banana Prata'], 4.000, $today->copy()->subDays(1), 'Cafe da manha');
            $this->createStockOutflow($house, $products['Peito de Frango'], 1.000, $today->copy()->subDays(5), 'Jantar da familia');
            $this->createStockOutflow($house, $products['Leite Integral'], 6.000, $today->copy()->subDays(4), 'Consumo da semana');
            $this->createStockOutflow($house, $products['Macarrao Espaguete'], 2.000, $today->copy()->subDays(3), 'Almoco de domingo');
            $this->createStockOutflow($house, $products['Tomate Italiano'], 1.500, $today->copy()->subDays(2), 'Salada do dia');
            $this->createStockOutflow($house, $products['Sabao em Po'], 1.000, $today->copy()->subDays(1), 'Lavagens da semana');
            $this->createStockOutflow($house, $products['Oleo de Soja'], 1.000, $today->copy()->subDays(6), 'Preparos da semana');
            $this->createStockOutflow($house, $products['Acucar Refinado'], 1.200, $today->copy()->subDays(5), 'Cafe e sobremesas');
            $this->createStockOutflow($house, $products['Iogurte Natural'], 8.000, $today->copy()->subDays(4), 'Lanches rapidos');
            $this->createStockOutflow($house, $products['Queijo Mussarela'], 0.800, $today->copy()->subDays(3), 'Sanduiches e pizzas');
            $this->createStockOutflow($house, $products['Cebola Roxa'], 0.900, $today->copy()->subDays(2), 'Refogados da semana');
            $this->createStockOutflow($house, $products['Agua Sanitaria'], 1.000, $today->copy()->subDays(2), 'Lavagem do quintal');
            $this->createStockOutflow($house, $products['Esponja Multiuso'], 2.000, $today->copy()->subDays(1), 'Troca das esponjas da pia');

            $this->createFinancialEntry($house, $accounts['INTER'], null, 'inflow', 3500.00, $today->copy()->subDays(20), 'Salario principal');
            $this->createFinancialEntry($house, $accounts['NUBANK'], $categories['CAT-MERCADO'], 'inflow', 220.00, $today->copy()->subDays(4), 'Reembolso de compras');
            $this->createFinancialEntry($house, $accounts['CAIXA'], $categories['CAT-TRANS'], 'outflow', 90.00, $today->copy()->subDays(2), 'Combustivel do carro');
            $this->createFinancialEntry($house, $accounts['INTER'], $categories['CAT-SAUDE'], 'outflow', 65.00, $today->copy()->subDays(1), 'Medicamentos');
            $this->createFinancialEntry($house, $accounts['NUBANK'], $categories['CAT-SERV'], 'inflow', 40.00, $today->copy()->subDays(1), 'Cashback do cartao');
            $this->createFinancialEntry($house, $accounts['INTER'], null, 'inflow', 850.00, $today->copy()->subDays(11), 'Freelance do mes');
            $this->createFinancialEntry($house, $accounts['CAIXA'], $categories['CAT-TRANS'], 'outflow', 45.00, $today->copy()->subDays(8), 'Pedagios e estacionamento');
            $this->createFinancialEntry($house, $accounts['NUBANK'], $categories['CAT-ASSIN'], 'outflow', 24.90, $today->copy()->subDays(7), 'Musica online');
            $this->createFinancialEntry($house, $accounts['INTER'], $categories['CAT-SERV'], 'outflow', 79.90, $today->copy()->subDays(6), 'Recarga de gas');
            $this->createFinancialEntry($house, $accounts['CAIXA'], $categories['CAT-MERCADO'], 'inflow', 60.00, $today->copy()->subDays(5), 'Rateio da casa');
            $this->createFinancialEntry($house, $accounts['MPAGO'], null, 'inflow', 1250.00, $today->copy()->subDays(17), 'Freelance de interface');
            $this->createFinancialEntry($house, $accounts['MPAGO'], $categories['CAT-SERV'], 'outflow', 109.90, $today->copy()->subDays(5), 'Academia mensal');
            $this->createFinancialEntry($house, $accounts['NUBANK'], $categories['CAT-TRANS'], 'outflow', 73.50, $today->copy()->subDays(4), 'Corridas por aplicativo');
            $this->createFinancialEntry($house, $accounts['INTER'], $categories['CAT-SERV'], 'outflow', 210.00, $today->copy()->subDays(1), 'Lavagem do sofa');
            $this->createFinancialEntry($house, $accounts['CAIXA'], $categories['CAT-MERCADO'], 'inflow', 95.00, $today->copy()->subDays(3), 'Rateio do churrasco');
            $this->createFinancialEntry($house, $accounts['MPAGO'], $categories['CAT-ASSIN'], 'outflow', 34.90, $today->copy()->subDays(2), 'Plano de treino online');
            $this->createFinancialEntry($house, $accounts['INTER'], null, 'inflow', 420.00, $today->copy()->subDays(9), 'Venda de itens usados');
            $this->createFinancialEntry($house, $accounts['CAIXA'], $categories['CAT-SAUDE'], 'outflow', 38.70, $today->copy()->subDays(2), 'Farmacia da semana');
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
