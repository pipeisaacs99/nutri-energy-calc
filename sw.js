// Cambia este número cada vez que publiques una versión nueva,
// para que los usuarios reciban los archivos actualizados.
const VERSION = 'v2';
const SHELL_CACHE = `energia-calc-shell-${VERSION}`;
const FONT_CACHE = 'energia-calc-fonts';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './manifest.webmanifest',
  './icons/logo.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== SHELL_CACHE && key !== FONT_CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts: se guardan en caché para que la app se vea igual sin conexión.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((response) => {
          if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Páginas: primero la red (para ver cambios), y si no hay conexión, la copia guardada.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto de archivos: la copia guardada al instante y se actualiza en segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
