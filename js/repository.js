import { APP_CONFIG } from "./config.js";
import { Firebase } from "./firebase.js";
import { nowIso, uid } from "./utils.js";

const ROOT = APP_CONFIG.paths.precificacao;
const EMPRESA = APP_CONFIG.paths.empresa;

export const paths = Object.freeze({
  root: ROOT,
  produtos: APP_CONFIG.paths.produtos,
  usuarios: APP_CONFIG.paths.usuarios,
  settings: `${ROOT}/configuracoes/geral`,
  materiais: `${ROOT}/materiais`,
  pedras: `${ROOT}/pedras`,
  insumos: `${ROOT}/insumos`,
  processos: `${ROOT}/processos`,
  acabamentos: `${ROOT}/acabamentos`,
  embalagens: `${ROOT}/embalagens`,
  custosOperacionais: `${ROOT}/custosOperacionais`,
  fichas: `${ROOT}/fichasTecnicas`,
  precificacoes: `${ROOT}/precificacoes`,
  aprovacoes: `${ROOT}/aprovacoes`,
  publicados: `${ROOT}/precosPublicados`,
  importacoes: `${ROOT}/importacoes`,
  auditoria: `${ROOT}/auditoria`,
  indices: `${ROOT}/indices`,
  schema: `${ROOT}/_schema`
});

function actor(profile = {}, user = {}) {
  return {
    uid: user.uid || profile.uid || "",
    email: user.email || profile.email || "",
    nome: profile.nome || user.displayName || user.email || "Usuário",
    papel: profile.papel || "sem_acesso"
  };
}

export const Repository = {
  async loadBootstrap(user) {
    const [profile, gestor, produtos, settings, materiais, pedras, insumos, processos, acabamentos, embalagens, custosOperacionais, fichas, precificacoes, publicados, usuarios] = await Promise.all([
      Firebase.get(`${paths.usuarios}/${user.uid}`, {}),
      Firebase.get(`gestores/${user.uid}`, false),
      Firebase.get(paths.produtos, {}),
      Firebase.get(paths.settings, {}),
      Firebase.get(paths.materiais, {}),
      Firebase.get(paths.pedras, {}),
      Firebase.get(paths.insumos, {}),
      Firebase.get(paths.processos, {}),
      Firebase.get(paths.acabamentos, {}),
      Firebase.get(paths.embalagens, {}),
      Firebase.get(paths.custosOperacionais, {}),
      Firebase.get(paths.fichas, {}),
      Firebase.get(paths.precificacoes, {}),
      Firebase.get(paths.publicados, {}),
      Firebase.get(paths.usuarios, {})
    ]);
    return { profile, gestor: gestor === true, produtos, settings, materiais, pedras, insumos, processos, acabamentos, embalagens, custosOperacionais, fichas, precificacoes, publicados, usuarios };
  },

  canAccess(profile = {}, gestor = false) {
    if (gestor) return true;
    if (profile.ativo === false) return false;
    if (["dono", "gerente"].includes(String(profile.papel || "").toLowerCase())) return true;
    return profile.permissoesPrecificacao?.acessar === true;
  },

  permission(profile = {}, gestor = false, name = "acessar") {
    if (gestor) return true;
    const role = String(profile.papel || "").toLowerCase();
    if (role === "dono") return true;
    if (role === "gerente" && name !== "publicar") return true;
    return profile.permissoesPrecificacao?.[name] === true;
  },

  async initializeDefaults(profile, user) {
    const created = nowIso();
    const defaults = {
      [`${paths.schema}`]: {
        nome: "Glamore Custos & Precificação",
        versao: 1,
        criadoEm: created,
        atualizadoEm: created
      },
      [paths.settings]: {
        moeda: "BRL",
        metodoRateio: "capacidade_global",
        custoOperacionalMensal: 0,
        capacidadeGlobalMensal: 1,
        unidadesEquivalentesMensais: 1,
        minutosProdutivosMensais: 1,
        impostoPercentual: APP_CONFIG.defaults.impostoPercentual,
        comissaoPercentual: APP_CONFIG.defaults.comissaoPercentual,
        cartaoPercentual: APP_CONFIG.defaults.cartaoPercentual,
        multiplicador: APP_CONFIG.defaults.multiplicador,
        margemDesejadaPercentual: APP_CONFIG.defaults.margemDesejadaPercentual,
        utilizacaoCapacidadePercentual: APP_CONFIG.defaults.utilizacaoCapacidadePercentual,
        conversaoVendaPercentual: APP_CONFIG.defaults.conversaoVendaPercentual,
        criadoEm: created,
        criadoPor: actor(profile, user),
        atualizadoEm: created,
        atualizadoPor: actor(profile, user)
      }
    };
    for (const [path, value] of Object.entries(defaults)) {
      const exists = await Firebase.get(path, null);
      if (exists === null) await Firebase.set(path, value);
    }

    const catalogDefaults = {
      materiais: {
        "prata-925": { nome: "Prata 925", categoria: "metal", unidade: "g", custoPorGrama: 0, perdaPercentual: 0, recuperacaoPercentual: 0, ativo: true },
        "prata-950": { nome: "Prata 950", categoria: "metal", unidade: "g", custoPorGrama: 0, perdaPercentual: 0, recuperacaoPercentual: 0, ativo: true },
        bronze: { nome: "Bronze", categoria: "metal", unidade: "g", custoPorGrama: 0, perdaPercentual: 0, recuperacaoPercentual: 0, ativo: true }
      },
      pedras: {
        "zirconia-redonda-1mm-branca": { nome: "Zircônia redonda 1 mm branca", material: "Zircônia", formato: "Redonda", tamanho: "1 mm", unidade: "un", precoUnitario: 0, ativo: true },
        "zirconia-redonda-1-25mm-branca": { nome: "Zircônia redonda 1,25 mm branca", material: "Zircônia", formato: "Redonda", tamanho: "1,25 mm", unidade: "un", precoUnitario: 0, ativo: true },
        "zirconia-redonda-1-5mm-branca": { nome: "Zircônia redonda 1,5 mm branca", material: "Zircônia", formato: "Redonda", tamanho: "1,5 mm", unidade: "un", precoUnitario: 0, ativo: true }
      },
      insumos: {}, processos: {}, acabamentos: {}, embalagens: {}
    };
    for (const [collection, records] of Object.entries(catalogDefaults)) {
      for (const [id, record] of Object.entries(records)) {
        const path = `${ROOT}/${collection}/${id}`;
        const exists = await Firebase.get(path, null);
        if (exists === null) await Firebase.set(path, { ...record, criadoEm: created, atualizadoEm: created, criadoPor: actor(profile, user), atualizadoPor: actor(profile, user) });
      }
    }
    await this.audit("modulo_inicializado", "configuracoes", "geral", {}, profile, user);
  },

  async saveSettings(data, profile, user) {
    const previous = await Firebase.get(paths.settings, {});
    const payload = {
      ...previous,
      ...data,
      atualizadoEm: nowIso(),
      atualizadoPor: actor(profile, user),
      criadoEm: previous.criadoEm || nowIso(),
      criadoPor: previous.criadoPor || actor(profile, user)
    };
    await Firebase.set(paths.settings, payload);
    await this.audit("configuracoes_atualizadas", "configuracoes", "geral", { antes: previous, depois: payload }, profile, user);
    return payload;
  },

  async saveCatalog(collection, id, data, profile, user) {
    if (!paths[collection]) throw new Error("Catálogo inválido.");
    const key = id || uid(collection.slice(0, 3));
    const path = `${paths[collection]}/${key}`;
    const previous = await Firebase.get(path, {});
    const payload = {
      ...previous,
      ...data,
      id: key,
      ativo: data.ativo !== false,
      criadoEm: previous.criadoEm || nowIso(),
      criadoPor: previous.criadoPor || actor(profile, user),
      atualizadoEm: nowIso(),
      atualizadoPor: actor(profile, user),
      versao: Number(previous.versao || 0) + 1
    };
    await Firebase.set(path, payload);
    await this.audit(previous.id ? "catalogo_atualizado" : "catalogo_criado", collection, key, { antes: previous, depois: payload }, profile, user);
    return payload;
  },

  async archiveCatalog(collection, id, profile, user) {
    const path = `${paths[collection]}/${id}`;
    const previous = await Firebase.get(path, {});
    const payload = { ...previous, ativo: false, atualizadoEm: nowIso(), atualizadoPor: actor(profile, user), versao: Number(previous.versao || 0) + 1 };
    await Firebase.set(path, payload);
    await this.audit("catalogo_arquivado", collection, id, { antes: previous, depois: payload }, profile, user);
  },

  async saveSheet(id, data, profile, user) {
    const key = id || data.produtoId || uid("ficha");
    const path = `${paths.fichas}/${key}`;
    const previous = await Firebase.get(path, {});
    const payload = {
      ...previous,
      ...data,
      id: key,
      status: data.status || previous.status || "rascunho",
      versao: Number(previous.versao || 0) + 1,
      criadoEm: previous.criadoEm || nowIso(),
      criadoPor: previous.criadoPor || actor(profile, user),
      atualizadoEm: nowIso(),
      atualizadoPor: actor(profile, user)
    };
    await Firebase.set(path, payload);
    await Firebase.set(`${paths.indices}/produtoFicha/${payload.produtoId}`, key);
    await this.audit(previous.id ? "ficha_atualizada" : "ficha_criada", "fichasTecnicas", key, { antes: previous, depois: payload }, profile, user);
    return payload;
  },

  async savePricing(data, profile, user) {
    const key = data.id || uid("prec");
    const path = `${paths.precificacoes}/${key}`;
    const previous = await Firebase.get(path, {});
    const payload = {
      ...previous,
      ...data,
      id: key,
      status: data.status || previous.status || "rascunho",
      versao: Number(previous.versao || 0) + 1,
      criadoEm: previous.criadoEm || nowIso(),
      criadoPor: previous.criadoPor || actor(profile, user),
      atualizadoEm: nowIso(),
      atualizadoPor: actor(profile, user)
    };
    await Firebase.set(path, payload);
    await Firebase.set(`${paths.indices}/produtoPrecificacao/${payload.produtoId}`, key);
    await this.audit(previous.id ? "precificacao_atualizada" : "precificacao_criada", "precificacoes", key, { antes: previous, depois: payload }, profile, user);
    return payload;
  },

  async changePricingStatus(id, status, profile, user, note = "") {
    const path = `${paths.precificacoes}/${id}`;
    const previous = await Firebase.get(path, null);
    if (!previous) throw new Error("Precificação não encontrada.");
    const allowed = {
      rascunho: ["em_conferencia", "arquivado"],
      em_conferencia: ["aguardando_aprovacao", "rascunho"],
      aguardando_aprovacao: ["aprovado", "rascunho"],
      aprovado: ["publicado", "substituido"],
      publicado: ["substituido"],
      substituido: ["arquivado"],
      arquivado: []
    };
    if (!(allowed[previous.status] || []).includes(status)) throw new Error(`Transição inválida: ${previous.status} → ${status}.`);
    const payload = { ...previous, status, statusNota: note, atualizadoEm: nowIso(), atualizadoPor: actor(profile, user) };
    if (status === "aprovado") {
      payload.aprovadoEm = nowIso(); payload.aprovadoPor = actor(profile, user);
      await Firebase.set(`${paths.aprovacoes}/${id}`, { precificacaoId: id, produtoId: previous.produtoId, aprovadoEm: payload.aprovadoEm, aprovadoPor: payload.aprovadoPor, snapshot: previous });
    }
    await Firebase.set(path, payload);
    await this.audit(`precificacao_status_${status}`, "precificacoes", id, { antes: previous, depois: payload }, profile, user);
    return payload;
  },

  async publishPricing(id, profile, user) {
    const pricingPath = `${paths.precificacoes}/${id}`;
    const previous = await Firebase.get(pricingPath, null);
    if (!previous || previous.status !== "aprovado") throw new Error("Somente uma precificação aprovada pode ser publicada.");
    const timestamp = nowIso();
    const published = {
      produtoId: previous.produtoId,
      fichaId: previous.fichaId,
      precificacaoId: id,
      versao: previous.versao,
      custoUnitario: previous.resultado?.custos?.totalUnitario || 0,
      precoSugerido: previous.resultado?.comercial?.precoVenda || 0,
      margemLiquidaPercentual: previous.resultado?.comercial?.margemLiquidaPercentual || 0,
      moeda: previous.comercial?.moeda || "BRL",
      publicadoEm: timestamp,
      publicadoPor: actor(profile, user),
      status: "ativo"
    };
    const publicationPath = `${paths.publicados}/${previous.produtoId}`;
    const oldPublished = await Firebase.get(publicationPath, null);
    const payload = { ...previous, status: "publicado", publicadoEm: timestamp, publicadoPor: published.publicadoPor, atualizadoEm: timestamp, atualizadoPor: actor(profile, user) };
    const auditId = Firebase.newKey(paths.auditoria);
    const auditPayload = {
      acao: "precificacao_publicada",
      colecao: "precosPublicados",
      documentoId: previous.produtoId,
      detalhes: { antes: oldPublished, depois: published },
      dataHora: timestamp,
      usuario: actor(profile, user),
      origem: "glamore-custos-precificacao",
      build: APP_CONFIG.app.build
    };
    await Firebase.multiUpdate({
      [publicationPath]: published,
      [pricingPath]: payload,
      [`${paths.auditoria}/${auditId}`]: auditPayload
    });
    return { pricing: payload, published };
  },

  async saveImport(data, profile, user) {
    const id = data.id || uid("imp");
    const payload = { ...data, id, criadoEm: data.criadoEm || nowIso(), criadoPor: data.criadoPor || actor(profile, user), atualizadoEm: nowIso(), atualizadoPor: actor(profile, user) };
    await Firebase.set(`${paths.importacoes}/${id}`, payload);
    await this.audit("importacao_salva", "importacoes", id, { depois: { nomeArquivo: payload.nomeArquivo, itens: payload.itens?.length || 0 } }, profile, user);
    return payload;
  },

  async updateUserPermission(userId, permissions, profile, user) {
    const path = `${paths.usuarios}/${userId}/permissoesPrecificacao`;
    const previous = await Firebase.get(path, {});
    await Firebase.set(path, permissions);
    await this.audit("permissoes_atualizadas", "usuarios", userId, { antes: previous, depois: permissions }, profile, user);
  },

  async audit(action, collection, documentId, details, profile, user) {
    const payload = {
      acao: action,
      colecao: collection,
      documentoId: documentId,
      detalhes: details || {},
      dataHora: nowIso(),
      usuario: actor(profile, user),
      origem: "glamore-custos-precificacao",
      build: APP_CONFIG.app.build
    };
    return Firebase.push(paths.auditoria, payload);
  },

  async exportModule() {
    const keys = ["configuracoes", "materiais", "pedras", "insumos", "processos", "acabamentos", "embalagens", "custosOperacionais", "fichasTecnicas", "precificacoes", "aprovacoes", "precosPublicados", "importacoes", "indices", "auditoria", "restauracoes", "_schema"];
    const entries = await Promise.all(keys.map(async (key) => [key, await Firebase.get(`${ROOT}/${key}`, {})]));
    return Object.fromEntries(entries);
  },

  async restoreModule(data, profile, user) {
    if (!data || typeof data !== "object") throw new Error("Backup inválido.");
    const backupId = uid("restore");
    await Firebase.set(`${ROOT}/restauracoes/${backupId}`, { status: "iniciada", iniciadoEm: nowIso(), iniciadoPor: actor(profile, user) });
    const safeKeys = ["configuracoes", "materiais", "pedras", "insumos", "processos", "acabamentos", "embalagens", "custosOperacionais", "fichasTecnicas", "precificacoes", "aprovacoes", "precosPublicados", "importacoes", "indices", "_schema"];
    for (const key of safeKeys) {
      if (Object.hasOwn(data, key)) await Firebase.set(`${ROOT}/${key}`, data[key]);
    }
    await Firebase.set(`${ROOT}/restauracoes/${backupId}`, { status: "concluida", concluidoEm: nowIso(), concluidoPor: actor(profile, user) });
    await this.audit("backup_restaurado", "restauracoes", backupId, { chaves: safeKeys.filter((k) => Object.hasOwn(data, k)) }, profile, user);
  },

  operationalRoot: EMPRESA
};
