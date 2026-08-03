import { round, toNumber } from "./utils.js";

const n = (value) => toNumber(value, 0);
const nonNegative = (value) => Math.max(0, n(value));
const pct = (value) => nonNegative(value) / 100;

export function calculateMetalCost(input = {}) {
  const pesoFinal = nonNegative(input.pesoFinalGramas);
  const perda = pct(input.perdaPercentual);
  const recuperacao = Math.min(1, pct(input.recuperacaoPercentual));
  const custoGrama = nonNegative(input.custoPorGrama);
  const valorRecuperavelGrama = nonNegative(input.valorRecuperavelPorGrama || custoGrama);

  const consumoBruto = pesoFinal * (1 + perda);
  const aparas = Math.max(0, consumoBruto - pesoFinal);
  const creditoRecuperacao = aparas * recuperacao * valorRecuperavelGrama;
  const custoBruto = consumoBruto * custoGrama;
  const custoLiquido = Math.max(0, custoBruto - creditoRecuperacao);

  return {
    pesoFinal: round(pesoFinal, 6),
    consumoBruto: round(consumoBruto, 6),
    aparas: round(aparas, 6),
    creditoRecuperacao: round(creditoRecuperacao, 6),
    custoBruto: round(custoBruto, 6),
    custoLiquido: round(custoLiquido, 6)
  };
}

export function calculateComponentCost(component = {}, catalog = {}) {
  const quantidade = nonNegative(component.quantidade || 1);
  const item = catalog[component.itemId] || component.itemSnapshot || {};
  const preco = nonNegative(component.precoUnitario ?? item.precoUnitario ?? item.custoUnitario);
  const perda = pct(component.perdaPercentual ?? item.perdaPercentual);
  const custo = quantidade * preco * (1 + perda);
  return {
    itemId: component.itemId || "",
    nome: component.nome || item.nome || item.descricao || "Componente",
    quantidade: round(quantidade, 6),
    precoUnitario: round(preco, 6),
    perdaPercentual: round((component.perdaPercentual ?? item.perdaPercentual) || 0, 4),
    custo: round(custo, 6)
  };
}

export function calculateOperationalUnit(config = {}, sheet = {}) {
  const custoMensal = nonNegative(config.custoOperacionalMensal);
  const metodo = config.metodoRateio || "capacidade_global";

  if (metodo === "produto_capacidade") {
    const capacidade = Math.max(1, nonNegative(sheet.capacidadeMensal));
    return { metodo, base: capacidade, custoUnitario: round(custoMensal / capacidade, 6) };
  }

  if (metodo === "unidade_equivalente") {
    const unidades = Math.max(1, nonNegative(config.unidadesEquivalentesMensais));
    const fator = Math.max(0.0001, nonNegative(sheet.fatorComplexidade || 1));
    return { metodo, base: unidades, fator, custoUnitario: round((custoMensal / unidades) * fator, 6) };
  }

  if (metodo === "tempo_produtivo") {
    const minutosDisponiveis = Math.max(1, nonNegative(config.minutosProdutivosMensais));
    const minutosProduto = nonNegative(sheet.tempoProdutivoMinutos);
    const custoMinuto = custoMensal / minutosDisponiveis;
    return {
      metodo,
      base: minutosDisponiveis,
      minutosProduto,
      custoMinuto: round(custoMinuto, 8),
      custoUnitario: round(custoMinuto * minutosProduto, 6)
    };
  }

  const capacidadeGlobal = Math.max(1, nonNegative(config.capacidadeGlobalMensal));
  return { metodo: "capacidade_global", base: capacidadeGlobal, custoUnitario: round(custoMensal / capacidadeGlobal, 6) };
}

export function priceFromTargetMargin(cost, commercial = {}) {
  const custo = nonNegative(cost);
  const descontos = pct(commercial.impostoPercentual) + pct(commercial.comissaoPercentual) + pct(commercial.cartaoPercentual) + pct(commercial.margemDesejadaPercentual);
  if (descontos >= 1) return { valid: false, price: 0, reason: "A soma de impostos, comissão, cartão e margem deve ser menor que 100%." };
  return { valid: true, price: round(custo / (1 - descontos), 6), reason: "" };
}

export function calculatePricing({ sheet = {}, catalogs = {}, settings = {}, commercial = {} } = {}) {
  const material = catalogs.materiais?.[sheet.materialId] || sheet.materialSnapshot || {};
  const metal = calculateMetalCost({
    pesoFinalGramas: sheet.pesoMetalGramas ?? sheet.pesoFinalGramas ?? 0,
    perdaPercentual: sheet.perdaMetalPercentual ?? material.perdaPercentual ?? 0,
    recuperacaoPercentual: sheet.recuperacaoAparasPercentual ?? material.recuperacaoPercentual ?? 0,
    custoPorGrama: sheet.custoMetalPorGrama ?? material.custoPorGrama ?? 0,
    valorRecuperavelPorGrama: material.valorRecuperavelPorGrama ?? material.custoPorGrama ?? 0
  });

  const groups = [
    ["pedras", catalogs.pedras || {}],
    ["insumos", catalogs.insumos || {}],
    ["processos", catalogs.processos || {}],
    ["acabamentos", catalogs.acabamentos || {}],
    ["embalagens", catalogs.embalagens || {}]
  ];

  const lines = {};
  let componentsTotal = 0;
  groups.forEach(([group, catalog]) => {
    lines[group] = (sheet[group] || []).map((item) => calculateComponentCost(item, catalog));
    const subtotal = lines[group].reduce((sum, item) => sum + item.custo, 0);
    componentsTotal += subtotal;
    lines[`${group}Subtotal`] = round(subtotal, 6);
  });

  const maoDeObraDireta = nonNegative(sheet.maoDeObraDireta);
  const terceirizacoes = nonNegative(sheet.terceirizacoes);
  const preparacaoLoteTotal = nonNegative(sheet.preparacaoLoteTotal);
  const loteEconomico = Math.max(1, nonNegative(sheet.loteEconomico || 1));
  const preparacaoLoteUnitario = preparacaoLoteTotal / loteEconomico;
  const outrosCustos = nonNegative(sheet.outrosCustos);
  const operational = calculateOperationalUnit(settings, sheet);

  const custoTotalUnitario = metal.custoLiquido + componentsTotal + maoDeObraDireta + terceirizacoes + preparacaoLoteUnitario + outrosCustos + operational.custoUnitario;
  const method = commercial.metodoPreco || "multiplicador";
  let precoVenda = 0;
  let pricingError = "";
  if (method === "margem_desejada") {
    const result = priceFromTargetMargin(custoTotalUnitario, commercial);
    precoVenda = result.price;
    pricingError = result.reason;
  } else {
    precoVenda = custoTotalUnitario * Math.max(0, nonNegative(commercial.multiplicador || 1));
  }

  const imposto = precoVenda * pct(commercial.impostoPercentual);
  const comissao = precoVenda * pct(commercial.comissaoPercentual);
  const cartao = precoVenda * pct(commercial.cartaoPercentual);
  const despesasComerciais = imposto + comissao + cartao;
  const lucroLiquidoUnitario = precoVenda - despesasComerciais - custoTotalUnitario;
  const margemLiquidaPercentual = precoVenda > 0 ? (lucroLiquidoUnitario / precoVenda) * 100 : 0;

  const capacidade = nonNegative(sheet.capacidadeMensal);
  const utilizacao = Math.min(100, nonNegative(commercial.utilizacaoCapacidadePercentual ?? 100));
  const conversao = Math.min(100, nonNegative(commercial.conversaoVendaPercentual ?? 100));
  const producaoProjetada = capacidade * pct(utilizacao);
  const vendaProjetada = producaoProjetada * pct(conversao);

  const fixedCommercialRate = pct(commercial.impostoPercentual) + pct(commercial.comissaoPercentual) + pct(commercial.cartaoPercentual);
  const contribuicaoUnitaria = precoVenda * (1 - fixedCommercialRate) - (custoTotalUnitario - operational.custoUnitario);
  const pontoEquilibrioUnidades = contribuicaoUnitaria > 0 ? nonNegative(settings.custoOperacionalMensal) / contribuicaoUnitaria : 0;

  return {
    engineVersion: "1.0.0",
    metal,
    lines,
    operational,
    custos: {
      metal: round(metal.custoLiquido, 6),
      pedras: lines.pedrasSubtotal,
      insumos: lines.insumosSubtotal,
      processos: lines.processosSubtotal,
      acabamentos: lines.acabamentosSubtotal,
      embalagens: lines.embalagensSubtotal,
      maoDeObraDireta: round(maoDeObraDireta, 6),
      terceirizacoes: round(terceirizacoes, 6),
      preparacaoLoteUnitario: round(preparacaoLoteUnitario, 6),
      outrosCustos: round(outrosCustos, 6),
      operacional: round(operational.custoUnitario, 6),
      totalUnitario: round(custoTotalUnitario, 6)
    },
    comercial: {
      metodo: method,
      precoVenda: round(precoVenda, 6),
      imposto: round(imposto, 6),
      comissao: round(comissao, 6),
      cartao: round(cartao, 6),
      despesasComerciais: round(despesasComerciais, 6),
      lucroLiquidoUnitario: round(lucroLiquidoUnitario, 6),
      margemLiquidaPercentual: round(margemLiquidaPercentual, 6),
      pricingError
    },
    projecao: {
      capacidadeMaxima: round(capacidade, 3),
      producaoProjetada: round(producaoProjetada, 3),
      vendaProjetada: round(vendaProjetada, 3),
      receitaBruta: round(precoVenda * vendaProjetada, 6),
      custoTotal: round(custoTotalUnitario * producaoProjetada, 6),
      lucroLiquido: round(lucroLiquidoUnitario * vendaProjetada, 6),
      capacidadeOciosa: round(Math.max(0, capacidade - producaoProjetada), 3),
      pontoEquilibrioUnidades: round(pontoEquilibrioUnidades, 3)
    }
  };
}
