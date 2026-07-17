// Calendar Synchronization Engine

import { fetchGoogleEvents, createGoogleEvent, refreshGoogleToken } from './google-calendar-handler.js';
import { fetchAppleEvents, parseICS } from './apple-calendar-handler.js';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos
const syncJobs = new Map();

export async function startCalendarSync(supabaseUrl, supabaseAnonKey) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase não configurado para sincronização');
    return;
  }

  console.log('📅 Iniciando sincronização de calendários...');

  // Executar sincronização a cada 5 minutos
  setInterval(async () => {
    try {
      await syncAllIntegrations(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('❌ Erro na sincronização de calendários:', error.message);
    }
  }, SYNC_INTERVAL);
}

async function syncAllIntegrations(supabaseUrl, supabaseAnonKey) {
  try {
    // Buscar todas as integrações ativas
    const response = await fetch(
      `${supabaseUrl}/rest/v1/time_tasks_calendar_integrations?is_active=eq.true&select=*`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        },
        signal: AbortSignal.timeout(10_000)
      }
    );

    if (!response.ok) {
      console.error('❌ Falha ao buscar integrações:', response.status);
      return;
    }

    const integrations = await response.json();

    for (const integration of integrations) {
      const jobKey = `${integration.user_id}:${integration.provider}`;

      if (syncJobs.has(jobKey)) {
        continue; // Job já em andamento
      }

      syncJobs.set(jobKey, true);

      try {
        if (integration.provider === 'google') {
          await syncGoogleCalendar(integration, supabaseUrl, supabaseAnonKey);
        } else if (integration.provider === 'apple') {
          await syncAppleCalendar(integration, supabaseUrl, supabaseAnonKey);
        }

        // Atualizar last_sync_at
        await updateSyncTimestamp(integration.id, supabaseUrl, supabaseAnonKey);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${integration.provider}:`, error.message);
        await updateSyncError(integration.id, error.message, supabaseUrl, supabaseAnonKey);
      } finally {
        syncJobs.delete(jobKey);
      }
    }
  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error.message);
  }
}

async function syncGoogleCalendar(integration, supabaseUrl, supabaseAnonKey) {
  const now = new Date();
  const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias adiante

  try {
    let accessToken = integration.access_token;

    // Renovar token se expirado
    if (integration.token_expires_at && new Date(integration.token_expires_at) < now) {
      if (integration.refresh_token) {
        const refreshed = await refreshGoogleToken(integration.refresh_token);
        accessToken = refreshed.access_token;
        // Atualizar token no banco
        await updateGoogleToken(integration.id, refreshed, supabaseUrl, supabaseAnonKey);
      } else {
        throw new Error('TOKEN_EXPIRED_NO_REFRESH');
      }
    }

    // Buscar eventos do Google
    const googleEvents = await fetchGoogleEvents(accessToken, integration.calendar_id, timeMin, timeMax);

    // Sincronizar para o Time Tasks
    for (const gevent of googleEvents) {
      await syncGoogleEventToTimeTasks(gevent, integration.user_id, integration.id, supabaseUrl, supabaseAnonKey);
    }

    console.log(`✅ Google Calendar sincronizado: ${googleEvents.length} eventos`);
  } catch (error) {
    throw new Error(`GOOGLE_SYNC_FAILED: ${error.message}`);
  }
}

async function syncAppleCalendar(integration, supabaseUrl, supabaseAnonKey) {
  // Apple Calendar sync com credenciais encriptadas
  // Placeholder para integração futura com decriptação
  console.log('⏳ Apple Calendar sync ainda em desenvolvimento');
}

async function syncGoogleEventToTimeTasks(gevent, userId, integrationId, supabaseUrl, supabaseAnonKey) {
  const eventData = {
    user_id: userId,
    title: gevent.summary || 'Evento',
    date: new Date(gevent.start?.dateTime || gevent.start?.date).toISOString().split('T')[0],
    start_time: gevent.start?.dateTime ? new Date(gevent.start.dateTime).toLocaleTimeString('pt-BR', { hour12: false }).slice(0, 5) : null,
    end_time: gevent.end?.dateTime ? new Date(gevent.end.dateTime).toLocaleTimeString('pt-BR', { hour12: false }).slice(0, 5) : null,
    all_day: !gevent.start?.dateTime,
    calendar: 'trabalho', // Google calendar → categoria trabalho
    description: gevent.description || '',
    external_id: gevent.id,
    external_source: 'google',
    external_calendar_id: integrationId,
    synced_at: new Date().toISOString()
  };

  // Verificar se evento já existe
  const existsResponse = await fetch(
    `${supabaseUrl}/rest/v1/time_tasks_events?user_id=eq.${userId}&external_id=eq.${gevent.id}&select=id`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    }
  );

  if (existsResponse.ok) {
    const existing = await existsResponse.json();
    if (existing.length > 0) {
      // Atualizar evento existente
      await fetch(
        `${supabaseUrl}/rest/v1/time_tasks_events?id=eq.${existing[0].id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );
    } else {
      // Criar novo evento
      await fetch(
        `${supabaseUrl}/rest/v1/time_tasks_events`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );
    }
  }
}

async function updateSyncTimestamp(integrationId, supabaseUrl, supabaseAnonKey) {
  await fetch(
    `${supabaseUrl}/rest/v1/time_tasks_calendar_integrations?id=eq.${integrationId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        last_sync_at: new Date().toISOString(),
        sync_errors: null
      })
    }
  );
}

async function updateSyncError(integrationId, error, supabaseUrl, supabaseAnonKey) {
  await fetch(
    `${supabaseUrl}/rest/v1/time_tasks_calendar_integrations?id=eq.${integrationId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sync_errors: String(error).slice(0, 500)
      })
    }
  );
}

async function updateGoogleToken(integrationId, tokenData, supabaseUrl, supabaseAnonKey) {
  const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
  await fetch(
    `${supabaseUrl}/rest/v1/time_tasks_calendar_integrations?id=eq.${integrationId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: tokenData.access_token,
        token_expires_at: expiresAt
      })
    }
  );
}

export async function pushEventToCalendars(event, integrations, supabaseUrl, supabaseAnonKey) {
  // Publicar evento em todos os calendários conectados
  for (const integration of integrations) {
    try {
      if (integration.provider === 'google' && integration.is_active) {
        const googleEvent = {
          summary: event.title,
          description: event.description,
          start: event.all_day
            ? { date: event.date }
            : { dateTime: `${event.date}T${event.start_time || '09:00'}:00` },
          end: event.all_day
            ? { date: new Date(new Date(event.date).getTime() + 86400000).toISOString().split('T')[0] }
            : { dateTime: `${event.date}T${event.end_time || '10:00'}:00` }
        };

        const createdEvent = await createGoogleEvent(integration.access_token, integration.calendar_id, googleEvent);

        // Atualizar event com external_id
        await fetch(
          `${supabaseUrl}/rest/v1/time_tasks_events?id=eq.${event.id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: supabaseAnonKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              external_id: createdEvent.id,
              external_source: 'google'
            })
          }
        );
      }
    } catch (error) {
      console.error(`❌ Erro ao publicar em ${integration.provider}:`, error.message);
    }
  }
}
