import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { createEvent, detectConflicts } from './events.js';
import { createSeed } from './seeds.js';
import { getSettings } from './settings.js';
import { showToast } from './modal.js';

let initialized = false;
let sending = false;
let recognition = null;
let historyLoadVersion = 0;

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
  addMessage('Olá! Eu sou a SX. Diga ou fale o que deseja agendar.', 'assistant');
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
  data.reverse().forEach(message => addMessage(message.content, message.role));
  renderWelcome();
}

async function sessionToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function errorMessage(code) {
  const errors = {
    UNAUTHORIZED: 'Sua sessão expirou. Entre novamente para usar a SX.',
    SX_NOT_CONFIGURED: 'A SX ainda não está configurada no servidor.',
    RATE_LIMITED: 'Muitos pedidos em pouco tempo. Aguarde um minuto e tente novamente.',
    INVALID_TEXT: 'O pedido precisa ser mais curto e objetivo.',
    SX_PROVIDER_ERROR: 'A SX está temporariamente indisponível. Tente novamente em instantes.',
    SX_EMPTY_RESPONSE: 'A SX não retornou uma resposta utilizável.',
    SX_INVALID_RESPONSE: 'A SX não conseguiu interpretar esse pedido com segurança.'
  };
  return errors[code] || 'Não foi possível concluir o pedido agora.';
}

async function askSx(text) {
  const token = await sessionToken();
  if (!token) throw new Error('UNAUTHORIZED');
  const settings = getSettings();
  const response = await fetch('/api/sx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      text,
      now: new Date().toISOString(),
      timezone: settings.timezone,
      language: settings.language,
      defaults: {
        defaultCalendar: settings.defaultCalendar,
        defaultDuration: settings.defaultDuration,
        defaultReminder: settings.defaultReminder
      }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'SX_REQUEST_FAILED');
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
  return result.message || 'Posso criar eventos, tarefas e lembretes para você.';
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
    input.value = '';
    const loading = addMessage('Processando seu pedido…', 'assistant', 'ai-loading');
    try {
      const result = await askSx(text);
      const response = await applyAction(result, callbacks);
      loading?.remove();
      addMessage(response, 'assistant');
      void persistMessage('assistant', response, result.action || 'CHAT');
    } catch (error) {
      loading?.remove();
      const message = ['EVENT_SAVE_FAILED', 'SEED_SAVE_FAILED'].includes(error.message)
        ? 'A SX entendeu o pedido, mas o Supabase não conseguiu salvar. Tente novamente.'
        : errorMessage(error.message);
      addMessage(message, 'assistant');
      void persistMessage('assistant', message, 'ERROR');
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
      historyElement().innerHTML = '';
      renderWelcome();
    }
  });
}
