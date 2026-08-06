# Glamore Custos & Precificação — V1.1.0

Aplicativo independente publicado pelo **GitHub Pages** e conectado ao mesmo Firebase da Glamore Joias.

## Arquitetura

- Repositório operacional preservado: `GlamoreJoias`.
- Novo repositório: `GLAMORE-ADM`.
- Mesmo Firebase Authentication.
- Mesmo Realtime Database.
- Leitura operacional permitida somente em:
  - `empresas/empresa-principal/produtos`
  - perfil autenticado em `empresas/empresa-principal/usuarios/{uid}`
- Todas as gravações do novo sistema permanecem em:
  - `empresas/empresa-principal/precificacao`

O projeto não possui rotinas de escrita em estoque, vendas, lotes, pedidos, produção, movimentos, peças físicas, clientes ou comissões.

## Fluxo automatizado

A tela **Automação em lote** transforma o fluxo demonstrado na planilha em uma tabela calculada para todos os códigos que possuem ficha técnica:

1. metal e peso;
2. pedras;
3. insumos e processos;
4. banho/acabamento;
5. capacidade produtiva mensal;
6. custo operacional por peça;
7. custo final unitário;
8. preço sugerido por multiplicador ou margem desejada;
9. impostos, comissão e cartão;
10. lucro líquido unitário;
11. receita e resultado líquido mensal projetados.

A simulação não grava nada automaticamente. O usuário precisa selecionar as linhas e confirmar o salvamento como rascunho. Publicação continua exigindo aprovação e permissão específica.

## Acabamentos e banhos

Os acabamentos podem ser calculados por:

- valor por unidade;
- percentual sobre metal + pedras;
- percentual sobre o custo direto;
- valor por grama do metal.

Isso permite representar fórmulas de planilha como banho de 5% sobre metal e pedras sem criar valores fixos artificiais.

## Permissões isoladas

As permissões não ficam mais dentro do cadastro operacional `usuarios`.

Elas são salvas em:

```text
empresas/empresa-principal/precificacao/acessos/{uid}
```

Somente proprietário ou gestor global pode administrar esse caminho. Gerente não recebe publicação automática e não consegue conceder permissão a si próprio pelo cadastro operacional.

## Publicação no GitHub Pages

- Branch: `main`
- Pasta: `/(root)`
- O arquivo `index.html` deve permanecer na raiz.
- O arquivo `.nojekyll` está incluído.
- Não há Vercel neste projeto.

## Regras do Firebase

- `database.rules.original.json`: cópia exata das regras atuais fornecidas pelo proprietário.
- `database.rules.json`: mesmas regras operacionais, acrescidas somente do bloco explícito `precificacao` e da exclusão de `precificacao` no curinga `$outros`.

Nunca publique somente um trecho. O arquivo de regras deve ser copiado integralmente.

## Testes

Execute:

```bash
npm test
```

A suíte valida cálculo, fórmulas percentuais, preservação das regras antigas, isolamento dos dados e estrutura do GitHub Pages.

Powered by thIAguinho Soluções Digitais.
