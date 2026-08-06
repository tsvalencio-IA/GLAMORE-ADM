# Relatório de alterações — V1.1.0

## Arquivos alterados no novo repositório

- `js/repository.js`
- `js/app.js`
- `js/state.js`
- `js/calculator.js`
- `js/config.js`
- `css/app.css`
- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `database.rules.json`
- `database.rules.original.json`
- testes e documentação

## Segurança

- Nenhum arquivo do repositório operacional foi alterado.
- Permissões movidas de `usuarios/{uid}/permissoesPrecificacao` para `precificacao/acessos/{uid}`.
- Proprietário e gestor global mantêm controle total.
- Gerente precisa de autorização explícita no módulo.
- Publicação exige `publicar`.
- Restauração exige `administrar`.
- Auditoria do módulo é somente de criação.
- O curinga `$outros` continua idêntico para todos os nós antigos e deixa apenas de capturar `precificacao`.

## Automação da planilha

Adicionada tela `Automação em lote` com cálculo simultâneo de todas as fichas completas e colunas equivalentes ao fluxo demonstrado:

- metal;
- pedras;
- outros insumos;
- acabamento;
- produção mensal;
- custo fixo por peça;
- custo final;
- preço sugerido;
- despesas de venda;
- lucro unitário;
- receita mensal;
- resultado mensal.

A tela permite exportar CSV e salvar somente as linhas escolhidas como rascunho.

## Fórmulas de acabamento

Adicionados métodos:

- `unitario`;
- `percentual_metal_pedras`;
- `percentual_custo_direto`;
- `por_grama_metal`.

## Resultado dos testes

- novo módulo: 4 suítes aprovadas;
- sistema operacional V69: 15 suítes aprovadas;
- JSON de regras válido;
- sintaxe JavaScript válida;
- nenhuma escrita operacional encontrada no novo repositório.
