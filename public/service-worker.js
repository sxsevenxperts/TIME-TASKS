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

  // Hashed assets (dist/assets/*): cache-first (immutable)
  if (request.method === 'GET' && url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
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

  // Non-hashed assets (.js, .css, images, fonts): network-first
  // (on deploy, these files change URL but keep the path — SW must not
  // cache-first them, else old version persists indefinitely)
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
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
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
        // noop: verificação de auth foi movida pro client (persistent-auth.js)
        event.ports[0]?.postMessage({ authenticated: true });
        break;
    }
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push recebido sem dados');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'notification',
      data: data.data || {},
      ...data.options
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Time Tasks', options)
    );
  } catch (error) {
    console.error('Erro ao processar push:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  if (data.eventId) {
    url = `/?action=view-event&id=${data.eventId}`;
  } else if (data.taskId) {
    url = `/?action=view-task&id=${data.taskId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Procurar por window aberta
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Abrir nova window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle background sync (desativado — localStorage não existe em SW)
// O sync é responsabilidade do client; o SW apenas persiste dados
self.addEventListener('sync', (event) => {
  // noop: background sync coordination happens on the client side
});

// Handle periodic sync (desativado — localStorage não existe em SW)
self.addEventListener('periodicsync', (event) => {
  // noop: periodic sync coordination happens on the client side
});
