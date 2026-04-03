# Formularios e modais

## Objetivo

Padronizar como formularios e CRUDs devem ser construidos no sistema.

## Stack usada nos formularios

Padrao atual:

- `useForm` do Inertia para estado e envio
- `FormEntityModal` como casca visual
- `LabeledInputField`, `LabeledSelectField` e `LabeledTextAreaField` para campos
- `useAntdApp()` para `message` e `modal`
- `noValidate` nos formularios React para evitar mensagens nativas do navegador em ingles

## Estrutura recomendada

### 1. Estado do formulario

Padrao:

```tsx
const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: '',
    code: '',
});
```

Boas praticas:

- mantenha o shape do formulario simples
- use strings no front para campos numericos quando o input trabalha como texto
- chame `reset()` e `clearErrors()` ao fechar modal

### 2. Modal de criacao/edicao

Padrao:

```tsx
<FormEntityModal
    isOpen={isOpen}
    onClose={closeModal}
    onSubmit={submit}
    processing={processing}
    sectionLabel="Produtos"
    title="Novo produto"
    description="Descricao curta do fluxo."
    saveLabel="Criar produto"
>
    ...
</FormEntityModal>
```

Boas praticas:

- `sectionLabel` deve refletir o modulo
- `title` deve ser direto
- `description` deve explicar o impacto da acao
- `saveLabel` deve refletir a acao do usuario

### 3. Campos

Padrao:

```tsx
<LabeledInputField
    id="name"
    label="Nome"
    value={data.name}
    onChange={(value) => setData('name', value)}
    error={errors.name}
/>
```

Boas praticas:

- sempre ligar `error` ao campo correspondente
- usar ids estaveis
- usar wrappers `Labeled*` antes de escrever HTML manual

## Modal de CRUD padrao

Quando a tela tem criar e editar:

- um modal para criacao
- um modal para edicao
- a tela pai controla abertura, fechamento e preenchimento

Padrao atual do projeto:

- `closeCreateModal()` reseta estado de criacao
- `closeEditModal()` limpa entidade em edicao e erros
- `openEditModal(entity)` carrega dados no formulario

## Fluxos em etapas

Quando o fluxo nao cabe em um CRUD simples, use modal em etapas.

Exemplos atuais:

- `resources/js/Pages/Purchases/components/ImportPreviewSection.tsx`
- `resources/js/Pages/Purchases/components/ManualPurchaseWizardModal.tsx`

Regras:

- usar `Modal` base do projeto
- mostrar apenas a etapa atual e o contexto minimo de navegacao
- usar scroll interno no conteudo sem comprimir os campos
- reaproveitar modais de CRUD existentes para cadastros auxiliares

Padrao ja adotado:

- criar conta via `AccountModal`
- criar categoria via `CategoryModal`
- reaproveitar `ProductFormFields` quando o fluxo precisa criar produto inline

## Exclusao

### Exclusao simples

Use `modal.confirm` via `useAntdApp()`:

```tsx
const { modal, message } = useAntdApp();

modal.confirm({
    title: 'Confirmar exclusao',
    content: 'Excluir este registro?',
    onOk: () => {
        router.delete(...);
    },
});
```

Boas praticas:

- nunca use `Modal.confirm` estatico direto
- toda exclusao deve ter confirmacao
- mensagens devem ser objetivas

### Exclusao em lote

Padrao:

- guardar `selectedRowKeys`
- mostrar botao destrutivo apenas quando houver selecao
- converter ids para numero antes de enviar

## Feedback para usuario

Padrao:

- sucesso: `message.info(...)`
- erro: `message.error(...)`

Boas praticas:

- sucesso deve dizer o que aconteceu
- erro deve dizer qual acao falhou
- evite mensagens genericas sem contexto

Exemplos bons:

- `Produto criado com sucesso!`
- `Erro ao atualizar categoria`
- `Compra excluida com sucesso!`

## Datas

Padrao:

- UI: `DD/MM/YYYY`
- backend: `YYYY-MM-DD`
- locale do calendario em portugues

Boas praticas:

- no formulario, use `LabeledInputField` com `type=\"date\"` quando o campo seguir o padrao do sistema
- nao deixe um campo de data nativo isolado com visual diferente do resto
- quando o usuario filtra por periodo, prefira `RangePicker`

## Selects

Padrao:

- usar `LabeledSelectField` quando nao houver necessidade especial
- usar `Select` do Antd diretamente apenas quando houver busca, multiplas selecoes ou filtros mais ricos

## Quando criar um componente de formulario separado

Crie componente especifico quando:

- o mesmo bloco de campos sera usado em criar e editar
- o formulario ficou grande demais para a pagina
- ha logica de transformacao de opcoes ou layout proprio

Exemplos atuais:

- `AccountFormFields`
- `CategoryFormFields`
- `ProductFormFields`

## O que evitar

- montar modal direto na pagina sem `FormEntityModal`
- criar inputs com classes soltas sem os wrappers padrao
- tratar sucesso/erro com `alert`
- duplicar a mesma estrutura de campos em criar e editar

## Checklist

- usa `useForm`
- reseta dados ao fechar
- limpa erros ao fechar
- usa `FormEntityModal`
- usa `Labeled*`
- usa `useAntdApp()`
- exclusao tem confirmacao
- `npm run build` passou
