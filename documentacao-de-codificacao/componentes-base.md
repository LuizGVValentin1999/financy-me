# Componentes base do sistema

## Objetivo

Este documento registra os componentes estruturais que devem ser preferidos antes de criar novos blocos de interface.

## Principio geral

Se um componente novo resolver um problema que ja aparece em mais de uma tela, a regra e:

1. verificar se ja existe um componente base reutilizavel
2. estender o componente base, se a necessidade for generica
3. so criar componente novo quando o comportamento for realmente especifico do dominio

## Componentes principais

### `AuthenticatedLayout`

Arquivo:

- `resources/js/Layouts/AuthenticatedLayout.tsx`

Uso:

- layout padrao das telas autenticadas
- sidebar desktop
- drawer mobile
- header de pagina
- tratamento de `flash.error` com Antd

Boas praticas:

- toda pagina interna deve nascer dentro desse layout
- o `header` da pagina deve ser passado pela prop `header`
- nao recrie navegacao lateral por tela

### `SectionCard`

Arquivo:

- `resources/js/Components/SectionCard.tsx`

Uso:

- bloco padrao para secoes internas do sistema
- envolve listagens, graficos, previews e formularios secundarios

Boas praticas:

- use `title`, `description` e `actions` quando existir contexto de secao
- prefira `SectionCard` em vez de criar `div` com borda/sombra manual
- mantenha secoes do sistema visualmente consistentes

### `ResponsiveDataTable`

Arquivo:

- `resources/js/Components/ResponsiveDataTable.tsx`

Uso:

- tabela Antd no desktop
- cards no mobile
- paginação e selecao unificadas

Boas praticas:

- toda listagem tabular nova deve partir daqui
- o desktop continua sendo `Table`
- o mobile deve ser implementado via `mobileRenderCard`

### `ResponsiveCard` e primitives

Arquivo:

- `resources/js/Components/responsive-table/ResponsiveCard.tsx`

Blocos disponiveis:

- `ResponsiveCard`
- `ResponsiveCardHeader`
- `ResponsiveCardPills`
- `ResponsiveCardPill`
- `ResponsiveCardFields`
- `ResponsiveCardField`

Uso:

- estrutura padrao de cards mobile nas tabelas

Boas praticas:

- nao replique classes Tailwind de card em cada pagina
- use `tone` apenas quando houver motivo visual claro
- prefira campos curtos em pills e detalhes em `ResponsiveCardField`

### `FormEntityModal`

Arquivo:

- `resources/js/Components/FormEntityModal.tsx`

Uso:

- modal padrao de CRUD
- cabecalho com secao, titulo, descricao
- formulario interno
- rodape padrao por `FormModalActions`

Boas praticas:

- modal de criacao/edicao deve partir desse componente
- o conteudo do formulario fica no `children`
- se a acao padrao nao servir, passe `actions`

### `FormModalActions`

Arquivo:

- `resources/js/Components/FormModalActions.tsx`

Uso:

- rodape padrao para `Cancelar`, `Excluir` e `Salvar`

Boas praticas:

- reuse esse componente em modais de CRUD
- so troque labels quando houver necessidade real do fluxo

### `Modal`

Arquivo:

- `resources/js/Components/Modal.tsx`

Uso:

- camada base de modal do projeto
- usa `AntModal` no desktop
- usa `Drawer` no mobile

Boas praticas:

- nao use `AntModal` direto nas paginas
- use `Modal` ou `FormEntityModal`
- isso preserva o mesmo comportamento responsivo

### Campos de formulario padrao

Arquivos:

- `resources/js/Components/form-fields/LabeledInputField.tsx`
- `resources/js/Components/form-fields/LabeledSelectField.tsx`
- `resources/js/Components/form-fields/LabeledTextAreaField.tsx`

Uso:

- campos com label, estilo e erro padronizados

Boas praticas:

- use esses wrappers antes de escrever `input`, `select` ou `textarea` manualmente
- `type="date"` deve passar por `LabeledInputField`, porque ele converte para `DatePicker` do Antd
- use campo manual apenas quando o layout realmente fugir do padrao

### Botoes base

Arquivos:

- `resources/js/Components/PrimaryButton.tsx`
- `resources/js/Components/SecondaryButton.tsx`
- `resources/js/Components/DangerButton.tsx`

Uso:

- CTA principal
- CTA secundario
- acoes destrutivas

Boas praticas:

- nao criar botoes inline com classes custom sem necessidade
- preserve a hierarquia: principal, secundaria, destrutiva

### `useAntdApp`

Arquivo:

- `resources/js/hooks/useAntdApp.ts`

Uso:

- acesso a `message` e `modal` no contexto do Antd

Boas praticas:

- usar `useAntdApp()` em vez de `message` e `Modal.confirm` estaticos
- isso evita warnings e mantem consistencia com o contexto do Antd

## Regra de decisao rapida

Quando for construir uma tela nova:

- estrutura geral: `AuthenticatedLayout`
- bloco de conteudo: `SectionCard`
- tabela/lista grande: `ResponsiveDataTable`
- modal de CRUD: `FormEntityModal`
- campos: `Labeled*`
- feedback: `useAntdApp`

Se a tela fugir demais desse fluxo, documente a excecao no PR ou na pasta de documentacao.
