import assert from "node:assert/strict";
import fs from "node:fs";

const original = JSON.parse(fs.readFileSync(new URL("../database.rules.original.json", import.meta.url), "utf8"));
const updated = JSON.parse(fs.readFileSync(new URL("../database.rules.json", import.meta.url), "utf8"));
const oldEmpresa = original.rules.empresas.$empresaId;
const newEmpresa = updated.rules.empresas.$empresaId;

assert.ok(newEmpresa.precificacao, "O nó precificacao precisa de regras explícitas.");
assert.equal(newEmpresa[".write"], oldEmpresa[".write"], "A negação de escrita da empresa foi alterada.");

for (const [key, value] of Object.entries(oldEmpresa)) {
  if (key === "$outros") continue;
  assert.deepEqual(newEmpresa[key], value, `A regra operacional antiga ${key} foi alterada.`);
}

const expectedRead = oldEmpresa.$outros[".read"].replace("auth != null && (", "auth != null && $outros !== 'precificacao' && (");
const expectedWrite = oldEmpresa.$outros[".write"].replace("auth != null && (", "auth != null && $outros !== 'precificacao' && (");
assert.equal(newEmpresa.$outros[".read"], expectedRead, "A leitura do curinga antigo mudou além da exclusão de precificacao.");
assert.equal(newEmpresa.$outros[".write"], expectedWrite, "A escrita do curinga antigo mudou além da exclusão de precificacao.");

const required = ["acessos","configuracoes","materiais","pedras","insumos","processos","acabamentos","embalagens","custosOperacionais","fichasTecnicas","precificacoes","aprovacoes","precosPublicados","importacoes","indices","auditoria","restauracoes","_schema"];
for (const key of required) assert.ok(newEmpresa.precificacao[key], `Regra ausente: ${key}`);

const serialized = JSON.stringify(newEmpresa.precificacao);
assert.equal(serialized.includes("permissoesPrecificacao"), false, "As regras ainda dependem do nó operacional usuarios/permissoesPrecificacao.");
assert.match(serialized, /precificacao.*acessos|acessos.*child\(auth\.uid\)/, "As permissões não estão isoladas em precificacao/acessos.");
assert.match(newEmpresa.precificacao.precosPublicados[".write"], /child\('publicar'\)/, "Publicação não exige a permissão publicar.");
assert.doesNotMatch(newEmpresa.precificacao.precosPublicados[".write"], /papel'\)\.val\(\) === 'gerente'/, "Gerente recebeu publicação automática.");
assert.match(newEmpresa.precificacao.auditoria.$auditoriaId[".write"], /!data\.exists\(\)/, "Auditoria não está imutável.");
assert.match(newEmpresa.precificacao.acessos[".write"], /papel'\)\.val\(\) === 'dono'/, "A administração dos acessos não está restrita ao proprietário/gestor global.");

console.log("OK rules.test.mjs");
