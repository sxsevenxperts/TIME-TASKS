/**
 * Push Notifications Manager for JWS PWA
 * Gerencia inscrições push e envio de notificações
 */

import { supabase } from './supabase.js';

// No navegador a env é injetada pelo Vite via import.meta.env (process.env
// não existe no bundle do cliente).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Garante a inscrição push deste aparelho: exige suporte do navegador,
 * permissão de notificação já concedida e chave VAPID no build.
 * Idempotente — reaproveita a inscrição existente e re-salva no banco.
 */
export async function ensurePushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('Push indisponível: VITE_VAPID_PUBLIC_KEY ausente do build.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await savePushSubscription(existing);
      return existing;
    }
    return await subscribeToPush(registration);
  } catch (error) {
    console.error('Erro ao garantir inscrição push:', error);
    return null;
  }
}

/**
 * Inscreve o aparelho automaticamente a cada sessão (se a permissão já foi
 * concedida) — mantém a inscrição viva e sincronizada com o banco.
 */
export function initPushNotifications() {
  document.addEventListener('timetasks:session', event => {
    if (event.detail?.user) void ensurePushSubscription();
  });
}

/**
 * Registra notificação push
 */
export async function subscribeToPush(registration) {
  if (!registration || !VAPID_PUBLIC_KEY) {
    console.warn('Push notifications não disponível (VAPID_PUBLIC_KEY ausente)');
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Salvar subscription no servidor/banco
    await savePushSubscription(subscription);

    console.log('✅ Inscrito em notificações push');
    return subscription;
  } catch (error) {
    console.error('Erro ao se inscrever em push:', error);
    return null;
  }
}

/**
 * Remove inscrição push
 */
export async function unsubscribeFromPush(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await subscription.unsubscribe();
    await removePushSubscription(subscription);

    console.log('❌ Desinscrição de push completada');
  } catch (error) {
    console.error('Erro ao desinscrever de push:', error);
  }
}

/**
 * Verifica status de inscrição push
 */
export async function getPushSubscription(registration) {
  if (!registration) return null;

  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Erro ao obter subscription:', error);
    return null;
  }
}

/**
 * Salva subscription no banco de dados
 */
async function savePushSubscription(subscription) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  try {
    const endpoint = subscription.endpoint;
    const auth = subscription.getKey('auth');
    const p256dh = subscription.getKey('p256dh');

    const { error } = await supabase.from('time_tasks_push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint,
        auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
        subscribed_at: new Date().toISOString()
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao salvar push subscription:', error);
  }
}

/**
 * Remove subscription do banco
 */
async function removePushSubscription(subscription) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  try {
    const { error } = await supabase
      .from('time_tasks_push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao remover push subscription:', error);
  }
}

/**
 * Converte VAPID public key para Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Envia notificação simples (testes)
 */
export async function sendTestNotification(title = 'Time Tasks', options = {}) {
  const registration = await navigator.serviceWorker.ready;

  const defaultOptions = {
    body: 'Teste de notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'test-notification',
    ...options
  };

  try {
    await registration.showNotification(title, defaultOptions);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}

/**
 * Notificação de evento próximo
 */
export async function notifyUpcomingEvent(event) {
  const registration = await navigator.serviceWorker.ready;

  const options = {
    body: `${event.start_time} — ${event.description || 'Sem descrição'}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `event-${event.id}`,
    data: {
      eventId: event.id,
      action: 'open-event'
    }
  };

  try {
    await registration.showNotification(`🕐 ${event.title}`, options);
  } catch (error) {
    console.error('Erro ao notificar evento:', error);
  }
}

/**
 * Notificação de tarefa
 */
export async function notifyTaskReminder(task) {
  const registration = await navigator.serviceWorker.ready;

  const options = {
    body: task.description || 'Sem descrição',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `task-${task.id}`,
    data: {
      taskId: task.id,
      action: 'open-task'
    }
  };

  try {
    await registration.showNotification(`✓ ${task.title}`, options);
  } catch (error) {
    console.error('Erro ao notificar tarefa:', error);
  }
}

/**
 * Notificação de sincronização
 */
export async function notifySyncStatus(status, message) {
  const registration = await navigator.serviceWorker.ready;

  const options = {
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'sync-status'
  };

  const title = status === 'success' ? '✅ Sincronizado' : '⚠️ Erro na sincronização';

  try {
    await registration.showNotification(title, options);
  } catch (error) {
    console.error('Erro ao notificar sync:', error);
  }
}

export default {
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  sendTestNotification,
  notifyUpcomingEvent,
  notifyTaskReminder,
  notifySyncStatus
};
