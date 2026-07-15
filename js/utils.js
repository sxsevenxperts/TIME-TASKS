// ============================================================
// utils.js — Utilitários de data e hora para o Time Tasks
// ============================================================

/**
 * Nomes dos meses em português
 */
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const DAY_NAMES = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAY_NAMES_MIN = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Retorna o início da semana (domingo) para uma data
 */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retorna o fim da semana (sábado) para uma data
 */
export function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Retorna array de datas de uma semana
 */
export function getWeekDays(date) {
  const start = getWeekStart(date);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Retorna array de N dias a partir de uma data
 */
export function getNDays(date, n) {
  const days = [];
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Retorna o primeiro dia visível do grid mensal (pode ser do mês anterior)
 */
export function getMonthGridDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days = [];

  // Dias do mês anterior
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Dias do mês atual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Dias do próximo mês para completar a grade (6 semanas = 42 dias)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
}

/**
 * Verifica se duas datas são o mesmo dia
 */
export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/**
 * Verifica se uma data é hoje
 */
export function isToday(date) {
  return isSameDay(date, new Date());
}

/**
 * Formata hora como "09:00"
 */
export function formatTime(hours, minutes = 0) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formata data como "15 de Julho de 2026"
 */
export function formatDateFull(date) {
  return `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Formata data como "15 Jul"
 */
export function formatDateShort(date) {
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;
}

/**
 * Formata o título do header baseado na visão atual
 */
export function formatHeaderTitle(date, view) {
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  if (view === 'day') {
    return `${date.getDate()} de ${month} de ${year}`;
  }

  if (view === 'month') {
    return `${month} ${year}`;
  }

  // week ou 3day
  const weekStart = view === 'week' ? getWeekStart(date) : date;
  const endOffset = view === 'week' ? 6 : 2;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + endOffset);

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  }

  if (weekStart.getFullYear() === weekEnd.getFullYear()) {
    return `${MONTH_NAMES_SHORT[weekStart.getMonth()]} – ${MONTH_NAMES_SHORT[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;
  }

  return `${MONTH_NAMES_SHORT[weekStart.getMonth()]} ${weekStart.getFullYear()} – ${MONTH_NAMES_SHORT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
}

/**
 * Converte string "HH:MM" para minutos desde meia-noite
 */
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte minutos desde meia-noite para string "HH:MM"
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return formatTime(h, m);
}

/**
 * Retorna a string de data no formato "YYYY-MM-DD"
 */
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Gera um ID único
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce utility
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
