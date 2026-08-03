import { APP_CONFIG } from "./config.js";
import { Firebase } from "./firebase.js";
import { Repository } from "./repository.js";
import { state } from "./state.js";
import { calculatePricing } from "./calculator.js";
import { extractPdf, matchProduct } from "./pdf-importer.js";
import {
  escapeHtml, objectEntries, money, numberBr, dateBr, toNumber, getFormObject,
  showToast, confirmAction, downloadText, csvCell, normalizeText, uid, deepClone
} from "./utils.js";

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const pageContent = document.getElementById("pageContent");
const pageTitle = document.getElementById("pageTitle");
const pageEyebrow = document.getElementById("pageEyebrow");
const mainNav = document.getElementById("mainNav");
const modalHost = document.getElementById("modalHost");

const NAV = [
  ["dashboard", "Visão geral", "⌂"],
  ["products", "Produtos existentes", "◇"],
  ["sheets", "Fichas técnicas", "▤"],
  ["calculator", "Calcular custos", "∑"],
  ["catalogs", "Materiais e componentes", "◫"],
  ["operations", "Custos operacionais", "⚙"],
  ["pricing", "Precificações", "R$"],
  ["approvals", "Aprovações", "✓"],
  ["imports", "Importar PDF", "⇧"],
  ["reports", "Relatórios", "▥"],
  ["access", "Acessos", "♙"],
  ["backup", "Backup do módulo", "⤓"]
];

const ROUTE_TITLES = Object.fromEntries(NAV.map(([id, label]) => [id, label]));

function can(name) {
  return Repository.permission(state.profile, state.gestor, name);
}

function currentUserName() {
  return state.profile?.nome || state.user?.email || "Usuário";
}

function catalogs() {
  return {
    materiais: state.data.materiais || {}, pedras: state.data.pedras || {}, insumos: state.data.insumos || {},
    processos: state.data.processos || {}, acabamentos: state.data.acabamentos || {}, embalagens: state.data.embalagens || {}
  };
}

function settingsMerged() {
  return {
    moeda: "BRL",
    metodoRateio: "capacidade_global",
    custoOperacionalMensal: 0,
    capacidadeGlobalMensal: 1,
    unidadesEquivalentesMensais: 1,
    minutosProdutivosMensais: 1,
    ...state.data.settings
  };
}

function commercialDefaults() {
  const s = settingsMerged();
  return {
    moeda: s.moeda || "BRL",
    metodoPreco: "multiplicador",
    multiplicador: s.multiplicador ?? APP_CONFIG.defaults.multiplicador,
    margemDesejadaPercentual: s.margemDesejadaPercentual ?? APP_CONFIG.defaults.margemDesejadaPercentual,
    impostoPercentual: s.impostoPercentual ?? APP_CONFIG.defaults.impostoPercentual,
    comissaoPercentual: s.comissaoPercentual ?? APP_CONFIG.defaults.comissaoPercentual,
    cartaoPercentual: s.cartaoPercentual ?? APP_CONFIG.defaults.cartaoPercentual,
    utilizacaoCapacidadePercentual: s.utilizacaoCapacidadePercentual ?? APP_CONFIG.defaults.utilizacaoCapacidadePercentual,
    conversaoVendaPercentual: s.conversaoVendaPercentual ?? APP_CONFIG.defaults.conversaoVendaPercentual
  };
}

function statusBadge(status = "rascunho") {
  const labels = {
    rascunho: "Rascunho", em_conferencia: "Em conferência", aguardando_aprovacao: "Aguardando aprovação",
    aprovado: "Aprovado", publicado: "Publicado", substituido: "Substituído", arquivado: "Arquivado"
  };
  return `<span class="badge badge-${status}">${labels[status] || escapeHtml(status)}</span>`;
}

function emptyState(title, text, action = "") {
  return `<div class="empty-state"><div class="empty-icon">◇</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;
}

function showLoading(text = "Carregando dados do Firebase...") {
  pageContent.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${escapeHtml(text)}</p></div>`;
}

function setRoute(route) {
  const valid = NAV.some(([id]) => id === route) ? route : "dashboard";
  state.route = valid;
  location.hash = `#/${valid}`;
  renderNav();
  renderRoute();
  document.getElementById("sidebar")?.classList.remove("open");
}

function renderNav() {
  mainNav.innerHTML = NAV.filter(([id]) => {
    if (id === "access") return can("administrar");
    if (id === "approvals") return can("aprovar") || can("publicar");
    if (id === "calculator") return can("calcular");
    if (id === "imports") return can("importar") || can("editarFicha");
    if (id === "pricing" || id === "reports") return can("visualizarMargem") || can("calcular") || can("aprovar") || can("publicar");
    if (id === "backup") return can("administrar") || can("exportar");
    return true;
  }).map(([id, label, icon]) => `<button class="nav-item ${state.route === id ? "active" : ""}" data-route="${id}"><span>${icon}</span>${label}</button>`).join("");
  mainNav.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => setRoute(button.dataset.route)));
}

async function loadData({ initialize = false } = {}) {
  showLoading();
  const data = await Repository.loadBootstrap(state.user);
  state.profile = data.profile || {};
  state.gestor = data.gestor;
  if (!Repository.canAccess(state.profile, state.gestor)) {
    loginView.hidden = false;
    appView.hidden = true;
    document.getElementById("loginError").hidden = false;
    document.getElementById("loginError").textContent = "Sua conta existe, mas não possui acesso ao módulo de precificação.";
    await Firebase.signOut();
    return;
  }
  state.data = {
    produtos: data.produtos || {}, usuarios: data.usuarios || {}, settings: data.settings || {},
    materiais: data.materiais || {}, pedras: data.pedras || {}, insumos: data.insumos || {}, processos: data.processos || {},
    acabamentos: data.acabamentos || {}, embalagens: data.embalagens || {}, custosOperacionais: data.custosOperacionais || {},
    fichas: data.fichas || {}, precificacoes: data.precificacoes || {}, publicados: data.publicados || {}
  };
  if (initialize || !Object.keys(state.data.settings).length) {
    if (can("administrar")) {
      await Repository.initializeDefaults(state.profile, state.user);
      const refreshed = await Repository.loadBootstrap(state.user);
      Object.assign(state.data, {
        settings: refreshed.settings || {}, materiais: refreshed.materiais || {}, pedras: refreshed.pedras || {},
        insumos: refreshed.insumos || {}, processos: refreshed.processos || {}, acabamentos: refreshed.acabamentos || {}, embalagens: refreshed.embalagens || {}
      });
    }
  }
  state.loaded = true;
  renderUser();
  renderNav();
  renderRoute();
}

function renderUser() {
  document.getElementById("userMini").innerHTML = `<strong>${escapeHtml(currentUserName())}</strong><span>${escapeHtml(state.profile?.papel || "gestor")}</span>`;
}

function metricCard(label, value, detail, tone = "") {
  return `<article class="metric-card ${tone}"><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(detail)}</small></article>`;
}

function renderDashboard() {
  const products = objectEntries(state.data.produtos);
  const sheets = objectEntries(state.data.fichas);
  const pricing = objectEntries(state.data.precificacoes);
  const published = objectEntries(state.data.publicados);
  const awaiting = pricing.filter((x) => x.status === "aguardando_aprovacao");
  const incomplete = sheets.filter((x) => !x.materialId || !toNumber(x.capacidadeMensal));
  const avgMargin = published.length ? published.reduce((s, x) => s + toNumber(x.margemLiquidaPercentual), 0) / published.length : 0;
  const latest = pricing.sort((a, b) => String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || ""))).slice(0, 6);

  pageContent.innerHTML = `
    <section class="hero-card">
      <div><p class="eyebrow">AMBIENTE ISOLADO</p><h3>Engenharia de custos sem movimentar o estoque atual</h3><p>Este repositório lê o catálogo existente e grava somente em <code>empresas/empresa-principal/precificacao</code>.</p></div>
      <button class="btn btn-primary" data-action="new-sheet">Nova ficha técnica</button>
    </section>
    <section class="metrics-grid">
      ${metricCard("Produtos disponíveis", products.length, "Lidos do cadastro operacional")}
      ${metricCard("Fichas técnicas", sheets.length, `${incomplete.length} com pendências`, incomplete.length ? "warning" : "")}
      ${metricCard("Aguardando aprovação", awaiting.length, "Nenhum preço publica sozinho", awaiting.length ? "warning" : "")}
      ${metricCard("Preços publicados", published.length, `Margem média ${numberBr(avgMargin, 2)}%`, "success")}
    </section>
    <section class="two-column">
      <article class="panel"><div class="panel-head"><div><p class="eyebrow">FLUXO</p><h3>Etapas profissionais</h3></div></div>
        <div class="flow-list">
          ${[["1", "Cadastro existente", "Produto é lido do sistema atual."], ["2", "Ficha técnica", "Metal, pedras, insumos, processos e capacidade."], ["3", "Cálculo", "Custo unitário, preço, despesas e margem."], ["4", "Aprovação", "Revisão humana obrigatória."], ["5", "Publicação isolada", "Resultado permanece dentro do novo módulo."]].map(([n,t,d]) => `<div><b>${n}</b><span><strong>${t}</strong><small>${d}</small></span></div>`).join("")}
        </div>
      </article>
      <article class="panel"><div class="panel-head"><div><p class="eyebrow">ATIVIDADE</p><h3>Precificações recentes</h3></div><button class="btn btn-link" data-route="pricing">Ver todas</button></div>
        ${latest.length ? `<div class="compact-list">${latest.map((p) => `<button data-pricing="${p.id}"><span><strong>${escapeHtml(p.produtoSnapshot?.codigo || p.produtoId)}</strong><small>${dateBr(p.atualizadoEm)}</small></span>${statusBadge(p.status)}</button>`).join("")}</div>` : emptyState("Nenhum cálculo", "Crie uma ficha técnica e execute a primeira precificação.")}
      </article>
    </section>`;
  bindCommonActions();
}

function productSearchRows(query = "") {
  const q = normalizeText(query);
  return objectEntries(state.data.produtos).filter((p) => !q || normalizeText(`${p.codigo} ${p.descricao} ${p.material} ${p.medida}`).includes(q));
}

function renderProducts() {
  pageContent.innerHTML = `
    <section class="panel">
      <div class="panel-head wrap"><div><p class="eyebrow">SOMENTE LEITURA</p><h3>Cadastro operacional existente</h3><p class="muted">Nenhum botão desta tela altera produtos, estoque ou peso.</p></div><div class="search-box"><input id="productSearch" placeholder="Buscar código, descrição, material ou medida" /></div></div>
      <div id="productsTable"></div>
    </section>`;
  const draw = () => {
    const rows = productSearchRows(document.getElementById("productSearch").value).slice(0, 500);
    document.getElementById("productsTable").innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Material</th><th>Medida</th><th>Peso médio</th><th>Ficha</th><th></th></tr></thead><tbody>${rows.map((p) => {
      const sheet = Object.values(state.data.fichas).find((f) => f.produtoId === p.id);
      return `<tr><td><div class="product-cell">${p.fotoUrl ? `<img src="${escapeHtml(p.fotoUrl)}" alt="" loading="lazy" />` : `<span class="thumb-placeholder">◇</span>`}<span><strong>${escapeHtml(p.codigo || p.id)}</strong><small>${escapeHtml(p.descricao || "Sem descrição")}</small></span></div></td><td>${escapeHtml(p.material || "—")}</td><td>${escapeHtml(p.medida || "—")}</td><td>${numberBr(p.pesoMedio || 0, 4)} g</td><td>${sheet ? statusBadge(sheet.status) : '<span class="muted">Não criada</span>'}</td><td><button class="btn btn-small ${sheet ? "btn-secondary" : "btn-primary"}" data-sheet-product="${p.id}">${sheet ? "Abrir ficha" : "Criar ficha"}</button></td></tr>`;
    }).join("")}</tbody></table></div><p class="table-note">Exibindo ${rows.length} de ${Object.keys(state.data.produtos).length} produtos.</p>` : emptyState("Nenhum produto encontrado", "Ajuste o termo da busca.");
    document.querySelectorAll("[data-sheet-product]").forEach((button) => button.addEventListener("click", () => openSheetForProduct(button.dataset.sheetProduct)));
  };
  document.getElementById("productSearch").addEventListener("input", draw);
  draw();
}

function renderSheets() {
  const sheets = objectEntries(state.data.fichas).sort((a, b) => String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || "")));
  pageContent.innerHTML = `
    <section class="panel"><div class="panel-head wrap"><div><p class="eyebrow">COMPOSIÇÃO TÉCNICA</p><h3>Fichas técnicas versionadas</h3></div><button class="btn btn-primary" data-action="new-sheet">Nova ficha</button></div>
    ${sheets.length ? `<div class="cards-grid">${sheets.map((f) => {
      const p = state.data.produtos[f.produtoId] || f.produtoSnapshot || {};
      const components = ["pedras", "insumos", "processos", "acabamentos", "embalagens"].reduce((s, k) => s + (f[k]?.length || 0), 0);
      return `<article class="item-card"><div class="item-card-head"><span class="tag">v${f.versao || 1}</span>${statusBadge(f.status)}</div><h4>${escapeHtml(p.codigo || f.produtoId)}</h4><p>${escapeHtml(p.descricao || "Sem descrição")}</p><dl><div><dt>Material</dt><dd>${escapeHtml(state.data.materiais[f.materialId]?.nome || f.materialSnapshot?.nome || "Não definido")}</dd></div><div><dt>Peso</dt><dd>${numberBr(f.pesoMetalGramas || 0, 4)} g</dd></div><div><dt>Capacidade</dt><dd>${numberBr(f.capacidadeMensal || 0, 0)}/mês</dd></div><div><dt>Componentes</dt><dd>${components}</dd></div></dl><div class="card-actions"><button class="btn btn-secondary" data-sheet="${f.id}">Editar</button><button class="btn btn-primary" data-calc-sheet="${f.id}">Calcular</button></div></article>`;
    }).join("")}</div>` : emptyState("Nenhuma ficha técnica", "Crie a primeira ficha a partir de um produto cadastrado.", '<button class="btn btn-primary" data-action="new-sheet">Criar ficha</button>')}</section>`;
  bindCommonActions();
  document.querySelectorAll("[data-sheet]").forEach((button) => button.addEventListener("click", () => openSheetEditor(button.dataset.sheet)));
  document.querySelectorAll("[data-calc-sheet]").forEach((button) => button.addEventListener("click", () => { state.editor.sheetId = button.dataset.calcSheet; setRoute("calculator"); }));
}

function componentRows(group, selected = []) {
  const source = state.data[group] || {};
  const options = objectEntries(source).filter((x) => x.ativo !== false).map((x) => `<option value="${x.id}">${escapeHtml(x.nome || x.descricao || x.id)}</option>`).join("");
  const rows = selected.length ? selected : [];
  return `<div class="component-editor" data-component-group="${group}"><div class="component-list">${rows.map((item) => componentRowHtml(group, item, options)).join("")}</div><button type="button" class="btn btn-small btn-secondary add-component" data-group="${group}">＋ Adicionar</button></div>`;
}

function componentRowHtml(group, item = {}, optionsHtml = "") {
  const source = state.data[group] || {};
  const options = optionsHtml || objectEntries(source).filter((x) => x.ativo !== false).map((x) => `<option value="${x.id}">${escapeHtml(x.nome || x.descricao || x.id)}</option>`).join("");
  return `<div class="component-row"><select data-field="itemId"><option value="">Selecione...</option>${options}</select><input data-field="quantidade" type="number" min="0" step="0.0001" value="${escapeHtml(item.quantidade ?? 1)}" title="Quantidade" /><input data-field="precoUnitario" type="number" min="0" step="0.0001" value="${escapeHtml(item.precoUnitario ?? "")}" placeholder="Preço opcional" title="Sobrescrever preço" /><button type="button" class="icon-btn remove-component" title="Remover">×</button><script type="application/json" class="row-data">${JSON.stringify({ selected: item.itemId || "" })}</script></div>`;
}

function openSheetForProduct(productId) {
  const existing = objectEntries(state.data.fichas).find((f) => f.produtoId === productId);
  openSheetEditor(existing?.id || null, productId);
}

function openSheetEditor(sheetId = null, productId = null) {
  if (!can("editarFicha")) return showToast("Sua conta não pode editar fichas técnicas.", "error");
  const existing = sheetId ? state.data.fichas[sheetId] : null;
  const selectedProductId = productId || existing?.produtoId || "";
  const product = state.data.produtos[selectedProductId] || existing?.produtoSnapshot || {};
  const materialOptions = objectEntries(state.data.materiais).filter((x) => x.ativo !== false).map((x) => `<option value="${x.id}" ${existing?.materialId === x.id ? "selected" : ""}>${escapeHtml(x.nome)}</option>`).join("");
  const productOptions = objectEntries(state.data.produtos).sort((a,b) => String(a.codigo).localeCompare(String(b.codigo))).map((p) => `<option value="${p.id}" ${selectedProductId === p.id ? "selected" : ""}>${escapeHtml(`${p.codigo || p.id} · ${p.medida || "s/medida"} · ${p.material || ""}`)}</option>`).join("");

  openModal(existing ? "Editar ficha técnica" : "Nova ficha técnica", `
    <form id="sheetForm" class="modal-form wide-form">
      <input type="hidden" name="id" value="${escapeHtml(existing?.id || "")}" />
      <div class="form-grid three"><label>Produto existente<select name="produtoId" required><option value="">Selecione...</option>${productOptions}</select></label><label>Material principal<select name="materialId" required><option value="">Selecione...</option>${materialOptions}</select></label><label>Status<select name="status"><option value="rascunho">Rascunho</option><option value="em_conferencia">Em conferência</option></select></label></div>
      <div class="read-only-summary" id="sheetProductSummary"><strong>${escapeHtml(product.codigo || "Produto não selecionado")}</strong><span>${escapeHtml(product.descricao || "")}</span></div>
      <div class="form-grid four"><label>Peso metálico unitário (g)<input name="pesoMetalGramas" type="number" min="0" step="0.0001" value="${escapeHtml(existing?.pesoMetalGramas ?? product.pesoMedio ?? "")}" required /></label><label>Perda do metal (%)<input name="perdaMetalPercentual" type="number" min="0" step="0.01" value="${escapeHtml(existing?.perdaMetalPercentual ?? "")}" /></label><label>Recuperação de aparas (%)<input name="recuperacaoAparasPercentual" type="number" min="0" max="100" step="0.01" value="${escapeHtml(existing?.recuperacaoAparasPercentual ?? "")}" /></label><label>Capacidade mensal<input name="capacidadeMensal" type="number" min="0" step="1" value="${escapeHtml(existing?.capacidadeMensal ?? "")}" required /></label></div>
      <div class="form-grid four"><label>Fator de complexidade<input name="fatorComplexidade" type="number" min="0.01" step="0.01" value="${escapeHtml(existing?.fatorComplexidade ?? 1)}" /></label><label>Tempo produtivo (min)<input name="tempoProdutivoMinutos" type="number" min="0" step="0.01" value="${escapeHtml(existing?.tempoProdutivoMinutos ?? "")}" /></label><label>Mão de obra direta (R$)<input name="maoDeObraDireta" type="number" min="0" step="0.01" value="${escapeHtml(existing?.maoDeObraDireta ?? "")}" /></label><label>Terceirizações (R$)<input name="terceirizacoes" type="number" min="0" step="0.01" value="${escapeHtml(existing?.terceirizacoes ?? "")}" /></label></div>
      <div class="form-grid three"><label>Preparação total do lote (R$)<input name="preparacaoLoteTotal" type="number" min="0" step="0.01" value="${escapeHtml(existing?.preparacaoLoteTotal ?? "")}" /></label><label>Lote econômico (un.)<input name="loteEconomico" type="number" min="1" step="1" value="${escapeHtml(existing?.loteEconomico ?? 1)}" /></label><label>Outros custos unitários (R$)<input name="outrosCustos" type="number" min="0" step="0.01" value="${escapeHtml(existing?.outrosCustos ?? "")}" /></label></div>
      <div class="accordion-grid">
        <details open><summary>Pedras <span>${existing?.pedras?.length || 0}</span></summary>${componentRows("pedras", existing?.pedras || [])}</details>
        <details><summary>Insumos <span>${existing?.insumos?.length || 0}</span></summary>${componentRows("insumos", existing?.insumos || [])}</details>
        <details><summary>Processos <span>${existing?.processos?.length || 0}</span></summary>${componentRows("processos", existing?.processos || [])}</details>
        <details><summary>Acabamentos <span>${existing?.acabamentos?.length || 0}</span></summary>${componentRows("acabamentos", existing?.acabamentos || [])}</details>
        <details><summary>Embalagens <span>${existing?.embalagens?.length || 0}</span></summary>${componentRows("embalagens", existing?.embalagens || [])}</details>
      </div>
      <label>Observações técnicas<textarea name="observacoes" rows="4">${escapeHtml(existing?.observacoes || "")}</textarea></label>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button><button class="btn btn-primary" type="submit">Salvar ficha versionada</button></div>
    </form>`, "modal-xl");

  document.querySelector('[name="status"]').value = existing?.status === "em_conferencia" ? "em_conferencia" : "rascunho";
  document.querySelectorAll(".component-row").forEach((row) => {
    const selected = JSON.parse(row.querySelector(".row-data").textContent).selected;
    row.querySelector('[data-field="itemId"]').value = selected;
  });
  document.querySelectorAll(".add-component").forEach((button) => button.addEventListener("click", () => {
    const group = button.dataset.group;
    const list = button.closest(".component-editor").querySelector(".component-list");
    list.insertAdjacentHTML("beforeend", componentRowHtml(group));
    bindComponentRemove(list.lastElementChild);
  }));
  document.querySelectorAll(".component-row").forEach(bindComponentRemove);
  document.querySelector('[name="produtoId"]').addEventListener("change", (event) => {
    const p = state.data.produtos[event.target.value] || {};
    document.getElementById("sheetProductSummary").innerHTML = `<strong>${escapeHtml(p.codigo || "")}</strong><span>${escapeHtml(p.descricao || "")}</span>`;
    const weight = document.querySelector('[name="pesoMetalGramas"]');
    if (!weight.value && p.pesoMedio) weight.value = p.pesoMedio;
  });
  document.getElementById("sheetForm").addEventListener("submit", saveSheetForm);
}

function bindComponentRemove(row) {
  row.querySelector(".remove-component")?.addEventListener("click", () => row.remove());
}

function collectComponents(group) {
  return [...document.querySelectorAll(`[data-component-group="${group}"] .component-row`)].map((row) => {
    const itemId = row.querySelector('[data-field="itemId"]').value;
    if (!itemId) return null;
    const item = state.data[group]?.[itemId] || {};
    return { itemId, quantidade: toNumber(row.querySelector('[data-field="quantidade"]').value, 1), precoUnitario: row.querySelector('[data-field="precoUnitario"]').value === "" ? null : toNumber(row.querySelector('[data-field="precoUnitario"]').value), itemSnapshot: { nome: item.nome || item.descricao || itemId, precoUnitario: item.precoUnitario || item.custoUnitario || 0, versao: item.versao || 1 } };
  }).filter(Boolean);
}

async function saveSheetForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const raw = getFormObject(form);
  const product = state.data.produtos[raw.produtoId];
  if (!product) return showToast("Selecione um produto existente.", "error");
  const data = {
    produtoId: raw.produtoId,
    produtoSnapshot: { codigo: product.codigo || product.codigoOriginal || raw.produtoId, descricao: product.descricao || "", material: product.material || "", medida: product.medida || "", pesoMedio: product.pesoMedio || 0, fotoUrl: product.fotoUrl || "" },
    materialId: raw.materialId, materialSnapshot: deepClone(state.data.materiais[raw.materialId] || {}), status: raw.status,
    pesoMetalGramas: toNumber(raw.pesoMetalGramas), perdaMetalPercentual: toNumber(raw.perdaMetalPercentual), recuperacaoAparasPercentual: toNumber(raw.recuperacaoAparasPercentual),
    capacidadeMensal: toNumber(raw.capacidadeMensal), fatorComplexidade: toNumber(raw.fatorComplexidade, 1), tempoProdutivoMinutos: toNumber(raw.tempoProdutivoMinutos),
    maoDeObraDireta: toNumber(raw.maoDeObraDireta), terceirizacoes: toNumber(raw.terceirizacoes), preparacaoLoteTotal: toNumber(raw.preparacaoLoteTotal), loteEconomico: Math.max(1, toNumber(raw.loteEconomico, 1)), outrosCustos: toNumber(raw.outrosCustos),
    pedras: collectComponents("pedras"), insumos: collectComponents("insumos"), processos: collectComponents("processos"), acabamentos: collectComponents("acabamentos"), embalagens: collectComponents("embalagens"), observacoes: raw.observacoes || ""
  };
  try {
    const saved = await Repository.saveSheet(raw.id || null, data, state.profile, state.user);
    state.data.fichas[saved.id] = saved;
    closeModal(); showToast("Ficha técnica salva com nova versão.", "success"); renderRoute();
  } catch (error) { showToast(error.message || "Não foi possível salvar.", "error"); }
}

function renderCalculator() {
  const sheets = objectEntries(state.data.fichas).filter((f) => f.status !== "arquivado");
  const selected = state.editor.sheetId && state.data.fichas[state.editor.sheetId] ? state.editor.sheetId : sheets[0]?.id || "";
  state.editor.sheetId = selected;
  const defaults = commercialDefaults();
  pageContent.innerHTML = `
    <section class="panel"><div class="panel-head"><div><p class="eyebrow">MOTOR 1.0.0</p><h3>Cálculo auditável</h3><p class="muted">O resultado é uma simulação até ser salvo, revisado e aprovado.</p></div></div>
    ${sheets.length ? `<form id="calculatorForm" class="stack-lg">
      <div class="form-grid three"><label>Ficha técnica<select name="sheetId">${sheets.map((f) => `<option value="${f.id}" ${selected === f.id ? "selected" : ""}>${escapeHtml(`${f.produtoSnapshot?.codigo || f.produtoId} · v${f.versao}`)}</option>`).join("")}</select></label><label>Método de preço<select name="metodoPreco"><option value="multiplicador">Custo × multiplicador</option><option value="margem_desejada">Margem líquida desejada</option></select></label><label>Moeda<select name="moeda"><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></label></div>
      <div class="form-grid four"><label>Multiplicador<input name="multiplicador" type="number" min="0" step="0.01" value="${defaults.multiplicador}" /></label><label>Margem desejada (%)<input name="margemDesejadaPercentual" type="number" min="0" max="99" step="0.01" value="${defaults.margemDesejadaPercentual}" /></label><label>Impostos (%)<input name="impostoPercentual" type="number" min="0" max="100" step="0.01" value="${defaults.impostoPercentual}" /></label><label>Comissão (%)<input name="comissaoPercentual" type="number" min="0" max="100" step="0.01" value="${defaults.comissaoPercentual}" /></label></div>
      <div class="form-grid three"><label>Taxa de cartão (%)<input name="cartaoPercentual" type="number" min="0" max="100" step="0.01" value="${defaults.cartaoPercentual}" /></label><label>Utilização da capacidade (%)<input name="utilizacaoCapacidadePercentual" type="number" min="0" max="100" step="0.01" value="${defaults.utilizacaoCapacidadePercentual}" /></label><label>Conversão em vendas (%)<input name="conversaoVendaPercentual" type="number" min="0" max="100" step="0.01" value="${defaults.conversaoVendaPercentual}" /></label></div>
      <div class="actions-row"><button class="btn btn-secondary" type="button" data-action="edit-selected-sheet">Revisar ficha</button><button class="btn btn-primary" type="submit">Calcular agora</button></div>
    </form><div id="calculationResult"></div>` : emptyState("Nenhuma ficha disponível", "Crie uma ficha técnica antes de calcular.", '<button class="btn btn-primary" data-action="new-sheet">Criar ficha</button>')}</section>`;
  bindCommonActions();
  document.querySelector('[data-action="edit-selected-sheet"]')?.addEventListener("click", () => openSheetEditor(document.querySelector('[name="sheetId"]').value));
  document.getElementById("calculatorForm")?.addEventListener("submit", (event) => { event.preventDefault(); runCalculation(event.currentTarget); });
}

function runCalculation(form) {
  const raw = getFormObject(form);
  const sheet = state.data.fichas[raw.sheetId];
  if (!sheet) return showToast("Ficha não encontrada.", "error");
  const commercial = {
    metodoPreco: raw.metodoPreco, moeda: raw.moeda, multiplicador: toNumber(raw.multiplicador), margemDesejadaPercentual: toNumber(raw.margemDesejadaPercentual),
    impostoPercentual: toNumber(raw.impostoPercentual), comissaoPercentual: toNumber(raw.comissaoPercentual), cartaoPercentual: toNumber(raw.cartaoPercentual),
    utilizacaoCapacidadePercentual: toNumber(raw.utilizacaoCapacidadePercentual), conversaoVendaPercentual: toNumber(raw.conversaoVendaPercentual)
  };
  const result = calculatePricing({ sheet, catalogs: catalogs(), settings: settingsMerged(), commercial });
  state.editor.calculation = { sheet, commercial, result };
  renderCalculationResult(result, commercial.moeda);
}

function renderCalculationResult(result, currency = "BRL") {
  const r = result;
  const el = document.getElementById("calculationResult");
  if (!el) return;
  el.innerHTML = `<div class="result-block">
    ${r.comercial.pricingError ? `<div class="alert alert-error">${escapeHtml(r.comercial.pricingError)}</div>` : ""}
    <div class="metrics-grid result-metrics">${metricCard("Custo unitário", money(r.custos.totalUnitario, currency), "Todos os componentes")}${metricCard("Preço sugerido", money(r.comercial.precoVenda, currency), `Método: ${r.comercial.metodo}`, "success")}${metricCard("Lucro líquido unitário", money(r.comercial.lucroLiquidoUnitario, currency), `${numberBr(r.comercial.margemLiquidaPercentual, 2)}% de margem`, r.comercial.lucroLiquidoUnitario >= 0 ? "success" : "danger")}${metricCard("Projeção líquida mensal", money(r.projecao.lucroLiquido, currency), `${numberBr(r.projecao.vendaProjetada, 0)} vendas projetadas`)}</div>
    <div class="two-column"><article class="panel inset"><h4>Composição do custo</h4><div class="cost-lines">${Object.entries(r.custos).filter(([k]) => k !== "totalUnitario").map(([k,v]) => `<div><span>${escapeHtml({metal:"Metal",pedras:"Pedras",insumos:"Insumos",processos:"Processos",acabamentos:"Acabamentos",embalagens:"Embalagens",maoDeObraDireta:"Mão de obra direta",terceirizacoes:"Terceirizações",preparacaoLoteUnitario:"Preparação do lote",outrosCustos:"Outros custos",operacional:"Custo operacional"}[k] || k)}</span><strong>${money(v, currency)}</strong></div>`).join("")}<div class="total"><span>Total</span><strong>${money(r.custos.totalUnitario, currency)}</strong></div></div></article>
    <article class="panel inset"><h4>Resultado comercial</h4><div class="cost-lines"><div><span>Preço de venda</span><strong>${money(r.comercial.precoVenda, currency)}</strong></div><div><span>Impostos</span><strong>− ${money(r.comercial.imposto, currency)}</strong></div><div><span>Comissão</span><strong>− ${money(r.comercial.comissao, currency)}</strong></div><div><span>Cartão</span><strong>− ${money(r.comercial.cartao, currency)}</strong></div><div><span>Custo unitário</span><strong>− ${money(r.custos.totalUnitario, currency)}</strong></div><div class="total"><span>Lucro líquido</span><strong>${money(r.comercial.lucroLiquidoUnitario, currency)}</strong></div></div></article></div>
    <article class="panel inset"><h4>Projeção mensal</h4><div class="projection-grid"><div><span>Capacidade máxima</span><strong>${numberBr(r.projecao.capacidadeMaxima,0)}</strong></div><div><span>Produção projetada</span><strong>${numberBr(r.projecao.producaoProjetada,0)}</strong></div><div><span>Venda projetada</span><strong>${numberBr(r.projecao.vendaProjetada,0)}</strong></div><div><span>Receita bruta</span><strong>${money(r.projecao.receitaBruta,currency)}</strong></div><div><span>Ponto de equilíbrio</span><strong>${numberBr(r.projecao.pontoEquilibrioUnidades,0)} un.</strong></div><div><span>Capacidade ociosa</span><strong>${numberBr(r.projecao.capacidadeOciosa,0)}</strong></div></div></article>
    <div class="actions-row"><button class="btn btn-primary" id="savePricingBtn">Salvar como precificação</button></div></div>`;
  document.getElementById("savePricingBtn").addEventListener("click", saveCurrentPricing);
}

async function saveCurrentPricing() {
  if (!can("calcular")) return showToast("Sua conta não pode salvar precificações.", "error");
  const current = state.editor.calculation;
  if (!current) return;
  const payload = {
    produtoId: current.sheet.produtoId, fichaId: current.sheet.id, fichaVersao: current.sheet.versao,
    produtoSnapshot: deepClone(current.sheet.produtoSnapshot), fichaSnapshot: deepClone(current.sheet),
    catalogosSnapshot: deepClone(catalogs()), configuracoesSnapshot: deepClone(settingsMerged()), comercial: deepClone(current.commercial), resultado: deepClone(current.result), status: "rascunho"
  };
  try {
    const saved = await Repository.savePricing(payload, state.profile, state.user);
    state.data.precificacoes[saved.id] = saved;
    showToast("Precificação salva como rascunho.", "success"); setRoute("pricing");
  } catch (error) { showToast(error.message, "error"); }
}

const CATALOG_META = {
  materiais: { title: "Metais e materiais", fields: [["nome","Nome","text"],["custoPorGrama","Custo por grama","number"],["perdaPercentual","Perda padrão (%)","number"],["recuperacaoPercentual","Recuperação (%)","number"],["valorRecuperavelPorGrama","Valor recuperável/g","number"],["fornecedor","Fornecedor","text"]], price: "custoPorGrama" },
  pedras: { title: "Pedras", fields: [["nome","Nome completo","text"],["material","Material","text"],["formato","Formato","text"],["tamanho","Tamanho","text"],["cor","Cor/variedade","text"],["unidade","Unidade de compra","text"],["precoUnitario","Preço unitário convertido","number"],["moedaOrigem","Moeda de origem","text"],["precoOrigem","Preço de origem","number"],["cotacao","Cotação utilizada","number"],["fornecedor","Fornecedor","text"]], price: "precoUnitario" },
  insumos: { title: "Insumos", fields: [["nome","Nome","text"],["unidade","Unidade","text"],["precoUnitario","Preço unitário","number"],["perdaPercentual","Perda (%)","number"],["fornecedor","Fornecedor","text"]], price: "precoUnitario" },
  processos: { title: "Processos", fields: [["nome","Nome","text"],["unidade","Unidade (min/un)","text"],["precoUnitario","Custo unitário","number"],["centroCusto","Centro de custo","text"]], price: "precoUnitario" },
  acabamentos: { title: "Acabamentos e banhos", fields: [["nome","Nome","text"],["unidade","Unidade","text"],["precoUnitario","Preço unitário","number"],["fornecedor","Fornecedor","text"]], price: "precoUnitario" },
  embalagens: { title: "Embalagens", fields: [["nome","Nome","text"],["unidade","Unidade","text"],["precoUnitario","Preço unitário","number"],["fornecedor","Fornecedor","text"]], price: "precoUnitario" }
};

function renderCatalogs() {
  pageContent.innerHTML = `<section class="panel"><div class="panel-head wrap"><div><p class="eyebrow">BASE CENTRAL</p><h3>Materiais e componentes</h3><p class="muted">Atualizações são versionadas e não alteram precificações históricas já salvas.</p></div></div><div class="tabs" id="catalogTabs">${Object.entries(CATALOG_META).map(([id,m],i) => `<button data-tab="${id}" class="${i===0?"active":""}">${m.title}</button>`).join("")}</div><div id="catalogContent"></div></section>`;
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-tab]").forEach((x) => x.classList.remove("active")); button.classList.add("active"); drawCatalog(button.dataset.tab); }));
  drawCatalog(Object.keys(CATALOG_META)[0]);
}

function drawCatalog(group) {
  const meta = CATALOG_META[group];
  const items = objectEntries(state.data[group]).sort((a,b) => String(a.nome).localeCompare(String(b.nome)));
  document.getElementById("catalogContent").innerHTML = `<div class="panel-head compact"><div><h4>${meta.title}</h4><p>${items.filter(x=>x.ativo!==false).length} ativos</p></div><button class="btn btn-primary" data-new-catalog="${group}">Novo cadastro</button></div>${items.length ? `<div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Valor atual</th><th>Versão</th><th>Status</th><th></th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escapeHtml(item.nome || item.id)}</strong><small class="block-muted">${escapeHtml([item.material,item.formato,item.tamanho,item.fornecedor].filter(Boolean).join(" · "))}</small></td><td>${money(item[meta.price] || 0, item.moeda || "BRL")}</td><td>v${item.versao || 1}</td><td>${item.ativo === false ? '<span class="badge badge-arquivado">Arquivado</span>' : '<span class="badge badge-success">Ativo</span>'}</td><td><button class="btn btn-small btn-secondary" data-edit-catalog="${group}:${item.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>` : emptyState("Nenhum cadastro", `Cadastre o primeiro item de ${meta.title.toLowerCase()}.`)}`;
  document.querySelector(`[data-new-catalog="${group}"]`)?.addEventListener("click", () => openCatalogEditor(group));
  document.querySelectorAll("[data-edit-catalog]").forEach((button) => button.addEventListener("click", () => { const [g,id]=button.dataset.editCatalog.split(":"); openCatalogEditor(g,id); }));
}

function openCatalogEditor(group, id = null) {
  if (!can("editarCatalogos")) return showToast("Sua conta não pode editar catálogos.", "error");
  const meta = CATALOG_META[group]; const item = id ? state.data[group][id] : {};
  openModal(`${id ? "Editar" : "Novo"} · ${meta.title}`, `<form id="catalogForm" class="modal-form"><input type="hidden" name="group" value="${group}"/><input type="hidden" name="id" value="${escapeHtml(id || "")}"/><div class="form-grid two">${meta.fields.map(([name,label,type]) => `<label>${label}<input name="${name}" type="${type}" ${type==="number"?'min="0" step="0.0001"':''} value="${escapeHtml(item?.[name] ?? "")}" ${name==="nome"?"required":""}/></label>`).join("")}</div><label class="checkbox"><input name="ativo" type="checkbox" ${item?.ativo !== false ? "checked" : ""}/> Cadastro ativo</label><div class="modal-actions"><button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>${id && item?.ativo !== false ? '<button type="button" class="btn btn-danger" id="archiveCatalogBtn">Arquivar</button>' : ""}<button class="btn btn-primary" type="submit">Salvar nova versão</button></div></form>`);
  document.getElementById("catalogForm").addEventListener("submit", async (event) => {
    event.preventDefault(); const raw = getFormObject(event.currentTarget); const data = {};
    meta.fields.forEach(([name,,type]) => { data[name] = type === "number" ? toNumber(raw[name]) : raw[name] || ""; }); data.ativo = event.currentTarget.ativo.checked;
    try { const saved = await Repository.saveCatalog(group, id, data, state.profile, state.user); state.data[group][saved.id] = saved; closeModal(); showToast("Cadastro salvo e versionado.", "success"); drawCatalog(group); } catch(error){showToast(error.message,"error");}
  });
  document.getElementById("archiveCatalogBtn")?.addEventListener("click", async () => { if (!confirmAction("Arquivar este cadastro? As precificações históricas continuarão preservadas.")) return; await Repository.archiveCatalog(group,id,state.profile,state.user); state.data[group][id].ativo=false; closeModal(); drawCatalog(group); });
}

function renderOperations() {
  const s = settingsMerged();
  pageContent.innerHTML = `<section class="panel"><div class="panel-head"><div><p class="eyebrow">RATEIO</p><h3>Custos operacionais e capacidade</h3><p class="muted">Configure o método aprovado pela fábrica. O valor não é replicado integralmente em cada código.</p></div></div>
  <form id="operationsForm" class="stack-lg"><div class="form-grid three"><label>Custo operacional mensal (R$)<input name="custoOperacionalMensal" type="number" min="0" step="0.01" value="${s.custoOperacionalMensal}" required/></label><label>Método de rateio<select name="metodoRateio"><option value="capacidade_global">Capacidade global</option><option value="produto_capacidade">Capacidade do produto</option><option value="unidade_equivalente">Unidade equivalente</option><option value="tempo_produtivo">Tempo produtivo</option></select></label><label>Moeda<select name="moeda"><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></label></div>
  <div class="form-grid three"><label>Capacidade global mensal<input name="capacidadeGlobalMensal" type="number" min="1" step="1" value="${s.capacidadeGlobalMensal}"/></label><label>Unidades equivalentes mensais<input name="unidadesEquivalentesMensais" type="number" min="1" step="0.01" value="${s.unidadesEquivalentesMensais}"/></label><label>Minutos produtivos mensais<input name="minutosProdutivosMensais" type="number" min="1" step="1" value="${s.minutosProdutivosMensais}"/></label></div>
  <hr/><h4>Parâmetros comerciais padrão</h4><div class="form-grid four"><label>Impostos (%)<input name="impostoPercentual" type="number" min="0" step="0.01" value="${s.impostoPercentual ?? 8}"/></label><label>Comissão (%)<input name="comissaoPercentual" type="number" min="0" step="0.01" value="${s.comissaoPercentual ?? 5}"/></label><label>Cartão (%)<input name="cartaoPercentual" type="number" min="0" step="0.01" value="${s.cartaoPercentual ?? 4}"/></label><label>Multiplicador<input name="multiplicador" type="number" min="0" step="0.01" value="${s.multiplicador ?? 2}"/></label></div><div class="form-grid three"><label>Margem desejada (%)<input name="margemDesejadaPercentual" type="number" min="0" max="99" step="0.01" value="${s.margemDesejadaPercentual ?? 25}"/></label><label>Utilização da capacidade (%)<input name="utilizacaoCapacidadePercentual" type="number" min="0" max="100" step="0.01" value="${s.utilizacaoCapacidadePercentual ?? 70}"/></label><label>Conversão em vendas (%)<input name="conversaoVendaPercentual" type="number" min="0" max="100" step="0.01" value="${s.conversaoVendaPercentual ?? 80}"/></label></div>
  <div class="calculation-preview"><span>Custo operacional por unidade na capacidade global</span><strong>${money(toNumber(s.custoOperacionalMensal)/Math.max(1,toNumber(s.capacidadeGlobalMensal)),s.moeda||"BRL")}</strong></div><div class="actions-row"><button class="btn btn-primary" type="submit">Salvar configurações</button></div></form></section>`;
  const form = document.getElementById("operationsForm"); form.metodoRateio.value=s.metodoRateio; form.moeda.value=s.moeda||"BRL";
  form.addEventListener("submit", async (event) => { event.preventDefault(); if(!can("editarCustos")) return showToast("Sem permissão para editar custos.","error"); const raw=getFormObject(form); const data={}; [...form.elements].filter(x=>x.name).forEach(x=>data[x.name]=["metodoRateio","moeda"].includes(x.name)?x.value:toNumber(x.value)); try{state.data.settings=await Repository.saveSettings(data,state.profile,state.user);showToast("Configurações salvas.","success");renderOperations();}catch(error){showToast(error.message,"error");} });
}

function pricingActions(p) {
  const actions = [`<button class="btn btn-small btn-secondary" data-view-pricing="${p.id}">Detalhes</button>`];
  if (p.status === "rascunho" && can("calcular")) actions.push(`<button class="btn btn-small btn-primary" data-status="${p.id}:em_conferencia">Enviar à conferência</button>`);
  if (p.status === "em_conferencia" && can("calcular")) actions.push(`<button class="btn btn-small btn-primary" data-status="${p.id}:aguardando_aprovacao">Solicitar aprovação</button>`);
  if (p.status === "aguardando_aprovacao" && can("aprovar")) actions.push(`<button class="btn btn-small btn-success" data-status="${p.id}:aprovado">Aprovar</button>`);
  if (p.status === "aprovado" && can("publicar")) actions.push(`<button class="btn btn-small btn-success" data-publish="${p.id}">Publicar</button>`);
  return actions.join("");
}

function renderPricing(filterStatus = "") {
  let list = objectEntries(state.data.precificacoes).sort((a,b)=>String(b.atualizadoEm||"").localeCompare(String(a.atualizadoEm||"")));
  if(filterStatus) list=list.filter(x=>x.status===filterStatus);
  pageContent.innerHTML=`<section class="panel"><div class="panel-head wrap"><div><p class="eyebrow">HISTÓRICO VERSIONADO</p><h3>${filterStatus==="aguardando_aprovacao"?"Fila de aprovações":"Precificações"}</h3></div><button class="btn btn-primary" data-route="calculator">Novo cálculo</button></div>${list.length?`<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Custo</th><th>Preço</th><th>Margem</th><th>Status</th><th>Atualização</th><th></th></tr></thead><tbody>${list.map(p=>`<tr><td><strong>${escapeHtml(p.produtoSnapshot?.codigo||p.produtoId)}</strong><small class="block-muted">Ficha v${p.fichaVersao||"—"} · Precificação v${p.versao||1}</small></td><td>${money(p.resultado?.custos?.totalUnitario||0,p.comercial?.moeda||"BRL")}</td><td>${money(p.resultado?.comercial?.precoVenda||0,p.comercial?.moeda||"BRL")}</td><td>${numberBr(p.resultado?.comercial?.margemLiquidaPercentual||0,2)}%</td><td>${statusBadge(p.status)}</td><td>${dateBr(p.atualizadoEm)}</td><td><div class="inline-actions">${pricingActions(p)}</div></td></tr>`).join("")}</tbody></table></div>`:emptyState("Nenhuma precificação",filterStatus?"Não há itens aguardando aprovação.":"Execute e salve o primeiro cálculo.")}</section>`;
  bindCommonActions();
  document.querySelectorAll("[data-view-pricing]").forEach(b=>b.addEventListener("click",()=>openPricingDetails(b.dataset.viewPricing)));
  document.querySelectorAll("[data-status]").forEach(b=>b.addEventListener("click",()=>changeStatus(...b.dataset.status.split(":"))));
  document.querySelectorAll("[data-publish]").forEach(b=>b.addEventListener("click",()=>publishPricing(b.dataset.publish)));
}

function renderApprovals(){renderPricing("aguardando_aprovacao");}

async function changeStatus(id,status){
  const label={em_conferencia:"enviar à conferência",aguardando_aprovacao:"solicitar aprovação",aprovado:"aprovar"}[status]||status;
  if(!confirmAction(`Confirma ${label} desta precificação?`))return;
  try{const saved=await Repository.changePricingStatus(id,status,state.profile,state.user);state.data.precificacoes[id]=saved;showToast("Status atualizado.","success");renderRoute();}catch(error){showToast(error.message,"error");}
}

async function publishPricing(id){
  if(!confirmAction("Publicar este preço no nó isolado precificacao/precosPublicados? Isso não altera estoque, vendas nem o cadastro operacional."))return;
  try{const {pricing,published}=await Repository.publishPricing(id,state.profile,state.user);state.data.precificacoes[id]=pricing;state.data.publicados[published.produtoId]=published;showToast("Preço publicado no módulo isolado.","success");renderRoute();}catch(error){showToast(error.message,"error");}
}

function openPricingDetails(id){
  const p=state.data.precificacoes[id]; if(!p)return; const r=p.resultado||{}; const c=p.comercial||{};
  openModal(`Precificação · ${p.produtoSnapshot?.codigo||p.produtoId}`,`<div class="stack-lg"><div class="detail-header">${statusBadge(p.status)}<span>v${p.versao||1} · ${dateBr(p.atualizadoEm)}</span></div><div class="metrics-grid result-metrics">${metricCard("Custo",money(r.custos?.totalUnitario||0,c.moeda||"BRL"),"unitário")}${metricCard("Preço",money(r.comercial?.precoVenda||0,c.moeda||"BRL"),c.metodoPreco||"")}${metricCard("Margem líquida",`${numberBr(r.comercial?.margemLiquidaPercentual||0,2)}%`,money(r.comercial?.lucroLiquidoUnitario||0,c.moeda||"BRL"))}</div><pre class="json-preview">${escapeHtml(JSON.stringify({produto:p.produtoSnapshot,fichaVersao:p.fichaVersao,configuracoes:p.configuracoesSnapshot,comercial:p.comercial,resultado:p.resultado},null,2))}</pre><div class="modal-actions"><button class="btn btn-secondary" id="downloadPricingJson">Exportar JSON</button><button class="btn btn-primary" data-close-modal>Fechar</button></div></div>`,"modal-xl");
  document.getElementById("downloadPricingJson").addEventListener("click",()=>downloadText(`precificacao-${p.produtoSnapshot?.codigo||p.produtoId}-${id}.json`,JSON.stringify(p,null,2)));
}

function renderImports(){
  pageContent.innerHTML=`<section class="panel"><div class="panel-head"><div><p class="eyebrow">IMPORTAÇÃO CONTROLADA</p><h3>Extrair cadastro técnico de PDF</h3><p class="muted">O PDF passa por extração heurística e conferência humana. Nenhum item é salvo automaticamente.</p></div></div><div class="upload-zone" id="pdfDrop"><input id="pdfFile" type="file" accept="application/pdf" hidden/><div class="upload-icon">⇧</div><h4>Selecione um PDF técnico</h4><p>Código, descrição, peso, material, medida e pedras serão sugeridos.</p><button class="btn btn-primary" id="choosePdfBtn">Escolher PDF</button></div><div id="importProgress"></div><div id="importReview"></div></section>`;
  const input=document.getElementById("pdfFile");document.getElementById("choosePdfBtn").addEventListener("click",()=>input.click());input.addEventListener("change",()=>processPdf(input.files[0]));
}

async function processPdf(file){
  if(!file)return; const progress=document.getElementById("importProgress"); progress.innerHTML='<div class="loading-inline"><div class="spinner"></div><span>Iniciando leitura...</span></div>';
  try{const data=await extractPdf(file,(page,total)=>{progress.innerHTML=`<div class="progress-line"><span>Lendo página ${page} de ${total}</span><progress max="${total}" value="${page}"></progress></div>`;});data.itens=data.itens.map(item=>({...item,match:matchProduct(item,state.data.produtos)}));state.editor.importData=data;progress.innerHTML=`<div class="alert alert-success">PDF lido: ${data.paginas} páginas e ${data.itens.length} linhas candidatas.</div>`;renderImportReview();}catch(error){progress.innerHTML=`<div class="alert alert-error">${escapeHtml(error.message)}</div>`;}
}

function renderImportReview(){
  const data=state.editor.importData; const host=document.getElementById("importReview"); if(!data||!host)return;
  host.innerHTML=`<div class="panel-head compact"><div><h4>Conferência obrigatória</h4><p>Marque somente linhas que representam produtos.</p></div><button class="btn btn-primary" id="saveImportBtn">Salvar importação e gerar fichas</button></div>${data.itens.length?`<div class="table-wrap"><table><thead><tr><th>Usar</th><th>Página</th><th>Código sugerido</th><th>Peso</th><th>Material</th><th>Pedras</th><th>Produto vinculado</th></tr></thead><tbody>${data.itens.map((item,i)=>`<tr><td><input type="checkbox" data-import-select="${i}" ${item.selecionado&&item.match.produtoId?"checked":""}/></td><td>${item.pagina}</td><td><input class="table-input" data-import-field="${i}:codigo" value="${escapeHtml(item.codigo)}"/></td><td><input class="table-input narrow" type="number" step="0.0001" data-import-field="${i}:pesoGramas" value="${item.pesoGramas||""}"/></td><td><input class="table-input" data-import-field="${i}:material" value="${escapeHtml(item.material)}"/></td><td>${escapeHtml(item.pedras.map(x=>x.nomeDetectado).join(", ")||"—")}</td><td>${item.match.produtoId?`<strong>${escapeHtml(item.match.produto.codigo||item.match.produtoId)}</strong><small class="block-muted">${item.match.confianca}</small>`:'<span class="badge badge-warning">Revisar vínculo</span>'}</td></tr>`).join("")}</tbody></table></div>`:emptyState("Nada identificado","O formato deste PDF não permitiu identificar linhas técnicas automaticamente.")}`;
  document.querySelectorAll("[data-import-select]").forEach(el=>el.addEventListener("change",()=>data.itens[Number(el.dataset.importSelect)].selecionado=el.checked));
  document.querySelectorAll("[data-import-field]").forEach(el=>el.addEventListener("change",()=>{const[i,field]=el.dataset.importField.split(":");data.itens[Number(i)][field]=field==="pesoGramas"?toNumber(el.value):el.value;data.itens[Number(i)].match=matchProduct(data.itens[Number(i)],state.data.produtos);renderImportReview();}));
  document.getElementById("saveImportBtn")?.addEventListener("click",saveImportAndSheets);
}

async function saveImportAndSheets(){
  if(!can("importar"))return showToast("Sua conta não pode importar fichas.","error"); const data=state.editor.importData; const selected=data.itens.filter(x=>x.selecionado&&x.match.produtoId); if(!selected.length)return showToast("Selecione ao menos uma linha vinculada a um produto.","error");
  try{const savedImport=await Repository.saveImport({...data,itens:selected,status:"conferida"},state.profile,state.user);let created=0;for(const item of selected){const existing=objectEntries(state.data.fichas).find(f=>f.produtoId===item.match.produtoId);const product=state.data.produtos[item.match.produtoId];const materialGuess=objectEntries(state.data.materiais).find(m=>normalizeText(item.material).includes(normalizeText(m.nome))||normalizeText(m.nome).includes(normalizeText(item.material)));const stoneComponents=item.pedras.map(st=>{const matched=objectEntries(state.data.pedras).find(p=>normalizeText(p.nome).includes(normalizeText(st.material))&&(!st.tamanho||normalizeText(p.tamanho).includes(normalizeText(st.tamanho))));return matched?{itemId:matched.id,quantidade:st.quantidade,itemSnapshot:{nome:matched.nome,precoUnitario:matched.precoUnitario||0,versao:matched.versao||1}}:null;}).filter(Boolean);const sheet=await Repository.saveSheet(existing?.id||null,{produtoId:item.match.produtoId,produtoSnapshot:{codigo:product.codigo||product.codigoOriginal||item.codigo,descricao:product.descricao||item.descricao,material:product.material||item.material,medida:product.medida||item.medida,pesoMedio:product.pesoMedio||item.pesoGramas,fotoUrl:product.fotoUrl||""},materialId:materialGuess?.id||existing?.materialId||"",materialSnapshot:materialGuess||existing?.materialSnapshot||{},status:"rascunho",pesoMetalGramas:item.pesoGramas||product.pesoMedio||existing?.pesoMetalGramas||0,perdaMetalPercentual:existing?.perdaMetalPercentual||0,recuperacaoAparasPercentual:existing?.recuperacaoAparasPercentual||0,capacidadeMensal:existing?.capacidadeMensal||0,fatorComplexidade:existing?.fatorComplexidade||1,tempoProdutivoMinutos:existing?.tempoProdutivoMinutos||0,maoDeObraDireta:existing?.maoDeObraDireta||0,terceirizacoes:existing?.terceirizacoes||0,preparacaoLoteTotal:existing?.preparacaoLoteTotal||0,loteEconomico:existing?.loteEconomico||1,outrosCustos:existing?.outrosCustos||0,pedras:stoneComponents.length?stoneComponents:existing?.pedras||[],insumos:existing?.insumos||[],processos:existing?.processos||[],acabamentos:existing?.acabamentos||[],embalagens:existing?.embalagens||[],observacoes:`Importado de ${data.nomeArquivo}; importação ${savedImport.id}. Conferência técnica ainda obrigatória.`},state.profile,state.user);state.data.fichas[sheet.id]=sheet;created++;}showToast(`${created} ficha(s) criada(s) ou atualizada(s) como rascunho.`,"success");setRoute("sheets");}catch(error){showToast(error.message,"error");}
}

function renderReports(){
  const published=objectEntries(state.data.publicados);const pricing=objectEntries(state.data.precificacoes);const products=state.data.produtos;
  const totalRevenue=published.reduce((s,p)=>s+toNumber(p.precoSugerido),0);const avgMargin=published.length?published.reduce((s,p)=>s+toNumber(p.margemLiquidaPercentual),0)/published.length:0;
  pageContent.innerHTML=`<section class="metrics-grid">${metricCard("Produtos publicados",published.length,"Preços ativos no módulo")}${metricCard("Soma dos preços",money(totalRevenue),"Indicador, não receita")}${metricCard("Margem média",`${numberBr(avgMargin,2)}%`,"Dos preços publicados")}${metricCard("Histórico de cálculos",pricing.length,"Todas as versões")}</section><section class="panel"><div class="panel-head wrap"><div><p class="eyebrow">EXPORTAÇÃO</p><h3>Relatórios gerenciais</h3></div><div class="inline-actions"><button class="btn btn-secondary" id="exportPublishedCsv">Preços publicados CSV</button><button class="btn btn-secondary" id="exportPricingCsv">Precificações CSV</button><button class="btn btn-primary" onclick="window.print()">Imprimir relatório</button></div></div>${published.length?`<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Custo</th><th>Preço</th><th>Margem</th><th>Publicado em</th></tr></thead><tbody>${published.map(p=>`<tr><td><strong>${escapeHtml(products[p.produtoId]?.codigo||p.produtoId)}</strong><small class="block-muted">${escapeHtml(products[p.produtoId]?.descricao||"")}</small></td><td>${money(p.custoUnitario,p.moeda||"BRL")}</td><td>${money(p.precoSugerido,p.moeda||"BRL")}</td><td>${numberBr(p.margemLiquidaPercentual,2)}%</td><td>${dateBr(p.publicadoEm)}</td></tr>`).join("")}</tbody></table></div>`:emptyState("Nenhum preço publicado","Aprovações publicadas aparecerão neste relatório.")}</section>`;
  document.getElementById("exportPublishedCsv").addEventListener("click",()=>{const lines=[["produtoId","codigo","descricao","custoUnitario","precoSugerido","margemLiquidaPercentual","publicadoEm"].map(csvCell).join(";")];published.forEach(p=>lines.push([p.produtoId,products[p.produtoId]?.codigo,products[p.produtoId]?.descricao,p.custoUnitario,p.precoSugerido,p.margemLiquidaPercentual,p.publicadoEm].map(csvCell).join(";")));downloadText("glamore-precos-publicados.csv",lines.join("\n"),"text/csv");});
  document.getElementById("exportPricingCsv").addEventListener("click",()=>{const lines=[["id","produtoId","codigo","status","custo","preco","margem","atualizadoEm"].map(csvCell).join(";")];pricing.forEach(p=>lines.push([p.id,p.produtoId,p.produtoSnapshot?.codigo,p.status,p.resultado?.custos?.totalUnitario,p.resultado?.comercial?.precoVenda,p.resultado?.comercial?.margemLiquidaPercentual,p.atualizadoEm].map(csvCell).join(";")));downloadText("glamore-historico-precificacoes.csv",lines.join("\n"),"text/csv");});
}

const PERMISSIONS=["acessar","editarFicha","editarCatalogos","editarCustos","calcular","visualizarMargem","aprovar","publicar","importar","exportar","visualizarAuditoria","administrar"];
function renderAccess(){
  if(!can("administrar"))return setRoute("dashboard");const users=objectEntries(state.data.usuarios);
  pageContent.innerHTML=`<section class="panel"><div class="panel-head"><div><p class="eyebrow">CONTROLE DE ACESSO</p><h3>Permissões do módulo</h3><p class="muted">Não altera o papel do usuário no sistema operacional.</p></div></div><div class="access-list">${users.map(u=>`<article class="access-card"><div><strong>${escapeHtml(u.nome||u.email)}</strong><span>${escapeHtml(u.email||"")} · ${escapeHtml(u.papel||"")}</span></div><div class="permission-grid">${PERMISSIONS.map(p=>`<label><input type="checkbox" data-permission="${u.id}:${p}" ${(["dono"].includes(u.papel)||u.permissoesPrecificacao?.[p])?"checked":""} ${u.papel==="dono"?"disabled":""}/>${p}</label>`).join("")}</div><button class="btn btn-secondary" data-save-permissions="${u.id}" ${u.papel==="dono"?"disabled":""}>Salvar permissões</button></article>`).join("")}</div></section>`;
  document.querySelectorAll("[data-save-permissions]").forEach(b=>b.addEventListener("click",async()=>{const userId=b.dataset.savePermissions;const permissions={};PERMISSIONS.forEach(p=>permissions[p]=document.querySelector(`[data-permission="${userId}:${p}"]`).checked);try{await Repository.updateUserPermission(userId,permissions,state.profile,state.user);state.data.usuarios[userId].permissoesPrecificacao=permissions;showToast("Permissões atualizadas.","success");}catch(error){showToast(error.message,"error");}}));
}

function renderBackup(){
  pageContent.innerHTML=`<section class="two-column"><article class="panel"><p class="eyebrow">EXPORTAR</p><h3>Backup exclusivo do módulo</h3><p>Inclui configurações, catálogos, fichas, cálculos, aprovações, preços publicados e histórico do novo nó.</p><div class="alert alert-info">Não inclui produtos, peças físicas, vendas, estoque ou movimentos do sistema atual.</div><button class="btn btn-primary" id="downloadBackupBtn">Gerar backup JSON</button></article><article class="panel"><p class="eyebrow">RESTAURAR</p><h3>Restaurar backup do módulo</h3><p>A restauração aceita somente chaves autorizadas dentro de <code>precificacao</code>.</p>${can("publicar") ? '<input id="restoreFile" type="file" accept="application/json"/><button class="btn btn-danger" id="restoreBackupBtn">Restaurar com confirmação</button>' : '<div class="alert alert-info">A restauração exige permissão de publicação para impedir a substituição indireta de preços aprovados.</div>'}</article></section><section class="panel"><h3>Barreira de segurança</h3><div class="security-grid"><div><b>✓</b><span>Não há caminho de escrita para estoque.</span></div><div><b>✓</b><span>Não há caminho de escrita para vendas.</span></div><div><b>✓</b><span>Backups não contêm dados operacionais.</span></div><div><b>✓</b><span>Publicação permanece no novo nó.</span></div></div></section>`;
  document.getElementById("downloadBackupBtn").addEventListener("click",async()=>{try{const data=await Repository.exportModule();downloadText(`glamore-precificacao-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2));showToast("Backup gerado.","success");}catch(error){showToast(error.message,"error");}});
  document.getElementById("restoreBackupBtn")?.addEventListener("click",async()=>{if(!can("administrar"))return showToast("Sem permissão.","error");const file=document.getElementById("restoreFile").files[0];if(!file)return showToast("Selecione um arquivo JSON.","error");if(!confirmAction("A restauração substituirá dados do módulo de precificação. O sistema operacional não será alterado. Continuar?"))return;try{const data=JSON.parse(await file.text());await Repository.restoreModule(data,state.profile,state.user);showToast("Backup restaurado.","success");await loadData();}catch(error){showToast(error.message,"error");}});
}

function renderRoute(){
  if(!state.loaded)return;pageTitle.textContent=ROUTE_TITLES[state.route]||"Painel";pageEyebrow.textContent=`GLAMORE · ${APP_CONFIG.app.versao}`;
  const renders={dashboard:renderDashboard,products:renderProducts,sheets:renderSheets,calculator:renderCalculator,catalogs:renderCatalogs,operations:renderOperations,pricing:renderPricing,approvals:renderApprovals,imports:renderImports,reports:renderReports,access:renderAccess,backup:renderBackup};(renders[state.route]||renderDashboard)();
}

function openModal(title, body, size=""){
  modalHost.innerHTML=`<div class="modal-backdrop"><section class="modal ${size}"><header><h3>${escapeHtml(title)}</h3><button class="icon-btn" data-close-modal aria-label="Fechar">×</button></header><div class="modal-body">${body}</div></section></div>`;
  modalHost.querySelectorAll("[data-close-modal]").forEach(x=>x.addEventListener("click",closeModal));modalHost.querySelector(".modal-backdrop").addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))closeModal();});
}
function closeModal(){modalHost.innerHTML="";}
function bindCommonActions(){
  document.querySelectorAll("[data-route]").forEach(b=>b.addEventListener("click",()=>setRoute(b.dataset.route)));
  document.querySelectorAll('[data-action="new-sheet"]').forEach(b=>b.addEventListener("click",()=>openSheetEditor()));
  document.querySelectorAll("[data-pricing]").forEach(b=>b.addEventListener("click",()=>openPricingDetails(b.dataset.pricing)));
}

async function handleLogin(event){
  event.preventDefault();const form=event.currentTarget;const error=document.getElementById("loginError");error.hidden=true;const submit=form.querySelector("button");submit.disabled=true;submit.textContent="Entrando...";
  try{await Firebase.signIn(form.email.value.trim(),form.password.value);}catch(err){error.hidden=false;error.textContent=err.code==="auth/invalid-credential"?"E-mail ou senha inválidos.":`Não foi possível entrar: ${err.message}`;}finally{submit.disabled=false;submit.textContent="Entrar com a conta da Glamore";}
}

document.getElementById("loginForm").addEventListener("submit",handleLogin);
document.getElementById("logoutBtn").addEventListener("click",()=>Firebase.signOut());
document.getElementById("refreshBtn").addEventListener("click",()=>loadData());
document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
window.addEventListener("hashchange",()=>{const route=location.hash.replace(/^#\//,"")||"dashboard";if(route!==state.route){state.route=route;renderNav();renderRoute();}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});

Firebase.onAuth(async(user)=>{
  state.user=user;
  if(!user){state.loaded=false;state.profile=null;state.gestor=false;loginView.hidden=false;appView.hidden=true;pageContent.innerHTML="";return;}
  loginView.hidden=true;appView.hidden=false;state.route=location.hash.replace(/^#\//,"")||"dashboard";
  try{await loadData();}catch(error){console.error(error);showToast(`Falha ao carregar: ${error.message}`,"error");document.getElementById("connectionBadge").className="badge badge-danger";document.getElementById("connectionBadge").textContent="Erro de conexão";}
});

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));}
