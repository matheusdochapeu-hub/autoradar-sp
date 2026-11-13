const CACHE_NAME = 'autoradar-sp-v21';

/**
 * Precache do app shell.
 * As fotos dos anúncios são externas e entram no cache sob demanda (runtime),
 * então não entram aqui: o precache precisa ser pequeno para instalar rápido
 * no celular.
 */
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/financing.js',
  './js/app.js',
  './data/cars.json',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Um asset ausente não deve impedir a instalação do Service Worker.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] falha ao precachear', url, err))
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol)) return;

  const isSameOrigin = url.origin === self.location.origin;
  const isCodeOrData =
    isSameOrigin &&
    (url.pathname.endsWith('/') ||
      /\.(?:html|js|css|json|webmanifest)$/i.test(url.pathname));

  // Network-first: código e catálogo sempre tentam a versão mais nova.
  if (isCodeOrData) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // Cache-first para imagens/ícones (local e fotos dos anúncios).
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        return new Response('', { status: 504, statusText: 'Offline sem cópia em cache' });
      }
    })()
  );
});
