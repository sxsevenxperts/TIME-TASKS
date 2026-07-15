// ============================================================
// app.js — Inicialização do Time Tasks
// ============================================================

import { initTheme } from './theme.js';
import { loadCalendarVisibility } from './events.js';
import { initSidebar } from './sidebar.js';
import { initModal } from './modal.js';
import { initCalendar, refreshCalendar, navigateToDate } from './calendar.js';
import { initNavigation } from './navigation.js';
import { initAI } from './ai.js';
import { initAuth } from './auth.js';

/**
 * Inicializa toda a aplicação
 */
function init() {
  // 1. Autenticação (Supabase)
  initAuth();

  // 2. Tema
  initTheme();

  // 3. Dados
  loadCalendarVisibility();

  // 3. Sidebar
  initSidebar({
    onDateSelected: (date) => {
      navigateToDate(date);
    },
    onCalendarVisibilityChange: () => {
      refreshCalendar();
    }
  });

  // 4. Modal
  initModal({
    onEventChanged: () => {
      refreshCalendar();
    }
  });

  // 5. Calendário
  initCalendar();

  // 6. Navegação
  initNavigation();

  // 7. IA (SX)
  initAI({
    onEventCreated: () => refreshCalendar()
  });

  // 8. Atalhos de teclado
  setupKeyboardShortcuts();

  console.log('🕐 Time Tasks inicializado com sucesso!');
}

/**
 * Configura atalhos de teclado
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignorar se estiver em input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }

    switch (e.key) {
      case 't':
      case 'T':
        // Ir para hoje
        document.getElementById('btn-today')?.click();
        break;
      case 'n':
      case 'N':
        // Novo evento
        document.getElementById('btn-new-event')?.click();
        break;
      case 'd':
      case 'D':
        document.querySelector('[data-view="day"]')?.click();
        break;
      case 'w':
      case 'W':
        document.querySelector('[data-view="week"]')?.click();
        break;
      case 'm':
      case 'M':
        document.querySelector('[data-view="month"]')?.click();
        break;
      case 'ArrowLeft':
        if (!e.ctrlKey && !e.metaKey) {
          document.getElementById('btn-prev')?.click();
        }
        break;
      case 'ArrowRight':
        if (!e.ctrlKey && !e.metaKey) {
          document.getElementById('btn-next')?.click();
        }
        break;
    }
  });
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
