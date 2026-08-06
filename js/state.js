export const state = {
  user: null,
  profile: null,
  gestor: false,
  access: {},
  loaded: false,
  route: "dashboard",
  data: {
    produtos: {}, usuarios: {}, acessos: {}, settings: {}, materiais: {}, pedras: {}, insumos: {}, processos: {}, acabamentos: {}, embalagens: {},
    custosOperacionais: {}, fichas: {}, precificacoes: {}, publicados: {}
  },
  editor: { sheetId: null, pricingId: null, importData: null }
};
