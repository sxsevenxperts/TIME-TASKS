// ============================================================
// theme.js — Gerenciamento de tema dark/light
// ============================================================

const THEME_KEY = 'time-tasks-theme';

/**
 * Inicializa o tema baseado na preferência salva ou do sistema
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');

  applyTheme(theme);

  // Escuta mudanças no tema do sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // Toggle button
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }
}

/**
 * Aplica o tema ao documento
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Atualiza meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#050705' : '#78c900');
  }
}

export function setThemePreference(preference = 'system') {
  if (preference === 'system') {
    localStorage.removeItem(THEME_KEY);
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    return;
  }
  localStorage.setItem(THEME_KEY, preference);
  applyTheme(preference);
}

/**
 * Retorna o tema atual
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}
