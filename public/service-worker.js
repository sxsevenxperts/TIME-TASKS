const CACHE_VERSION = 'sx-time-tasks-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/layout.css',
  '/style.css',
  '/sx-time-tasks-logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest'
];

const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Fallback: continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name.startsWith('sx-time-tasks')) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network-first, fallback to offline cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline fallback for API calls
            if (request.method === 'GET') {
              return new Response(
                JSON.stringify({ offline: true, message: 'Modo offline' }),
                {
                  status: 200,
                  statusText: 'OK (cached)',
                  headers: new Headers({ 'Content-Type': 'application/json' })
                }
              );
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  if (
    request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.includes('/fonts/'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(request).then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }
      if (response.type === 'basic') {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(request).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'CLEAR_CACHE':
        caches.delete(DYNAMIC_CACHE);
        break;

      case 'CHECK_AUTH':
        // Verificar se há token válido no localStorage
        const authKey = 'timetasks_auth_persistent';
        const authData = localStorage.getItem ? (() => {
          try {
            const stored = localStorage.getItem(authKey);
            return stored ? JSON.parse(stored) : null;
          } catch {
            return null;
          }
        })() : null;

        if (authData && authData.expiresAt) {
          const now = Date.now();
          const expiresAtMs = authData.expiresAt * 1000;

          // Se expirou, limpar
          if (now > expiresAtMs) {
            if (localStorage.removeItem) {
              localStorage.removeItem(authKey);
            }
            event.ports[0]?.postMessage({ authenticated: false, reason: 'expired' });
          } else {
            event.ports[0]?.postMessage({ authenticated: true });
          }
        } else {
          event.ports[0]?.postMessage({ authenticated: false, reason: 'no-session' });
        }
        break;
    }
  }
});
