// ============================================================
// sidebar.js — Mini-calendário e lista de calendários
// ============================================================

import { MONTH_NAMES, getMonthGridDays, isToday, isSameDay, toDateKey } from './utils.js';
import { CALENDARS, toggleCalendarVisibility, loadCalendarVisibility } from './events.js';

let sidebarMonth;
let sidebarYear;
let selectedDate = new Date();
let onDateSelect = null;
let onCalendarToggle = null;

/**
 * Inicializa a sidebar
 */
export function initSidebar({ onDateSelected, onCalendarVisibilityChange }) {
  onDateSelect = onDateSelected;
  onCalendarToggle = onCalendarVisibilityChange;

  const now = new Date();
  sidebarMonth = now.getMonth();
  sidebarYear = now.getFullYear();

  loadCalendarVisibility();
  renderMiniCalendar();
  renderCalendarList();

  // Navegação do mini-calendário
  document.getElementById('mini-cal-prev')?.addEventListener('click', () => {
    sidebarMonth--;
    if (sidebarMonth < 0) { sidebarMonth = 11; sidebarYear--; }
    renderMiniCalendar();
  });

  document.getElementById('mini-cal-next')?.addEventListener('click', () => {
    sidebarMonth++;
    if (sidebarMonth > 11) { sidebarMonth = 0; sidebarYear++; }
    renderMiniCalendar();
  });

  // Toggle da sub-sidebar no mobile
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const toggle = document.getElementById('sidebar-toggle');
    const panel = document.getElementById('sub-sidebar');
    const open = !panel?.classList.contains('sub-sidebar--open');
    panel?.classList.toggle('sub-sidebar--open', open);
    toggle?.setAttribute('aria-expanded', String(open));
  });
}

/**
 * Atualiza a data selecionada no mini-calendário
 */
export function updateSelectedDate(date) {
  selectedDate = new Date(date);
  sidebarMonth = selectedDate.getMonth();
  sidebarYear = selectedDate.getFullYear();
  renderMiniCalendar();
}

/**
 * Renderiza o mini-calendário
 */
function renderMiniCalendar() {
  const titleEl = document.getElementById('mini-cal-title');
  const daysEl = document.getElementById('mini-cal-days');

  if (!titleEl || !daysEl) return;

  titleEl.textContent = `${MONTH_NAMES[sidebarMonth]} ${sidebarYear}`;

  const gridDays = getMonthGridDays(sidebarYear, sidebarMonth);
  daysEl.innerHTML = '';

  gridDays.forEach(({ date, isCurrentMonth }) => {
    const btn = document.createElement('button');
    btn.className = 'mini-calendar__day';
    btn.textContent = date.getDate();

    if (!isCurrentMonth) btn.classList.add('mini-calendar__day--other');
    if (isToday(date)) btn.classList.add('mini-calendar__day--today');
    if (isSameDay(date, selectedDate)) btn.classList.add('mini-calendar__day--selected');

    btn.addEventListener('click', () => {
      selectedDate = new Date(date);
      renderMiniCalendar();
      if (onDateSelect) onDateSelect(date);
    });

    daysEl.appendChild(btn);
  });
}

/**
 * Renderiza a lista de calendários
 */
export function renderCalendarList() {
  const container = document.getElementById('calendar-list');
  if (!container) return;

  container.innerHTML = '';

  Object.entries(CALENDARS).forEach(([key, cal]) => {
    const item = document.createElement('label');
    item.className = 'calendar-list__item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = cal.visible;
    checkbox.className = 'calendar-list__checkbox';
    checkbox.style.setProperty('--cal-color', cal.color);

    checkbox.addEventListener('change', () => {
      toggleCalendarVisibility(key);
      if (onCalendarToggle) onCalendarToggle();
    });

    const dot = document.createElement('span');
    dot.className = 'calendar-list__dot';
    dot.style.backgroundColor = cal.color;

    const name = document.createElement('span');
    name.className = 'calendar-list__name';
    name.textContent = cal.name;

    item.appendChild(checkbox);
    item.appendChild(dot);
    item.appendChild(name);
    container.appendChild(item);
  });
}
