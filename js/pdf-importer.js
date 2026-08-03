import { normalizeText, toNumber, uid } from "./utils.js";

function detectStones(text) {
  const normalized = normalizeText(text);
  const stones = [];
  const materials = [
    ["zircônia", /zircon|zirconia|zirc\b/],
    ["moissanita", /moissanita|moissanite/],
    ["diamante", /diamante|brilhante/],
    ["ametista", /ametista/],
    ["turmalina verde", /turmalina verde/],
    ["turmalina rosa", /turmalina rosa/],
    ["rubelita", /rubelita|rubilita/],
    ["esmeralda", /esmeralda/],
    ["rubi", /rubi/],
    ["topázio", /topazio/],
    ["pérola", /perola/]
  ];
  const formats = [
    ["Gota", /gota/], ["Navete", /navete/], ["Redonda", /redond|\bred\b/],
    ["Oval", /oval/], ["Coração", /coracao/], ["Quadrada", /quadrad/], ["Baguete", /baguete/]
  ];
  const material = materials.find(([, regex]) => regex.test(normalized));
  if (!material) return stones;
  const format = formats.find(([, regex]) => regex.test(normalized));
  const sizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?/i) || text.match(/(\d+(?:[.,]\d+)?)\s*mm/i);
  const qtyMatch = text.match(/(?:^|\s)(\d+)\s*(?:x|un|und|pedras?|zirc)/i);
  stones.push({
    itemId: "",
    nomeDetectado: [material[0], format?.[0], sizeMatch?.[0]].filter(Boolean).join(" "),
    material: material[0],
    formato: format?.[0] || "",
    tamanho: sizeMatch?.[0]?.replace(/\s+/g, " ") || "",
    quantidade: qtyMatch ? Number(qtyMatch[1]) : 1,
    confianca: sizeMatch ? "media" : "baixa"
  });
  return stones;
}

function parseLine(line, page) {
  const clean = line.replace(/\s+/g, " ").trim();
  if (clean.length < 4) return null;
  const codeMatch = clean.match(/\b[A-Z0-9][A-Z0-9._/-]{2,}\b/i);
  const weightMatch = clean.match(/(?:peso\s*)?(\d+(?:[.,]\d+)?)\s*g\b/i);
  const measureMatch = clean.match(/(?:aro|medida|tam(?:anho)?)\s*[:.-]?\s*(\d{1,3})/i);
  const materialMatch = clean.match(/\b(prata\s*(?:925|950)?|bronze|lat[aã]o|ouro\s*(?:10k|18k|750)?)\b/i);
  const stones = detectStones(clean);
  if (!codeMatch && !weightMatch && stones.length === 0) return null;
  return {
    id: uid("linha"),
    pagina: page,
    linhaOriginal: clean,
    codigo: codeMatch?.[0]?.toUpperCase() || "",
    descricao: clean,
    medida: measureMatch?.[1] || "",
    material: materialMatch?.[0] || "",
    pesoGramas: weightMatch ? toNumber(weightMatch[1]) : 0,
    pedras: stones,
    confianca: codeMatch && weightMatch ? "alta" : codeMatch ? "media" : "baixa",
    selecionado: Boolean(codeMatch)
  };
}

export async function extractPdf(file, onProgress = () => {}) {
  if (!window.pdfjsLib) throw new Error("Biblioteca PDF.js não foi carregada.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
  const pages = [];
  const items = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress(pageNumber, pdf.numPages);
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map();
    content.items.forEach((item) => {
      const y = Math.round(item.transform?.[5] || 0);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform?.[4] || 0, text: item.str || "" });
    });
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map((x) => x.text).join(" ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    pages.push({ pageNumber, lines });
    lines.forEach((line) => {
      const parsed = parseLine(line, pageNumber);
      if (parsed) items.push(parsed);
    });
  }
  return {
    nomeArquivo: file.name,
    tamanho: file.size,
    paginas: pdf.numPages,
    extraidoEm: new Date().toISOString(),
    itens: deduplicate(items),
    textoPaginas: pages
  };
}

function deduplicate(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.pagina}|${item.codigo}|${item.descricao}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function matchProduct(item, products = {}) {
  const code = normalizeText(item.codigo);
  const measure = normalizeText(item.medida);
  const material = normalizeText(item.material);
  const entries = Object.entries(products);
  const exact = entries.find(([, p]) => normalizeText(p.codigo || p.codigoOriginal) === code && (!measure || normalizeText(p.medida) === measure) && (!material || normalizeText(p.material).includes(material)));
  if (exact) return { produtoId: exact[0], produto: exact[1], confianca: "alta" };
  const byCode = entries.filter(([, p]) => normalizeText(p.codigo || p.codigoOriginal) === code);
  if (byCode.length === 1) return { produtoId: byCode[0][0], produto: byCode[0][1], confianca: "media" };
  return { produtoId: "", produto: null, confianca: "baixa" };
}
