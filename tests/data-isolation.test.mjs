import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
const exportPath = "/mnt/data/vitorgomes-fa1e1-default-rtdb-export.json";
if (fs.existsSync(exportPath)) {
  const before = JSON.parse(fs.readFileSync(exportPath,"utf8"));
  const simulated = structuredClone(before);
  simulated.empresas["empresa-principal"].precificacao = { _schema: { nome: "Glamore Custos & Precificação", versao: 1 } };
  const protectedBefore = structuredClone(before.empresas["empresa-principal"]);
  const protectedAfter = structuredClone(simulated.empresas["empresa-principal"]);
  delete protectedBefore.precificacao; delete protectedAfter.precificacao;
  const hash = (v) => crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
  assert.equal(hash(protectedBefore), hash(protectedAfter));
}
console.log("OK data-isolation.test.mjs");
