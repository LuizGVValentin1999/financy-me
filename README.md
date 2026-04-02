# Financy Me

Aplicacao web para controle financeiro domestico e operacional, com foco em categorias, contas, produtos, compras, estoque, importacao de NFC-e e consolidacao de indicadores na dashboard.

O projeto usa:

- Backend em Laravel 13
- Frontend em React + TypeScript com Inertia
- UI com Ant Design
- Banco SQLite no ambiente local
- Testes backend com Pest
- Testes end-to-end com Cypress

## Principais modulos

- Autenticacao de usuarios
- Gestao de casas (`house_id`) como contexto ativo da aplicacao
- Categorias e contas
- Cadastro de produtos estocaveis e nao estocaveis
- Compras manuais e importacao de NFC-e
- Movimentacao e saida de estoque
- Dashboard com indicadores financeiros e operacionais

## Requisitos

Antes de iniciar, tenha instalado:

- PHP 8.3+
- Composer
- Node.js 20+ com npm
- SQLite 3

## Como executar depois de clonar

### 1. Clonar o repositorio

```bash
git clone git@github-pessoal:LuizGVValentin1999/financy-me.git
cd financy-me
```

### 2. Instalar dependencias

```bash
composer install
npm install
```

### 3. Criar e configurar o ambiente

Se o arquivo `.env` nao existir:

```bash
cp .env.example .env
```

Gere a chave da aplicacao:

```bash
php artisan key:generate
```

Crie o banco SQLite local, se necessario:

```bash
mkdir -p database
touch database/database.sqlite
```

### 4. Rodar as migrations

```bash
php artisan migrate
```

### 5. Subir o projeto

Em um terminal:

```bash
php artisan serve
```

Em outro terminal:

```bash
npm run dev
```

Depois acesse a URL exibida pelo Laravel, normalmente:

```text
http://127.0.0.1:8000
```

## Setup rapido

Se quiser fazer quase tudo em um comando, o projeto tem o script:

```bash
composer run setup
```

Esse script:

- instala dependencias PHP
- cria `.env` se nao existir
- gera `APP_KEY`
- roda migrations
- instala dependencias frontend
- gera build

## Comandos uteis

- Desenvolvimento completo: `composer run dev`
- Servidor frontend: `npm run dev`
- Build de producao: `npm run build`
- Lint frontend: `npm run lint`

## Testes

O projeto possui testes de backend e testes E2E.

### Testes backend

Executa toda a suite:

```bash
php artisan test
```

Ou usando o script do Composer:

```bash
composer test
```

Cobertura minima local:

```bash
composer test:coverage
```

### Testes end-to-end com Cypress

Os testes E2E usam:

- Laravel na porta `8010`
- Vite na porta `5180`
- banco dedicado `database/e2e.sqlite`

Rodar a suite completa:

```bash
npm run e2e:run
```

## Rotas operacionais para hospedagem sem terminal

Se a sua hospedagem nao oferece acesso SSH/terminal, o projeto agora tem rotas opcionais para tarefas operacionais.

Essas rotas ficam desligadas por padrao. Para habilitar em producao, configure no `.env`:

```env
OPS_ROUTE_ENABLED=true
OPS_ROUTE_TOKEN=coloque-um-token-longo-e-dificil-aqui
```

Rotas disponiveis:

- `GET /api/ops/migrate`
- `GET /api/ops/optimize-clear`
- `POST /api/ops/migrate`
- `POST /api/ops/optimize-clear`

Autenticacao:

- enviar header `X-Deploy-Token: seu-token`
- ou usar `?token=seu-token`

Exemplo para rodar migrations no navegador:

```text
https://seu-dominio.com/api/ops/migrate?token=seu-token
```

Exemplo com `curl`:

```bash
curl -X POST https://seu-dominio.com/api/ops/migrate \
  -H "X-Deploy-Token: seu-token"
```

Exemplo para limpar caches:

```bash
curl -X POST https://seu-dominio.com/api/ops/optimize-clear \
  -H "X-Deploy-Token: seu-token"
```

Observacao importante:

- existe rota para `migrate --force`
- nao existe rota para `migrate:fresh`, porque isso apagaria os dados de producao
- depois do deploy, o ideal e desligar novamente com `OPS_ROUTE_ENABLED=false`

Abrir o Cypress em modo interativo:

```bash
npm run e2e:open
```

Recriar apenas o banco E2E:

```bash
npm run e2e:reset-db
```

Se voce ja estiver com os servidores corretos rodando, tambem pode usar:

```bash
npm run cypress:run
npm run cypress:open
```

### O que o fluxo E2E cobre

As specs atuais cobrem jornadas como:

- autenticacao
- fluxo financeiro
- cadastro e compra de produtos
- importacao de NFC-e
- saida de estoque
- jornada completa ponta a ponta

Os arquivos ficam em:

```text
cypress/e2e/
```

## Observacoes do dominio

- O sistema e multi-tenant por casa, usando `house_id`
- Os dados de negocio devem sempre respeitar a casa ativa do usuario
- O projeto trabalha com compras, estoque, contas e lancamentos financeiros sincronizados

## Estrutura principal

```text
app/            Backend Laravel
resources/js/   Frontend React + Inertia
resources/css/  Estilos
database/       Migrations e arquivos SQLite
tests/          Testes backend
cypress/        Testes E2E
```

## Verificacao rapida apos setup

Depois de configurar o ambiente, a validacao minima recomendada e:

```bash
php artisan test
npm run build
npm run e2e:run
```
