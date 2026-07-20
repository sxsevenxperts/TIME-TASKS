import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { ensureFreshSession } from './persistent-auth.js';
import { createEvent, detectConflicts, deleteEvent, getEventById, loadEvents, patchEvent, setEventCompleted } from './events.js';
import { createSeed } from './seeds.js';
import { getSettings } from './settings.js';
import { showToast } from './modal.js';

let initialized = false;
let sending = false;
let recognition = null;
let historyLoadVersion = 0;

// Memória de conversa enviada à SX a cada pedido, para que referências como
// "o último evento criado" ou "me lembre 5 minutos antes" sejam resolvidas.
const MEMORY_LIMIT = 20;
let conversationMemory = [];

function rememberMessage(role, content) {
  const text = String(content || '').trim();
  if (!text) return;
  conversationMemory.push({ role, content: text.slice(0, 1000) });
  if (conversationMemory.length > MEMORY_LIMIT) {
    conversationMemory = conversationMemory.slice(-MEMORY_LIMIT);
  }
}

// Recorte compacto da agenda para a SX localizar eventos por título/data.
function agendaSnapshot() {
  return [...loadEvents()]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 50)
    .map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      calendar: event.calendar,
      reminderMinutes: event.reminderMinutes,
      completed: Boolean(event.completed),
      createdAt: event.createdAt
    }));
}

function historyElement() {
  return document.getElementById('ai-chat-history');
}

function scrollToBottom() {
  const history = historyElement();
  if (history) history.scrollTop = history.scrollHeight;
}

function messageElement(content, role, customClass = '') {
  const element = document.createElement('div');
  element.className = `ai-msg ai-msg--${role === 'user' ? 'user' : 'system'} ${customClass}`.trim();
  element.textContent = content;
  return element;
}

function addMessage(content, role, customClass = '') {
  const history = historyElement();
  if (!history) return null;
  const element = messageElement(content, role, customClass);
  history.appendChild(element);
  scrollToBottom();
  return element;
}

function renderWelcome() {
  const history = historyElement();
  if (!history || history.children.length) return;
  addMessage('Olá! Eu sou a SX. Posso criar, reeditar, adiar, desmarcar e dar baixa em eventos e tarefas. Diga ou fale o que precisa.', 'assistant');
}

async function persistMessage(role, content, action = null) {
  const user = getCurrentUser();
  if (!user || !supabase || !String(content).trim()) return;
  const { error } = await supabase.from('time_tasks_sx_messages').insert({
    user_id: user.id,
    role,
    content: String(content).trim().slice(0, 4000),
    action
  });
  if (error) console.error('Erro ao salvar histórico da SX:', error);
}

async function loadHistory() {
  const loadVersion = ++historyLoadVersion;
  const user = getCurrentUser();
  const history = historyElement();
  if (!history) return;
  if (!user || !supabase) {
    if (loadVersion !== historyLoadVersion) return;
    history.innerHTML = '';
    return renderWelcome();
  }
  const { data, error } = await supabase
    .from('time_tasks_sx_messages')
    .select('role,content,action,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40);
  if (loadVersion !== historyLoadVersion) return;
  history.innerHTML = '';
  if (error) {
    console.error('Erro ao carregar histórico da SX:', error);
    return renderWelcome();
  }
  conversationMemory = [];
  data.reverse().forEach(message => {
    addMessage(message.content, message.role);
    rememberMessage(message.role, message.content);
  });
  renderWelcome();
}

async function sessionToken(forceRefresh = false) {
  if (!supabase) return null;
  // ensureFreshSession renova o token vencido (iOS suspende o app e o token
  // morre em ~60min) em vez de devolver null e acusar "sessão expirou".
  console.log(`[sessionToken] Obtendo token, force=${forceRefresh}`);
  const session = await ensureFreshSession({ force: forceRefresh });
  const token = session?.access_token || null;
  console.log(`[sessionToken] Token obtido: ${token ? '✓ presente' : '✗ null'}`);
  return token;
}

function errorMessage(code) {
  const errors = {
    UNAUTHORIZED: 'Sua sessão expirou. Entre novamente para usar a SX.',
    SX_NOT_CONFIGURED: 'A SX ainda não está configurada no servidor.',
    RATE_LIMITED: 'Muitos pedidos em pouco tempo. Aguarde um minuto e tente novamente.',
    INVALID_TEXT: 'O pedido precisa ser mais curto e objetivo.',
    SX_PROVIDER_ERROR: 'A SX está temporariamente indisponível. Tente novamente em instantes.',
    SX_EMPTY_RESPONSE: 'A SX não retornou uma resposta utilizável.',
    SX_INVALID_RESPONSE: 'A SX não conseguiu interpretar esse pedido com segurança.',
    EVENT_NOT_FOUND: 'Não encontrei esse evento na sua agenda. Ele pode ter sido removido.',
    EVENT_UPDATE_FAILED: 'A SX entendeu o pedido, mas não consegui atualizar o evento. Tente novamente.',
    EVENT_DELETE_FAILED: 'A SX entendeu o pedido, mas não consegui desmarcar o evento. Tente novamente.'
  };
  return errors[code] || 'Não foi possível concluir o pedido agora.';
}

function sxRequest(text, token) {
  const settings = getSettings();
  const userName = String(settings.displayName || '').trim()
    || String(getCurrentUser()?.email || '').split('@')[0];
  return fetch('/api/sx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      text,
      now: new Date().toISOString(),
      timezone: settings.timezone,
      language: settings.language,
      history: conversationMemory.slice(0, -1),
      agenda: agendaSnapshot(),
      userName,
      defaults: {
        defaultCalendar: settings.defaultCalendar,
        defaultDuration: settings.defaultDuration,
        defaultReminder: settings.defaultReminder
      }
    })
  });
}

async function askSx(text) {
  console.log('[askSx] Iniciando pedido à SX');
  let token = null;
  let attempts = 0;
  const maxAttempts = 5;

  // Tentar obter token com múltiplas estratégias
  while (!token && attempts < maxAttempts) {
    attempts++;
    console.log(`[askSx] Tentativa ${attempts}/${maxAttempts}`);

    if (attempts === 1) {
      // Primeira tentativa: simples
      token = await sessionToken();
    } else if (attempts === 2) {
      // Segunda: forçar renovação
      console.warn('[askSx] Tentativa 2: forçando renovação...');
      token = await sessionToken(true);
    } else if (attempts === 3) {
      // Terceira: aguardar e tentar novamente
      console.warn('[askSx] Tentativa 3: aguardando 500ms...');
      await new Promise(r => setTimeout(r, 500));
      token = await sessionToken(true);
    } else if (attempts === 4) {
      // Quarta: aguardar mais e tentar
      console.warn('[askSx] Tentativa 4: aguardando 1s...');
      await new Promise(r => setTimeout(r, 1000));
      token = await sessionToken(true);
    } else {
      // Última: forçar refresh direto no localStorage
      console.warn('[askSx] Tentativa 5: usando fallback localStorage');
      const { ensureFreshSession } = await import('./persistent-auth.js');
      const session = await ensureFreshSession({ force: true });
      token = session?.access_token;
    }
  }

  if (!token) {
    console.error('[askSx] ✗ Nenhum token disponível após 5 tentativas');
    throw new Error('UNAUTHORIZED');
  }

  console.log('[askSx] ✓ Token obtido na tentativa', attempts, ', enviando pedido...');
  let response = await sxRequest(text, token);

  if (response.status === 401) {
    console.warn('[askSx] Servidor retornou 401, tentando renovação final...');
    token = await sessionToken(true);
    if (!token) {
      console.error('[askSx] ✗ Falha ao renovar após 401');
      throw new Error('UNAUTHORIZED');
    }
    response = await sxRequest(text, token);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[askSx] ✗ Resposta erro:', response.status, payload.error);
    throw new Error(payload.error || 'SX_REQUEST_FAILED');
  }
  console.log('[askSx] ✓ Pedido bem-sucedido');
  return payload;
}

async function applyAction(result, callbacks) {
  if (result.action === 'CREATE_EVENT' && result.event) {
    const settings = getSettings();
    if (settings.conflictCheck && !result.event.allDay) {
      const conflicts = detectConflicts(result.event.date, result.event.startTime, result.event.endTime);
      if (conflicts.length) {
        return `Encontrei conflito com “${conflicts[0].title}”. O evento não foi criado; escolha outro horário.`;
      }
    }
    const saved = await createEvent(result.event);
    if (!saved) throw new Error('EVENT_SAVE_FAILED');
    callbacks.onEventCreated?.(saved);
    const time = saved.allDay ? 'dia inteiro' : `${saved.startTime}`;
    return `Pronto! Criei “${saved.title}” em ${saved.date}, ${time}, com o lembrete configurado.`;
  }
  if (result.action === 'CREATE_SEED' && result.seed) {
    const saved = await createSeed(result.seed);
    if (!saved) throw new Error('SEED_SAVE_FAILED');
    callbacks.onSeedCreated?.(saved);
    return `Pronto! A tarefa “${saved.title}” foi criada${saved.reminderAt ? ' com lembrete' : ''}.`;
  }
  if (result.action === 'UPDATE_EVENT' && result.eventId) {
    const current = getEventById(result.eventId);
    if (!current) throw new Error('EVENT_NOT_FOUND');
    const changes = result.changes || {};
    const settings = getSettings();
    const changesTime = changes.date !== undefined || changes.startTime !== undefined || changes.endTime !== undefined || changes.allDay !== undefined;
    if (settings.conflictCheck && changesTime && !(changes.allDay ?? current.allDay)) {
      const date = changes.date ?? current.date;
      const startTime = changes.startTime ?? current.startTime;
      const endTime = changes.endTime ?? current.endTime;
      const conflicts = detectConflicts(date, startTime, endTime, current.id);
      if (conflicts.length) {
        return `O novo horário conflita com “${conflicts[0].title}”. Nada foi alterado; escolha outro horário.`;
      }
    }
    const saved = await patchEvent(result.eventId, changes);
    if (!saved) throw new Error('EVENT_UPDATE_FAILED');
    callbacks.onEventChanged?.(saved);
    const when = saved.allDay ? `${saved.date} (dia inteiro)` : `${saved.date} às ${saved.startTime}`;
    return changesTime
      ? `Pronto! “${saved.title}” foi remarcado para ${when}.`
      : `Pronto! Atualizei “${saved.title}” (${when}).`;
  }
  if (result.action === 'DELETE_EVENT' && result.eventId) {
    const current = getEventById(result.eventId);
    if (!current) throw new Error('EVENT_NOT_FOUND');
    const removed = await deleteEvent(result.eventId);
    if (!removed) throw new Error('EVENT_DELETE_FAILED');
    callbacks.onEventChanged?.(null);
    return `Desmarquei “${current.title}” de ${current.date}. O evento foi removido da agenda.`;
  }
  if (result.action === 'SET_EVENT_STATUS' && result.eventId) {
    const current = getEventById(result.eventId);
    if (!current) throw new Error('EVENT_NOT_FOUND');
    const saved = await setEventCompleted(result.eventId, result.completed);
    if (!saved) throw new Error('EVENT_UPDATE_FAILED');
    callbacks.onEventChanged?.(saved);
    return saved.completed
      ? `Baixa registrada: “${saved.title}” foi marcado como concluído (SIM).`
      : `Baixa desfeita: “${saved.title}” voltou a ficar em aberto (NÃO).`;
  }
  return result.message || 'Posso criar, reeditar, adiar, desmarcar e dar baixa em eventos e tarefas para você.';
}

function setupVoice(input, sendMessage) {
  const button = document.getElementById('btn-ai-voice');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!button) return;
  if (!Recognition) {
    button.disabled = true;
    button.title = 'Entrada por voz não disponível neste navegador';
    return;
  }
  recognition = new Recognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => {
    button.classList.add('is-listening');
    button.setAttribute('aria-pressed', 'true');
    input.placeholder = 'Ouvindo…';
  };
  recognition.onend = () => {
    button.classList.remove('is-listening');
    button.setAttribute('aria-pressed', 'false');
    input.placeholder = 'Pergunte à SX sobre seu calendário...';
  };
  recognition.onerror = event => {
    if (event.error !== 'no-speech') showToast('Não foi possível captar a voz. Verifique a permissão do microfone.', 'error');
  };
  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    input.value = transcript;
    void sendMessage();
  };
  button.addEventListener('click', () => {
    if (!getSettings().voiceInput) return showToast('Ative a entrada por voz em Configurações > IA', 'error');
    try {
      recognition.lang = getSettings().language === 'pt-BR' ? 'pt-BR' : getSettings().language;
      recognition.start();
    } catch {
      recognition.stop();
    }
  });
}

export function initAI(callbacks = {}) {
  if (initialized) return;
  initialized = true;
  const input = document.getElementById('ai-input');
  const submit = document.getElementById('btn-ai-submit');
  if (!input || !submit) return;

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text || sending || !getCurrentUser()) return;
    sending = true;
    submit.disabled = true;
    input.disabled = true;
    addMessage(text, 'user');
    void persistMessage('user', text);
    rememberMessage('user', text);
    input.value = '';
    const loading = addMessage('Processando seu pedido…', 'assistant', 'ai-loading');
    try {
      const result = await askSx(text);
      const response = await applyAction(result, callbacks);
      loading?.remove();
      addMessage(response, 'assistant');
      void persistMessage('assistant', response, result.action || 'CHAT');
      rememberMessage('assistant', response);
    } catch (error) {
      loading?.remove();
      const message = ['EVENT_SAVE_FAILED', 'SEED_SAVE_FAILED'].includes(error.message)
        ? 'A SX entendeu o pedido, mas o Supabase não conseguiu salvar. Tente novamente.'
        : errorMessage(error.message);
      addMessage(message, 'assistant');
      void persistMessage('assistant', message, 'ERROR');
      rememberMessage('assistant', message);
      console.error('Erro na SX:', error);
    } finally {
      sending = false;
      submit.disabled = false;
      input.disabled = false;
      input.focus();
    }
  };

  submit.addEventListener('click', () => void sendMessage());
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  });
  setupVoice(input, sendMessage);
  document.addEventListener('timetasks:session', event => {
    if (event.detail?.user) void loadHistory();
    else {
      historyLoadVersion += 1;
      conversationMemory = [];
      const history = historyElement();
      if (history) history.innerHTML = '';
      renderWelcome();
    }
  });
}
