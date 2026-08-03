# LEIA ANTES DE PUBLICAR

Este ZIP é um **novo repositório independente**. Não substitua arquivos do repositório operacional `GlamoreJoias-main` por arquivos deste pacote.

## O que o novo aplicativo acessa

Leitura:

```text
empresas/empresa-principal/produtos
empresas/empresa-principal/usuarios/{uid}
gestores/{uid}
```

Leitura e gravação:

```text
empresas/empresa-principal/precificacao
```

O código não possui operações de gravação para estoque, vendas, lotes, movimentos, produção, inventários ou clientes.

## Ordem obrigatória

1. No Firebase Console, exporte novamente o Realtime Database e guarde o arquivo.
2. Copie e guarde as regras atuais antes de qualquer publicação.
3. Compare as regras atuais com `database.rules.original.json`. Esse arquivo corresponde às regras enviadas para a construção do pacote.
4. Publique `database.rules.json` no Realtime Database.
5. Não importe nenhum JSON de dados deste ZIP na raiz do banco.
6. Crie um repositório vazio no GitHub.
7. Envie o conteúdo da pasta raiz deste ZIP para o novo repositório.
8. Importe o novo repositório na Vercel.
9. Abra o novo domínio e entre primeiro com a conta do proprietário.
10. A primeira entrada inicializará apenas `empresas/empresa-principal/precificacao`.
11. Confira no Firebase se nenhum contador dos nós operacionais foi alterado.
12. Cadastre valores reais somente depois de validar as fórmulas com o proprietário.

## Nunca faça

- Não importe `database.rules.json` como dados.
- Não importe um arquivo de seed na raiz do banco.
- Não apague o nó `empresas/empresa-principal`.
- Não substitua o repositório atual por este.
- Não dê acesso de publicação a usuários que não podem visualizar custos e margens.
- Não trate a extração de PDF como informação confirmada sem revisão humana.

## Rollback

Se o novo aplicativo apresentar problema:

1. retire o projeto novo do ar na Vercel;
2. restaure as regras usando `database.rules.original.json`;
3. mantenha ou remova somente o nó `empresas/empresa-principal/precificacao`;
4. o repositório operacional continuará separado e não precisará de rollback.
