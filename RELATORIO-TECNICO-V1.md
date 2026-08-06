# Relatório técnico — Glamore Custos & Precificação V1.1.0

## Bases atuais auditadas

- SaaS operacional em produção: `GlamoreJoias-main (3)(2).zip`.
- Novo repositório do GitHub Pages: `GLAMORE-ADM-main (1).zip`.
- Regras realmente publicadas no Realtime Database: `Texto colado(121).txt`.
- Exportação anterior do Realtime Database: `vitorgomes-fa1e1-default-rtdb-export.json`.
- Exportação após a inicialização do módulo: `vitorgomes-fa1e1-default-rtdb-export (1).json`.
- Amostra do fluxo de planilha a automatizar: `1000852300.mp4`.

## Decisão arquitetural preservada

O estoque da Glamore Joias continua no repositório operacional, sem receber arquivos ou funções do novo módulo.

O novo repositório é publicado separadamente pelo GitHub Pages, mas utiliza o mesmo Firebase Authentication e o mesmo Realtime Database.

O novo projeto lê somente os dados necessários do ambiente operacional:

```text
empresas/empresa-principal/produtos
empresas/empresa-principal/usuarios/{uid}
gestores/{uid}
```

Todas as gravações próprias permanecem abaixo de:

```text
empresas/empresa-principal/precificacao
```

## Nós operacionais preservados

O novo repositório não contém operações de escrita direcionadas a:

- `produtos`;
- `clientes`;
- `vendedores`;
- `pedidos`;
- `vendas`;
- `consignacoes`;
- `movimentos`;
- `estoqueMovimentos`;
- `producoes`;
- `producao`;
- `pedidosProducao`;
- `lotes`;
- `inventariosEstoque`;
- `pecasEstoque`;
- `comissoes`;
- `auditoria` operacional existente.

O repositório operacional não foi modificado.

## Permissões isoladas do novo módulo

As permissões da precificação foram retiradas do cadastro operacional de usuários e passaram a ser mantidas exclusivamente em:

```text
empresas/empresa-principal/precificacao/acessos/{uid}
```

Consequências:

- o papel operacional do usuário não é alterado;
- o gerente não recebe autorização automática para publicar preços;
- somente proprietário ou gestor global administra acessos;
- cada usuário recebe permissões específicas para acessar, editar, calcular, aprovar, publicar, importar, exportar ou administrar;
- um usuário limitado não consegue conceder permissões a si próprio pelo cadastro operacional.

## Regras do Realtime Database

O arquivo `database.rules.original.json` é a cópia exata das regras realmente publicadas fornecidas pelo proprietário.

O arquivo `database.rules.json` foi gerado a partir dessa base e preserva literalmente os blocos operacionais existentes. As únicas mudanças intencionais são:

1. inclusão do bloco explícito `precificacao`;
2. exclusão apenas do nome `precificacao` no curinga `$outros`, para que o novo nó use suas regras próprias;
3. validações específicas do novo módulo;
4. isolamento de `precificacao/acessos` para administração apenas pelo proprietário ou gestor global;
5. exigência de permissão explícita para aprovação, publicação, restauração e auditoria.

Todos os demais nomes capturados por `$outros` continuam com o comportamento anterior.

## Automação do fluxo demonstrado na planilha

A tela `Automação em lote` reproduz o fluxo apresentado no vídeo para todas as fichas técnicas completas.

Ela calcula e apresenta:

- código e descrição;
- custo do metal;
- custo das pedras;
- demais insumos e processos;
- banho ou acabamento;
- capacidade de produção mensal;
- custo operacional/fixo por peça;
- custo final unitário;
- preço sugerido;
- impostos, comissão e cartão;
- lucro líquido unitário;
- margem líquida;
- receita bruta mensal projetada;
- resultado líquido mensal projetado.

A automação não publica nem grava preços silenciosamente. O usuário seleciona as linhas válidas e confirma o salvamento como rascunho. A publicação continua dependendo de conferência, aprovação e permissão específica.

## Fórmulas de banho e acabamento

Foram implementadas quatro formas de cálculo:

- valor unitário;
- percentual sobre metal + pedras;
- percentual sobre o custo direto;
- valor por grama do metal.

Isso permite representar fórmulas como o banho de 5% sobre a soma de metal e pedras observado na planilha, sem transformar o percentual em um valor fixo artificial.

## Recursos funcionais preservados e acrescentados

1. autenticação compartilhada;
2. catálogo operacional de produtos em modo somente leitura;
3. fichas técnicas versionadas;
4. metais, pedras, insumos, processos, acabamentos e embalagens;
5. perda de metal e recuperação econômica de aparas;
6. métodos de rateio operacional;
7. custo unitário completo;
8. preço por multiplicador;
9. preço por margem líquida desejada;
10. impostos, comissão e cartão;
11. projeções mensais e ponto de equilíbrio;
12. cálculo automatizado em lote;
13. exportação CSV da automação;
14. salvamento seletivo como rascunho;
15. fluxo de conferência, aprovação e publicação;
16. publicação multiponto dentro do novo nó;
17. importação de PDF com revisão humana obrigatória;
18. relatórios e impressão;
19. backup restrito ao módulo;
20. auditoria própria;
21. controle de acessos isolado;
22. PWA responsiva para computador e celular;
23. compatibilidade com subpasta do GitHub Pages.

## Testes executados

### SaaS operacional V69

Foram executadas as 15 suítes originais do repositório operacional, cobrindo:

- estoque;
- peso real;
- vendas;
- produção;
- estornos;
- alertas;
- auditoria;
- importação de PDF;
- integridade das versões V56 a V69.

Resultado: todas aprovadas.

### Novo repositório V1.1.0

Foram executadas as suítes de:

- motor de cálculo;
- cálculo percentual de banho;
- perda e recuperação;
- rateio operacional;
- margem desejada;
- projeções;
- preservação das regras antigas;
- isolamento de acessos;
- ausência de escrita nos nós operacionais;
- estrutura do GitHub Pages;
- sintaxe JavaScript;
- validade dos arquivos JSON.

Resultado: todas aprovadas.

## Limite real da validação

Os arquivos foram auditados e testados localmente, e nenhuma regra operacional existente foi modificada no arquivo final. Entretanto, a publicação das regras no Firebase real continua sendo uma operação administrativa e deve seguir a ordem de homologação documentada.

A implantação segura é:

1. atualizar somente o repositório `GLAMORE-ADM`;
2. aguardar o GitHub Pages publicar a V1.1.0;
3. entrar como proprietário e conferir o módulo;
4. configurar os acessos necessários;
5. exportar novamente os dados e copiar as regras atuais;
6. publicar o arquivo completo `database.rules.json`;
7. testar primeiro o sistema operacional;
8. testar depois o novo módulo;
9. restaurar `database.rules.original.json` se qualquer permissão operacional se comportar de forma diferente.

Powered by thIAguinho Soluções Digitais.
