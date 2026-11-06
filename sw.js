const CACHE_NAME = 'autoradar-sp-v4';
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
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first para data/cars.json para sempre ter os dados mais atualizados
  if (event.request.url.includes('data/cars.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
