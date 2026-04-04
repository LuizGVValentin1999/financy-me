const CACHE_NAME = 'financy-me-v2';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

const STATIC_PATH_PREFIXES = ['/build/', '/icons/'];
const STATIC_EXACT_PATHS = new Set([
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
]);

const isStaticAssetRequest = (url) =>
  STATIC_EXACT_PATHS.has(url.pathname) || STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  if (url.origin === self.location.origin && isStaticAssetRequest(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
  }
});
