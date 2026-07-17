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
    Notification.requestPermission();
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
    }
  };
})();
