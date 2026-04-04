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
- `app/Services/HouseDataVersion.php`

Uso:

- encapsula a importação de NFC-e do Paraná

Boa pratica:

- integrações externas ou parsing mais complexo devem ir para `Services`
- controller deve orquestrar, não concentrar parsing pesado

Estado atual:

- consulta e parsing da NFC-e ficam no service
- confirmacao final continua no controller porque precisa salvar nota, itens, pagamentos e lancamentos sincronizados

## Cache por casa e invalidação de dados

O app instalado usa service worker e cache de respostas dinamicas.

Para nao servir dados antigos depois de uma edicao, o projeto usa uma `data_version` por casa.

Arquivos centrais:

- `app/Services/HouseDataVersion.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `public/sw.js`

### Como funciona

Backend:

- cada casa tem uma chave de cache `houses:{house_id}:data_version`
- essa versao fica no cache do Laravel, nao no banco
- quando algum dado relevante da casa muda, essa versao precisa subir

Middleware Inertia:

- adiciona a versao da casa no `Inertia::version()`
- envia `X-House-Id` e `X-House-Data-Version` nas respostas
- compartilha a versao nas props globais

Service worker:

- assets estaticos usam cache proprio
- respostas dinamicas usam cache por `house_id + data_version`
- a estrategia para dados dinamicos e `network-first`
- quando a versao muda, o cache antigo deixa de ser reutilizado

### Regra obrigatoria para novas mutacoes

Se uma acao cria, edita ou exclui dado que aparece em telas da casa, ela deve chamar:

```php
app(\App\Services\HouseDataVersion::class)->bump((int) $house->id);
```

Faca isso apenas depois da operacao ter concluido com sucesso.

Em fluxos com transacao:

- rode o `bump()` depois do `DB::transaction(...)`
- nao rode antes da persistencia

### Quando dar bump

Deve dar bump quando a mudanca afeta qualquer tela que o usuario pode revisitar no app instalado, por exemplo:

- produtos
- compras
- estoque
- contas
- categorias
- lancamentos financeiros
- notas fiscais

### Quando normalmente nao precisa

Nao precisa dar bump em:

- leitura (`index`, `show`, filtros, dashboards sem escrita)
- rascunhos apenas de sessao que nao alteram dados persistidos
- validacoes que falham e nao salvam nada

### Checklist para nova funcao de escrita

Ao criar um novo `store`, `update`, `destroy` ou acao custom:

1. descobrir qual e a `house` ativa
2. persistir os dados
3. se a persistencia foi bem-sucedida, chamar `HouseDataVersion::bump()`
4. se houver `DB::transaction`, chamar o `bump()` fora dela
5. se a rota retorna JSON, o `bump()` continua sendo obrigatorio

### Exemplo minimo

```php
public function update(Request $request, Product $product): RedirectResponse
{
    $house = $request->user()->getCurrentHouse();

    $product->update($request->validated());

    app(\App\Services\HouseDataVersion::class)->bump((int) $house->id);

    return back()->with('success', 'Produto atualizado com sucesso.');
}
```

### Observacoes operacionais

Essa estrategia depende de um cache persistente no Laravel. Em ambiente real, use `file`, `redis` ou `database`.

Se o ambiente estiver com `CACHE_STORE=array`, a versao nao persiste entre requests e a invalidacao por casa perde efeito.

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
- se a rota escreve dados persistidos, chamou `HouseDataVersion::bump()`?
- existe teste feature cobrindo o comportamento?
