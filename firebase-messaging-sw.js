const CACHE_NAME = "billgen-neumorphic-cache-v3"; // Version bumped to force update
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

// Install Service Worker and Cache Assets (Loophole free offline load)
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate and clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// TRUE Network-First Strategy (Loophole Free for Updates & API calls)
self.addEventListener("fetch", (event) => {
  // SECURITY FIX: Never intercept non-GET requests (e.g., Firebase Auth POST data)
  if (event.request.method !== 'GET') return;
  
  // LOGIC FIX: Do not intercept external CDNs, only cache your own GitHub hosted files
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // Network worked! Update the cache with latest files silently
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });
    }).catch(() => {
      // Network failed! App is offline, fallback to the latest cached version
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
