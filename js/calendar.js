// ============================================================
// calendar.js — Renderização do calendário (semana/dia/3dias/mês)
// ============================================================

import {
  getWeekDays, getNDays, getMonthGridDays, isToday, isSameDay,
  toDateKey, formatTime, formatHeaderTitle, DAY_NAMES_SHORT,
  DAY_NAMES, MONTH_NAMES, timeToMinutes
} from './utils.js';
import { getEventsForDay, getEventsInRange, getCalendarColor } from './events.js';
import { openPopover, openModal } from './modal.js';
import { updateSelectedDate } from './sidebar.js';

const HOUR_HEIGHT = 60; // px por hora
const TOTAL_HOURS = 24;

let currentView = 'week'; // 'day' | '3day' | 'week' | 'month'
let currentDate = new Date();
let nowIndicatorInterval = null;

/**
 * Inicializa o calendário
 */
export function initCalendar() {
  renderView();
  setupViewSelector();
  setupNavigation();
  startNowIndicator();

  // Scroll para hora atual na primeira renderização
  setTimeout(() => scrollToCurrentTime(), 100);
}

/**
 * Retorna a data atual do calendário
 */
export function getCurrentDate() {
  return new Date(currentDate);
}

/**
 * Retorna a visão atual
 */
export function getCurrentView() {
  return currentView;
}

/**
 * Re-renderiza o calendário (chamado após mudanças de eventos)
 */
export function refreshCalendar() {
  renderView();
}

/**
 * Navega para uma data específica
 */
export function navigateToDate(date) {
  currentDate = new Date(date);
  renderView();
  updateSelectedDate(currentDate);
}

/**
 * Configura os botões de seleção de visão
 */
function setupViewSelector() {
  const buttons = document.querySelectorAll('.view-selector__btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderView();
    });
  });
}

/**
 * Configura navegação (anterior/próximo/hoje)
 */
function setupNavigation() {
  document.getElementById('btn-prev')?.addEventListener('click', () => navigate(-1));
  document.getElementById('btn-next')?.addEventListener('click', () => navigate(1));
  document.getElementById('btn-today')?.addEventListener('click', () => {
    currentDate = new Date();
    renderView();
    updateSelectedDate(currentDate);
    scrollToCurrentTime();
  });
}

/**
 * Navega para frente ou para trás
 */
function navigate(direction) {
  switch (currentView) {
    case 'day':
      currentDate.setDate(currentDate.getDate() + direction);
      break;
    case '3day':
      currentDate.setDate(currentDate.getDate() + (3 * direction));
      break;
    case 'week':
      currentDate.setDate(currentDate.getDate() + (7 * direction));
      break;
    case 'month':
      currentDate.setMonth(currentDate.getMonth() + direction);
      break;
  }
  renderView();
  updateSelectedDate(currentDate);
}

/**
 * Renderiza a visão atual
 */
function renderView() {
  const title = document.getElementById('current-date-title');
  if (title) {
    title.textContent = formatHeaderTitle(currentDate, currentView);
  }

  const timeGrid = document.getElementById('time-grid-scroll');
  const monthGrid = document.getElementById('month-grid');
  const alldayRow = document.getElementById('allday-row');

  if (currentView === 'month') {
    if (timeGrid) timeGrid.style.display = 'none';
    if (alldayRow) alldayRow.style.display = 'none';
    if (monthGrid) monthGrid.style.display = 'grid';
    renderMonthView();
  } else {
    if (timeGrid) timeGrid.style.display = 'block';
    if (alldayRow) alldayRow.style.display = 'flex';
    if (monthGrid) monthGrid.style.display = 'none';
    renderTimeGrid();
  }
}

/**
 * Renderiza a grade de tempo (dia/3dias/semana)
 */
function renderTimeGrid() {
  let days;
  switch (currentView) {
    case 'day':
      days = getNDays(currentDate, 1);
      break;
    case '3day':
      days = getNDays(currentDate, 3);
      break;
    case 'week':
    default:
      days = getWeekDays(currentDate);
      break;
  }

  renderTimeLabels();
  renderDayColumns(days);
  renderAllDayEvents(days);
  updateNowIndicator();

  // Ajustar CSS grid columns
  const dayColumns = document.getElementById('day-columns');
  const alldayCells = document.getElementById('allday-cells');
  if (dayColumns) {
    dayColumns.style.gridTemplateColumns = `repeat(${days.length}, 1fr)`;
  }
  if (alldayCells) {
    alldayCells.style.gridTemplateColumns = `repeat(${days.length}, 1fr)`;
  }
}

/**
 * Renderiza os labels de hora na coluna lateral
 */
function renderTimeLabels() {
  const container = document.getElementById('time-labels');
  if (!container) return;

  container.innerHTML = '';

  for (let h = 0; h < TOTAL_HOURS; h++) {
    const label = document.createElement('div');
    label.className = 'time-label';
    label.style.height = `${HOUR_HEIGHT}px`;

    const span = document.createElement('span');
    span.textContent = h === 0 ? '' : formatTime(h);
    label.appendChild(span);

    container.appendChild(label);
  }
}

/**
 * Renderiza as colunas de dias
 */
function renderDayColumns(days) {
  const container = document.getElementById('day-columns');
  if (!container) return;

  container.innerHTML = '';

  days.forEach((date, idx) => {
    const column = document.createElement('div');
    column.className = 'day-column';
    if (isToday(date)) column.classList.add('day-column--today');

    // Header do dia
    const header = document.createElement('div');
    header.className = 'day-column__header';

    const dayName = document.createElement('span');
    dayName.className = 'day-column__name';
    dayName.textContent = DAY_NAMES_SHORT[date.getDay()];

    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-column__number';
    if (isToday(date)) dayNumber.classList.add('day-column__number--today');
    dayNumber.textContent = date.getDate();

    header.appendChild(dayName);
    header.appendChild(dayNumber);
    column.appendChild(header);

    // Slots de hora (para clique)
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'day-column__slots';
    slotsContainer.style.height = `${TOTAL_HOURS * HOUR_HEIGHT}px`;

    // Linhas de hora
    for (let h = 0; h < TOTAL_HOURS; h++) {
      const slot = document.createElement('div');
      slot.className = 'hour-slot';
      slot.style.height = `${HOUR_HEIGHT}px`;
      slot.dataset.hour = h;
      slot.dataset.date = toDateKey(date);

      // Clique para criar evento
      slot.addEventListener('click', (e) => {
        if (e.target.closest('.event-block')) return;
        const rect = slot.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const minuteOffset = Math.floor((clickY / HOUR_HEIGHT) * 60);
        const roundedMinutes = Math.floor(minuteOffset / 15) * 15;
        const startTime = formatTime(h, roundedMinutes);

        openModal(null, {
          date: toDateKey(date),
          startTime
        });
      });

      slotsContainer.appendChild(slot);
    }

    column.appendChild(slotsContainer);

    // Renderizar eventos do dia
    const dateKey = toDateKey(date);
    const dayEvents = getEventsForDay(dateKey).filter(e => !e.allDay);
    renderEventsInColumn(slotsContainer, dayEvents);

    container.appendChild(column);
  });
}

/**
 * Renderiza eventos dentro de uma coluna
 */
function renderEventsInColumn(container, events) {
  if (!events.length) return;

  // Ordenar eventos por hora de início
  events.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Detectar sobreposições e calcular largura/posição
  const columns = resolveOverlaps(events);

  events.forEach((event, i) => {
    const startMin = timeToMinutes(event.startTime);
    const endMin = timeToMinutes(event.endTime);
    const duration = Math.max(endMin - startMin, 15); // mínimo 15min

    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);
    const color = getCalendarColor(event.calendar);

    const { col, totalCols } = columns[i];
    const width = (100 / totalCols);
    const left = col * width;

    const block = document.createElement('div');
    block.className = 'event-block';
    block.dataset.eventId = event.id;
    block.style.cssText = `
      top: ${top}px;
      height: ${height}px;
      left: ${left}%;
      width: calc(${width}% - 4px);
      --event-color: ${color};
    `;

    const titleEl = document.createElement('div');
    titleEl.className = 'event-block__title';
    titleEl.textContent = event.title;

    const timeEl = document.createElement('div');
    timeEl.className = 'event-block__time';
    timeEl.textContent = `${event.startTime} – ${event.endTime}`;

    block.appendChild(titleEl);
    if (height > 36) {
      block.appendChild(timeEl);
    }

    // Click para mostrar popover
    block.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = block.getBoundingClientRect();
      openPopover(event.id, rect);
    });

    container.appendChild(block);
  });
}

/**
 * Resolve sobreposições de eventos retornando coluna e total de colunas
 */
function resolveOverlaps(events) {
  const result = events.map(() => ({ col: 0, totalCols: 1 }));

  // Grupos de eventos que se sobrepõem
  const groups = [];
  let currentGroup = [];

  events.forEach((event, i) => {
    const start = timeToMinutes(event.startTime);
    const end = timeToMinutes(event.endTime);

    if (currentGroup.length === 0) {
      currentGroup.push({ start, end, index: i });
    } else {
      const groupEnd = Math.max(...currentGroup.map(g => g.end));
      if (start < groupEnd) {
        currentGroup.push({ start, end, index: i });
      } else {
        groups.push([...currentGroup]);
        currentGroup = [{ start, end, index: i }];
      }
    }
  });

  if (currentGroup.length) groups.push(currentGroup);

  // Atribuir colunas dentro de cada grupo
  groups.forEach(group => {
    const cols = [];
    group.forEach(item => {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (item.start >= cols[c]) {
          cols[c] = item.end;
          result[item.index].col = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        result[item.index].col = cols.length;
        cols.push(item.end);
      }
    });

    const totalCols = cols.length;
    group.forEach(item => {
      result[item.index].totalCols = totalCols;
    });
  });

  return result;
}

/**
 * Renderiza eventos de dia inteiro
 */
function renderAllDayEvents(days) {
  const container = document.getElementById('allday-cells');
  if (!container) return;

  container.innerHTML = '';

  days.forEach(date => {
    const cell = document.createElement('div');
    cell.className = 'allday-cell';

    const dateKey = toDateKey(date);
    const allDayEvents = getEventsForDay(dateKey).filter(e => e.allDay);

    allDayEvents.forEach(event => {
      const chip = document.createElement('div');
      chip.className = 'allday-chip';
      chip.style.setProperty('--event-color', getCalendarColor(event.calendar));
      chip.textContent = event.title;
      chip.dataset.eventId = event.id;

      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = chip.getBoundingClientRect();
        openPopover(event.id, rect);
      });

      cell.appendChild(chip);
    });

    container.appendChild(cell);
  });
}

/**
 * Renderiza a visão mensal
 */
function renderMonthView() {
  const grid = document.getElementById('month-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // Header com dias da semana
  DAY_NAMES_SHORT.forEach(name => {
    const header = document.createElement('div');
    header.className = 'month-grid__header';
    header.textContent = name;
    grid.appendChild(header);
  });

  const gridDays = getMonthGridDays(currentDate.getFullYear(), currentDate.getMonth());

  gridDays.forEach(({ date, isCurrentMonth }) => {
    const cell = document.createElement('div');
    cell.className = 'month-grid__cell';
    if (!isCurrentMonth) cell.classList.add('month-grid__cell--other');
    if (isToday(date)) cell.classList.add('month-grid__cell--today');

    const number = document.createElement('span');
    number.className = 'month-grid__number';
    number.textContent = date.getDate();
    cell.appendChild(number);

    // Eventos do dia
    const dateKey = toDateKey(date);
    const dayEvents = getEventsForDay(dateKey);

    dayEvents.slice(0, 3).forEach(event => {
      const eventDot = document.createElement('div');
      eventDot.className = 'month-grid__event';
      eventDot.style.setProperty('--event-color', getCalendarColor(event.calendar));
      eventDot.textContent = event.title;

      eventDot.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = eventDot.getBoundingClientRect();
        openPopover(event.id, rect);
      });

      cell.appendChild(eventDot);
    });

    if (dayEvents.length > 3) {
      const more = document.createElement('div');
      more.className = 'month-grid__more';
      more.textContent = `+${dayEvents.length - 3} mais`;
      cell.appendChild(more);
    }

    // Clique para ir ao dia
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.month-grid__event')) return;
      currentDate = new Date(date);
      currentView = 'day';
      document.querySelectorAll('.view-selector__btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-view="day"]')?.classList.add('active');
      renderView();
      updateSelectedDate(currentDate);
    });

    grid.appendChild(cell);
  });
}

/**
 * Indicador "agora"
 */
function startNowIndicator() {
  updateNowIndicator();
  nowIndicatorInterval = setInterval(updateNowIndicator, 60000);
}

function updateNowIndicator() {
  const indicator = document.getElementById('now-indicator');
  if (!indicator) return;

  if (currentView === 'month') {
    indicator.style.display = 'none';
    return;
  }

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * HOUR_HEIGHT;

  // Encontrar qual coluna tem hoje
  const dayColumns = document.querySelectorAll('.day-column');
  let todayColumnIndex = -1;

  dayColumns.forEach((col, idx) => {
    if (col.classList.contains('day-column--today')) {
      todayColumnIndex = idx;
    }
  });

  if (todayColumnIndex === -1) {
    indicator.style.display = 'none';
    return;
  }

  indicator.style.display = 'block';

  // Calcular posição horizontal
  const totalCols = dayColumns.length;
  const gutterWidth = 56; // largura da coluna de horas
  const headerHeight = document.querySelector('.day-column__header')?.offsetHeight || 44;

  const gridEl = document.getElementById('day-columns');
  if (gridEl) {
    const gridRect = gridEl.getBoundingClientRect();
    const colWidth = gridRect.width / totalCols;
    const left = gutterWidth + todayColumnIndex * colWidth;

    indicator.style.top = `${top + headerHeight}px`;
    indicator.style.left = `${left - 5}px`;
    indicator.style.width = `${colWidth + 5}px`;
  }
}

/**
 * Scroll para a hora atual
 */
function scrollToCurrentTime() {
  const scrollContainer = document.getElementById('time-grid-scroll');
  if (!scrollContainer) return;

  const now = new Date();
  const targetHour = Math.max(now.getHours() - 1, 0);
  scrollContainer.scrollTop = targetHour * HOUR_HEIGHT;
}
