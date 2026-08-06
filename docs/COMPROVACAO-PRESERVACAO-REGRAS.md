# Comprovação de preservação das regras operacionais

## Arquivo-base

A comparação utiliza `database.rules.original.json`, que é a cópia exata das regras atuais fornecidas pelo proprietário em `Texto colado(121).txt`.

## Resultado da comparação estrutural

Os seguintes blocos permanecem exatamente iguais no arquivo novo:

- `.write` de `empresas/$empresaId`;
- `usuarios`;
- `configuracoes`;
- `tiposProduto`;
- `parametrosTecnicos`;
- `produtos`;
- `clientes`;
- `vendedores`;
- `pedidos`;
- `vendas`;
- `consignacoes`;
- `cadastrosMostruario`;
- `movimentos`;
- `estoqueMovimentos`;
- `producoes`;
- `producao`;
- `comissoes`;
- `auditoria`;
- `iaConsultas`;
- `pedidosProducao`;
- `lotes`;
- `inventariosEstoque`;
- `pecasEstoque`;
- `catalogosPublicos`.

## Alterações intencionais

Somente duas alterações foram aplicadas no nível `empresas/$empresaId`:

1. inclusão do novo irmão `precificacao`;
2. inclusão de `$outros !== 'precificacao'` nas expressões de leitura e gravação do curinga `$outros`.

A segunda alteração impede que o novo nó continue recebendo a permissão genérica anterior. Para qualquer outro nome de nó, as expressões e permissões continuam iguais.

## Proteção do estoque em produção

O novo bloco não modifica, substitui, herda ou escreve dados em:

```text
produtos
pecasEstoque
estoqueMovimentos
movimentos
vendas
pedidos
producoes
producao
pedidosProducao
lotes
inventariosEstoque
clientes
vendedores
consignacoes
comissoes
auditoria
```

O teste `tests/rules.test.mjs` falha automaticamente caso qualquer bloco operacional antigo seja diferente do arquivo original.
