let currentTarget = 'calendar';

function isDesktopViewport() {
  return window.matchMedia('(min-width: 901px)').matches;
}

/**
 * Fonte única de navegação: qualquer botão com [data-target], esteja ele no
 * nav-strip do desktop ou na mobile-tabbar, é sincronizado por aqui.
 *
 * `options.keepChatState` evita reabrir a SX automaticamente no desktop —
 * usado apenas pelo botão "Ver Sementes" (Histórico), que fecha a SX de
 * propósito para navegar. Fora desse caso, a SX permanece sempre aberta no
 * desktop após login e troca de views, sem exigir clique manual.
 */
export function activateView(target, options = {}) {
  currentTarget = target;
  const navButtons = document.querySelectorAll('[data-target]');
  const sidebars = document.querySelectorAll('.sidebar-section');
  const views = document.querySelectorAll('.view-container');

  navButtons.forEach(button => {
    const active = button.dataset.target === target;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  sidebars.forEach(sidebar => {
    const active = sidebar.id === `sidebar-${target}`;
    sidebar.classList.toggle('active', active);
    sidebar.style.display = active ? 'flex' : 'none';
  });
  views.forEach(view => {
    const active = view.id === `view-${target}`;
    view.classList.toggle('active', active);
    view.style.display = active ? 'flex' : 'none';
  });

  if (target === 'settings') {
    const activeItem = document.querySelector('.settings-nav [data-settings].active')
      || document.querySelector('.settings-nav [data-settings="account"]');
    document.dispatchEvent(new CustomEvent('timetasks:settings-section', {
      detail: { section: activeItem?.dataset.settings || 'account' }
    }));
  }

  if (isDesktopViewport() && !options.keepChatState) {
    setChatOpen(true);
  }
}

export function getActiveView() {
  return currentTarget;
}

/**
 * Abre/fecha a SX e sincroniza todos os controles que a controlam
 * (botão do nav-strip no desktop e botão circular no mobile).
 */
export function setChatOpen(open) {
  const assistant = document.getElementById('ai-sidebar');
  if (!assistant) return;
  const resolved = open ?? !assistant.classList.contains('ai-sidebar--open');
  assistant.classList.toggle('ai-sidebar--open', resolved);
  assistant.setAttribute('aria-hidden', String(!resolved));
  document.querySelectorAll('[data-chat-toggle]').forEach(button => {
    button.classList.toggle('active', resolved);
    button.setAttribute('aria-expanded', String(resolved));
  });
  // Focar o input só no desktop: no mobile o foco automático levanta o
  // teclado por cima da conversa e pode disparar o zoom de foco do iOS —
  // a conversa deve abrir enquadrada, em escala 1:1.
  if (resolved && isDesktopViewport()) document.getElementById('ai-input')?.focus();
  return resolved;
}

export function isChatOpen() {
  return document.getElementById('ai-sidebar')?.classList.contains('ai-sidebar--open') ?? false;
}

async function setAiTab(tab) {
  document.querySelectorAll('.ai-header-tab[data-ai-tab]').forEach(button => {
    const active = button.dataset.aiTab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const chatPane = document.getElementById('ai-pane-chat');
  const notificationsPane = document.getElementById('ai-pane-notifications');
  const inputArea = document.getElementById('ai-chat-input-area');
  if (chatPane) {
    chatPane.classList.toggle('active', tab === 'chat');
    chatPane.style.display = tab === 'chat' ? 'flex' : 'none';
  }
  if (notificationsPane) {
    notificationsPane.classList.toggle('active', tab === 'notifications');
    notificationsPane.style.display = tab === 'notifications' ? 'flex' : 'none';
  }
  if (inputArea) inputArea.style.display = tab === 'chat' ? 'flex' : 'none';
  if (tab === 'notifications') {
    try {
      const { renderNotifications } = await import('./triggers.js');
      await renderNotifications();
    } catch (err) {
      console.warn('Notificações indisponíveis:', err.message);
    }
    document.dispatchEvent(new Event('timetasks:notifications-viewed'));
  }
}

export function initNavigation() {
  document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', () => activateView(button.dataset.target));
  });

  document.querySelectorAll('[data-chat-toggle]').forEach(button => {
    button.addEventListener('click', () => setChatOpen());
  });

  document.getElementById('btn-ai-history')?.addEventListener('click', () => {
    setChatOpen(false);
    activateView('seeds', { keepChatState: true });
  });

  document.addEventListener('timetasks:session', event => {
    // Bate-papo é a tela inicial após o login em qualquer viewport: no
    // desktop a SX fica sempre aberta ao lado; no mobile ela abre por cima
    // do calendário, que permanece como view ativa por baixo.
    if (event.detail?.user) setChatOpen(true);
  });

  document.querySelectorAll('.ai-header-tab[data-ai-tab]').forEach(button => {
    button.addEventListener('click', () => setAiTab(button.dataset.aiTab));
  });

  document.querySelectorAll('.settings-nav [data-settings]').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    const openSection = () => {
      document.querySelectorAll('.settings-nav [data-settings]').forEach(current => current.classList.remove('active'));
      item.classList.add('active');
      document.dispatchEvent(new CustomEvent('timetasks:settings-section', {
        detail: { section: item.dataset.settings }
      }));
    };
    item.addEventListener('click', openSection);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSection();
      }
    });
  });

  activateView('calendar');
}
