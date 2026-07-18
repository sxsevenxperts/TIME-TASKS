import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGoogleAuthUrl, exchangeGoogleCode, refreshGoogleToken, fetchGoogleCalendars } from './js/google-calendar-handler.js';
import { discoverAppleCalDAV, fetchAppleCalendars, fetchAppleEvents, parseICS } from './js/apple-calendar-handler.js';
import { startCalendarSync } from './js/calendar-sync.js';
import TriggerExecutor from './js/trigger-executor.js';
import { initPushSender } from './js/push-sender.js';

const port = Number(process.env.PORT || 3000);
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || '';
const requestCounters = new Map();
const supabaseOrigin = (() => {
  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return '';
  }
})();
const supabaseSocketOrigin = supabaseOrigin.replace(/^http/, 'ws');
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseSocketOrigin} https://api.open-meteo.com https://geocoding-api.open-meteo.com`.trim(),
  "font-src 'self' https://fonts.gstatic.com data:",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "img-src 'self' data:",
  "manifest-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "worker-src 'self'"
].join('; ');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2'
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 65_536) throw new Error('PAYLOAD_TOO_LARGE');
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new Error('INVALID_JSON');
  }
}

async function authenticate(request) {
  const authorization = request.headers.authorization || '';
  if (!authorization.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) return null;

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization
    },
    signal: AbortSignal.timeout(10_000)
  });
  if (!authResponse.ok) return null;
  const user = await authResponse.json();
  if (!user?.id) return null;

  // O Auth é compartilhado no servidor, mas somente membros explícitos do
  // Time Tasks podem consumir as APIs privadas deste aplicativo.
  const membershipResponse = await fetch(
    `${supabaseUrl}/rest/v1/time_tasks_members?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: authorization
      },
      signal: AbortSignal.timeout(10_000)
    }
  );
  if (!membershipResponse.ok) return null;
  const membership = await membershipResponse.json();
  return Array.isArray(membership) && membership.length === 1 ? user : null;
}

function allowRequest(userId) {
  const now = Date.now();
  if (requestCounters.size > 5000) {
    for (const [key, counter] of requestCounters) {
      if (now - counter.startedAt > 300_000) requestCounters.delete(key);
    }
  }
  const current = requestCounters.get(userId);
  if (!current || now - current.startedAt >= 60_000) {
    requestCounters.set(userId, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= 20;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const total = Math.min((hours * 60) + mins + minutes, (23 * 60) + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function timeToNumber(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const CALENDAR_KEYS = new Set(['pessoal', 'trabalho', 'saude', 'estudos', 'social']);

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(entry => entry && (entry.role === 'user' || entry.role === 'assistant') && String(entry.content || '').trim())
    .slice(-20)
    .map(entry => ({
      role: entry.role,
      content: String(entry.content).trim().slice(0, 1000)
    }));
}

function sanitizeAgenda(agenda) {
  if (!Array.isArray(agenda)) return [];
  return agenda
    .filter(item => item && typeof item.id === 'string' && item.id.length <= 64 && String(item.title || '').trim())
    .slice(0, 50)
    .map(item => ({
      id: item.id,
      title: String(item.title).trim().slice(0, 180),
      date: validDate(item.date) ? item.date : null,
      startTime: validTime(item.startTime) ? item.startTime : null,
      endTime: validTime(item.endTime) ? item.endTime : null,
      allDay: Boolean(item.allDay),
      calendar: CALENDAR_KEYS.has(item.calendar) ? item.calendar : 'pessoal',
      reminderMinutes: Math.max(0, Math.min(Number(item.reminderMinutes ?? 0) || 0, 10_080)),
      completed: Boolean(item.completed),
      createdAt: item.createdAt && !Number.isNaN(Date.parse(item.createdAt)) ? item.createdAt : null
    }));
}

function normalizeSxResult(result, defaults, agenda = []) {
  if (!result || typeof result !== 'object') throw new Error('INVALID_MODEL_RESPONSE');
  const agendaIds = new Set(agenda.map(item => item.id));

  if (result.action === 'CREATE_EVENT' && result.event) {
    const event = result.event;
    const allDay = Boolean(event.allDay);
    if (!String(event.title || '').trim() || !validDate(event.date)) throw new Error('INVALID_EVENT');
    const startTime = allDay ? null : (validTime(event.startTime) ? event.startTime : null);
    if (!allDay && !startTime) throw new Error('INVALID_EVENT_TIME');
    const duration = Number(defaults.defaultDuration) || 60;
    const requestedEnd = validTime(event.endTime) ? event.endTime : null;
    const endTime = allDay
      ? null
      : (requestedEnd && timeToNumber(requestedEnd) > timeToNumber(startTime)
          ? requestedEnd
          : addMinutes(startTime, duration));

    return {
      action: 'CREATE_EVENT',
      event: {
        title: String(event.title).trim().slice(0, 180),
        date: event.date,
        startTime,
        endTime,
        allDay,
        calendar: CALENDAR_KEYS.has(event.calendar) ? event.calendar : (defaults.defaultCalendar || 'pessoal'),
        description: String(event.description || '').trim().slice(0, 2000),
        reminderMinutes: Math.max(0, Math.min(Number(event.reminderMinutes ?? defaults.defaultReminder ?? 0), 10_080))
      }
    };
  }

  if (result.action === 'UPDATE_EVENT') {
    const eventId = String(result.eventId || '');
    if (!agendaIds.has(eventId)) throw new Error('INVALID_EVENT_REFERENCE');
    const source = result.changes && typeof result.changes === 'object' ? result.changes : {};
    const changes = {};
    if (String(source.title || '').trim()) changes.title = String(source.title).trim().slice(0, 180);
    if (validDate(source.date)) changes.date = source.date;
    if (validTime(source.startTime)) changes.startTime = source.startTime;
    if (validTime(source.endTime)) changes.endTime = source.endTime;
    if (typeof source.allDay === 'boolean') changes.allDay = source.allDay;
    if (CALENDAR_KEYS.has(source.calendar)) changes.calendar = source.calendar;
    if (typeof source.description === 'string') changes.description = source.description.trim().slice(0, 2000);
    if (source.reminderMinutes !== undefined && source.reminderMinutes !== null) {
      changes.reminderMinutes = Math.max(0, Math.min(Number(source.reminderMinutes) || 0, 10_080));
    }
    // Horário novo sem fim explícito: recalcula o fim preservando a duração padrão.
    if (changes.startTime && !changes.endTime) {
      const current = agenda.find(item => item.id === eventId);
      const duration = current?.startTime && current?.endTime
        ? timeToNumber(current.endTime) - timeToNumber(current.startTime)
        : (Number(defaults.defaultDuration) || 60);
      changes.endTime = addMinutes(changes.startTime, Math.max(duration, 5));
    }
    if (!Object.keys(changes).length) throw new Error('INVALID_EVENT_CHANGES');
    return { action: 'UPDATE_EVENT', eventId, changes };
  }

  if (result.action === 'DELETE_EVENT') {
    const eventId = String(result.eventId || '');
    if (!agendaIds.has(eventId)) throw new Error('INVALID_EVENT_REFERENCE');
    return { action: 'DELETE_EVENT', eventId };
  }

  if (result.action === 'SET_EVENT_STATUS') {
    const eventId = String(result.eventId || '');
    if (!agendaIds.has(eventId)) throw new Error('INVALID_EVENT_REFERENCE');
    return { action: 'SET_EVENT_STATUS', eventId, completed: Boolean(result.completed) };
  }

  if (result.action === 'CREATE_SEED' && result.seed) {
    const seed = result.seed;
    if (!String(seed.title || '').trim()) throw new Error('INVALID_SEED');
    const dueAt = seed.dueAt && !Number.isNaN(Date.parse(seed.dueAt)) ? new Date(seed.dueAt).toISOString() : null;
    const reminderAt = seed.reminderAt && !Number.isNaN(Date.parse(seed.reminderAt))
      ? new Date(seed.reminderAt).toISOString()
      : dueAt;
    return {
      action: 'CREATE_SEED',
      seed: {
        title: String(seed.title).trim().slice(0, 180),
        notes: String(seed.notes || '').trim().slice(0, 2000),
        dueAt,
        reminderAt
      }
    };
  }

  return {
    action: 'CHAT',
    message: String(result.message || 'Posso criar eventos, tarefas e lembretes para você.').slice(0, 1200)
  };
}



async function handleAppleConnect(response, user) {
  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({
    status: 'setup_required',
    message: 'Apple Calendar setup requer credenciais iCloud',
    nextStep: '/api/auth/apple/setup'
  }));
}

async function handleAppleSetup(request, response, user) {
  if (request.method !== 'POST') return response.writeHead(405) || response.end();

  try {
    let body = '';
    for await (const chunk of request) body += chunk;
    const { email, password } = JSON.parse(body);

    if (!email || !password) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ error: 'EMAIL_PASSWORD_REQUIRED' }));
    }

    const calendars = await fetchAppleCalendars(email, password);
    
    if (!calendars.length) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ error: 'NO_CALENDARS_FOUND' }));
    }

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      status: 'calendars_found',
      calendars: calendars.map(c => ({ url: c.url, name: c.name }))
    }));
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: error.message }));
  }
}

async function handleGoogleConnect(response, user) {
  if (!googleClientId) return sendJson(response, 503, { error: 'GOOGLE_NOT_CONFIGURED' });
  
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const authUrl = buildGoogleAuthUrl(state);
  
  if (!authUrl) return sendJson(response, 503, { error: 'GOOGLE_AUTH_URL_BUILD_FAILED' });
  
  response.writeHead(302, { Location: authUrl });
  response.end();
}

async function handleGoogleCallback(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return response.writeHead(302, { Location: `/?error=google_${error}` }) || response.end();
  }

  if (!code) {
    return response.writeHead(302, { Location: '/?error=no_code' }) || response.end();
  }

  try {
    const tokenData = await exchangeGoogleCode(code);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const calendars = await fetchGoogleCalendars(accessToken);
    const primaryCalendar = calendars.find(c => c.primary) || calendars[0];
    
    if (!primaryCalendar) {
      return response.writeHead(302, { Location: '/?error=no_calendars' }) || response.end();
    }

    response.writeHead(302, { Location: `/?calendar_setup=success&provider=google&calendar=${encodeURIComponent(primaryCalendar.summary || 'Google Calendar')}` });
    response.end();
  } catch (error) {
    console.error('Google callback error:', error);
    response.writeHead(302, { Location: `/?error=google_callback_${encodeURIComponent(error.message)}` });
    response.end();
  }
}

async function handleCalendarStatus(response, user) {
  // Retornar status das integrações de calendário do usuário
  try {
    // TODO: Buscar do Supabase tabela time_tasks_calendar_integrations
    // Por enquanto retornar structure básica
    const status = {
      google: null,
      apple: null
    };
    return sendJson(response, 200, status);
  } catch (error) {
    console.error('Calendar status error:', error);
    return sendJson(response, 500, { error: 'STATUS_ERROR' });
  }
}

async function handleGoogleDisconnect(response, user) {
  try {
    // TODO: Deletar integração Google do usuário em Supabase
    return sendJson(response, 200, { success: true });
  } catch (error) {
    console.error('Google disconnect error:', error);
    return sendJson(response, 500, { error: 'DISCONNECT_ERROR' });
  }
}

async function handleAppleDisconnect(response, user) {
  try {
    // TODO: Deletar integração Apple do usuário em Supabase
    return sendJson(response, 200, { success: true });
  } catch (error) {
    console.error('Apple disconnect error:', error);
    return sendJson(response, 500, { error: 'DISCONNECT_ERROR' });
  }
}

async function handleCreateTrigger(request, response, user) {
  try {
    const body = await readJson(request);
    const { name, type, condition, enabled } = body;

    if (!name || !type) {
      return sendJson(response, 400, { error: 'INVALID_TRIGGER' });
    }

    // TODO: Salvar trigger em Supabase tabela time_tasks_triggers
    // Por enquanto retornar sucesso
    return sendJson(response, 201, {
      success: true,
      trigger: {
        id: Math.random().toString(36).substr(2, 9),
        name,
        type,
        condition,
        enabled,
        user_id: user.id
      }
    });
  } catch (error) {
    console.error('Create trigger error:', error);
    return sendJson(response, 500, { error: 'TRIGGER_ERROR' });
  }
}

async function handleSx(request, response, user) {
  if (!geminiApiKey) return sendJson(response, 503, { error: 'SX_NOT_CONFIGURED' });
  if (!allowRequest(user.id)) return sendJson(response, 429, { error: 'RATE_LIMITED' });

  const body = await readJson(request);
  const text = String(body.text || '').trim();
  if (!text || text.length > 4000) return sendJson(response, 400, { error: 'INVALID_TEXT' });

  const now = body.now && !Number.isNaN(Date.parse(body.now)) ? new Date(body.now) : new Date();
  const timezone = String(body.timezone || 'America/Fortaleza').slice(0, 80);
  let localNow;
  try {
    localNow = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(now);
  } catch {
    return sendJson(response, 400, { error: 'INVALID_TIMEZONE' });
  }
  const defaults = body.defaults && typeof body.defaults === 'object' ? body.defaults : {};
  const history = sanitizeHistory(body.history);
  const agenda = sanitizeAgenda(body.agenda);
  const userName = String(body.userName || '').trim().slice(0, 80);
  const systemInstruction = [
    'Você é SX, a assistente de agenda do Time Tasks.',
    'PERSONA: fale como uma pessoa próxima, calorosa e natural, em português do Brasil, com frases curtas e vivas. Nada de tom robótico, burocrático ou de sistema.',
    userName ? `O nome de quem fala com você é ${userName}. Chame pelo nome com naturalidade, sem exagerar.` : '',
    'Nunca se descreva como IA, robô, modelo, sistema ou assistente virtual, e nunca mencione tecnologia interna. Se perguntarem se você é humana ou robô, responda com simpatia apenas que é a SX, a assistente do Time Tasks — sem afirmar que é humana.',
    'Se a pessoa disser que um compromisso "foi cancelado", confirme com gentileza qual evento é (CHAT) e, quando estiver claro, desmarque com DELETE_EVENT. Se disser que o compromisso "já aconteceu" ou "foi cumprido", sugira ou registre a baixa com SET_EVENT_STATUS.',
    'Interprete português do Brasil e responda com exatamente uma das ações permitidas.',
    'Use CREATE_EVENT quando houver compromisso com duração. Use CREATE_SEED para tarefa ou lembrete pontual.',
    'Use UPDATE_EVENT para reeditar ou adiar um evento existente (mudar título, data, horário, lembrete, calendário ou descrição). Envie em "changes" somente os campos que mudam.',
    'Use DELETE_EVENT quando o usuário quiser desmarcar/cancelar um evento existente.',
    'Use SET_EVENT_STATUS quando o usuário quiser dar baixa (completed=true) ou reabrir (completed=false) um evento existente.',
    'Você recebe o histórico recente da conversa e a lista AGENDA com os eventos do usuário (cada um com "id").',
    'Referências como "o último evento criado", "aquela reunião" ou "o evento de amanhã" devem ser resolvidas pela conversa e pela AGENDA; use o "createdAt" mais recente para "último criado".',
    'Só use um eventId que exista na AGENDA. Se a referência for ambígua ou não existir, responda com CHAT pedindo esclarecimento e cite os títulos candidatos.',
    'Pedidos como "me lembre X minutos antes" sobre um evento já criado são UPDATE_EVENT com {"reminderMinutes":X}.',
    'Datas relativas devem usar a data/hora e o fuso fornecidos.',
    'Nunca invente uma ação diferente das seis permitidas.',
    'Retorne somente JSON válido, sem markdown.',
    'Formato de evento: {"action":"CREATE_EVENT","event":{"title":"","date":"YYYY-MM-DD","startTime":"HH:MM","endTime":"HH:MM","allDay":false,"calendar":"pessoal|trabalho|saude|estudos|social","description":"","reminderMinutes":0}}.',
    'Formato de tarefa: {"action":"CREATE_SEED","seed":{"title":"","notes":"","dueAt":"ISO-8601 ou null","reminderAt":"ISO-8601 ou null"}}.',
    'Formato de edição/adiamento: {"action":"UPDATE_EVENT","eventId":"","changes":{"title":"","date":"YYYY-MM-DD","startTime":"HH:MM","endTime":"HH:MM","allDay":false,"calendar":"","description":"","reminderMinutes":0}}.',
    'Formato de desmarcar: {"action":"DELETE_EVENT","eventId":""}.',
    'Formato de baixa: {"action":"SET_EVENT_STATUS","eventId":"","completed":true}.',
    'Para conversa: {"action":"CHAT","message":""}.'
  ].filter(Boolean).join(' ');

  const contextText = [
    `Agora em UTC: ${now.toISOString()}`,
    `Agora no fuso do usuário: ${localNow}`,
    `Fuso: ${timezone}`,
    `Duração padrão: ${Number(defaults.defaultDuration) || 60} minutos`,
    `Lembrete padrão: ${Number(defaults.defaultReminder) || 0} minutos`,
    `AGENDA: ${JSON.stringify(agenda)}`,
    `Pedido: ${JSON.stringify(text)}`
  ].join('\n');

  const contents = [
    ...history.map(entry => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.content }]
    })),
    { role: 'user', parts: [{ text: contextText }] }
  ];

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 900
        }
      }),
      signal: AbortSignal.timeout(25_000)
    }
  );

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    console.error('Gemini respondeu com erro:', geminiResponse.status, detail.slice(0, 500));
    return sendJson(response, 502, { error: 'SX_PROVIDER_ERROR' });
  }

  const payload = await geminiResponse.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
  if (!raw) return sendJson(response, 502, { error: 'SX_EMPTY_RESPONSE' });

  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
  } catch {
    console.error('SX retornou JSON inválido:', raw.slice(0, 500));
    return sendJson(response, 502, { error: 'SX_INVALID_RESPONSE' });
  }

  try {
    return sendJson(response, 200, normalizeSxResult(parsed, defaults, agenda));
  } catch (error) {
    console.error('SX retornou uma ação inválida:', error.message, raw.slice(0, 500));
    return sendJson(response, 502, { error: 'SX_INVALID_RESPONSE' });
  }
}

async function handleVerse(response, user) {
  if (!allowRequest(`verse:${user.id}`)) return sendJson(response, 429, { error: 'RATE_LIMITED' });
  const verseResponse = await fetch('https://bible-api.com/data/almeida/random', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000)
  });
  if (!verseResponse.ok) return sendJson(response, 502, { error: 'VERSE_PROVIDER_ERROR' });
  const payload = await verseResponse.json();
  const verse = payload?.random_verse;
  if (!verse?.text) return sendJson(response, 502, { error: 'VERSE_EMPTY_RESPONSE' });
  const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
  return sendJson(response, 200, {
    key: `${verse.book_id}-${verse.chapter}-${verse.verse}`,
    reference,
    text: String(verse.text).replace(/\s+/g, ' ').trim(),
    translation: payload?.translation?.name || 'João Ferreira de Almeida'
  });
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const requestedPath = decodeURIComponent(url.pathname);
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(distDir, safePath === '/' ? 'index.html' : safePath);

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    filePath = join(distDir, 'index.html');
  }

  const content = await readFile(filePath);
  const extension = extname(filePath).toLowerCase();
  // "immutable" só vale para bundles com hash no nome (dist/assets/*).
  // Arquivos de nome fixo (service-worker.js, pwa-register.js, manifest,
  // error-overlay.js...) mudam entre deploys mantendo a URL — com 1 ano de
  // cache, navegadores e Cloudflare seguravam versões antigas indefinidamente.
  const isHashedAsset = /[\\/]assets[\\/]/.test(filePath);
  const cacheControl = filePath.endsWith('index.html')
    ? 'no-cache'
    : isHashedAsset
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=300, must-revalidate';
  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': cacheControl,
    'Content-Security-Policy': contentSecurityPolicy,
    'Permissions-Policy': 'camera=(), geolocation=(self), microphone=(self)',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN'
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/health' && request.method === 'GET') {
    if (url.pathname === '/api/auth/google/callback' && request.method === 'GET') return handleGoogleCallback(request, response);
      return sendJson(response, 200, {
        status: 'ok',
        service: 'time-tasks',
        sx: Boolean(geminiApiKey),
        supabase: Boolean(supabaseUrl && supabaseAnonKey)
      });
    }

    if (url.pathname.startsWith('/api/')) {
      const user = await authenticate(request);
      if (!user) return sendJson(response, 401, { error: 'UNAUTHORIZED' });
            if (url.pathname === '/api/auth/google/connect' && request.method === 'GET') return handleGoogleConnect(response, user);

      if (url.pathname === '/api/auth/apple/connect' && request.method === 'GET') return handleAppleConnect(response, user);
      if (url.pathname === '/api/auth/apple/setup' && request.method === 'POST') return handleAppleSetup(request, response, user);
      if (url.pathname === '/api/calendar/status' && request.method === 'GET') return handleCalendarStatus(response, user);
      if (url.pathname === '/api/auth/google/disconnect' && request.method === 'POST') return handleGoogleDisconnect(response, user);
      if (url.pathname === '/api/auth/apple/disconnect' && request.method === 'POST') return handleAppleDisconnect(response, user);
      if (url.pathname === '/api/triggers/create' && request.method === 'POST') return handleCreateTrigger(request, response, user);
      if (url.pathname === '/api/sx' && request.method === 'POST') return handleSx(request, response, user);
      if (url.pathname === '/api/verse' && request.method === 'GET') return handleVerse(response, user);
      return sendJson(response, 404, { error: 'NOT_FOUND' });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
    return serveStatic(request, response);
  } catch (error) {
    console.error('Erro no servidor Time Tasks:', error);
    const status = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : error.message === 'INVALID_JSON' ? 400 : 500;
    return sendJson(response, status, { error: status === 500 ? 'INTERNAL_ERROR' : error.message });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Time Tasks disponível na porta ${port}`);
});

// Iniciar sincronização de calendários em background
if (supabaseUrl && supabaseAnonKey) {
  startCalendarSync(supabaseUrl, supabaseAnonKey).catch(err => {
    console.error('Erro ao inicializar sincronização de calendários:', err);
  });
}

// Web Push (VAPID) — desativado sem as chaves, sem quebrar o boot
initPushSender();

// Iniciar executor de triggers em background
if (supabaseUrl && supabaseAnonKey) {
  const triggerExecutor = new TriggerExecutor(supabaseUrl, supabaseAnonKey, process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  triggerExecutor.start(60000); // Executar a cada 1 minuto
  console.log('✅ Trigger Executor iniciado');
}
