import assert from "node:assert/strict";
import fs from "node:fs";

const original = JSON.parse(fs.readFileSync(new URL("../database.rules.original.json", import.meta.url), "utf8"));
const updated = JSON.parse(fs.readFileSync(new URL("../database.rules.json", import.meta.url), "utf8"));
const oldEmpresa = original.rules.empresas.$empresaId;
const newEmpresa = updated.rules.empresas.$empresaId;

assert.ok(newEmpresa.precificacao, "O novo nó precificacao precisa de regras explícitas.");
assert.equal(newEmpresa[".write"], oldEmpresa[".write"], "A negação de escrita da empresa foi alterada.");

for (const [key, value] of Object.entries(oldEmpresa)) {
  if (key === "$outros") continue;
  assert.deepEqual(newEmpresa[key], value, `A regra antiga ${key} foi alterada.`);
}

const expectedRead = oldEmpresa.$outros[".read"].replace("auth != null && (", "auth != null && $outros !== 'precificacao' && (");
const expectedWrite = oldEmpresa.$outros[".write"].replace("auth != null && (", "auth != null && $outros !== 'precificacao' && (");
assert.equal(newEmpresa.$outros[".read"], expectedRead);
assert.equal(newEmpresa.$outros[".write"], expectedWrite);

const required = ["configuracoes","materiais","pedras","insumos","processos","acabamentos","embalagens","custosOperacionais","fichasTecnicas","precificacoes","aprovacoes","precosPublicados","importacoes","indices","auditoria","restauracoes","_schema"];
for (const key of required) assert.ok(newEmpresa.precificacao[key], `Regra ausente: ${key}`);
assert.match(newEmpresa.precificacao.precosPublicados[".write"], /publicar/);
assert.match(newEmpresa.precificacao.auditoria.$auditoriaId[".write"], /!data\.exists\(\)/);

console.log("OK rules.test.mjs");
