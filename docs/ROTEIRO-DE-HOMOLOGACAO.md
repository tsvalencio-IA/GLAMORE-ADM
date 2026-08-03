# Roteiro de homologação

## 1. Segurança de acesso

- Entrar como dono.
- Entrar como gerente.
- Confirmar bloqueio de usuário sem permissão.
- Conceder somente `acessar` e verificar que o usuário não grava.
- Conceder `editarFicha` e verificar que ele não publica.

## 2. Isolamento do sistema atual

Antes e depois do teste, comparar a quantidade de registros em:

- produtos;
- pecasEstoque;
- vendas;
- movimentos;
- estoqueMovimentos;
- lotes;
- inventariosEstoque;
- auditoria operacional.

Os números devem permanecer iguais quando a única atividade realizada for dentro do novo aplicativo.

## 3. Fórmulas

Validar pelo menos dez produtos reais:

- prata sem pedra;
- prata com zircônia;
- prata com pedra natural;
- bronze;
- produto banhado;
- lote pequeno;
- lote grande;
- alta perda;
- recuperação de aparas;
- preço por multiplicador;
- preço por margem desejada.

Comparar cada resultado com a planilha usada pelo proprietário.

## 4. PDF

- importar PDF conhecido;
- revisar falsos positivos;
- conferir peso, medida, material e pedras;
- confirmar que as fichas são criadas como rascunho;
- não aprovar ficha sem revisão humana.

## 5. Aprovação

- rascunho → conferência;
- conferência → aguardando aprovação;
- aprovação somente por autorizado;
- publicação somente pelo dono ou permissão explícita;
- confirmar gravação em `precificacao/precosPublicados`;
- confirmar que `produtos` permanece inalterado.
