import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const candidates = [
  "/mnt/data/vitorgomes-fa1e1-default-rtdb-export (1).json",
  "/mnt/data/vitorgomes-fa1e1-default-rtdb-export.json"
];
const exportPath = candidates.find((item) => fs.existsSync(item));
if (exportPath) {
  const before = JSON.parse(fs.readFileSync(exportPath,"utf8"));
  const simulated = structuredClone(before);
  simulated.empresas["empresa-principal"].precificacao = {
    ...(simulated.empresas["empresa-principal"].precificacao || {}),
    acessos: { teste: { acessar: true, calcular: true } },
    _schema: { nome: "Glamore Custos & Precificação", versao: 2 }
  };
  const protectedBefore = structuredClone(before.empresas["empresa-principal"]);
  const protectedAfter = structuredClone(simulated.empresas["empresa-principal"]);
  delete protectedBefore.precificacao;
  delete protectedAfter.precificacao;
  const hash = (v) => crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
  assert.equal(hash(protectedBefore), hash(protectedAfter), "A simulação alterou nós operacionais.");
}
console.log("OK data-isolation.test.mjs");
