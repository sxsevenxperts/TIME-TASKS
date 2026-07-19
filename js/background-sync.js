/**
 * Background Sync for JWS PWA
 * Sincroniza dados offline quando reconectar
 */

import { supabase } from './supabase.js';
import { loadEventsFromServer } from './events.js';
import { refreshCalendar } from './calendar.js';

const SYNC_TAG_EVENTS = 'sync-events';
const SYNC_TAG_TASKS = 'sync-tasks';
const SYNC_TAG_CALENDARS = 'sync-calendars';

/**
 * Registra background sync
 */
export async function registerBackgroundSync() {
  const registration = await navigator.serviceWorker.ready;

  if (!('sync' in registration)) {
    console.warn('Background Sync não suportado');
    return;
  }

  try {
    // Registrar sync tag padrão
    await registration.sync.register(SYNC_TAG_EVENTS);
    console.log('✅ Background Sync registrado para eventos');
  } catch (error) {
    console.error('Erro ao registrar background sync:', error);
  }
}

/**
 * Detecta mudança de conectividade e dispara sync
 */
export function setupSyncListener() {
  window.addEventListener('online', async () => {
    console.log('🌐 Conectado! Iniciando sincronização...');

    try {
      // Sincronizar eventos
      await syncEvents();

      // Sincronizar calendários (Google, Apple)
      await syncCalendars();

      // Recarregar UI
      await loadEventsFromServer();
      refreshCalendar();

      console.log('✅ Sincronização concluída');

      // Notificar usuário
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification('✅ Dados sincronizados', {
          body: 'Seus eventos e tarefas foram atualizados',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'sync-complete'
        });
      }
    } catch (error) {
      console.error('Erro na sincronização automática:', error);

      // Notificar erro
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification('⚠️ Erro na sincronização', {
          body: 'Tente novamente mais tarde',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'sync-error'
        });
      }
    }
  });

  window.addEventListener('offline', () => {
    console.log('📴 Offline! Modo local ativado');

    // Notificar usuário
    const notification = document.createElement('div');
    notification.className = 'offline-notice';
    notification.textContent = '📴 Modo offline — dados serão sincronizados ao conectar';
    document.body.appendChild(notification);
  });
}

/**
 * Sincroniza eventos
 */
export async function syncEvents() {
  try {
    console.log('Sincronizando eventos...');

    // Buscar eventos do servidor
    await loadEventsFromServer();

    // Tentar enviar eventos locais pendentes
    const localEvents = localStorage.getItem('pending_events');
    if (localEvents) {
      const events = JSON.parse(localEvents);
      for (const event of events) {
        try {
          const { error } = await supabase
            .from('time_tasks_events')
            .insert(event);

          if (!error) {
            // Remover do pendente
            const remaining = events.filter(e => e.id !== event.id);
            if (remaining.length > 0) {
              localStorage.setItem('pending_events', JSON.stringify(remaining));
            } else {
              localStorage.removeItem('pending_events');
            }
          }
        } catch (err) {
          console.warn('Falha ao sincronizar evento individual:', err);
        }
      }
    }

    console.log('✅ Eventos sincronizados');
  } catch (error) {
    console.error('Erro ao sincronizar eventos:', error);
    throw error;
  }
}

/**
 * Sincroniza tarefas
 */
export async function syncTasks() {
  try {
    console.log('Sincronizando tarefas...');

    // Buscar tarefas do servidor
    const { data, error } = await supabase
      .from('time_tasks_seeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Armazenar localmente
    localStorage.setItem('tasks', JSON.stringify(data || []));

    // Tentar enviar tarefas pendentes
    const localTasks = localStorage.getItem('pending_tasks');
    if (localTasks) {
      const tasks = JSON.parse(localTasks);
      for (const task of tasks) {
        try {
          const { error: insertError } = await supabase
            .from('time_tasks_seeds')
            .insert(task);

          if (!insertError) {
            const remaining = tasks.filter(t => t.id !== task.id);
            if (remaining.length > 0) {
              localStorage.setItem('pending_tasks', JSON.stringify(remaining));
            } else {
              localStorage.removeItem('pending_tasks');
            }
          }
        } catch (err) {
          console.warn('Falha ao sincronizar tarefa individual:', err);
        }
      }
    }

    console.log('✅ Tarefas sincronizadas');
  } catch (error) {
    console.error('Erro ao sincronizar tarefas:', error);
    throw error;
  }
}

/**
 * Sincroniza calendários (Google, Apple)
 */
export async function syncCalendars() {
  try {
    console.log('Sincronizando calendários...');

    // Obter token com timeout (iOS PWA pode congelar auth calls)
    const { data: sessionData, error: sessionError } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 5000))
    ]).then(
      result => ({ data: result, error: null }),
      error => ({ data: null, error })
    );

    const token = sessionData?.session?.access_token;
    if (!token) {
      console.warn('Token não disponível para sincronização de calendários');
      throw new Error('No auth token available');
    }

    // Chamar endpoint de sincronização
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sync falhou: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Calendários sincronizados:', result);

    return result;
  } catch (error) {
    console.error('Erro ao sincronizar calendários:', error);
    throw error;
  }
}

/**
 * Força sincronização manual
 */
export async function forceSync() {
  console.log('Forçando sincronização...');

  try {
    await syncEvents();
    await syncTasks();
    await syncCalendars();

    console.log('✅ Sincronização manual concluída');
    return { success: true };
  } catch (error) {
    console.error('Erro na sincronização manual:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Armazena evento pendente (offline)
 */
export function savePendingEvent(event) {
  const pending = JSON.parse(localStorage.getItem('pending_events') || '[]');
  pending.push({
    ...event,
    offline_created: true,
    offline_created_at: new Date().toISOString()
  });
  localStorage.setItem('pending_events', JSON.stringify(pending));
  console.log('📱 Evento salvo offline — será sincronizado ao conectar');
}

/**
 * Armazena tarefa pendente (offline)
 */
export function savePendingTask(task) {
  const pending = JSON.parse(localStorage.getItem('pending_tasks') || '[]');
  pending.push({
    ...task,
    offline_created: true,
    offline_created_at: new Date().toISOString()
  });
  localStorage.setItem('pending_tasks', JSON.stringify(pending));
  console.log('📱 Tarefa salva offline — será sincronizada ao conectar');
}

export default {
  registerBackgroundSync,
  setupSyncListener,
  syncEvents,
  syncTasks,
  syncCalendars,
  forceSync,
  savePendingEvent,
  savePendingTask
};
