// Service Worker de Casa de Cambio VE
// Cachea el "shell" de la app (HTML/íconos) para que abra rápido y
// muestre algo aunque no haya señal. Las tasas siempre se piden en
// vivo a Supabase (no se cachean), porque necesitas el dato del momento.

const CACHE_NAME = "casa-de-cambio-ve-v1";
const ARCHIVOS_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear las llamadas a Supabase (fuente de datos, siempre en vivo)
  if (url.hostname.endsWith("supabase.co")) {
    return;
  }

  // Para el resto (el shell de la app): cache-first, con red como respaldo
  event.respondWith(
    caches.match(event.request).then((respuestaCache) => {
      if (respuestaCache) return respuestaCache;
      return fetch(event.request)
        .then((respuestaRed) => {
          const copia = respuestaRed.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          return respuestaRed;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
