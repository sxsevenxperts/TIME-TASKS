import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3000);
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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
  `connect-src 'self' ${supabaseOrigin} ${supabaseSocketOrigin}`.trim(),
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
    if (body.length > 32_768) throw new Error('PAYLOAD_TOO_LARGE');
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

function normalizeSxResult(result, defaults) {
  if (!result || typeof result !== 'object') throw new Error('INVALID_MODEL_RESPONSE');

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
    const calendars = new Set(['pessoal', 'trabalho', 'saude', 'estudos', 'social']);

    return {
      action: 'CREATE_EVENT',
      event: {
        title: String(event.title).trim().slice(0, 180),
        date: event.date,
        startTime,
        endTime,
        allDay,
        calendar: calendars.has(event.calendar) ? event.calendar : (defaults.defaultCalendar || 'pessoal'),
        description: String(event.description || '').trim().slice(0, 2000),
        reminderMinutes: Math.max(0, Math.min(Number(event.reminderMinutes ?? defaults.defaultReminder ?? 0), 10_080))
      }
    };
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
  const systemInstruction = [
    'Você é SX, a assistente de agenda do Time Tasks.',
    'Interprete português do Brasil e transforme pedidos objetivos em CREATE_EVENT ou CREATE_SEED.',
    'Use CREATE_EVENT quando houver compromisso com duração. Use CREATE_SEED para tarefa ou lembrete pontual.',
    'Datas relativas devem usar a data/hora e o fuso fornecidos.',
    'Nunca invente uma ação diferente das três permitidas.',
    'Retorne somente JSON válido, sem markdown.',
    'Formato de evento: {"action":"CREATE_EVENT","event":{"title":"","date":"YYYY-MM-DD","startTime":"HH:MM","endTime":"HH:MM","allDay":false,"calendar":"pessoal|trabalho|saude|estudos|social","description":"","reminderMinutes":0}}.',
    'Formato de tarefa: {"action":"CREATE_SEED","seed":{"title":"","notes":"","dueAt":"ISO-8601 ou null","reminderAt":"ISO-8601 ou null"}}.',
    'Para conversa: {"action":"CHAT","message":""}.'
  ].join(' ');

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
        contents: [{
          role: 'user',
          parts: [{
            text: `Agora em UTC: ${now.toISOString()}\nAgora no fuso do usuário: ${localNow}\nFuso: ${timezone}\nDuração padrão: ${Number(defaults.defaultDuration) || 60} minutos\nLembrete padrão: ${Number(defaults.defaultReminder) || 0} minutos\nPedido: ${JSON.stringify(text)}`
          }]
        }],
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

  return sendJson(response, 200, normalizeSxResult(parsed, defaults));
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
  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Security-Policy': contentSecurityPolicy,
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
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
