import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { loadEvents, markEventNotified } from './events.js';
import { getSeeds, markSeedNotified } from './seeds.js';
import { getSettings } from './settings.js';
import { showToast } from './modal.js';

let timer = null;
let running = false;
let audioContext = null;
let initialized = false;

function zonedDateTimeToDate(dateKey, time, timezone) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const assumed = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(assumed))
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, part.value]));
  const represented = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );
  return new Date(assumed - (represented - assumed));
}

function dateKeyInZone(timezone, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function minutesInZone(timezone, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || '00:00').split(':').map(Number);
  return hour * 60 + minute;
}

export async function playNotificationSound(force = false) {
  if (!force && !getSettings().soundEnabled) return false;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    audioContext ||= new AudioContextClass();
    await audioContext.resume();
    const start = audioContext.currentTime;
    [
      { frequency: 740, offset: 0, duration: 0.16 },
      { frequency: 988, offset: 0.19, duration: 0.24 }
    ].forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = note.frequency;
      gain.gain.setValueAtTime(0.0001, start + note.offset);
      gain.gain.exponentialRampToValueAtTime(0.16, start + note.offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.offset + note.duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start + note.offset);
      oscillator.stop(start + note.offset + note.duration + 0.02);
    });
    return true;
  } catch (error) {
    console.warn('O navegador bloqueou o som do lembrete:', error);
    return false;
  }
}

async function notify(title, body, tag) {
  await playNotificationSound();
  showToast(`${title}: ${body}`, 'info');
  const settings = getSettings();
  if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      tag,
      icon: '/sx-time-tasks-logo.png',
      badge: '/sx-time-tasks-logo.png',
      renotify: false
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

function eventTimes(event, settings) {
  if (event.allDay) {
    const minutes = Number(settings.allDayReminder) || 0;
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const occurrence = zonedDateTimeToDate(event.date, '23:59', settings.timezone);
    return { target: zonedDateTimeToDate(event.date, time, settings.timezone), occurrence };
  }
  const occurrence = zonedDateTimeToDate(event.date, event.startTime, settings.timezone);
  return {
    target: new Date(occurrence.getTime() - Number(event.reminderMinutes || 0) * 60_000),
    occurrence
  };
}

async function checkEvents(now) {
  const settings = getSettings();
  if (!settings.eventNotifications) return;
  for (const event of loadEvents()) {
    if (event.notifiedAt) continue;
    const { target, occurrence } = eventTimes(event, settings);
    if (now >= target && now.getTime() - occurrence.getTime() < 86_400_000) {
      const claimed = await markEventNotified(event.id);
      if (claimed) await notify('Lembrete de evento', event.title, `event-${event.id}`);
    }
  }
}

async function checkSeeds(now) {
  if (!getSettings().eventNotifications) return;
  for (const seed of getSeeds()) {
    if (seed.completed || seed.notifiedAt) continue;
    const targetValue = seed.reminderAt || seed.dueAt;
    if (!targetValue) continue;
    const target = new Date(targetValue);
    if (now >= target && now.getTime() - target.getTime() < 86_400_000) {
      const claimed = await markSeedNotified(seed.id);
      if (claimed) await notify('Lembrete de tarefa', seed.title, `seed-${seed.id}`);
    }
  }
}

function renderVerse(verse) {
  const card = document.getElementById('daily-verse-card');
  if (!card || !verse) return;
  document.getElementById('daily-verse-text').textContent = `“${verse.verse_text || verse.text}”`;
  document.getElementById('daily-verse-reference').textContent = verse.reference;
  card.hidden = false;
}

async function existingVerse(dateKey, period) {
  const user = getCurrentUser();
  if (!user || !supabase) return null;
  const { data, error } = await supabase
    .from('time_tasks_verse_deliveries')
    .select('*')
    .eq('user_id', user.id)
    .eq('delivery_date', dateKey)
    .eq('period', period)
    .maybeSingle();
  if (error) console.error('Erro ao consultar versículo:', error);
  return data || null;
}

async function apiToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function deliverVerse(dateKey, period) {
  const user = getCurrentUser();
  if (!user || !supabase) return;
  const delivered = await existingVerse(dateKey, period);
  if (delivered) {
    renderVerse(delivered);
    return;
  }
  const token = await apiToken();
  if (!token) return;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch('/api/verse', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      console.error('Não foi possível obter o versículo:', response.status);
      return;
    }
    const verse = await response.json();
    const { data, error } = await supabase
      .from('time_tasks_verse_deliveries')
      .insert({
        user_id: user.id,
        verse_key: verse.key,
        reference: verse.reference,
        verse_text: verse.text,
        period,
        delivery_date: dateKey
      })
      .select()
      .single();
    if (!error && data) {
      renderVerse(data);
      const label = period === 'morning' ? 'Versículo da manhã' : 'Versículo da tarde';
      await notify(label, `${data.reference} — ${data.verse_text}`, `verse-${dateKey}-${period}`);
      return;
    }
    if (error?.code !== '23505') {
      console.error('Erro ao registrar versículo:', error);
      return;
    }
    const nowDelivered = await existingVerse(dateKey, period);
    if (nowDelivered) {
      renderVerse(nowDelivered);
      return;
    }
  }
  console.warn('Não foi encontrado um versículo ainda não entregue após várias tentativas.');
}

async function loadLatestVerse() {
  const user = getCurrentUser();
  if (!user || !supabase) return;
  const { data } = await supabase
    .from('time_tasks_verse_deliveries')
    .select('*')
    .eq('user_id', user.id)
    .order('delivered_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) renderVerse(data);
}

async function checkVerses(now) {
  const settings = getSettings();
  if (!settings.verseNotifications) return;
  const dateKey = dateKeyInZone(settings.timezone, now);
  const currentMinutes = minutesInZone(settings.timezone, now);
  if (currentMinutes >= timeToMinutes(settings.verseMorningTime)) {
    await deliverVerse(dateKey, 'morning');
  }
  if (currentMinutes >= timeToMinutes(settings.verseAfternoonTime)) {
    await deliverVerse(dateKey, 'afternoon');
  }
}

async function runChecks() {
  if (running || !getCurrentUser() || document.hidden) return;
  running = true;
  try {
    const now = new Date();
    await checkEvents(now);
    await checkSeeds(now);
    await checkVerses(now);
  } finally {
    running = false;
  }
}

function start() {
  clearInterval(timer);
  void loadLatestVerse();
  void runChecks();
  timer = setInterval(() => void runChecks(), 15_000);
}

function stop() {
  clearInterval(timer);
  timer = null;
  const card = document.getElementById('daily-verse-card');
  if (card) card.hidden = true;
}

export function initReminders() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('timetasks:test-sound', async () => {
    const played = await playNotificationSound(true);
    showToast(played ? 'Som de notificação reproduzido' : 'Som indisponível neste navegador', played ? 'success' : 'error');
  });
  document.addEventListener('timetasks:session', event => {
    if (event.detail?.user) start();
    else stop();
  });
  document.addEventListener('timetasks:settings', () => void runChecks());
  document.addEventListener('timetasks:data', () => void runChecks());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void runChecks();
  });
}
