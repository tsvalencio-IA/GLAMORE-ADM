import assert from "node:assert/strict";
import { calculateMetalCost, calculateOperationalUnit, calculatePricing, priceFromTargetMargin } from "../js/calculator.js";

const metal = calculateMetalCost({ pesoFinalGramas: 10, perdaPercentual: 10, recuperacaoPercentual: 50, custoPorGrama: 5, valorRecuperavelPorGrama: 5 });
assert.equal(metal.consumoBruto, 11);
assert.equal(metal.aparas, 1);
assert.equal(metal.creditoRecuperacao, 2.5);
assert.equal(metal.custoLiquido, 52.5);

const op = calculateOperationalUnit({ custoOperacionalMensal: 100000, metodoRateio: "capacidade_global", capacidadeGlobalMensal: 2000 }, {});
assert.equal(op.custoUnitario, 50);

const target = priceFromTargetMargin(49, { impostoPercentual: 8, comissaoPercentual: 5, cartaoPercentual: 4, margemDesejadaPercentual: 25 });
assert.equal(target.valid, true);
assert.equal(target.price, 84.482759);

const result = calculatePricing({
  sheet: {
    materialId: "prata",
    pesoMetalGramas: 4,
    perdaMetalPercentual: 0,
    recuperacaoAparasPercentual: 0,
    capacidadeMensal: 2000,
    pedras: [{ itemId: "z1", quantidade: 2 }],
    insumos: [{ itemId: "i1", quantidade: 1 }],
    processos: [], acabamentos: [], embalagens: [],
    maoDeObraDireta: 7,
    terceirizacoes: 0,
    preparacaoLoteTotal: 100,
    loteEconomico: 100,
    outrosCustos: 0
  },
  catalogs: {
    materiais: { prata: { custoPorGrama: 5 } },
    pedras: { z1: { nome: "Zircônia", precoUnitario: 1 } },
    insumos: { i1: { nome: "Solda", precoUnitario: 2 } },
    processos: {}, acabamentos: {}, embalagens: {}
  },
  settings: { custoOperacionalMensal: 100000, metodoRateio: "capacidade_global", capacidadeGlobalMensal: 2000 },
  commercial: { metodoPreco: "multiplicador", multiplicador: 2, impostoPercentual: 8, comissaoPercentual: 5, cartaoPercentual: 4, utilizacaoCapacidadePercentual: 70, conversaoVendaPercentual: 80 }
});
assert.equal(result.custos.metal, 20);
assert.equal(result.custos.pedras, 2);
assert.equal(result.custos.insumos, 2);
assert.equal(result.custos.maoDeObraDireta, 7);
assert.equal(result.custos.preparacaoLoteUnitario, 1);
assert.equal(result.custos.operacional, 50);
assert.equal(result.custos.totalUnitario, 82);
assert.equal(result.comercial.precoVenda, 164);
assert.equal(result.comercial.despesasComerciais, 27.88);
assert.equal(result.comercial.lucroLiquidoUnitario, 54.12);
assert.equal(result.projecao.producaoProjetada, 1400);
assert.equal(result.projecao.vendaProjetada, 1120);

console.log("OK calculator.test.mjs");
