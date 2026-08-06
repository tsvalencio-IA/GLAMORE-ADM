const CACHE = "glamore-precificacao-v1.1.0";
const ASSETS = ["./", "./index.html", "./css/app.css", "./js/app.js", "./js/config.js", "./js/utils.js", "./js/calculator.js", "./js/firebase.js", "./js/repository.js", "./js/pdf-importer.js", "./js/state.js"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("googleapis.com") || event.request.url.includes("firebase")) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match(event.request)));
});
