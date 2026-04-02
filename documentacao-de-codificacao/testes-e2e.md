# Testes E2E

## Objetivo

Documentar como a suite Cypress do projeto foi organizada e como novas specs devem ser escritas.

## Estrutura atual

Arquivos principais:

- `cypress/e2e/auth-smoke.cy.ts`
- `cypress/e2e/financial-flow.cy.ts`
- `cypress/e2e/full-app-journey.cy.ts`
- `cypress/e2e/nfce-import-flow.cy.ts`
- `cypress/e2e/products-flow.cy.ts`
- `cypress/e2e/purchases-flow.cy.ts`
- `cypress/e2e/stock-withdraw-flow.cy.ts`
- `cypress/support/commands.ts`
- `cypress/support/e2e.ts`

## Scripts principais

Local:

- `npm run e2e:reset-db`
- `npm run e2e:open`
- `npm run e2e:run`

Produção:

- `npm run prod:open`
- `npm run prod:e2e:smoke`
- `npm run prod:e2e:full`
- `npm run prod:e2e`

## Como a suite local funciona

O fluxo local usa:

- banco SQLite isolado em `database/e2e.sqlite`
- `php artisan serve` em `127.0.0.1:8010`
- `vite` em `127.0.0.1:5180`

Isso fica encapsulado nos scripts do `package.json`.

## Como a suite de produção funciona

Produção usa:

- `baseUrl` apontando para o dominio real
- banco real da aplicação
- limpeza automática do usuário/casa quando os testes usam `registerAndLogin()`

## Helpers compartilhados

Arquivo:

- `cypress/support/commands.ts`

Helpers principais:

- `cy.loginByUi(...)`
- `cy.registerAndLogin(...)`
- `cy.cleanupCurrentUserAndHouse()`
- `cy.selectAntdOption(...)`
- `cy.assertNoVisibleModal()`
- `cy.createProductViaUi(...)`
- `cy.createManualPurchaseViaUi(...)`
- `cy.withdrawStockViaUi(...)`

## Regra para novas specs

### Quando a spec cria usuário

Use:

```ts
cy.registerAndLogin();
```

Motivo:

- gera usuário isolado
- prepara cleanup automático
- evita colisão entre execuções

### Quando a spec depende de usuário criado manualmente

Evite, se possível.

Se precisar:

- documente o motivo
- saiba que o cleanup automático pode não cobrir esse caso

## Cleanup automático

Arquivo:

- `cypress/support/e2e.ts`

Regra atual:

- quando `cleanupAfterTest=true`, o `afterEach` tenta excluir a conta e a casa ativa

Isso depende de:

- usuário ter sido criado por `registerAndLogin()`
- fluxo de perfil continuar com o botão `Excluir conta e casa ativa`

## Regras para escrever novas specs

### 1. Priorize helpers

Antes de escrever interação nova, verifique se já existe helper em `commands.ts`.

Se o mesmo fluxo aparecer em duas specs:

- extraia helper
- tipa o comando
- documente pelo nome do comando

### 2. Interaja com Antd do jeito certo

Para `Select`:

- use `cy.selectAntdOption(...)`

Evite:

- clicar em classes internas aleatórias do Antd sem helper

### 3. Sempre espere o backend quando a ação for importante

Padrao:

```ts
cy.intercept('POST', '**/products').as('storeProduct');
cy.contains('button', 'Criar produto').click();
cy.wait('@storeProduct').its('response.statusCode').should('be.oneOf', [200, 302, 303]);
```

### 4. Modais precisam ser estabilizadas

Padrao:

- validar abertura pelos campos
- validar fechamento com `cy.assertNoVisibleModal()`

Se o fluxo usa modal sobre modal:

- cheque explicitamente se o modal anterior saiu da frente antes de continuar

### 5. Evite asserts frágeis

Ruim:

- depender de texto externo da SEFAZ fixo
- depender de ordering acidental
- depender de ids aleatórios fixos

Bom:

- validar o comportamento principal
- validar payloads e status
- validar blocos visíveis esperados

## Estratégia de organização das specs

### Smoke

Para validar deploy:

- login
- registro
- carregamento inicial de telas principais

### Flow

Para jornada de um módulo:

- produto
- compra
- estoque
- financeiro

### Full journey

Para garantir integração entre módulos:

- cadastro
- login/logout
- categorias
- contas
- importação
- compras
- dashboard
- limpeza final

## Quando rodar local vs produção

Local:

- desenvolvimento diário
- refactor de fluxo
- regressão previsível

Produção:

- smoke controlado
- validação final de ambiente
- fluxo completo apenas quando o impacto for conhecido

## Boas práticas

- specs devem ser determinísticas
- dados devem ser isolados por sufixo único
- use nomes sem ambiguidade
- cleanup deve ser preservado
- extraia helpers quando houver repetição real

## Checklist para nova spec

- usa helper compartilhado quando possível
- intercepta requests importantes
- evita dependência externa frágil
- funciona com cleanup
- pode rodar localmente
- se for para produção, o risco está claro
