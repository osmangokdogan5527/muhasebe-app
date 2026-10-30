/**
 * Storm Ön Muhasebe - Service Worker (telefona yüklenebilir uygulama / PWA)
 *
 * Yalnızca uygulamanın kendi dosyalarını önbelleğe alır; veriler (Firebase) ve
 * yapay zeka (Gemini) istekleri hiç önbelleğe alınmaz, her zaman doğrudan gider.
 * - Sayfa açılışı: önce ağ, ağ yoksa önbellekteki sürüm (internetsiz açılış)
 * - /assets/ altındaki adı özetli (hash) dosyalar: önce önbellek
 * - Diğer kendi dosyalarımız: önbellekten hemen ver, arkada güncelle
 */
const CACHE_NAME = 'storm-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('[sw] Önbellek hazırlanamadı:', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put('./index.html', response.clone());
    return response;
  } catch (err) {
    const cached = (await cache.match('./index.html')) || (await cache.match('./'));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Firebase, Gemini, kur servisleri vb. başka adresler: dokunma
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
