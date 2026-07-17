/**
 * Periodic Sync for JWS PWA
 * Atualiza calendários a cada 24h sem abrir o app
 */

import { supabase } from './supabase.js';

const SYNC_CALENDARS_TAG = 'sync-calendars-24h';
const SYNC_REMINDERS_TAG = 'sync-reminders-daily';

/**
 * Registra periodic sync (24h)
 */
export async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready;

  if (!('periodicSync' in registration)) {
    console.warn('Periodic Sync não suportado (Chrome 80+, Edge 80+, Opera 67+)');
    return;
  }

  try {
    // Sincronizar calendários a cada 24 horas
    await registration.periodicSync.register(SYNC_CALENDARS_TAG, {
      minInterval: 24 * 60 * 60 * 1000 // 24 horas
    });

    console.log('✅ Periodic Sync registrado (calendários a cada 24h)');

    // Opcional: sincronizar lembretes 2x ao dia
    await registration.periodicSync.register(SYNC_REMINDERS_TAG, {
      minInterval: 12 * 60 * 60 * 1000 // 12 horas
    });

    console.log('✅ Periodic Sync registrado (lembretes a cada 12h)');
  } catch (error) {
    console.error('Erro ao registrar periodic sync:', error);
  }
}

/**
 * Obtém status de periodic sync
 */
export async function getPeriodicSyncTags() {
  const registration = await navigator.serviceWorker.ready;

  if (!('periodicSync' in registration)) {
    return [];
  }

  try {
    return await registration.periodicSync.getTags();
  } catch (error) {
    console.error('Erro ao obter periodic sync tags:', error);
    return [];
  }
}

/**
 * Cancela periodic sync
 */
export async function unregisterPeriodicSync(tag) {
  const registration = await navigator.serviceWorker.ready;

  if (!('periodicSync' in registration)) {
    return false;
  }

  try {
    await registration.periodicSync.unregister(tag);
    console.log(`❌ Periodic Sync cancelado: ${tag}`);
    return true;
  } catch (error) {
    console.error('Erro ao cancelar periodic sync:', error);
    return false;
  }
}

/**
 * Handler do periodic sync (rodado no Service Worker)
 * Chamado via: self.addEventListener('periodicsync', handler)
 */
export async function handlePeriodicSync(tag) {
  console.log(`⏰ Periodic Sync disparado: ${tag}`);

  try {
    switch (tag) {
      case SYNC_CALENDARS_TAG:
        await syncCalendarsBackground();
        break;

      case SYNC_REMINDERS_TAG:
        await checkRemindersBackground();
        break;

      default:
        console.warn(`Tag de periodic sync desconhecida: ${tag}`);
    }
  } catch (error) {
    console.error(`Erro no periodic sync (${tag}):`, error);
    throw error; // Faz retry automático
  }
}

/**
 * Sincroniza calendários em background (rodado pelo SW)
 */
async function syncCalendarsBackground() {
  try {
    console.log('🔄 Sincronizando calendários em background...');

    // Precisamos de autenticação, que está no localStorage
    const authData = localStorage.getItem('timetasks_auth_persistent');
    if (!authData) {
      console.warn('Sem autenticação, pulando sync de calendários');
      return;
    }

    const { accessToken } = JSON.parse(authData);

    // Chamar endpoint de sincronização
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(60_000) // 60 segundos
    });

    if (!response.ok) {
      throw new Error(`Sync falhou: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Calendários sincronizados em background:', result);

    // Notificar usuário
    await notifyCalendarSync(result);
  } catch (error) {
    console.error('Erro ao sincronizar calendários em background:', error);
    // Não fazer re-throw para evitar retry infinito
  }
}

/**
 * Verifica lembretes em background
 */
async function checkRemindersBackground() {
  try {
    console.log('🔔 Verificando lembretes em background...');

    const authData = localStorage.getItem('timetasks_auth_persistent');
    if (!authData) {
      console.warn('Sem autenticação, pulando check de lembretes');
      return;
    }

    const { accessToken, user } = JSON.parse(authData);

    // Buscar eventos próximos
    const response = await fetch(
      `/api/reminders?days=1&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30_000)
      }
    );

    if (!response.ok) throw new Error('Falha ao buscar lembretes');

    const reminders = await response.json();
    console.log(`🔔 ${reminders.length} lembretes encontrados`);

    // Notificar próximos lembretes
    for (const reminder of reminders) {
      await notifyReminder(reminder);
    }
  } catch (error) {
    console.error('Erro ao verificar lembretes em background:', error);
  }
}

/**
 * Notifica sincronização de calendários
 */
async function notifyCalendarSync(result) {
  try {
    const title = result.success ? '✅ Calendários atualizados' : '⚠️ Erro na sincronização';
    const body = `${result.events_synced || 0} eventos sincronizados`;

    // Enviar notificação via postMessage
    if (typeof self !== 'undefined' && 'registration' in self) {
      // No Service Worker
      self.registration?.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'calendar-sync',
        silent: true // Não fazer som (background)
      });
    }
  } catch (error) {
    console.error('Erro ao notificar sync de calendários:', error);
  }
}

/**
 * Notifica lembrete
 */
async function notifyReminder(reminder) {
  try {
    const title = reminder.title || 'Lembrete';
    const body = reminder.description || 'Você tem um lembrete próximo';

    if (typeof self !== 'undefined' && 'registration' in self) {
      await self.registration?.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `reminder-${reminder.id}`,
        data: {
          reminderId: reminder.id
        }
      });
    }
  } catch (error) {
    console.error('Erro ao notificar lembrete:', error);
  }
}

/**
 * Retorna intervalo configurado (minInterval)
 */
export function getPeriodicSyncInterval(tag) {
  const intervals = {
    [SYNC_CALENDARS_TAG]: 24 * 60 * 60 * 1000,
    [SYNC_REMINDERS_TAG]: 12 * 60 * 60 * 1000
  };
  return intervals[tag] || null;
}

export default {
  registerPeriodicSync,
  getPeriodicSyncTags,
  unregisterPeriodicSync,
  handlePeriodicSync,
  getPeriodicSyncInterval
};
