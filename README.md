# Glamore Custos & Precificação

Aplicativo independente para engenharia de custos, fichas técnicas, precificação e projeções da Glamore Joias.

## Arquitetura

- Novo repositório GitHub.
- Novo projeto Vercel.
- Mesmo Firebase Authentication.
- Mesmo Realtime Database.
- Leitura do cadastro de produtos existente.
- Gravação exclusiva no nó `empresas/empresa-principal/precificacao`.
- Nenhuma alteração necessária no código do SaaS operacional.

## Funcionalidades entregues

- login com as contas existentes;
- controle granular de acesso;
- leitura do catálogo operacional;
- fichas técnicas versionadas;
- metais: prata 925, prata 950, bronze e novos materiais;
- pedras por material, formato, tamanho, cor, unidade, moeda, cotação e fornecedor;
- insumos, processos, acabamentos, banhos e embalagens;
- custo operacional por capacidade global, capacidade do produto, unidade equivalente ou tempo produtivo;
- perda de metal e recuperação econômica de aparas;
- mão de obra, terceirização, lote e outros custos;
- preço por multiplicador ou margem líquida desejada;
- impostos, comissão e taxa de cartão;
- margem líquida, capacidade, receita, lucro e ponto de equilíbrio;
- estados de rascunho, conferência, aprovação e publicação;
- publicação isolada no novo nó;
- extração heurística de PDF com conferência obrigatória;
- relatórios CSV e impressão;
- backup e restauração limitados ao novo módulo;
- auditoria própria.

## Publicação na Vercel

1. Crie um repositório vazio.
2. Envie todos os arquivos deste pacote para a raiz.
3. Na Vercel, selecione **Add New Project**.
4. Importe o repositório.
5. Framework preset: **Other**.
6. Build command: deixe vazio.
7. Output directory: deixe vazio.
8. Publique.

O `js/config.js` já está conectado ao projeto Firebase `vitorgomes-fa1e1` recebido no sistema original.

## Regras do Firebase

O arquivo `database.rules.json` contém as regras antigas completas e o novo bloco de precificação. Consulte `docs/ALTERACAO-DAS-REGRAS.md`.

### Publicação manual

Firebase Console → Realtime Database → Regras → cole todo o conteúdo de `database.rules.json` → Publicar.

### Publicação por Firebase CLI

```bash
firebase deploy --only database
```

A publicação por CLI é opcional. O projeto inclui `.firebaserc` e `firebase.json` apenas para quem já utiliza esse fluxo.

## Testes locais

```bash
npm test
```

Os testes verificam:

- fórmulas de metal, custos, margem e projeção;
- preservação estrutural das regras antigas;
- isolamento dos caminhos de gravação;
- presença dos arquivos obrigatórios.

## Limitação deliberada da primeira versão

O preço publicado fica em:

```text
empresas/empresa-principal/precificacao/precosPublicados/{produtoId}
```

Ele não é copiado automaticamente para `produtos`. Essa barreira evita que o novo sistema modifique o fluxo comercial atual antes da homologação.
