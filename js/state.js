export const state = {
  user: null,
  profile: null,
  gestor: false,
  loaded: false,
  route: "dashboard",
  data: {
    produtos: {}, usuarios: {}, settings: {}, materiais: {}, pedras: {}, insumos: {}, processos: {}, acabamentos: {}, embalagens: {},
    custosOperacionais: {}, fichas: {}, precificacoes: {}, publicados: {}
  },
  editor: { sheetId: null, pricingId: null, importData: null }
};
