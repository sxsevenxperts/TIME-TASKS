let currentTarget = 'calendar';

export function activateView(target) {
  currentTarget = target;
  const navButtons = document.querySelectorAll('.nav-strip .nav-btn[data-target]');
  const sidebars = document.querySelectorAll('.sidebar-section');
  const views = document.querySelectorAll('.view-container');

  navButtons.forEach(button => button.classList.toggle('active', button.dataset.target === target));
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
}

export function getActiveView() {
  return currentTarget;
}

export function initNavigation() {
  document.querySelectorAll('.nav-strip .nav-btn[data-target]').forEach(button => {
    button.addEventListener('click', () => activateView(button.dataset.target));
  });

  const chatButton = document.getElementById('btn-toggle-chat');
  const assistant = document.getElementById('ai-sidebar');
  chatButton?.addEventListener('click', () => {
    const open = !assistant.classList.contains('ai-sidebar--open');
    assistant.classList.toggle('ai-sidebar--open', open);
    chatButton.classList.toggle('active', open);
    chatButton.setAttribute('aria-expanded', String(open));
    assistant.setAttribute('aria-hidden', String(!open));
    if (open) document.getElementById('ai-input')?.focus();
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
