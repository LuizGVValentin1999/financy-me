# Deploy e producao

## Objetivo

Registrar o fluxo pratico de build, publicacao e operacao do sistema em producao.

## Stack de producao

O projeto usa:

- Laravel
- Inertia
- React
- Vite
- Antd

## Build frontend

Comando:

```bash
npm run build
```

Resultado:

- `public/build/manifest.json`
- `public/build/assets/*`

Regra:

- `manifest.json` e `assets` devem sempre ser do mesmo build
- nao subir `manifest.json` isolado

## Raiz publica correta

O ideal e o servidor apontar para:

- pasta `public`

Se a hospedagem não permitir isso, a raiz precisa se comportar como a `public`.

## Caso de hospedagem sem terminal

O projeto possui rotas operacionais:

- `GET|POST /api/ops/migrate`
- `GET|POST /api/ops/optimize-clear`

Arquivos envolvidos:

- `routes/api.php`
- `app/Http/Controllers/OperationsController.php`
- `config/operations.php`

Variaveis:

```env
OPS_ROUTE_ENABLED=false
OPS_ROUTE_TOKEN=
```

## Como habilitar temporariamente

No `.env`:

```env
OPS_ROUTE_ENABLED=true
OPS_ROUTE_TOKEN=token-forte-aqui
```

Exemplos:

```text
https://seu-dominio.com/api/ops/migrate?token=SEU_TOKEN
https://seu-dominio.com/api/ops/optimize-clear?token=SEU_TOKEN
```

Depois do uso:

```env
OPS_ROUTE_ENABLED=false
```

## Regras de seguranca para rotas operacionais

- usar token longo e dificil
- habilitar so durante deploy/manutencao
- desligar apos uso
- nao criar rotas destrutivas como `migrate:fresh` em producao

## Sequencia recomendada de deploy

1. subir codigo backend
2. subir `public/build` completo
3. revisar `.env`
4. rodar `optimize-clear`
5. rodar `migrate`
6. validar login e dashboard
7. desligar rotas operacionais

## Problemas comuns de producao

### 1. Tela branca

Causas comuns:

- assets do Vite nao publicados corretamente
- `/build/...` devolvendo HTML em vez de JS
- `manifest.json` e `assets` de builds diferentes

Como validar:

- abrir `/build/manifest.json`
- abrir um `.js` referenciado no manifest

Esses arquivos devem retornar:

- JSON para o manifest
- JavaScript real para os assets

### 2. MIME type de `text/html` para arquivos JS

Isso indica que:

- o servidor esta reescrevendo `/build/...` para o Laravel
- ou os arquivos nao existem na raiz publica correta

### 3. Erro de banco em producao

Exemplo comum:

- credenciais erradas no `.env`
- usuario MySQL sem permissao no banco

Validacao:

- corrigir `.env`
- rodar `optimize-clear`
- testar rota operacional de migrate

## Build na hospedagem

Se a hospedagem nao tiver ambiente de Node completo:

- faca o build localmente
- suba `public/build` pronto

Nao dependa de:

- `npm run build` no servidor compartilhado

## Produção e Cypress

Scripts disponiveis:

- `npm run prod:open`
- `npm run prod:e2e:smoke`
- `npm run prod:e2e:full`
- `npm run prod:e2e`

Regra:

- comece por smoke
- use full apenas com consciencia do impacto
- o cleanup automatico depende de `registerAndLogin()`

## Checklist final de deploy

- `public/build` atualizado
- `.env` correto
- banco acessivel
- `optimize-clear` executado
- migrations aplicadas
- login funciona
- dashboard funciona
- rotas operacionais desligadas
