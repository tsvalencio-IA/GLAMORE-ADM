# Alteração segura das regras do Realtime Database

O arquivo `database.rules.json` é uma cópia integral das regras recebidas, com duas alterações controladas:

1. Foi acrescentado o filho explícito `empresas/$empresaId/precificacao`.
2. O curinga `$outros` recebeu a condição `$outros !== 'precificacao'`.

A condição no curinga é necessária porque a regra anterior concedia aos papéis `dono` e `gerente` acesso a qualquer nó ainda não declarado. Sem a exclusão, as regras específicas do novo módulo poderiam ser ignoradas pela concessão mais ampla do curinga.

A condição não muda o acesso aos nós antigos: para qualquer nome diferente de `precificacao`, a expressão original continua idêntica.

## Permissões adicionadas ao perfil de usuário

As permissões ficam em:

```text
empresas/{empresaId}/usuarios/{uid}/permissoesPrecificacao
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

`dono` continua com acesso integral. `gerente` mantém acesso administrativo ao módulo, exceto publicação, que exige papel `dono`, gestor global ou permissão `publicar`.
