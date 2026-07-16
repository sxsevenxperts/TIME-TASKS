import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { CALENDARS, setCalendarVisibility } from './events.js';
import { renderCalendarList } from './sidebar.js';
import { refreshCalendar } from './calendar.js';
import { setThemePreference } from './theme.js';
import { showToast } from './modal.js';

const DEFAULTS = Object.freeze({
  displayName: '',
  language: 'pt-BR',
  timezone: 'America/Fortaleza',
  theme: 'system',
  hour24: true,
  weekStartsOn: 1,
  defaultCalendar: 'pessoal',
  calendarVisibility: { pessoal: true, trabalho: true, saude: true, estudos: true, social: true },
  browserNotifications: false,
  eventNotifications: true,
  soundEnabled: true,
  verseNotifications: true,
  verseMorningTime: '08:00',
  verseAfternoonTime: '16:00',
  smartResponse: true,
  voiceInput: true,
  smartSync: true,
  defaultDuration: 60,
  defaultReminder: 0,
  allDayReminder: 540,
  conflictCheck: true
});

let settings = structuredClone(DEFAULTS);
let activeSection = 'account';
let initialized = false;

function fromDatabase(row = {}) {
  return {
    displayName: row.display_name ?? DEFAULTS.displayName,
    language: row.language ?? DEFAULTS.language,
    timezone: row.timezone ?? DEFAULTS.timezone,
    theme: row.theme ?? DEFAULTS.theme,
    hour24: row.hour_24 ?? DEFAULTS.hour24,
    weekStartsOn: row.week_starts_on ?? DEFAULTS.weekStartsOn,
    defaultCalendar: row.default_calendar ?? DEFAULTS.defaultCalendar,
    calendarVisibility: row.calendar_visibility ?? structuredClone(DEFAULTS.calendarVisibility),
    browserNotifications: row.browser_notifications ?? DEFAULTS.browserNotifications,
    eventNotifications: row.event_notifications ?? DEFAULTS.eventNotifications,
    soundEnabled: row.sound_enabled ?? DEFAULTS.soundEnabled,
    verseNotifications: row.verse_notifications ?? DEFAULTS.verseNotifications,
    verseMorningTime: String(row.verse_morning_time ?? DEFAULTS.verseMorningTime).slice(0, 5),
    verseAfternoonTime: String(row.verse_afternoon_time ?? DEFAULTS.verseAfternoonTime).slice(0, 5),
    smartResponse: row.smart_response ?? DEFAULTS.smartResponse,
    voiceInput: row.voice_input ?? DEFAULTS.voiceInput,
    smartSync: row.smart_sync ?? DEFAULTS.smartSync,
    defaultDuration: row.default_duration ?? DEFAULTS.defaultDuration,
    defaultReminder: row.default_reminder ?? DEFAULTS.defaultReminder,
    allDayReminder: row.all_day_reminder ?? DEFAULTS.allDayReminder,
    conflictCheck: row.conflict_check ?? DEFAULTS.conflictCheck
  };
}

function toDatabase(value, userId) {
  return {
    user_id: userId,
    display_name: value.displayName,
    language: value.language,
    timezone: value.timezone,
    theme: value.theme,
    hour_24: value.hour24,
    week_starts_on: value.weekStartsOn,
    default_calendar: value.defaultCalendar,
    calendar_visibility: value.calendarVisibility,
    browser_notifications: value.browserNotifications,
    event_notifications: value.eventNotifications,
    sound_enabled: value.soundEnabled,
    verse_notifications: value.verseNotifications,
    verse_morning_time: value.verseMorningTime,
    verse_afternoon_time: value.verseAfternoonTime,
    smart_response: value.smartResponse,
    voice_input: value.voiceInput,
    smart_sync: value.smartSync,
    default_duration: value.defaultDuration,
    default_reminder: value.defaultReminder,
    all_day_reminder: value.allDayReminder,
    conflict_check: value.conflictCheck,
    updated_at: new Date().toISOString()
  };
}

export function getSettings() {
  return settings;
}

export async function loadSettings() {
  const user = getCurrentUser();
  if (!user || !supabase) {
    settings = structuredClone(DEFAULTS);
    return settings;
  }

  const { data, error } = await supabase
    .from('time_tasks_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar preferências:', error);
    showToast('Não foi possível carregar as configurações', 'error');
    settings = structuredClone(DEFAULTS);
    return settings;
  }

  if (data) {
    settings = fromDatabase(data);
  } else {
    const initial = toDatabase(settings, user.id);
    const { data: created, error: createError } = await supabase
      .from('time_tasks_settings')
      .upsert(initial, { onConflict: 'user_id' })
      .select()
      .single();
    if (createError) {
      console.error('Erro ao criar preferências:', createError);
    } else {
      settings = fromDatabase(created);
    }
  }

  setThemePreference(settings.theme);
  setCalendarVisibility(settings.calendarVisibility);
  renderCalendarList();
  refreshCalendar();
  document.dispatchEvent(new CustomEvent('timetasks:settings', { detail: settings }));
  return settings;
}

export async function saveSettings(patch) {
  const user = getCurrentUser();
  if (!user || !supabase) return false;
  settings = { ...settings, ...patch };
  const { data, error } = await supabase
    .from('time_tasks_settings')
    .upsert(toDatabase(settings, user.id), { onConflict: 'user_id' })
    .select()
    .single();
  if (error) {
    console.error('Erro ao salvar preferências:', error);
    showToast('Não foi possível salvar a configuração', 'error');
    return false;
  }
  settings = fromDatabase(data);
  setThemePreference(settings.theme);
  setCalendarVisibility(settings.calendarVisibility);
  renderCalendarList();
  refreshCalendar();
  document.dispatchEvent(new CustomEvent('timetasks:settings', { detail: settings }));
  return true;
}

function header(title, subtitle = '') {
  return `<header class="settings-page-header"><span class="eyebrow">Configurações</span><h2>${title}</h2>${subtitle ? `<p class="muted">${subtitle}</p>` : ''}</header>`;
}

function switchControl(key, checked, label) {
  return `<label class="switch" aria-label="${label}"><input type="checkbox" data-setting-key="${key}" ${checked ? 'checked' : ''}/><span></span></label>`;
}

function option(value, label, selected) {
  return `<option value="${value}" ${String(selected) === String(value) ? 'selected' : ''}>${label}</option>`;
}

function renderPlan(container) {
  container.innerHTML = `${header('Meu Plano')}<div class="settings-page-body"><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Ambiente privado</strong><span>Uso interno do SX Time Tasks, sem modo demonstração e sem cobrança simulada.</span></div><span class="connected-status">ATIVO</span></div><div class="setting-row"><div class="setting-copy"><strong>Dados em nuvem</strong><span>Eventos, tarefas e preferências persistidos no Supabase com RLS.</span></div><span class="connected-status">ATIVO</span></div><div class="setting-row"><div class="setting-copy"><strong>IA protegida</strong><span>A chave fica no servidor e nunca é enviada ao navegador.</span></div><span class="connected-status">ATIVA</span></div></div></div>`;
}

function renderAccount(container) {
  const user = getCurrentUser();
  container.innerHTML = `${header('Conta', 'Perfil, acesso e conexões disponíveis.')}<div class="settings-page-body"><div class="settings-card"><div class="settings-profile"><img class="brand-logo" src="/sx-time-tasks-logo.png" alt="SX Time Tasks"><div><strong id="settings-profile-name"></strong><p id="settings-profile-email" class="muted"></p></div></div><div class="setting-row"><div class="setting-copy"><strong>Nome de exibição</strong><span>Usado nas páginas públicas de agendamento.</span></div><input id="settings-display-name" class="form-input setting-control" maxlength="120" /></div><div class="setting-row"><div class="setting-copy"><strong>E-mail e senha</strong><span>Autenticação isolada por sessão e protegida pelo Supabase.</span></div><span class="connected-status">CONECTADO</span></div></div><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>WhatsApp</strong><span>Canal externo ainda não configurado.</span></div><span class="unavailable-status">INDISPONÍVEL</span></div><div class="setting-row"><div class="setting-copy"><strong>Telegram</strong><span>Canal externo ainda não configurado.</span></div><span class="unavailable-status">INDISPONÍVEL</span></div><div class="setting-row"><div class="setting-copy"><strong>Google Calendar</strong><span>Sincronização externa está no roadmap.</span></div><span class="unavailable-status">INDISPONÍVEL</span></div></div><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Sessão web atual</strong><span>${navigator.userAgent.includes('Mac') ? 'Navegador no macOS' : 'Navegador atual'} · sessão autenticada</span></div><span class="connected-status">ATUAL</span></div></div><div class="settings-actions"><button id="settings-save-profile" class="btn-primary" type="button">Salvar perfil</button></div></div>`;
  container.querySelector('#settings-profile-name').textContent = settings.displayName || 'Usuário Time Tasks';
  container.querySelector('#settings-profile-email').textContent = user?.email || '';
  container.querySelector('#settings-display-name').value = settings.displayName;
  container.querySelector('#settings-save-profile').addEventListener('click', async () => {
    const displayName = container.querySelector('#settings-display-name').value.trim();
    if (await saveSettings({ displayName })) {
      showToast('Perfil atualizado', 'success');
      renderSection('account');
    }
  });
}

function renderGeneral(container) {
  const zones = [...new Set([settings.timezone, 'America/Fortaleza', 'America/Sao_Paulo', 'America/Manaus', 'America/Belem', 'UTC'])];
  container.innerHTML = `${header('Geral')}<div class="settings-page-body"><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Idioma da interface</strong><span>Idioma usado nos textos do aplicativo.</span></div><select class="form-select setting-control" data-setting-key="language">${option('pt-BR','Português (Brasil)',settings.language)}${option('en-US','English',settings.language)}${option('es-ES','Español',settings.language)}</select></div><div class="setting-row"><div class="setting-copy"><strong>Tema de cores</strong><span>Identidade SX em modo claro, escuro ou conforme o sistema.</span></div><select class="form-select setting-control" data-setting-key="theme">${option('system','Seguir sistema',settings.theme)}${option('light','Claro',settings.theme)}${option('dark','Escuro',settings.theme)}</select></div><div class="setting-row"><div class="setting-copy"><strong>Fuso horário</strong><span>Base para a SX, lembretes e agendamentos.</span></div><select class="form-select setting-control" data-setting-key="timezone">${zones.map(zone => option(zone,zone,settings.timezone)).join('')}</select></div><div class="setting-row"><div class="setting-copy"><strong>Horário de 24 horas</strong><span>Exibe horas no formato 14:30.</span></div>${switchControl('hour24',settings.hour24,'Horário de 24 horas')}</div><div class="setting-row"><div class="setting-copy"><strong>A semana começa em</strong></div><select class="form-select setting-control" data-setting-key="weekStartsOn" data-number="true">${option(0,'Domingo',settings.weekStartsOn)}${option(1,'Segunda-feira',settings.weekStartsOn)}</select></div></div></div>`;
}

function renderCalendars(container) {
  container.innerHTML = `${header('Calendários')}<div class="settings-page-body"><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Calendário padrão</strong><span>Aplicado a novos eventos manuais e criados pela IA.</span></div><select class="form-select setting-control" data-setting-key="defaultCalendar">${Object.entries(CALENDARS).map(([key, cal]) => option(key,cal.name,settings.defaultCalendar)).join('')}</select></div>${Object.entries(CALENDARS).map(([key, cal]) => `<div class="setting-row"><div class="setting-copy"><strong><span style="color:${cal.color}">●</span> ${cal.name}</strong><span>Mostrar na grade do calendário.</span></div>${switchControl(`calendar:${key}`,settings.calendarVisibility[key] !== false,`Mostrar ${cal.name}`)}</div>`).join('')}</div></div>`;
}

function renderNotifications(container) {
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';
  container.innerHTML = `${header('Notificações', 'Alertas enquanto o aplicativo estiver aberto.')}<div class="settings-page-body"><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Notificações do navegador</strong><span>Permissão atual: ${permission}.</span></div><button id="request-notification-permission" class="btn-secondary" type="button">Solicitar permissão</button></div><div class="setting-row"><div class="setting-copy"><strong>Lembretes de eventos e tarefas</strong><span>Dispara no horário configurado.</span></div>${switchControl('eventNotifications',settings.eventNotifications,'Lembretes de eventos')}</div><div class="setting-row"><div class="setting-copy"><strong>Som do lembrete</strong><span>Reproduz o alerta sonoro dentro do app.</span></div>${switchControl('soundEnabled',settings.soundEnabled,'Som do lembrete')}</div><div class="setting-row"><div class="setting-copy"><strong>Testar som</strong><span>Valide o volume antes de depender do alerta.</span></div><button id="test-notification-sound" class="btn-secondary" type="button">Ouvir agora</button></div></div><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Versículo por acesso</strong><span>Uma mensagem bíblica é exibida em balão a cada login, com botão para fechar. Não requer configuração.</span></div><span class="connected-status">ATIVO</span></div></div><p class="settings-note">Para alertas quando o navegador estiver totalmente fechado será necessário ativar Web Push e service worker na próxima camada de infraestrutura.</p></div>`;
  const permissionButton = container.querySelector('#request-notification-permission');
  if (!('Notification' in window)) permissionButton.disabled = true;
  permissionButton.addEventListener('click', async () => {
    const result = await Notification.requestPermission();
    await saveSettings({ browserNotifications: result === 'granted' });
    showToast(result === 'granted' ? 'Notificações autorizadas' : 'Permissão não concedida', result === 'granted' ? 'success' : 'error');
    renderSection('notifications');
  });
  container.querySelector('#test-notification-sound').addEventListener('click', () => {
    document.dispatchEvent(new Event('timetasks:test-sound'));
  });
}

function renderAi(container) {
  container.innerHTML = `${header('IA', 'A assistente SX cria eventos, tarefas e lembretes por texto ou voz.')}<div class="settings-page-body"><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>IA ativa</strong><span>A chave está protegida no servidor do EasyPanel e não aparece no navegador.</span></div><span class="connected-status">EMBUTIDA</span></div><div class="setting-row"><div class="setting-copy"><strong>Resposta inteligente</strong><span>Permite que a SX explique o que criou.</span></div>${switchControl('smartResponse',settings.smartResponse,'Resposta inteligente')}</div><div class="setting-row"><div class="setting-copy"><strong>Entrada por voz</strong><span>Converte sua fala em comando antes de enviar à SX.</span></div>${switchControl('voiceInput',settings.voiceInput,'Entrada por voz')}</div></div><p class="settings-note">Exemplo: “SX, amanhã às 9h reunião de marketing, me lembre 15 minutos antes”.</p></div>`;
}

function renderNewEvents(container) {
  container.innerHTML = `${header('Novos Eventos')}<div class="settings-page-body"><div class="settings-card"><div class="setting-row"><div class="setting-copy"><strong>Sincronização inteligente</strong><span>A IA usa suas preferências para completar duração e lembrete.</span></div>${switchControl('smartSync',settings.smartSync,'Sincronização inteligente')}</div><div class="setting-row"><div class="setting-copy"><strong>Duração padrão</strong></div><select class="form-select setting-control" data-setting-key="defaultDuration" data-number="true">${[15,30,45,60,90,120].map(value => option(value,`${value} minutos`,settings.defaultDuration)).join('')}</select></div><div class="setting-row"><div class="setting-copy"><strong>Alerta do evento</strong></div><select class="form-select setting-control" data-setting-key="defaultReminder" data-number="true">${option(0,'No horário',settings.defaultReminder)}${option(5,'5 minutos antes',settings.defaultReminder)}${option(15,'15 minutos antes',settings.defaultReminder)}${option(30,'30 minutos antes',settings.defaultReminder)}${option(60,'1 hora antes',settings.defaultReminder)}</select></div><div class="setting-row"><div class="setting-copy"><strong>Alerta para dia inteiro</strong></div><select class="form-select setting-control" data-setting-key="allDayReminder" data-number="true">${option(0,'À meia-noite',settings.allDayReminder)}${option(480,'Às 08:00',settings.allDayReminder)}${option(540,'Às 09:00',settings.allDayReminder)}</select></div><div class="setting-row"><div class="setting-copy"><strong>Verificação de conflitos</strong><span>Bloqueia eventos manuais sobrepostos.</span></div>${switchControl('conflictCheck',settings.conflictCheck,'Verificação de conflitos')}</div></div></div>`;
}

function renderAbout(container) {
  container.innerHTML = `${header('Sobre o SX Time Tasks')}<div class="settings-page-body"><div class="settings-card"><div class="settings-profile"><img class="brand-logo" src="/sx-time-tasks-logo.png" alt="SX Time Tasks"><div><strong>SX Time Tasks</strong><p class="muted">Agenda, tarefas, lembretes e páginas de agendamento.</p></div></div><div class="setting-row"><div class="setting-copy"><strong>Manual de uso</strong><span>Guia atualizado junto com cada entrega.</span></div><a class="btn-secondary" href="https://github.com/sxsevenxperts/TIME-TASKS/blob/main/MANUAL_DE_USO.md" target="_blank" rel="noreferrer">Documentação</a></div><div class="setting-row"><div class="setting-copy"><strong>Privacidade</strong><span>Dados isolados por usuário com RLS no Supabase.</span></div><span class="connected-status">ATIVA</span></div><div class="setting-row"><div class="setting-copy"><strong>Versão</strong></div><span class="muted">2.0.0</span></div></div></div>`;
}

function bindCommonControls(container) {
  container.querySelectorAll('[data-setting-key]').forEach(control => {
    control.addEventListener('change', async () => {
      const key = control.dataset.settingKey;
      let value = control.type === 'checkbox' ? control.checked : control.value;
      if (control.dataset.number === 'true') value = Number(value);
      if (key.startsWith('calendar:')) {
        const calendar = key.split(':')[1];
        value = { ...settings.calendarVisibility, [calendar]: control.checked };
        await saveSettings({ calendarVisibility: value });
      } else {
        await saveSettings({ [key]: value });
      }
    });
  });
}

export function renderSection(section = activeSection) {
  const container = document.getElementById('settings-content');
  if (!container) return;
  activeSection = section;
  const renderers = {
    plan: renderPlan,
    account: renderAccount,
    general: renderGeneral,
    calendars: renderCalendars,
    notifications: renderNotifications,
    ai: renderAi,
    'new-events': renderNewEvents,
    about: renderAbout
  };
  (renderers[section] || renderAccount)(container);
  bindCommonControls(container);
}

export function initSettings() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('timetasks:settings-section', event => renderSection(event.detail?.section || 'account'));
  document.addEventListener('timetasks:calendar-visibility', event => {
    const { calendar, visible } = event.detail || {};
    if (!calendar) return;
    void saveSettings({ calendarVisibility: { ...settings.calendarVisibility, [calendar]: visible } });
  });
  document.addEventListener('timetasks:session', async event => {
    if (event.detail?.user) {
      await loadSettings();
      renderSection(activeSection);
    } else {
      settings = structuredClone(DEFAULTS);
      const container = document.getElementById('settings-content');
      if (container) container.innerHTML = '';
    }
  });
}
