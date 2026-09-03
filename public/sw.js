// MS Shorts VIP Service Worker
const CACHE_NAME = 'ms-shorts-vip-v1';
const OFFLINE_URL = '/';

// Pre-cache essential app shell assets on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install Event: Cache app shell & skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching assets notice:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Offline-ready network-first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass non-http(s) schemes (like chrome-extension, data, blob)
  if (!request.url.startsWith('http')) {
    return;
  }

  // For API endpoints or dynamic uploads, try network directly
  if (request.url.includes('/api/') || request.url.includes('/uploads/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable. Running in offline mode.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Navigation requests (HTML page): Network first, then cached root/index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const rootCached = await caches.match(OFFLINE_URL);
          if (rootCached) {
            return rootCached;
          }
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline - MS Shorts VIP</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;"><h1>MS Shorts VIP</h1><p>You are currently offline. Please check your internet connection to stream videos.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Static assets (scripts, styles, images, fonts): Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        return cachedResponse;
      });
    })
  );
});
