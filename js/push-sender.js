// Push Sender — envio de Web Push pelo servidor (Node)
// Chaves VAPID vêm do ambiente; sem elas o envio fica desativado sem quebrar
// o boot. Inscrições expiradas (404/410) são removidas do banco.

import webpush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:contato@sevenxperts.solutions';

let enabled = false;

export function initPushSender() {
  if (!publicKey || !privateKey) {
    console.warn('⚠️  Web Push desativado: defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no ambiente.');
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  enabled = true;
  console.log('✅ Web Push habilitado');
  return true;
}

export function isPushEnabled() {
  return enabled;
}

/**
 * Envia um push para todos os aparelhos inscritos do usuário.
 * payload: { title, body, tag, data } — formato consumido pelo handler
 * `push` do service-worker.js.
 * Retorna o número de envios bem-sucedidos.
 */
export async function sendPushToUser(supabaseUrl, serviceRoleKey, userId, payload) {
  if (!enabled || !supabaseUrl || !serviceRoleKey || !userId) return 0;

  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey
  };

  let subscriptions = [];
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/time_tasks_push_subscriptions?user_id=eq.${userId}&select=id,endpoint,auth,p256dh`,
      { headers }
    );
    if (!response.ok) return 0;
    subscriptions = await response.json();
  } catch (error) {
    console.error('Erro ao buscar inscrições push:', error.message);
    return 0;
  }

  const body = JSON.stringify(payload);
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        body
      );
      sent += 1;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Inscrição morta (app desinstalado, permissão revogada) — limpar
        await fetch(
          `${supabaseUrl}/rest/v1/time_tasks_push_subscriptions?id=eq.${sub.id}`,
          { method: 'DELETE', headers }
        ).catch(() => {});
      } else {
        console.error('Erro ao enviar push:', error.statusCode || error.message);
      }
    }
  }

  return sent;
}
