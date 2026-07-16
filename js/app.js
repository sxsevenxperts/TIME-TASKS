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
import { initSettings } from './settings.js';
import { initSeeds } from './seeds.js';
import { initBooking, isPublicBookingRoute } from './booking.js';
import { initReminders } from './reminders.js';
import { initVerseAccess } from './verse-access.js';
import { initWeather } from './weather.js';
import { initTriggers, renderNotifications } from './triggers.js';

/**
 * Inicializa toda a aplicação
 */
function init() {
  // A página pública de agendamento funciona sem sessão.
  initTheme();
  initBooking();
  if (isPublicBookingRoute()) return;

  // Registre todos os consumidores da sessão antes de restaurar a autenticação.
  loadCalendarVisibility();
  initSidebar({
    onDateSelected: (date) => {
      navigateToDate(date);
    },
    onCalendarVisibilityChange: () => {
      refreshCalendar();
    }
  });

  initModal({
    onEventChanged: () => {
      refreshCalendar();
    }
  });

  initCalendar();
  initSettings();
  initSeeds();
  initReminders();
  initVerseAccess();
  initWeather();
  initTriggers();
  initNavigation();
  initAI({
    onEventCreated: () => refreshCalendar()
  });
  setupKeyboardShortcuts();
  void initAuth();

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
