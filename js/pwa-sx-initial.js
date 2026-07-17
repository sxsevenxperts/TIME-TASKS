/**
 * PWA SX Initial Screen
 * Configura SX Chat como tela inicial do PWA JWS
 * Auto-login → direto pro bate-papo, nenhuma tela de login
 */

import { supabase } from './supabase.js';
import { silentAutoLogin } from './persistent-auth.js';

/**
 * Inicializa tela SX para PWA
 * Chamado após auto-login bem-sucedido
 */
export async function initPWASXInitial() {
  // Detectar se é PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  if (!isPWA) {
    return; // Não é PWA, usar layout normal
  }

  console.log('📱 Inicializando PWA SX Initial Screen');

  // Mostrar SX como tela principal
  configureInitialLayout();

  // Ativar voice input (mobile)
  setupVoiceInputDefault();

  // Carregar contexto (próximos eventos, tarefas)
  await loadInitialContext();

  // Setup quick actions
  setupQuickActions();
}

/**
 * Configura layout inicial para mostrar SX fullscreen
 */
function configureInitialLayout() {
  const appLayout = document.querySelector('.app-layout');
  const sxPanel = document.getElementById('sx-panel');
  const navigationBar = document.querySelector('.navigation-bottom');

  if (!appLayout || !sxPanel) return;

  // PWA: SX em fullscreen
  appLayout.classList.add('pwa-sx-initial');

  // Mostrar SX
  if (sxPanel) {
    sxPanel.style.display = 'flex';
  }

  // Esconder calendário/main content
  const mainContent = document.querySelector('.calendar-container') ||
    document.querySelector('[data-view]');
  if (mainContent) {
    mainContent.style.display = 'none';
  }

  // Navigation: mostrar só SX ou ocultar
  if (navigationBar) {
    navigationBar.classList.add('pwa-sx-mode');
  }

  console.log('✅ Layout PWA SX configurado');
}

/**
 * Ativa voice input por padrão (mobile)
 */
function setupVoiceInputDefault() {
  const isMobile = window.innerWidth <= 768;

  if (!isMobile) return;

  // Focar no campo de voz
  setTimeout(() => {
    const voiceButton = document.getElementById('sx-voice-button');
    const inputField = document.querySelector('[data-sx-input]');

    if (voiceButton) {
      // Mostrar placeholder sugerindo voz
      if (inputField) {
        inputField.placeholder = '🎤 Fale com a SX...';
      }

      // Se tiver permissão, ativar voz automaticamente após 2s
      if ('Notification' in window && Notification.permission === 'granted') {
        console.log('💬 Voice ready');
      }
    }
  }, 500);
}

/**
 * Carrega contexto inicial (próximos eventos, tarefas)
 */
async function loadInitialContext() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // Buscar próximos eventos (próximas 24h)
    const { data: upcomingEvents } = await supabase
      .from('time_tasks_events')
      .select('id, title, start_time, completed')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .order('start_time', { ascending: true })
      .limit(5);

    // Buscar tarefas pendentes
    const { data: pendingTasks } = await supabase
      .from('time_tasks_seeds')
      .select('id, title, completed')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(3);

    // Guardar no sessionStorage para SX usar como contexto
    if (upcomingEvents && upcomingEvents.length > 0) {
      sessionStorage.setItem(
        'pwa_context_events',
        JSON.stringify(upcomingEvents)
      );
    }

    if (pendingTasks && pendingTasks.length > 0) {
      sessionStorage.setItem(
        'pwa_context_tasks',
        JSON.stringify(pendingTasks)
      );
    }

    // Enviar mensagem de boas-vindas (opcional)
    showWelcomeMessage(upcomingEvents, pendingTasks);

    console.log('✅ Contexto carregado');
  } catch (error) {
    console.error('Erro ao carregar contexto:', error);
  }
}

/**
 * Mostra mensagem de boas-vindas com contexto
 */
async function showWelcomeMessage(events, tasks) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const displayName = user.user_metadata?.display_name || user.email.split('@')[0];

  let message = `Olá, ${displayName}! 👋`;

  if (events && events.length > 0) {
    message += `\n\nVocê tem ${events.length} evento${events.length > 1 ? 's' : ''} próximo${events.length > 1 ? 's' : ''}:`;
    events.slice(0, 3).forEach((evt) => {
      const time = new Date(evt.start_time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      message += `\n• ${time} — ${evt.title}`;
    });
  }

  if (tasks && tasks.length > 0) {
    message += `\n\nE ${tasks.length} tarefa${tasks.length > 1 ? 's' : ''} pendente${tasks.length > 1 ? 's' : ''}`;
  }

  // Mostrar no painel SX (como mensagem do sistema)
  const sxMessages = document.querySelector('[data-sx-messages]');
  if (sxMessages) {
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'sx-message sx-initial-welcome';
    welcomeMsg.textContent = message;
    welcomeMsg.style.cssText = `
      padding: 12px;
      background: rgba(155, 232, 0, 0.1);
      border-left: 3px solid #9be800;
      margin: 8px 0;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    `;
    sxMessages.appendChild(welcomeMsg);
    sxMessages.scrollTop = sxMessages.scrollHeight;
  }
}

/**
 * Setup quick actions (botões flutuantes)
 */
function setupQuickActions() {
  const isMobile = window.innerWidth <= 768;

  if (!isMobile) return;

  // Criar quick actions
  const quickActions = document.createElement('div');
  quickActions.className = 'pwa-quick-actions';
  quickActions.innerHTML = `
    <div class="quick-action-row">
      <button class="quick-action" data-action="new-event" title="Novo Evento">
        📅 Evento
      </button>
      <button class="quick-action" data-action="new-task" title="Nova Tarefa">
        ✓ Tarefa
      </button>
      <button class="quick-action" data-action="view-agenda" title="Ver Agenda">
        📋 Agenda
      </button>
    </div>
  `;

  // Estilo
  quickActions.style.cssText = `
    position: fixed;
    bottom: 70px;
    left: 0;
    right: 0;
    padding: 8px;
    display: flex;
    justify-content: center;
    gap: 4px;
    z-index: 40;
    background: transparent;
  `;

  const actionButtons = quickActions.querySelectorAll('.quick-action');
  actionButtons.forEach((btn) => {
    btn.style.cssText = `
      padding: 8px 12px;
      background: rgba(155, 232, 0, 0.9);
      color: #050705;
      border: none;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(155, 232, 0, 1)';
      btn.style.transform = 'scale(1.05)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(155, 232, 0, 0.9)';
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      handleQuickAction(action);
    });
  });

  document.body.appendChild(quickActions);
  console.log('✅ Quick actions criadas');
}

/**
 * Handle quick action click
 */
function handleQuickAction(action) {
  const sxInput = document.querySelector('[data-sx-input]');

  switch (action) {
    case 'new-event':
      if (sxInput) {
        sxInput.value = 'Criar novo evento ';
        sxInput.focus();
      }
      break;

    case 'new-task':
      if (sxInput) {
        sxInput.value = 'Criar nova tarefa ';
        sxInput.focus();
      }
      break;

    case 'view-agenda':
      // Alternar para calendário
      document.dispatchEvent(new CustomEvent('pwa-action', {
        detail: { action: 'show-agenda' }
      }));
      break;
  }
}

/**
 * Escuta evento de sair do modo SX
 */
export function setupSXModeToggle() {
  const calendarContainer = document.querySelector('.calendar-container');
  const sxPanel = document.getElementById('sx-panel');

  if (!calendarContainer || !sxPanel) return;

  // Botão de voltar para agenda (se existir)
  const backButton = sxPanel.querySelector('[data-back-to-calendar]');
  if (backButton) {
    backButton.addEventListener('click', () => {
      sxPanel.style.display = 'none';
      calendarContainer.style.display = 'block';
    });
  }

  // Listener de ação PWA
  document.addEventListener('pwa-action', (e) => {
    if (e.detail.action === 'show-agenda') {
      sxPanel.style.display = 'none';
      calendarContainer.style.display = 'block';
    } else if (e.detail.action === 'show-sx') {
      sxPanel.style.display = 'flex';
      calendarContainer.style.display = 'none';
    }
  });
}

export default {
  initPWASXInitial,
  setupSXModeToggle
};
