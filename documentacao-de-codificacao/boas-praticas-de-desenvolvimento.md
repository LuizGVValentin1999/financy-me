# Boas praticas de desenvolvimento

## Objetivo

Registrar as convencoes praticas do projeto para manter consistencia tecnica e visual.

## 1. Evoluir pela base, nao pela excecao

Quando aparecer uma necessidade nova:

- primeiro verifique se o comportamento pode entrar em um componente base
- so depois aplique a mudanca nas paginas

Exemplos:

- tabela nova -> `ResponsiveDataTable`
- card mobile -> `ResponsiveCard`
- modal de CRUD -> `FormEntityModal`
- bloco de secao -> `SectionCard`

## 2. Evitar duplicacao estrutural

Duplicacao aceitavel:

- texto de negocio
- combinacao especifica de campos

Duplicacao ruim:

- mesma estrutura de card em varias paginas
- mesma estrutura de modal em varios CRUDs
- mesmos handlers de feedback escritos de formas diferentes

## 3. Preferir componentes do sistema

Antes de escrever markup manual, verificar:

- existe componente base no projeto?
- existe wrapper para Antd ja padronizado?
- existe padrao visual ja consolidado?

Se existir, reutilize.

## 4. Antd deve passar pelo contexto correto

Padrao:

- usar `useAntdApp()` para `message` e `modal`

Evitar:

- uso estatico de APIs do Antd fora de contexto

## 5. Desktop e mobile devem nascer juntos

Nao trate mobile como remendo.

Toda tela nova precisa considerar:

- como fica no desktop
- como fica no mobile
- como os CTAs funcionam no mobile
- como a leitura da lista ou tabela acontece no mobile

## 6. Formularios devem limpar estado corretamente

Ao fechar modal:

- limpar erros
- resetar formulario quando fizer sentido
- limpar entidade em edicao quando existir

Isso evita:

- modal abrindo com dado antigo
- erro visual reaproveitado do fluxo anterior

## 7. Mensagens para usuario devem ser objetivas

Boas mensagens:

- dizem a acao
- dizem o resultado

Exemplos:

- `Conta criada com sucesso!`
- `Erro ao excluir categoria`

Evite:

- `Ops, algo deu errado`
- mensagens vagas sem contexto

## 8. Tipos e nomes devem seguir o dominio

No front:

- nomes de tipo devem refletir o dominio da tela
- `PageProps`, `Row`, `TableRecord` sao padroes ja usados no projeto

Padrao comum:

- `ProductsPageProps`
- `ProductRow`
- `ProductTableRecord`

## 9. Search e filtros precisam ser coerentes

Quando uma tela tiver busca:

- a busca deve usar os campos que o usuario espera
- o placeholder deve explicar o escopo

Quando uma tela tiver filtros:

- filtros do desktop devem permanecer uteis
- no mobile, a leitura principal nao pode depender de scroll horizontal

## 10. Mudancas de UX devem ser sistemicas quando possivel

Se uma melhoria visual se repetir em varias telas:

- transforme em padrao
- documente
- aplique de forma consistente

Foi exatamente esse o caso das tabelas responsivas.

## 11. Checklist de PR interno

Antes de considerar uma mudanca pronta:

- reaproveita os componentes base?
- funciona em desktop e mobile?
- evita duplicacao?
- mensagens e confirmacoes estao coerentes?
- build passou?
- se criou padrao novo, a documentacao foi atualizada?

## 12. Quando documentar

Atualize `documentacao-de-codificacao` quando:

- criar componente base novo
- mudar o padrao de uma familia de telas
- introduzir um fluxo recorrente novo
- consolidar uma convencao que deve ser seguida dali para frente
