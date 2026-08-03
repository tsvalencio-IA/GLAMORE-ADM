export const APP_CONFIG = Object.freeze({
  empresaId: "empresa-principal",
  app: {
    nome: "Glamore Custos & Precificação",
    subtitulo: "Engenharia de custos para prata, bronze e produtos banhados",
    versao: "1.0.0",
    build: "glamore-precificacao-rtdb-v1-20260803",
    assinatura: "Powered by thIAguinho Soluções Digitais"
  },
  firebase: {
    apiKey: "AIzaSyCuGvulL9C2sjxU2rdrNrIg6IddsKZrsEk",
    authDomain: "vitorgomes-fa1e1.firebaseapp.com",
    databaseURL: "https://vitorgomes-fa1e1-default-rtdb.firebaseio.com",
    projectId: "vitorgomes-fa1e1",
    storageBucket: "vitorgomes-fa1e1.firebasestorage.app",
    messagingSenderId: "696221809673",
    appId: "1:696221809673:web:bce5df61b2393bbafc0cd8"
  },
  paths: {
    empresa: "empresas/empresa-principal",
    produtos: "empresas/empresa-principal/produtos",
    usuarios: "empresas/empresa-principal/usuarios",
    precificacao: "empresas/empresa-principal/precificacao"
  },
  defaults: {
    moeda: "BRL",
    casasDinheiro: 2,
    casasPeso: 4,
    impostoPercentual: 8,
    comissaoPercentual: 5,
    cartaoPercentual: 4,
    multiplicador: 2,
    margemDesejadaPercentual: 25,
    utilizacaoCapacidadePercentual: 70,
    conversaoVendaPercentual: 80
  }
});
