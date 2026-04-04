# Documentacao de codificacao

Esta pasta concentra os padroes de implementacao que devem ser seguidos no projeto.

Arquivos disponiveis:

- `tabelas-web-mobile.md`: como criar tabelas novas no padrao atual do sistema, com `Table` no desktop e cards no mobile.
- `componentes-base.md`: guia dos componentes base que estruturam a interface.
- `formularios-e-modais.md`: como montar formularios, CRUDs e modais no padrao do sistema.
- `layout-e-navegacao.md`: regras de layout autenticado, header e navegacao.
- `boas-praticas-de-desenvolvimento.md`: convencoes praticas para evoluir o projeto sem quebrar consistencia.
- `testes-e2e.md`: padrao dos testes Cypress, helpers e execucao local/producao.
- `backend-laravel.md`: organizacao do backend, multi-casa, controllers, requests, services e regra de cache por casa com `data_version`.
- `deploy-e-producao.md`: fluxo de build, publicacao, operacao e cuidados em producao.

Regra pratica:

- novas listagens nao devem criar layout mobile do zero
- primeiro reutilize `ResponsiveDataTable`
- para cards mobile, reutilize os primitives de `ResponsiveCard`
- se um caso novo exigir algo diferente, evolua os componentes base antes de duplicar estrutura em uma tela
