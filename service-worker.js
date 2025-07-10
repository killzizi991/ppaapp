const CACHE_NAME = 'finance-tracker-simple';
const BASE_PATH = '/ppapp/';
const OFFLINE_URL = BASE_PATH + 'index.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Кешируем только самое необходимое
        return cache.addAll([
          OFFLINE_URL,
          BASE_PATH + 'styles.css',
          BASE_PATH + 'app.js',
          BASE_PATH + 'manifest.webmanifest'
        ]);
      })
  );
});

self.addEventListener('fetch', event => {
  // Только GET-запросы
  if (event.request.method !== 'GET') return;
  
  // Для навигационных запросов
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  
  // Для остальных запросов
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  // Удаляем старые кеши
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
