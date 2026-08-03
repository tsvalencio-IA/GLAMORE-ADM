# Estrutura do novo nó no Realtime Database

O aplicativo cria somente a raiz abaixo:

```text
empresas/empresa-principal/precificacao
```

Subnós:

```text
precificacao/
├── _schema
├── configuracoes/geral
├── materiais
├── pedras
├── insumos
├── processos
├── acabamentos
├── embalagens
├── custosOperacionais
├── fichasTecnicas
├── precificacoes
├── aprovacoes
├── precosPublicados
├── importacoes
├── indices
├── auditoria
└── restauracoes
```

## Nós operacionais que este projeto não grava

- produtos
- pecasEstoque
- estoqueMovimentos
- movimentos
- lotes
- pedidos
- vendas
- clientes
- consignacoes
- producoes
- inventariosEstoque
- comissoes
- auditoria operacional existente

O catálogo `produtos` é lido para vincular a ficha técnica ao mesmo `produtoId`. A publicação do preço permanece em `precificacao/precosPublicados/{produtoId}`.
