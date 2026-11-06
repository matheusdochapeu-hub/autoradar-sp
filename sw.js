const CACHE_NAME = 'autoradar-sp-v5';
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
  './icons/icon.svg',
  './img/cars/pulse-drive-cinza.jpg',
  './img/cars/pulse-turbo-branco.jpg',
  './img/cars/pulse-audace-azul.jpg',
  './img/cars/byd-dolphin-mini-branco.jpg',
  './img/cars/byd-dolphin-mini-verde.jpg',
  './img/cars/byd-dolphin-mini-preto.jpg',
  './img/cars/vw-tera.jpg',
  './img/cars/vw-polo-tsi.jpg',
  './img/cars/kwid-etech.jpg',
  './img/cars/jac-ejs1.jpg',
  './img/cars/nissan-kicks.jpg',
  './img/cars/c4-cactus.jpg',
  './img/cars/argo-trekking.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Apagando cache antigo obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Network-first para HTML, scripts e cars.json (sempre entrega a versão mais recente)
  const isCodeOrData = url.includes('data/cars.json') || 
                       url.includes('.js') || 
                       url.endsWith('/') || 
                       url.includes('index.html');

  if (isCodeOrData) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first para imagens e ícones locais já otimizados
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
