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

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-events') {
    event.waitUntil(
      (async () => {
        try {
          const authData = localStorage.getItem('timetasks_auth_persistent');
          if (!authData) {
            console.warn('Sem autenticação para background sync');
            return;
          }

          const { accessToken } = JSON.parse(authData);

          // Sincronizar eventos
          const response = await fetch('/api/events/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) throw new Error('Sync falhou');

          const result = await response.json();
          console.log('✅ Background sync concluído:', result);

          // Notificar sucesso
          self.registration?.showNotification('✅ Eventos sincronizados', {
            body: 'Seus dados foram atualizados',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'sync-complete',
            silent: true
          });
        } catch (error) {
          console.error('Erro em background sync:', error);

          // Retry automático (vai disparar novamente em ~5min)
          throw error;
        }
      })()
    );
  }
});

// Handle periodic sync (calendários 24h, lembretes 12h)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-calendars-24h') {
    event.waitUntil(
      (async () => {
        try {
          const authData = localStorage.getItem('timetasks_auth_persistent');
          if (!authData) {
            console.warn('Sem autenticação para periodic sync');
            return;
          }

          const { accessToken } = JSON.parse(authData);

          const response = await fetch('/api/calendar/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(60_000)
          });

          if (!response.ok) throw new Error('Calendar sync falhou');

          const result = await response.json();
          console.log('✅ Calendários sincronizados (periodic):', result);

          // Notificar apenas se houver mudanças
          if (result.events_synced > 0) {
            self.registration?.showNotification('✅ Calendários atualizados', {
              body: `${result.events_synced} eventos sincronizados`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'calendar-sync',
              silent: true
            });
          }
        } catch (error) {
          console.error('Erro em periodic sync (calendários):', error);
        }
      })()
    );
  } else if (event.tag === 'sync-reminders-daily') {
    event.waitUntil(
      (async () => {
        try {
          const authData = localStorage.getItem('timetasks_auth_persistent');
          if (!authData) return;

          const { accessToken } = JSON.parse(authData);

          const response = await fetch('/api/reminders?days=1', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(30_000)
          });

          if (!response.ok) return;

          const reminders = await response.json();
          if (reminders.length > 0) {
            console.log(`🔔 ${reminders.length} lembretes verificados (periodic)`);
          }
        } catch (error) {
          console.error('Erro em periodic sync (lembretes):', error);
        }
      })()
    );
  }
});
