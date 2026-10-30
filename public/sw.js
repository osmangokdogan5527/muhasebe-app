/**
 * Storm Ön Muhasebe - Service Worker (telefona yüklenebilir uygulama / PWA)
 *
 * Yalnızca uygulamanın kendi dosyalarını önbelleğe alır; veriler (Firebase) ve
 * yapay zeka (Gemini) istekleri hiç önbelleğe alınmaz, her zaman doğrudan gider.
 * - Sayfa açılışı: önce ağ, ağ yoksa önbellekteki sürüm (internetsiz açılış)
 * - /assets/ altındaki adı özetli (hash) dosyalar: önce önbellek
 * - Diğer kendi dosyalarımız: önbellekten hemen ver, arkada güncelle
 */
const CACHE_NAME = 'storm-pwa-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// index.html içindeki derleme dosyalarını (assets/…js, …css) bulup önbelleğe alır.
// İlk açılışta bu dosyalar service worker devreye girmeden indirildiği için
// ayrıca alınmazlarsa internetsiz açılışta sayfa boş kalır.
async function cacheShellAssets(cache, html) {
  const urls = new Set();
  const pattern = /(?:src|href)=["']([^"']*assets\/[^"']+)["']/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    urls.add(new URL(match[1], self.registration.scope).href);
  }
  await Promise.all(Array.from(urls).map(async (url) => {
    if (await cache.match(url)) return;
    try {
      const response = await fetch(url);
      if (response && response.ok) await cache.put(url, response);
    } catch (err) {
      console.warn('[sw] Dosya önbelleğe alınamadı:', url, err);
    }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL);
        const indexResponse = await cache.match('./index.html');
        if (indexResponse) await cacheShellAssets(cache, await indexResponse.text());
      })
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

async function networkFirst(request, event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      // Yeni sürüm yayınlandığında yeni derleme dosyaları da arka planda önbelleğe alınır
      event.waitUntil(
        copy.text()
          .then(async (html) => {
            await cache.put('./index.html', new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
            await cacheShellAssets(cache, html);
          })
          .catch((err) => console.warn('[sw] Sayfa önbelleğe alınamadı:', err))
      );
    }
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
    event.respondWith(networkFirst(request, event));
  } else if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
