// ============================================================
// events.js — Gerenciamento de eventos no Supabase
// ============================================================

import { generateId, toDateKey, timeToMinutes } from './utils.js';
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

let localEvents = [];

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

export function loadCalendarVisibility() {
  const saved = localStorage.getItem(CALENDARS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(key => {
        if (CALENDARS[key]) CALENDARS[key].visible = parsed[key] !== false;
      });
    } catch {
      localStorage.removeItem(CALENDARS_KEY);
    }
  }
}

export function saveCalendarVisibility() {
  const vis = {};
  Object.keys(CALENDARS).forEach(key => {
    vis[key] = CALENDARS[key].visible;
  });
  localStorage.setItem(CALENDARS_KEY, JSON.stringify(vis));
}

export function toggleCalendarVisibility(calKey) {
  if (CALENDARS[calKey]) {
    CALENDARS[calKey].visible = !CALENDARS[calKey].visible;
    saveCalendarVisibility();
  }
}

/**
 * Carrega todos os eventos do Supabase para a memória
 */
export async function loadEventsFromServer() {
  const user = getCurrentUser();
  if (!user || !supabase) {
    localEvents = [];
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Erro ao buscar eventos do Supabase:', error);
    localEvents = [];
    return [];
  }

  // Converter snake_case para camelCase para o frontend não quebrar
  localEvents = data.map(dbEvent => ({
    id: dbEvent.id,
    title: dbEvent.title,
    date: dbEvent.date,
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    allDay: dbEvent.all_day,
    calendar: dbEvent.calendar,
    description: dbEvent.description,
    createdAt: dbEvent.created_at
  }));

  return localEvents;
}

export function loadEvents() {
  return localEvents; // Retorna da memória
}

/**
 * Cria um novo evento no Supabase e na memória
 */
export async function createEvent(eventData) {
  const user = getCurrentUser();
  if (!user || !supabase) return null;

  const newEvent = {
    user_id: user.id,
    title: eventData.title,
    date: eventData.date,        // "YYYY-MM-DD"
    start_time: eventData.startTime, // "HH:MM" ou null se allDay
    end_time: eventData.endTime,     // "HH:MM" ou null se allDay
    all_day: eventData.allDay || false,
    calendar: eventData.calendar || 'pessoal',
    description: eventData.description || ''
  };

  const { data, error } = await supabase
    .from('events')
    .insert([newEvent])
    .select();

  if (error) {
    console.error('Erro ao criar evento:', error);
    return null;
  }

  if (data && data.length > 0) {
    const dbEvent = data[0];
    const savedEvent = {
      id: dbEvent.id,
      title: dbEvent.title,
      date: dbEvent.date,
      startTime: dbEvent.start_time,
      endTime: dbEvent.end_time,
      allDay: dbEvent.all_day,
      calendar: dbEvent.calendar,
      description: dbEvent.description,
      createdAt: dbEvent.created_at
    };
    localEvents.push(savedEvent);
    return savedEvent;
  }
  return null;
}

/**
 * Atualiza um evento existente
 */
export async function updateEvent(id, eventData) {
  if (!supabase || !getCurrentUser()) return null;
  const idx = localEvents.findIndex(e => e.id === id);
  if (idx === -1) return null;

  const updatePayload = {
    title: eventData.title,
    date: eventData.date,
    start_time: eventData.startTime,
    end_time: eventData.endTime,
    all_day: eventData.allDay,
    calendar: eventData.calendar,
    description: eventData.description
  };

  const { error } = await supabase
    .from('events')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar evento:', error);
    return null;
  }

  localEvents[idx] = { ...localEvents[idx], ...eventData };
  return localEvents[idx];
}

/**
 * Remove um evento
 */
export async function deleteEvent(id) {
  if (!supabase || !getCurrentUser()) return false;
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar evento:', error);
    return false;
  }

  localEvents = localEvents.filter(e => e.id !== id);
  return true;
}

/**
 * Busca evento por ID (da memória)
 */
export function getEventById(id) {
  return localEvents.find(e => e.id === id) || null;
}

/**
 * Retorna eventos de um dia específico (filtrando por visibilidade do calendário)
 */
export function getEventsForDay(dateKey) {
  return localEvents.filter(e =>
    e.date === dateKey &&
    CALENDARS[e.calendar]?.visible !== false
  );
}

/**
 * Retorna eventos em um intervalo de datas
 */
export function getEventsInRange(startDate, endDate) {
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  return localEvents.filter(e =>
    e.date >= startKey &&
    e.date <= endKey &&
    CALENDARS[e.calendar]?.visible !== false
  );
}

export function getCalendarColor(calKey) {
  return CALENDARS[calKey]?.color || '#8e8e93';
}

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
