const STATIC_CACHE_NAME = 'financy-me-static-v3';
const DATA_CACHE_PREFIX = 'financy-me-data';
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

const getHouseDataCacheName = (houseId, version) =>
  `${DATA_CACHE_PREFIX}-house-${houseId}-v-${version}`;

const purgeOldHouseCaches = async (houseId, keepCacheName) => {
  const cacheKeys = await caches.keys();

  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith(`${DATA_CACHE_PREFIX}-house-${houseId}-`) && key !== keepCacheName)
      .map((key) => caches.delete(key)),
  );
};

const cacheVersionedResponse = async (request, response) => {
  if (!response.ok) {
    return;
  }

  const houseId = response.headers.get('X-House-Id');
  const houseDataVersion = response.headers.get('X-House-Data-Version');

  if (!houseId || !houseDataVersion) {
    return;
  }

  const cacheName = getHouseDataCacheName(houseId, houseDataVersion);
  const cache = await caches.open(cacheName);

  await cache.put(request, response.clone());
  await purgeOldHouseCaches(houseId, cacheName);
};

const fromCacheOrFallback = async (request, fallbackToShell = false) => {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  if (fallbackToShell) {
    return caches.match('/');
  }

  return undefined;
};

const networkFirstVersioned = async (request, fallbackToShell = false) => {
  try {
    const response = await fetch(request);

    await cacheVersionedResponse(request, response);

    return response;
  } catch {
    const cached = await fromCacheOrFallback(request, fallbackToShell);

    if (cached) {
      return cached;
    }

    throw new Error('Network unavailable and no cached response found.');
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('financy-me-static-') && key !== STATIC_CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
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
    event.respondWith(networkFirstVersioned(request, true));
    return;
  }

  if (url.origin === self.location.origin && isStaticAssetRequest(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const cloned = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, cloned));
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstVersioned(request));
  }
});
