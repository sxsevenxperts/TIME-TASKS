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
    if (event.completed || event.notifiedAt) continue;
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

// A mensagem bíblica é única: um versículo por acesso, exibido no balão de
// verse-access.js com botão de fechar. Não há mais entregas por período.

async function runChecks() {
  if (running || !getCurrentUser() || document.hidden) return;
  running = true;
  try {
    const now = new Date();
    await checkEvents(now);
    await checkSeeds(now);
  } finally {
    running = false;
  }
}

function start() {
  clearInterval(timer);
  void runChecks();
  timer = setInterval(() => void runChecks(), 15_000);
}

function stop() {
  clearInterval(timer);
  timer = null;
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
