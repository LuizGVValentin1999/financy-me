# Backend Laravel

## Objetivo

Documentar a organizacao backend do projeto e as convencoes para evoluir controllers, requests, models e fluxo multi-casa.

## Estrutura atual

Pastas centrais:

- `app/Http/Controllers`
- `app/Http/Requests`
- `app/Models`
- `app/Services`
- `app/Traits`
- `app/Http/Middleware`
- `routes/web.php`
- `routes/api.php`

## Convencao de controllers

Padrao atual:

- cada modulo principal tem um controller proprio
- controllers entregam paginas Inertia e tratam ações CRUD

Exemplos:

- `AccountController`
- `CategoryController`
- `ProductController`
- `PurchaseEntryController`
- `FinancialEntryController`
- `DashboardController`

Ponto de atencao:

- `PurchaseEntryController` hoje orquestra os fluxos mais complexos do dominio:
  - compra manual em wizard com itens e pagamentos
  - importacao de NFC-e com revisao em etapas
  - sincronizacao entre compras, nota fiscal, estoque e financeiro

## Convencao de requests

Padrao atual:

- validacao fica em `FormRequest` dedicado

Exemplos:

- `StoreAccountRequest`
- `UpdateAccountRequest`
- `StoreCategoryRequest`
- `StoreProductRequest`
- `StorePurchaseEntryRequest`

Boa pratica:

- se uma ação de store/update tem validacao relevante, crie request proprio
- nao concentre regra de validacao extensa direto no controller

## Convencao de models

Models principais:

- `House`
- `User`
- `Account`
- `Category`
- `Product`
- `PurchaseEntry`
- `PurchaseInvoice`
- `FinancialEntry`

## Multi-casa

O sistema e multi-tenant por casa.

Componentes centrais disso:

- `app/Traits/BelongsToHouse.php`
- `app/Http/Middleware/EnsureHouseSelected.php`

### `BelongsToHouse`

Regra:

- aplica escopo global por `house_id` quando o usuário autenticado tem casa ativa

Impacto:

- consultas dos models com essa trait tendem a ser automaticamente filtradas
- ao escrever novas queries, lembre que o escopo pode estar ativo

### `EnsureHouseSelected`

Regra:

- se o usuário não tiver `active_house_id`, tenta usar a primeira casa
- se não houver casa, redireciona para escolha/criação

Impacto:

- rotas principais da aplicação ficam dentro do middleware `house`

## Rotas web

Arquivo:

- `routes/web.php`

Organização:

- raiz redireciona para dashboard ou login
- bloco autenticado
- sub-bloco com middleware `house`
- CRUDs dos módulos
- perfil
- fallback autenticado

Boa pratica:

- novos módulos internos devem entrar no grupo `auth` + `house` quando dependerem de casa ativa

## Rotas operacionais

Arquivo:

- `routes/api.php`

Controller:

- `app/Http/Controllers/OperationsController.php`

Uso:

- `GET|POST /api/ops/migrate`
- `GET|POST /api/ops/optimize-clear`

Proteção:

- `OPS_ROUTE_ENABLED`
- `OPS_ROUTE_TOKEN`

Boa pratica:

- manter desligado fora de uso
- usar token forte
- nao expor fresh reset em produção

## Services

Service atual de destaque:

- `app/Services/ParanaNfceImporter.php`

Uso:

- encapsula a importação de NFC-e do Paraná

Boa pratica:

- integrações externas ou parsing mais complexo devem ir para `Services`
- controller deve orquestrar, não concentrar parsing pesado

Estado atual:

- consulta e parsing da NFC-e ficam no service
- confirmacao final continua no controller porque precisa salvar nota, itens, pagamentos e lancamentos sincronizados

## Convencoes de implementação

### Controllers

Devem:

- orquestrar fluxo
- chamar requests/services/models
- devolver resposta Inertia, redirect ou JSON

Nao devem:

- carregar validacao pesada inline
- concentrar parsing complexo
- misturar muitas responsabilidades

### Requests

Devem:

- validar
- normalizar entradas quando necessario

### Services

Devem:

- encapsular integrações externas
- encapsular logica procedural grande

### Models

Devem:

- concentrar relacoes
- traits de escopo compartilhado
- casts e comportamento de dominio leve

## Regra para novos módulos

Quando criar um módulo novo:

1. model
2. migration
3. request(s) de store/update
4. controller
5. rotas
6. page Inertia
7. testes feature
8. se houver UI de tabela, usar padrão responsivo

## Testes backend

A base de testes fica em:

- `tests/Feature`

Cobertura atual inclui:

- auth
- contas e financeiro
- catalogo
- estoque
- compras
- importação NFC-e
- perfil
- rotas operacionais

Boa pratica:

- bug de backend novo deve ganhar teste feature
- mudança de regra de negocio deve ser acompanhada de teste

## Checklist para mudar backend

- respeita escopo por casa?
- validacao foi para request quando necessario?
- controller ficou enxuto?
- service externo foi isolado?
- rota entrou no grupo certo?
- existe teste feature cobrindo o comportamento?
