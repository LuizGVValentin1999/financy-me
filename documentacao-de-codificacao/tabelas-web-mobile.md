# Padrao de tabelas web e mobile

## Objetivo

Toda tabela do sistema deve seguir o mesmo comportamento:

- desktop: `Table` do Antd
- mobile: cards responsivos, mais faceis de tocar e ler
- mesma fonte de dados para os dois modos
- mesma regra de selecao, paginação e estado vazio

## Componentes base

### Tabela responsiva

Arquivo:

- `resources/js/Components/ResponsiveDataTable.tsx`

Responsabilidade:

- renderizar `Table` no desktop
- renderizar cards no mobile
- manter paginação mobile
- manter selecao por checkbox quando existir `rowSelection`
- manter estado vazio

Props principais:

- `rowKey`
- `columns`
- `dataSource`
- `rowSelection`
- `pagination`
- `scroll`
- `onRow`
- `mobileHint`
- `mobilePageSize`
- `mobileRenderCard`

### Primitives de card mobile

Arquivo:

- `resources/js/Components/responsive-table/ResponsiveCard.tsx`

Componentes:

- `ResponsiveCard`
- `ResponsiveCardHeader`
- `ResponsiveCardPills`
- `ResponsiveCardPill`
- `ResponsiveCardFields`
- `ResponsiveCardField`

Responsabilidade:

- garantir consistencia visual entre cards das tabelas
- reduzir repeticao de classes Tailwind
- manter mesma hierarquia visual em todas as telas

## Como criar uma nova tabela

### 1. Monte o `dataSource`

Padrao:

```tsx
const dataSource = rows.map((row) => ({
    ...row,
    key: String(row.id),
}));
```

### 2. Defina as colunas do desktop

Padrao:

```tsx
const columns: ColumnsType<MyRecord> = [
    {
        title: 'Nome',
        dataIndex: 'name',
        key: 'name',
        render: (_value, record) => <span>{record.name}</span>,
    },
];
```

### 3. Use `ResponsiveDataTable`

Exemplo:

```tsx
<ResponsiveDataTable<MyRecord>
    rowKey="key"
    columns={columns}
    dataSource={dataSource}
    pagination={{ pageSize: 12, showSizeChanger: true }}
    scroll={{ x: 1200 }}
    mobileHint="No celular esta lista vira cards."
    mobileRenderCard={(record) => (
        <ResponsiveCard key={record.key}>
            <ResponsiveCardHeader
                title={record.name}
                subtitle={record.subtitle}
            />

            <ResponsiveCardFields columns={2}>
                <ResponsiveCardField label="Campo A:" value={record.fieldA} />
                <ResponsiveCardField label="Campo B:" value={record.fieldB} />
            </ResponsiveCardFields>
        </ResponsiveCard>
    )}
/>
```

## Quando usar selecao

Se a tabela tiver exclusao em lote ou acao em lote:

- passe `rowSelection` normalmente
- no card mobile use `mobileMeta.isSelected`
- use `mobileMeta.toggleSelected(...)`

Exemplo:

```tsx
<Checkbox
    checked={mobileMeta.isSelected}
    onChange={(event) => mobileMeta.toggleSelected(event.target.checked)}
/>
```

## Quando usar clique na linha

Se no desktop a linha abre modal de edicao:

- mantenha `onRow`
- no mobile, o card deve ter um botao interno ou `onClick` claro para abrir o mesmo fluxo

Evite:

- cards sem affordance de toque
- areas pequenas demais para clique

## Regras visuais do mobile

### Hierarquia

- titulo principal em destaque
- subtitulo curto abaixo
- valor principal ou status no topo direito
- detalhes secundarios em `ResponsiveCardField`

### Densidade

- maximo de 4 a 6 informacoes visiveis de primeira
- detalhes longos vao para campo de largura total
- use pills para tipo, categoria, origem ou status

### Toque

- card com area grande
- checkbox separado da area principal
- CTA implicita: tocar no card abre edicao ou detalhe

## Regras visuais do desktop

- manter `Table` do Antd
- manter filtros por coluna quando fizer sentido
- manter `scroll.x` quando houver muitas colunas
- evitar criar layout paralelo no desktop

## Quando nao usar tabela

Nao use `ResponsiveDataTable` se a tela for:

- apenas resumo estatistico
- lista muito curta sem comparacao tabular
- timeline ou feed

Nesses casos, use cards comuns de dominio.

## O que nao fazer

- nao duplicar toda a estrutura mobile em cada tela sem reutilizar os componentes base
- nao criar classes novas de card por pagina sem necessidade real
- nao usar tabela horizontal no mobile como experiencia principal
- nao misturar estilos de card muito diferentes entre modulos

## Como evoluir o padrao

Se uma nova tabela exigir algo que o componente base nao cobre:

1. ajuste `ResponsiveDataTable` se o comportamento for generico
2. ajuste `ResponsiveCard` se a necessidade for visual e reutilizavel
3. so depois adapte a tela especifica

Ou seja:

- primeiro evolui a base
- depois reaplica nas telas

## Checklist antes de concluir

- desktop continua com `Table` do Antd
- mobile ficou sem scroll horizontal como fluxo principal
- cards possuem titulo, contexto e valor principal claros
- selecao em lote continua funcionando, se existir
- paginação continua funcionando
- `npm run build` passou
