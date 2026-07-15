// ============================================================
// modal.js — Modal de criação/edição e popover de preview
// ============================================================

import { createEvent, updateEvent, deleteEvent, getEventById, getCalendarColor } from './events.js';
import { formatDateFull, formatTime, toDateKey } from './utils.js';

let onEventChange = null;

/**
 * Inicializa os modais e popovers
 */
export function initModal({ onEventChanged }) {
  onEventChange = onEventChanged;

  const overlay = document.getElementById('event-modal');
  const form = document.getElementById('event-form');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('btn-cancel');
  const deleteBtn = document.getElementById('btn-delete-event');
  const allDayCheck = document.getElementById('event-allday');
  const newEventBtn = document.getElementById('btn-new-event');

  // Fechar modal
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closePopover();
    }
  });

  // Toggle campos de hora ao marcar "Dia inteiro"
  allDayCheck?.addEventListener('change', () => {
    const timeInputs = document.getElementById('time-inputs');
    if (timeInputs) {
      timeInputs.style.display = allDayCheck.checked ? 'none' : 'flex';
    }
  });

  // Submit do formulário
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });

  // Botão de excluir
  deleteBtn?.addEventListener('click', () => {
    const id = document.getElementById('event-id')?.value;
    if (id) {
      deleteEvent(id);
      closeModal();
      showToast('Evento excluído', 'success');
      if (onEventChange) onEventChange();
    }
  });

  // Botão "Novo Evento"
  newEventBtn?.addEventListener('click', () => {
    openModal();
  });

  // Popover
  document.getElementById('popover-close')?.addEventListener('click', closePopover);
  document.getElementById('popover-edit')?.addEventListener('click', () => {
    const id = document.getElementById('event-popover')?.dataset.eventId;
    closePopover();
    if (id) openModal(id);
  });
  document.getElementById('popover-delete')?.addEventListener('click', () => {
    const id = document.getElementById('event-popover')?.dataset.eventId;
    if (id) {
      deleteEvent(id);
      closePopover();
      showToast('Evento excluído', 'success');
      if (onEventChange) onEventChange();
    }
  });

  // Fechar popover ao clicar fora
  document.addEventListener('click', (e) => {
    const popover = document.getElementById('event-popover');
    if (popover && !popover.contains(e.target) && !e.target.closest('.event-block')) {
      closePopover();
    }
  });
}

/**
 * Abre o modal (novo ou edição)
 */
export function openModal(eventId = null, prefill = {}) {
  const overlay = document.getElementById('event-modal');
  const title = document.getElementById('modal-title');
  const deleteBtn = document.getElementById('btn-delete-event');
  const form = document.getElementById('event-form');

  if (!overlay) return;

  // Reset form
  form?.reset();
  document.getElementById('time-inputs').style.display = 'flex';

  if (eventId) {
    // Modo edição
    const event = getEventById(eventId);
    if (!event) return;

    title.textContent = 'Editar Evento';
    deleteBtn.style.display = 'block';

    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-allday').checked = event.allDay;
    document.getElementById('event-start').value = event.startTime || '09:00';
    document.getElementById('event-end').value = event.endTime || '10:00';
    document.getElementById('event-calendar').value = event.calendar;
    document.getElementById('event-description').value = event.description || '';

    if (event.allDay) {
      document.getElementById('time-inputs').style.display = 'none';
    }
  } else {
    // Modo criação
    title.textContent = 'Novo Evento';
    deleteBtn.style.display = 'none';
    document.getElementById('event-id').value = '';

    // Prefill de data/hora se fornecido
    if (prefill.date) {
      document.getElementById('event-date').value = prefill.date;
    } else {
      document.getElementById('event-date').value = toDateKey(new Date());
    }

    if (prefill.startTime) {
      document.getElementById('event-start').value = prefill.startTime;
      // Auto-set end time 1 hour later
      const [h, m] = prefill.startTime.split(':').map(Number);
      const endH = Math.min(h + 1, 23);
      document.getElementById('event-end').value = formatTime(endH, m);
    }
  }

  overlay.classList.add('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'false');

  // Focus no título
  setTimeout(() => {
    document.getElementById('event-title')?.focus();
  }, 100);
}

/**
 * Fecha o modal
 */
export function closeModal() {
  const overlay = document.getElementById('event-modal');
  if (overlay) {
    overlay.classList.remove('modal-overlay--visible');
    overlay.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Processa o envio do formulário
 */
function handleSubmit() {
  const id = document.getElementById('event-id')?.value;
  const eventData = {
    title: document.getElementById('event-title')?.value?.trim(),
    date: document.getElementById('event-date')?.value,
    allDay: document.getElementById('event-allday')?.checked,
    startTime: document.getElementById('event-allday')?.checked ? null : document.getElementById('event-start')?.value,
    endTime: document.getElementById('event-allday')?.checked ? null : document.getElementById('event-end')?.value,
    calendar: document.getElementById('event-calendar')?.value,
    description: document.getElementById('event-description')?.value?.trim(),
  };

  if (!eventData.title) return;

  if (id) {
    updateEvent(id, eventData);
    showToast('Evento atualizado', 'success');
  } else {
    createEvent(eventData);
    showToast('Evento criado', 'success');
  }

  closeModal();
  if (onEventChange) onEventChange();
}

/**
 * Abre o popover de preview do evento
 */
export function openPopover(eventId, anchorRect) {
  const popover = document.getElementById('event-popover');
  const event = getEventById(eventId);
  if (!popover || !event) return;

  // Preencher dados
  popover.dataset.eventId = eventId;
  document.getElementById('popover-color').style.backgroundColor = getCalendarColor(event.calendar);
  document.getElementById('popover-title').textContent = event.title;

  const dateObj = new Date(event.date + 'T00:00:00');
  let dateTimeStr = formatDateFull(dateObj);
  if (!event.allDay && event.startTime && event.endTime) {
    dateTimeStr += ` · ${event.startTime} – ${event.endTime}`;
  } else if (event.allDay) {
    dateTimeStr += ' · Dia inteiro';
  }
  document.getElementById('popover-datetime').textContent = dateTimeStr;

  const descRow = document.getElementById('popover-desc-row');
  const descText = document.getElementById('popover-description');
  if (event.description) {
    descRow.style.display = 'flex';
    descText.textContent = event.description;
  } else {
    descRow.style.display = 'none';
  }

  // Posicionar
  popover.classList.add('event-popover--visible');
  popover.setAttribute('aria-hidden', 'false');

  const popRect = popover.getBoundingClientRect();
  let top = anchorRect.top;
  let left = anchorRect.right + 8;

  // Evitar sair da tela pela direita
  if (left + popRect.width > window.innerWidth - 16) {
    left = anchorRect.left - popRect.width - 8;
  }

  // Evitar sair pela parte inferior
  if (top + popRect.height > window.innerHeight - 16) {
    top = window.innerHeight - popRect.height - 16;
  }

  // Evitar sair pelo topo
  if (top < 16) top = 16;

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

/**
 * Fecha o popover
 */
export function closePopover() {
  const popover = document.getElementById('event-popover');
  if (popover) {
    popover.classList.remove('event-popover--visible');
    popover.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Mostra toast notification
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
