# Baseline dos nós recebidos

Arquivo analisado: `vitorgomes-fa1e1-default-rtdb-export.json`.

| Nó | Registros | SHA-256 normalizado |
|---|---:|---|
| `auditoria` | 424 | `745d9c1b6865fd20c3fdd1b1f3a88a7779e7abf909c61621cc9696e6fc06039c` |
| `catalogosPublicos` | 1 | `c39e3a57b568b2c4b89ca68d44d0540660bc9595e68995b997e283539b7a0a0e` |
| `clientes` | 18 | `a7be545e440fdcb7790f01daada07521480cf4b9c63a9503fc75bddf4b567ee0` |
| `configuracoes` | 3 | `69b04e8c763dc65fe8770e185c769e231907e5e812fddf0dc2ec60da5a5d5dd5` |
| `estoqueMovimentos` | 301 | `6579ebb68d8833c5373b63e80ca7c985687a2a3b817555b3e5d632c89166111b` |
| `iaConsultas` | 22 | `11c24fd9c760d89acdadac9f82d432e48a98121fa20c3587a001dc670d984998` |
| `inventariosEstoque` | 7 | `1218975065ff7315c19731818eab8881ae7738f886bb229a71f3222b9b389f71` |
| `lotes` | 301 | `fbda770620f2e8bd0f20f155ab36d3b101ad01604bb713bdc71644876bd8094c` |
| `movimentos` | 341 | `5318873a946e13c3bbb329993c1100515857e52c8ede3d5edeaf144d8b762f8c` |
| `pecasEstoque` | 1848 | `7e6fc6463b714fe21a5caf19f59f620983985ca1a44f107b32f577964c1dad33` |
| `pedidos` | 33 | `0f321b85b46dedcca0d7c1b375d8437ac714765aeecc1a7dc0b5d10a77895b64` |
| `produtos` | 296 | `30801caca505b2b0da5a4ec7b7f8014c5e108eef6fcdf6b5b25a9036c623ba46` |
| `tiposProduto` | 6 | `feb2b2a5a2a62d0f500bba85b7b3899b9b15564486e6721581b6dbe250cae3f7` |
| `usuarios` | 3 | `0d23490e354fb18d91d3668b1464a9291005912f792dde80cab22eba29008c04` |
| `vendas` | 40 | `e660d500b68d0d4e15a7fcadac8a4e4d3280dc5461f33657e44d2d8edf47b4ea` |
| `vendedores` | 2 | `4a48bf5c154d3bcfdf10308243a948ac521095f8209d42150719de15036f76f6` |

O hash permite comparar o conteúdo exato de cada nó em outra exportação. O aplicativo `verificador.html` automatiza essa comparação e ignora somente o novo nó `precificacao`.