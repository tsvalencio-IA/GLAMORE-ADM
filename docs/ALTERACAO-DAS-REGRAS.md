# Alteração segura das regras do Realtime Database

O arquivo `database.rules.json` foi gerado a partir das regras atuais fornecidas pelo proprietário em `Texto colado(121).txt`.

Foram realizadas somente duas alterações na estrutura da empresa:

1. inclusão do filho explícito `empresas/$empresaId/precificacao`;
2. inclusão da condição `$outros !== 'precificacao'` no curinga `$outros`.

Todas as regras antigas de usuários, produtos, clientes, pedidos, vendas, estoque, movimentos, produção, comissões, auditoria, lotes, inventários, peças e catálogos públicos foram preservadas literalmente.

## Por que excluir `precificacao` do `$outros`

As regras atuais permitem que dono e gerente acessem qualquer nó sem regra própria através de `$outros`. Foi por isso que o módulo conseguiu criar `precificacao` antes da atualização das regras.

Depois da atualização, somente `precificacao` deixa de usar esse curinga e passa a obedecer às permissões próprias. Todos os outros nomes continuam com a expressão anterior.

## Permissões isoladas

As permissões ficam em:

```text
empresas/{empresaId}/precificacao/acessos/{uid}
```

Campos:

- acessar
- editarFicha
- editarCatalogos
- editarCustos
- calcular
- visualizarMargem
- aprovar
- publicar
- importar
- exportar
- visualizarAuditoria
- administrar

O cadastro operacional `usuarios/{uid}` não recebe novos campos de permissão.

## Autoridade

- gestor global: acesso integral;
- dono: acesso integral;
- gerente: somente permissões explicitamente concedidas em `precificacao/acessos`;
- demais usuários ativos: somente permissões explicitamente concedidas.

Somente gestor global ou dono pode alterar `precificacao/acessos`. Isso impede que um gerente conceda publicação a si próprio através do cadastro operacional.
