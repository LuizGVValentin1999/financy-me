# Layout e navegacao

## Objetivo

Registrar como as paginas autenticadas devem ser estruturadas para manter consistencia de navegacao e hierarquia visual.

## Layout padrao

Toda pagina autenticada deve usar:

- `resources/js/Layouts/AuthenticatedLayout.tsx`

Esse layout ja resolve:

- sidebar desktop
- drawer mobile
- cabecalho superior mobile
- container principal da pagina
- leitura de `flash.error` com feedback visual

## Header de pagina

O header e passado pela prop `header` do `AuthenticatedLayout`.

Padrao esperado:

- etiqueta pequena em uppercase
- titulo principal
- descricao curta quando necessario
- acoes principais no lado direito ou abaixo, conforme viewport

### Exemplo de estrutura

```tsx
<AuthenticatedLayout
    header={
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Produtos</p>
                <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                    Cadastre o que entra no estoque.
                </h1>
            </div>

            <PrimaryButton className="w-full justify-center sm:w-auto">
                Novo produto
            </PrimaryButton>
        </div>
    }
>
```

## Regra para CTAs no mobile

Quando houver acoes no header:

- no desktop podem ficar lado a lado
- no mobile devem ocupar largura total quando forem botoes principais

Padrao usado:

- `className="w-full justify-center sm:w-auto"`

## Sidebar e menu

A navegacao principal mora em `AuthenticatedLayout`.

Boas praticas:

- nao criar menus locais concorrentes com a sidebar
- nao duplicar links principais dentro das paginas
- se um modulo novo nascer, ele deve entrar no array `navigation` do layout

## Container visual

Padrao visual:

- pagina dentro de um container branco transluscido
- secoes internas em `SectionCard`
- espacamento vertical consistente com `space-y-*`

Boas praticas:

- evitar telas com varios estilos de container competindo
- evitar misturar cards improvisados com `SectionCard` sem necessidade

## Feedback de erros globais

`AuthenticatedLayout` ja trata `flash.error` e exibe via `message.error`.

Boas praticas:

- quando o backend mandar `flash.error`, nao duplique o mesmo erro com outro toast manual

## Navegacao programatica

Padrao atual:

- `router.visit(...)` para navegar por acao
- `Link` do Inertia para links declarativos

Boas praticas:

- use `Link` quando for navegacao sem logica extra
- use `router.visit` quando houver regra antes da navegacao

## Quando nao usar `AuthenticatedLayout`

Nao usar em:

- login
- registro
- reset de senha
- paginas publicas

Esses fluxos devem seguir o layout de guest.

## Checklist

- pagina autenticada usa `AuthenticatedLayout`
- header segue o padrao do projeto
- CTA principal funciona em largura total no mobile
- conteudo esta quebrado em `SectionCard` quando fizer sentido
- nao ha menus paralelos desnecessarios
