import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = ["index.html",".nojekyll","database.rules.json","database.rules.original.json","js/app.js","js/repository.js","js/calculator.js","js/firebase.js","js/pdf-importer.js","css/app.css","LEIA-ANTES-DE-PUBLICAR.md"];
for (const file of required) assert.ok(fs.existsSync(path.join(root,file)), `Arquivo obrigatório ausente: ${file}`);

const repository = fs.readFileSync(path.join(root,"js/repository.js"),"utf8");
const forbiddenWritePatterns = [
  /Firebase\.(?:set|update|remove|push|transaction)\([^\n]*(?:pecasEstoque|estoqueMovimentos|movimentos|vendas|pedidos|lotes|inventariosEstoque|clientes|producoes|comissoes)/,
  /paths\.produtos\s*[,)]\s*,?\s*(?:payload|data|value)/
];
for (const pattern of forbiddenWritePatterns) assert.equal(pattern.test(repository), false, `Possível escrita operacional encontrada: ${pattern}`);
assert.match(repository, /const ROOT = APP_CONFIG\.paths\.precificacao/);
assert.match(repository, /paths\.acessos/);
assert.equal(repository.includes("permissoesPrecificacao"), false, "O repositório ainda grava permissões no cadastro operacional.");
assert.match(repository, /precosPublicados/);

const app = fs.readFileSync(path.join(root,"js/app.js"),"utf8");
assert.match(app, /Automação em lote/);
assert.match(app, /precificacao\/acessos/);
assert.equal(app.includes("permissoesPrecificacao"), false, "A interface ainda usa permissões do cadastro operacional.");

const config = fs.readFileSync(path.join(root,"js/config.js"),"utf8");
assert.match(config, /empresas\/empresa-principal\/precificacao/);
assert.match(config, /vitorgomes-fa1e1-default-rtdb/);

console.log("OK structure.test.mjs");
