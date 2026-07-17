# Web Push + Background Sync + Periodic Sync — JWS PWA

## Overview

Implementação completa de notificações push, sincronização offline e atualização periódica de calendários para o app JWS:

✅ **Web Push** — notificações mesmo com app fechado  
✅ **Background Sync** — sincronizar dados ao reconectar  
✅ **Periodic Sync** — atualizar calendários a cada 24h  

---

## 1. Web Push Notifications

### Como funciona

1. **Usuário ativa notificações** → browser pede permissão
2. **App registra subscription** → salva chave de push no servidor
3. **Servidor envia notificação** → Web Push API (Firebase Cloud Messaging, Sendgrid, etc.)
4. **Service Worker intercepta** → mostra notificação ao usuário
5. **Usuário clica notificação** → abre app com ação específica

### Setup

**1. Gerar VAPID Keys** (servidor)

```bash
# Instalar web-push
npm install web-push

# Gerar keys
npx web-push generate-vapid-keys

# Output:
# Public Key: BA...
# Private Key: xx...
```

**2. Configurar variáveis de ambiente**

```bash
# .env.production
VAPID_PUBLIC_KEY=BA...        # Enviar para cliente
VAPID_PRIVATE_KEY=xx...       # Guardar no servidor
```

**3. No cliente (index.html)**

```html
<script>
  window.__VAPID_PUBLIC_KEY__ = 'BA...'; // Do env público
</script>
```

### APIs Disponíveis

**Registrar push:**
```javascript
import { subscribeToPush } from './push-notifications.js';

const registration = await navigator.serviceWorker.ready;
const subscription = await subscribeToPush(registration);
// Salva em time_tasks_push_subscriptions no banco
```

**Desinscrever:**
```javascript
import { unsubscribeFromPush } from './push-notifications.js';

await unsubscribeFromPush(registration);
```

**Enviar notificação de teste:**
```javascript
import { sendTestNotification } from './push-notifications.js';

await sendTestNotification('Olá!', {
  body: 'Teste de notificação push'
});
```

**Notificar evento próximo:**
```javascript
import { notifyUpcomingEvent } from './push-notifications.js';

await notifyUpcomingEvent({
  id: 'evt-123',
  title: 'Reunião',
  start_time: '14:00',
  description: 'Com a equipe'
});
```

### Schema do Banco (Supabase)

```sql
-- Tabela de subscrições push
CREATE TABLE time_tasks_push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_subscription UNIQUE (user_id, endpoint)
);

-- RLS: apenas o usuário acessa suas subscrições
ALTER TABLE time_tasks_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their subscriptions"
  ON time_tasks_push_subscriptions
  USING (auth.uid() = user_id);
```

### Endpoint do Servidor

```javascript
// POST /api/push/subscribe
// Salva subscription do usuário

app.post('/api/push/subscribe', authenticate, async (req, res) => {
  const { subscription } = req.body;
  const user = req.user;

  // Salvar em time_tasks_push_subscriptions
  const { error } = await supabase
    .from('time_tasks_push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
      subscribed_at: new Date().toISOString()
    });

  if (error) return sendJson(res, 500, { error: error.message });

  sendJson(res, 200, { success: true });
});

// POST /api/push/send
// Envia notificação push

app.post('/api/push/send', authenticate, async (req, res) => {
  const { userId, title, body } = req.body;

  // Buscar subscriptions do usuário
  const { data: subscriptions } = await supabase
    .from('time_tasks_push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  // Enviar para cada subscription
  for (const sub of subscriptions || []) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh
      }
    };

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });

    // Usar web-push
    const webpush = await import('web-push');
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    try {
      await webpush.sendNotification(pushSubscription, payload);
    } catch (error) {
      console.error('Erro ao enviar push:', error);
      // Limpar subscription inválida
      if (error.statusCode === 410) {
        await supabase
          .from('time_tasks_push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      }
    }
  }

  sendJson(res, 200, { sent: subscriptions?.length || 0 });
});
```

---

## 2. Background Sync

### Como funciona

1. **Usuário offline** → cria evento/tarefa localmente
2. **Usuário volta online** → SW dispara `sync` event
3. **SW sincroniza** → envia dados para servidor
4. **Notifica sucesso** → usuário sabe que foi sincronizado

### APIs Disponíveis

**Registrar background sync:**
```javascript
import { registerBackgroundSync, setupSyncListener } from './background-sync.js';

await registerBackgroundSync();
setupSyncListener(); // Escuta online/offline
```

**Sincronizar manualmente:**
```javascript
import { forceSync } from './background-sync.js';

const result = await forceSync();
// { success: true/false, error? }
```

**Salvar dados offline (para sincronizar depois):**
```javascript
import { savePendingEvent, savePendingTask } from './background-sync.js';

// Quando offline
savePendingEvent({
  title: 'Meu evento',
  start_time: '14:00',
  // ...
});

savePendingTask({
  title: 'Minha tarefa',
  description: '...',
  // ...
});
```

### Fluxo

```
┌─────────────────────┐
│  Usuário Offline    │
│  Cria evento        │
│  savePendingEvent() │
└──────────┬──────────┘
           │
           ▼
    ┌─────────────┐
    │ localStorage│
    │ pending_*   │
    └──────┬──────┘
           │ [reconecta]
           ▼
    ┌──────────────────┐
    │ Service Worker   │
    │ sync event       │
    └──────┬───────────┘
           │
           ▼
    ┌────────────────────┐
    │ POST /api/sync     │
    │ Envia pending_*    │
    └──────┬─────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Servidor         │
    │ Salva eventos    │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ ✅ Sincronizado  │
    │ Limpa localStorage│
    │ Notifica usuário │
    └──────────────────┘
```

### Endpoints Necessários

```javascript
// POST /api/events/sync
// Sincroniza eventos offline

app.post('/api/events/sync', authenticate, async (req, res) => {
  const user = req.user;

  // Buscar eventos do cliente (que foram criados offline)
  // Cliente envia via body: { pending_events: [...] }

  const { pending_events } = req.body;

  for (const event of pending_events || []) {
    // Validar e salvar
    const { error } = await supabase
      .from('time_tasks_events')
      .insert({
        user_id: user.id,
        ...event
      });

    if (error) {
      console.error('Erro ao sincronizar evento:', error);
    }
  }

  sendJson(res, 200, { synced: pending_events?.length || 0 });
});
```

---

## 3. Periodic Sync

### Como funciona

1. **App instalado** → registra periodic sync (24h)
2. **A cada 24h** (ou quando o sistema acha apropriado) → SW dispara
3. **SW sincroniza calendários** → busca eventos de Google, Apple
4. **Notifica se houver mudanças** → usuário vê atualização

### APIs Disponíveis

**Registrar periodic sync:**
```javascript
import { registerPeriodicSync } from './periodic-sync.js';

await registerPeriodicSync();
// Registra 'sync-calendars-24h' + 'sync-reminders-daily'
```

**Obter status:**
```javascript
import { getPeriodicSyncTags } from './periodic-sync.js';

const tags = await getPeriodicSyncTags();
// ['sync-calendars-24h', 'sync-reminders-daily']
```

**Cancelar:**
```javascript
import { unregisterPeriodicSync } from './periodic-sync.js';

await unregisterPeriodicSync('sync-calendars-24h');
```

### Suporte

| Browser | Support | Min Version |
|---------|---------|-------------|
| Chrome | ✅ | 80+ |
| Edge | ✅ | 80+ |
| Firefox | ❌ | — |
| Safari | ❌ | — |

**Fallback:** se não suportar, não funciona (graceful degradation)

### Endpoints Necessários

```javascript
// POST /api/calendar/sync
// Sincroniza Google + Apple calendars

app.post('/api/calendar/sync', authenticate, async (req, res) => {
  const user = req.user;

  let synced = 0;

  // Sincronizar Google Calendar
  const googleIntegrations = await supabase
    .from('time_tasks_calendar_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google');

  for (const integration of googleIntegrations.data || []) {
    // Renovar token se necessário
    // Buscar eventos
    // Atualizar no banco
    synced++;
  }

  // Sincronizar Apple Calendar
  const appleIntegrations = await supabase
    .from('time_tasks_calendar_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'apple');

  for (const integration of appleIntegrations.data || []) {
    // CalDAV sync
    // Atualizar no banco
    synced++;
  }

  sendJson(res, 200, { success: true, events_synced: synced });
});

// GET /api/reminders?days=1
// Busca lembretes próximos (para periodic sync de lembretes)

app.get('/api/reminders', authenticate, async (req, res) => {
  const user = req.user;
  const days = parseInt(req.query.days) || 1;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + days);

  const { data, error } = await supabase
    .from('time_tasks_events')
    .select('id, title, description, start_time')
    .eq('user_id', user.id)
    .eq('completed', false)
    .gte('start_time', new Date().toISOString())
    .lte('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });

  if (error) return sendJson(res, 500, { error: error.message });

  sendJson(res, 200, data || []);
});
```

---

## Integração Completa

### 1. Ao iniciar app

```javascript
import { registerBackgroundSync, setupSyncListener } from './background-sync.js';
import { registerPeriodicSync } from './periodic-sync.js';

async function initPWAFeatures() {
  const registration = await navigator.serviceWorker.ready;

  // Background sync
  await registerBackgroundSync();
  setupSyncListener();

  // Periodic sync
  await registerPeriodicSync();

  // Push notifications (já configura em pwa-register.js)
  console.log('✅ PWA features ativadas');
}

initPWAFeatures();
```

### 2. Ao fazer login

```javascript
import { subscribeToPush } from './push-notifications.js';

// Após autenticação bem-sucedida
async function onLoginSuccess(session) {
  const registration = await navigator.serviceWorker.ready;
  await subscribeToPush(registration);
}
```

### 3. Ao criar evento offline

```javascript
import { savePendingEvent } from './background-sync.js';

async function createEvent(eventData) {
  if (navigator.onLine) {
    // Criar no servidor
    await supabase.from('time_tasks_events').insert(eventData);
  } else {
    // Salvar offline
    savePendingEvent(eventData);
  }
}
```

---

## Teste Local

### 1. Gerar VAPID keys e configurar

```bash
npm install web-push
npx web-push generate-vapid-keys
# Copiar Public Key para .env.local
```

### 2. Build e preview

```bash
npm run build
npm run preview
# http://localhost:4173
```

### 3. DevTools

```
F12 → Application → Service Workers
- Offline checkbox (testar offline)

F12 → Application → Manifest
- Verificar se carrega

F12 → Console
- Ver logs de sync, push, periodic sync
```

### 4. Testar push (Chrome)

```javascript
// No console:
const registration = await navigator.serviceWorker.ready;
await registration.showNotification('Teste', {
  body: 'Isso funciona!',
  icon: '/icon-192.png'
});
```

### 5. Simular offline

```
F12 → Network → Offline checkbox
- Criar evento → salva em pending
- Voltar online → sync automático
```

---

## Próximas Melhorias

1. ✅ Web Push (notificações)
2. ✅ Background Sync (sincronizar offline)
3. ✅ Periodic Sync (atualizar 24h)
4. ⏳ Web Push do servidor (backend)
5. ⏳ Notificações de eventos próximos
6. ⏳ Sync automático de lembretes
7. ⏳ Dashboard de sync status

---

**Versão:** 1.0 Web Push + Background Sync  
**Status:** Pronto para integração com backend  
**Data:** 2026-07-16
