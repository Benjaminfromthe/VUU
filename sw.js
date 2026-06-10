const CACHE_NAME = 'vuu-transport-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/routes.html',
  '/book.html',
  '/confirmation.html',
  '/driver-dashboard.html',
  '/passenger-dashboard.html',
  '/login.html',
  '/register.html',
  '/style.css',
  '/translation.js',
  '/ai-chatbot.js',
  '/manifest.json'
];

// On installation, cache static shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[Service Worker] Static assets caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept network requests
self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  // Handle API cache - Network First, fallback to cached API response
  if (reqUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Network failed, serving API cached data');
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle general assets - Network first, fallback to cached assets
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        console.log('[Service Worker] Network failed, serving cached asset:', reqUrl.pathname);
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback if offline and nothing cached for page navigation
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
