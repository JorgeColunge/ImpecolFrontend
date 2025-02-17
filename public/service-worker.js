/* eslint-disable no-restricted-globals */

const CACHE_NAME = "app-cache-v2"; // Cambia la versión cuando actualices archivos
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/flor.ico",
  "/flor.png",
  "/LogoImpecol.png",
  "/logo192.png",
  "/logo512.png"
];

// 🛠️ INSTALAR SERVICE WORKER Y ALMACENAR EN CACHÉ
self.addEventListener("install", (event) => {
  console.log("📦 Instalando Service Worker...");

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("✅ Archivos cacheados con éxito.");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// 🌍 INTERCEPTAR SOLICITUDES Y SERVIR DESDE CACHÉ O RED
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log(`🎯 Servido desde caché: ${event.request.url}`);
        return response;
      }

      return fetch(event.request.clone())
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            console.log(`🌍 Guardado en caché: ${event.request.url}`);
            return networkResponse;
          });
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// 🧹 ELIMINAR CACHÉ ANTIGUA AL ACTIVAR UN NUEVO SERVICE WORKER
self.addEventListener("activate", (event) => {
  console.log("🔄 Activando nuevo Service Worker...");

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log(`🗑 Eliminando caché antigua: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim();
});
