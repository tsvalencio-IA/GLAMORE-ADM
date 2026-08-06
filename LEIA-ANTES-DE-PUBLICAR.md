# LEIA ANTES DE ATUALIZAR O GLAMORE-ADM

## O que será atualizado

Somente o repositório novo `GLAMORE-ADM`.

O repositório operacional `GlamoreJoias` não deve receber nenhum arquivo deste pacote.

## Ordem segura

1. Guarde o ZIP atual do `GLAMORE-ADM`.
2. Guarde a exportação atual do Realtime Database.
3. Guarde uma cópia das regras atualmente publicadas.
4. Substitua os arquivos do novo repositório pelo conteúdo deste pacote.
5. Aguarde o GitHub Pages concluir o deploy.
6. Entre com a conta do proprietário e confirme os 296 produtos.
7. Abra `Acessos` e configure os usuários que poderão usar o novo módulo.
8. Teste a tela `Automação em lote` sem salvar rascunhos.
9. Somente depois publique o arquivo completo `database.rules.json` no Realtime Database.
10. Teste primeiro o sistema operacional antigo.
11. Teste depois o `GLAMORE-ADM`.

## O que não fazer

- Não importar o JSON do banco no GitHub.
- Não substituir o repositório do estoque.
- Não apagar o nó `precificacao`.
- Não copiar apenas um trecho das regras.
- Não usar o arquivo `database.rules.original.json` como regra nova; ele é o backup anterior.
- Não publicar preços reais durante a homologação.

## Rollback das regras

Se houver erro de permissão após a publicação:

1. Abra Firebase Console → Realtime Database → Regras.
2. Copie integralmente `database.rules.original.json`.
3. Cole no editor.
4. Publique.

Isso restaura exatamente as regras fornecidas como atuais, sem apagar dados.
