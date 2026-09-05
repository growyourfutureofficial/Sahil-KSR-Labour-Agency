const CACHE_NAME = "billgen-spnwa-cache-v4"; // Version bumped for full cache reset
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/logo.png" // ENGINEERED FIX: Logo must be cached for offline PDF generation
];

// 1. INSTALLATION: Cache core native files
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. ACTIVATION: Wipe old zombie caches immediately
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

// 3. TRUE NETWORK-FIRST FETCH ENGINE (Zero Crash Offline Mode)
self.addEventListener("fetch", (event) => {
  // SECURITY FIX: Never intercept non-GET requests (e.g. Firebase Auth/DB POST data)
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);

  // LOGIC FIX: Intercept only your hosted origin files (Ignore Firebase/CDN dynamically)
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Network worked! Update cache silently for seamless SPNWA updates
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(async () => {
        // Network failed! App is offline -> Serve from Cache instantly
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // LOOPHOLE FIX: Ensure navigation EXACTLY matches the relative cache key
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
