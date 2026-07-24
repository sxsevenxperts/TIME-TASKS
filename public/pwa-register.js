// PWA Service Worker Registration & Features
(() => {
  // Register Service Worker; tudo que depende do registration fica dentro
  // do .then — antes, vários blocos usavam a variável fora do escopo e o
  // ReferenceError derrubava o script inteiro (inclusive window.PWA).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Verificar atualizações do SW a cada minuto (descobre novos deploys)
        setInterval(() => {
          registration.update();
        }, 60000);

        // Auth check não é necessário no SW (sem localStorage); client gerencia
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Deploy novo → SW novo assume (skipWaiting + clients.claim) → recarrega a
    // página UMA vez para trocar o bundle em memória. Sem isso, abas/PWA
    // abertos continuam rodando o JavaScript antigo indefinidamente (foi o que
    // fez testes pós-deploy rodarem código velho em 2026-07-23).
    // hadController: na PRIMEIRA instalação (página ainda sem controller) o
    // controllerchange também dispara — não recarregar nesse caso, para não
    // interromper o primeiro acesso/login.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloadedBySW = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloadedBySW) return;
      reloadedBySW = true;
      window.location.reload();
    });
  }

  // A inscrição em Web Push é responsabilidade do app (js/push-notifications.js),
  // após a permissão concedida em Ajustes → Notificações.

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
    forceSync: async () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'FORCE_SYNC' });
      }
    }
  };
})();
