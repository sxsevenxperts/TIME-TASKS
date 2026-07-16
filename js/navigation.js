// ============================================================
// navigation.js — Controla a navegação principal (Nav Strip)
// ============================================================

export function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-strip .nav-btn');
  const sidebarSections = document.querySelectorAll('.sidebar-section');
  const viewContainers = document.querySelectorAll('.view-container');
  const btnToggleChat = document.getElementById('btn-toggle-chat');
  const aiSidebar = document.getElementById('ai-sidebar');

  // Nav Strip Toggle
  navBtns.forEach(btn => {
    if(btn.id === 'btn-toggle-chat') return; // Skip chat toggle

    btn.addEventListener('click', () => {
      // Remover active de todos
      navBtns.forEach(b => b.classList.remove('active'));
      sidebarSections.forEach(s => s.classList.remove('active'));
      viewContainers.forEach(v => v.classList.remove('active'));

      // Adicionar active no clicado
      btn.classList.add('active');
      const target = btn.dataset.target;

      // Ativar sidebar correspondente
      const sidebarId = `sidebar-${target}`;
      const sidebarTarget = document.getElementById(sidebarId);
      if (sidebarTarget) {
        sidebarTarget.classList.add('active');
        sidebarTarget.style.display = 'flex'; // Certificar de mostrar
      }
      
      // Esconder os outros sidebars via inline style (por causa do display flex original)
      sidebarSections.forEach(s => {
        if(s.id !== sidebarId) s.style.display = 'none';
      });

      // Ativar view correspondente
      const viewId = `view-${target}`;
      const viewTarget = document.getElementById(viewId);
      if (viewTarget) {
        viewTarget.classList.add('active');
        viewTarget.style.display = 'flex';
      }
      
      // Esconder os outros views via inline style
      viewContainers.forEach(v => {
        if(v.id !== viewId) v.style.display = 'none';
      });
    });
  });

  // Chat Toggle
  if (btnToggleChat && aiSidebar) {
    btnToggleChat.addEventListener('click', () => {
      const isVisible = aiSidebar.classList.contains('ai-sidebar--open');
      if (isVisible) {
        aiSidebar.classList.remove('ai-sidebar--open');
        btnToggleChat.classList.remove('active');
        btnToggleChat.setAttribute('aria-expanded', 'false');
        aiSidebar.setAttribute('aria-hidden', 'true');
      } else {
        aiSidebar.classList.add('ai-sidebar--open');
        btnToggleChat.classList.add('active');
        btnToggleChat.setAttribute('aria-expanded', 'true');
        aiSidebar.setAttribute('aria-hidden', 'false');
        document.getElementById('ai-input')?.focus();
      }
    });
  }

  // Settings sub-navigation (fake)
  const settingsItems = document.querySelectorAll('.settings-nav li');
  settingsItems.forEach(item => {
    item.addEventListener('click', () => {
      settingsItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}
