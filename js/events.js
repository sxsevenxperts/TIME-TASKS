// ============================================================
// events.js — Gerenciamento de eventos (CRUD + localStorage)
// ============================================================

import { generateId, toDateKey, timeToMinutes } from './utils.js';

const EVENTS_KEY = 'time-tasks-events';

/**
 * Definição dos calendários disponíveis e suas cores
 */
export const CALENDARS = {
  pessoal:  { name: 'Pessoal',  color: '#5856D6', visible: true },
  trabalho: { name: 'Trabalho', color: '#007AFF', visible: true },
  saude:    { name: 'Saúde',    color: '#34C759', visible: true },
  estudos:  { name: 'Estudos',  color: '#FF9500', visible: true },
  social:   { name: 'Social',   color: '#FF2D55', visible: true },
};

const CALENDARS_KEY = 'time-tasks-calendars-visibility';

/**
 * Carrega visibilidade dos calendários
 */
export function loadCalendarVisibility() {
  const saved = localStorage.getItem(CALENDARS_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.keys(parsed).forEach(key => {
      if (CALENDARS[key]) {
        CALENDARS[key].visible = parsed[key];
      }
    });
  }
}

/**
 * Salva visibilidade dos calendários
 */
export function saveCalendarVisibility() {
  const vis = {};
  Object.keys(CALENDARS).forEach(key => {
    vis[key] = CALENDARS[key].visible;
  });
  localStorage.setItem(CALENDARS_KEY, JSON.stringify(vis));
}

/**
 * Alterna visibilidade de um calendário
 */
export function toggleCalendarVisibility(calKey) {
  if (CALENDARS[calKey]) {
    CALENDARS[calKey].visible = !CALENDARS[calKey].visible;
    saveCalendarVisibility();
  }
}

/**
 * Carrega todos os eventos do localStorage
 */
export function loadEvents() {
  const data = localStorage.getItem(EVENTS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Salva todos os eventos no localStorage
 */
function saveEvents(events) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

/**
 * Cria um novo evento
 */
export function createEvent(eventData) {
  const events = loadEvents();
  const newEvent = {
    id: generateId(),
    title: eventData.title,
    date: eventData.date,        // "YYYY-MM-DD"
    startTime: eventData.startTime, // "HH:MM" ou null se allDay
    endTime: eventData.endTime,     // "HH:MM" ou null se allDay
    allDay: eventData.allDay || false,
    calendar: eventData.calendar || 'pessoal',
    description: eventData.description || '',
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  saveEvents(events);
  return newEvent;
}

/**
 * Atualiza um evento existente
 */
export function updateEvent(id, eventData) {
  const events = loadEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;

  events[idx] = { ...events[idx], ...eventData };
  saveEvents(events);
  return events[idx];
}

/**
 * Remove um evento
 */
export function deleteEvent(id) {
  let events = loadEvents();
  events = events.filter(e => e.id !== id);
  saveEvents(events);
}

/**
 * Busca evento por ID
 */
export function getEventById(id) {
  const events = loadEvents();
  return events.find(e => e.id === id) || null;
}

/**
 * Retorna eventos de um dia específico (filtrando por visibilidade do calendário)
 */
export function getEventsForDay(dateKey) {
  const events = loadEvents();
  return events.filter(e =>
    e.date === dateKey &&
    CALENDARS[e.calendar]?.visible !== false
  );
}

/**
 * Retorna eventos em um intervalo de datas
 */
export function getEventsInRange(startDate, endDate) {
  const events = loadEvents();
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  return events.filter(e =>
    e.date >= startKey &&
    e.date <= endKey &&
    CALENDARS[e.calendar]?.visible !== false
  );
}

/**
 * Retorna a cor de um calendário
 */
export function getCalendarColor(calKey) {
  return CALENDARS[calKey]?.color || '#8e8e93';
}

/**
 * Detecta conflitos para um evento em um dia
 */
export function detectConflicts(dateKey, startTime, endTime, excludeId = null) {
  const dayEvents = getEventsForDay(dateKey).filter(e => !e.allDay && e.id !== excludeId);
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  return dayEvents.filter(e => {
    const eStart = timeToMinutes(e.startTime);
    const eEnd = timeToMinutes(e.endTime);
    return newStart < eEnd && newEnd > eStart;
  });
}

/**
 * Popula eventos de exemplo se não houver nenhum
 */
export function seedDemoEvents() {
  const events = loadEvents();
  if (events.length > 0) return;

  const today = new Date();
  const todayKey = toDateKey(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterKey = toDateKey(dayAfter);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  const demos = [
    { title: 'Reunião de Planejamento', date: todayKey, startTime: '09:00', endTime: '10:30', calendar: 'trabalho', description: 'Revisão de sprints e metas do trimestre' },
    { title: 'Almoço com equipe', date: todayKey, startTime: '12:00', endTime: '13:00', calendar: 'social', description: 'Restaurante novo no centro' },
    { title: 'Academia', date: todayKey, startTime: '07:00', endTime: '08:00', calendar: 'saude', description: 'Treino de pernas' },
    { title: 'Estudo de JavaScript', date: todayKey, startTime: '15:00', endTime: '17:00', calendar: 'estudos', description: 'Módulos ES6 e Promises' },
    { title: 'Consulta médica', date: tomorrowKey, startTime: '10:00', endTime: '11:00', calendar: 'saude', description: 'Check-up anual' },
    { title: 'Deploy do projeto', date: tomorrowKey, startTime: '14:00', endTime: '16:00', calendar: 'trabalho', description: 'Deploy da versão 2.0' },
    { title: 'Aniversário da Ana', date: dayAfterKey, allDay: true, calendar: 'social', description: 'Comprar presente!' },
    { title: 'Entrega do relatório', date: dayAfterKey, startTime: '09:00', endTime: '10:00', calendar: 'trabalho', description: 'Relatório mensal de performance' },
    { title: 'Yoga', date: yesterdayKey, startTime: '06:30', endTime: '07:30', calendar: 'saude', description: 'Sessão matinal de yoga' },
    { title: 'Call com cliente', date: yesterdayKey, startTime: '14:00', endTime: '15:00', calendar: 'trabalho', description: 'Apresentação do protótipo' },
    { title: 'Happy Hour', date: todayKey, startTime: '18:00', endTime: '20:00', calendar: 'social', description: 'Bar do João com a galera' },
    { title: 'Revisão de código', date: tomorrowKey, startTime: '16:30', endTime: '18:00', calendar: 'trabalho', description: 'PR #234 — refactor do módulo de auth' },
  ];

  demos.forEach(d => createEvent(d));
}
