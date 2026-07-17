// PWA Service Worker Registration & Features
(() => {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Verificar autenticação periodicamente no SW
        setInterval(() => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CHECK_AUTH'
            });
          }
        }, 5 * 60 * 1000); // A cada 5 minutos
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }

  // Detect PWA launch mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  if (isPWA) {
    document.documentElement.setAttribute('data-pwa', 'true');
  }

  // Install prompt handling
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;

    // Show install button/hint to user (you can customize this)
    const installHint = document.getElementById('pwa-install-hint');
    if (installHint) {
      installHint.style.display = 'block';
      installHint.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
  });

  // Handle app installed state
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
  });

  // Periodic background sync for calendar sync
  if ('periodicSync' in registration) {
    registration.periodicSync.register('sync-calendars', {
      minInterval: 24 * 60 * 60 * 1000 // 24 hours
    }).catch((error) => {
      console.log('Periodic sync registration failed:', error);
    });
  }

  // Push notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('✅ Notificações ativadas');
        // Registrar push subscription
        if (registration && 'pushManager' in registration) {
          subscribeToPush(registration);
        }
      }
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // Já tem permissão, registrar se necessário
    if (registration && 'pushManager' in registration) {
      subscribeToPush(registration);
    }
  }

  // Background sync
  if ('sync' in registration) {
    registration.sync.register('sync-events').catch((err) => {
      console.warn('Background sync não disponível:', err.message);
    });
  }

  // Periodic sync (24h)
  if ('periodicSync' in registration) {
    registration.periodicSync
      .register('sync-calendars-24h', {
        minInterval: 24 * 60 * 60 * 1000
      })
      .catch((err) => {
        console.warn('Periodic sync não disponível:', err.message);
      });
  }

  /**
   * Registra push subscription
   */
  async function subscribeToPush(registration) {
    if (!registration || !('pushManager' in registration)) {
      console.warn('Push não suportado');
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(window.__VAPID_PUBLIC_KEY__ || '')
      });

      // Salvar subscription no servidor
      const user = (await supabase.auth.getUser()).data.user;
      if (user && subscription) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            subscription: subscription.toJSON()
          })
        });
      }

      console.log('✅ Push subscription registrada');
      return subscription;
    } catch (error) {
      console.error('Erro ao registrar push:', error);
      return null;
    }
  }

  /**
   * Converter VAPID public key
   */
  function urlBase64ToUint8Array(base64String) {
    if (!base64String) return new Uint8Array();

    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Export PWA utilities
  window.PWA = {
    isStandalone: isPWA,
    register: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        return await deferredPrompt.userChoice;
      }
      return { outcome: 'dismissed' };
    },
    clearCache: () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
    },
    showNotification: async (title, options = {}) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, {
          badge: '/icon-192.png',
          icon: '/icon-512.png',
          ...options
        });
      }
    },
    subscribeToPush: async () => {
      const registration = await navigator.serviceWorker.ready;
      return await subscribeToPush(registration);
    },
    forceSync: async () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'FORCE_SYNC' });
      }
    }
  };
})();
