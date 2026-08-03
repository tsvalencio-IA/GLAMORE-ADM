# Relatório técnico — Glamore Custos & Precificação V1

## Base analisada

- SaaS operacional: `GlamoreJoias-main (2)(4).zip`.
- Realtime Database: `vitorgomes-fa1e1-default-rtdb-export.json`.
- Regras recebidas: `Texto colado(119).txt`.

## Decisão arquitetural

Foi criado um repositório totalmente independente, conectado ao mesmo Firebase Authentication e ao mesmo Realtime Database.

O projeto lê:

```text
empresas/empresa-principal/produtos
empresas/empresa-principal/usuarios
gestores
```

E grava somente em:

```text
empresas/empresa-principal/precificacao
```

## Nós operacionais protegidos

O código do novo projeto não possui operações de escrita direcionadas aos seguintes nós:

- produtos;
- clientes;
- pedidos;
- vendas;
- peças físicas;
- estoqueMovimentos;
- movimentos;
- lotes;
- inventários;
- produção;
- comissões;
- auditoria operacional existente.

## Recursos implementados

1. Autenticação compartilhada.
2. Controle granular de permissões.
3. Catálogo de produtos existente em modo somente leitura.
4. Fichas técnicas versionadas.
5. Metais, pedras, insumos, processos, acabamentos e embalagens.
6. Perda de metal e recuperação econômica de aparas.
7. Quatro métodos de rateio operacional.
8. Custo unitário completo.
9. Preço por multiplicador.
10. Preço por margem líquida desejada.
11. Impostos, comissão e cartão.
12. Projeções mensais e ponto de equilíbrio.
13. Fluxo de conferência, aprovação e publicação.
14. Publicação atômica no novo nó.
15. Extração de PDF com revisão humana obrigatória.
16. Exportação CSV e impressão.
17. Backup restrito ao módulo.
18. Verificador de isolamento entre duas exportações do RTDB.
19. Auditoria própria.
20. PWA responsiva para computador e celular.

## Alteração das regras

- Todas as regras antigas foram preservadas estruturalmente.
- Foi acrescentado `precificacao` com regras específicas.
- O curinga `$outros` passou a excluir apenas o nome `precificacao` para que suas regras específicas não sejam anuladas por uma permissão mais ampla.
- Nenhuma regra de produto, estoque, venda, lote, movimento, produção ou auditoria operacional foi modificada.

## Testes executados

### SaaS operacional original

Todos os testes originais passaram:

- smoke test;
- regras ERP;
- peso e estornos V56–V60;
- produção e relatórios V62–V67;
- PDF V68;
- baixa manual V69.

### Novo repositório

Todos os testes novos passaram:

- cálculo de metal;
- perda e recuperação;
- custo operacional;
- margem desejada;
- cálculo completo;
- projeção;
- preservação das regras antigas;
- presença das regras novas;
- ausência de escrita nos nós operacionais;
- simulação de isolamento dos dados;
- validação sintática dos arquivos JavaScript e JSON;
- servidor estático local.

## Limite de validação

Não foram publicadas regras no Firebase real nem realizado login no ambiente real, pois não foram fornecidas credenciais de usuário e a publicação das regras é uma operação administrativa da conta do proprietário. O pacote está preparado para essa instalação, mas a homologação real deve seguir `LEIA-ANTES-DE-PUBLICAR.md` e `docs/ROTEIRO-DE-HOMOLOGACAO.md`.
