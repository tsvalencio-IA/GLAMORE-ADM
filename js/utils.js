export const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export const normalizeText = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

export const slug = (value = "") => normalizeText(value)
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || crypto.randomUUID();

export const nowIso = () => new Date().toISOString();

export const uid = (prefix = "id") => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const toNumber = (value, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const clean = String(value ?? "")
    .replace(/R\$|US\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

export const money = (value, currency = "BRL") => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(Number(value || 0));

export const numberBr = (value, decimals = 2) => new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals
}).format(Number(value || 0));

export const dateBr = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
};

export const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));

export const objectEntries = (obj = {}) => Object.entries(obj || {}).map(([id, value]) => ({ id, ...(value || {}) }));

export const downloadText = (filename, text, mime = "application/json") => {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

export const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export const debounce = (fn, wait = 250) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

export const getFormObject = (form) => Object.fromEntries(new FormData(form).entries());

export const percent = (value) => `${numberBr(value, 2)}%`;

export function showToast(message, type = "info") {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const item = document.createElement("div");
  item.className = `toast toast-${type}`;
  item.textContent = message;
  host.appendChild(item);
  requestAnimationFrame(() => item.classList.add("show"));
  setTimeout(() => {
    item.classList.remove("show");
    setTimeout(() => item.remove(), 250);
  }, 3600);
}

export function confirmAction(message) {
  return window.confirm(message);
}
