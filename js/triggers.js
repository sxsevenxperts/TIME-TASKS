import { supabase } from './supabase.js';

export async function initTriggers() {
  const triggerList = document.getElementById('trigger-list');
  const newTriggerBtn = document.getElementById('btn-new-trigger');
  const triggerEmpty = document.getElementById('trigger-empty');

  if (!triggerList || !newTriggerBtn) return;

  newTriggerBtn.addEventListener('click', () => openTriggerModal());
  await renderTriggers();
}

export async function renderTriggers() {
  const triggerList = document.getElementById('trigger-list');
  const triggerEmpty = document.getElementById('trigger-empty');
  if (!triggerList || !triggerEmpty) return;

  try {
    const { data, error } = await supabase
      .from('time_tasks_triggers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    triggerList.innerHTML = '';

    if (!data || data.length === 0) {
      triggerEmpty.hidden = false;
      return;
    }

    triggerEmpty.hidden = true;
    data.forEach(trigger => renderTriggerCard(trigger));
  } catch (err) {
    console.error('Erro ao carregar triggers:', err.message);
    triggerList.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

function renderTriggerCard(trigger) {
  const triggerList = document.getElementById('trigger-list');
  if (!triggerList) return;

  const card = document.createElement('div');
  card.className = 'trigger-card';
  card.innerHTML = `
    <div class="trigger-card__header">
      <h3 class="trigger-card__name">${escapeHtml(trigger.name)}</h3>
      <label class="toggle-switch">
        <input type="checkbox" class="toggle-input" ${trigger.enabled ? 'checked' : ''}
               data-trigger-id="${trigger.id}" />
        <span class="toggle-slider"></span>
      </label>
    </div>
    ${trigger.description ? `<p class="trigger-card__desc">${escapeHtml(trigger.description)}</p>` : ''}
    <div class="trigger-card__meta">
      <span class="badge badge--${trigger.type}">${getTriggerTypeLabel(trigger.type)}</span>
      <span class="text-secondary text-sm">${formatSchedule(trigger.schedule)}</span>
    </div>
    <div class="trigger-card__actions">
      <button class="btn-small" data-trigger-edit="${trigger.id}">Editar</button>
      <button class="btn-small btn-small--danger" data-trigger-delete="${trigger.id}">Deletar</button>
    </div>
  `;

  const toggleInput = card.querySelector('.toggle-input');
  toggleInput?.addEventListener('change', () => toggleTrigger(trigger.id, toggleInput.checked));

  const editBtn = card.querySelector('[data-trigger-edit]');
  editBtn?.addEventListener('click', () => openTriggerModal(trigger));

  const deleteBtn = card.querySelector('[data-trigger-delete]');
  deleteBtn?.addEventListener('click', () => deleteTrigger(trigger.id));

  triggerList.appendChild(card);
}

function openTriggerModal(trigger = null) {
  alert(trigger ? `Editar: ${trigger.name}` : 'Criar novo trigger');
}

async function toggleTrigger(triggerId, enabled) {
  try {
    const { error } = await supabase
      .from('time_tasks_triggers')
      .update({ enabled })
      .eq('id', triggerId);

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao alternar trigger:', err.message);
    renderTriggers();
  }
}

async function deleteTrigger(triggerId) {
  if (!confirm('Tem certeza que deseja deletar este trigger?')) return;

  try {
    const { error } = await supabase
      .from('time_tasks_triggers')
      .delete()
      .eq('id', triggerId);

    if (error) throw error;
    renderTriggers();
  } catch (err) {
    console.error('Erro ao deletar trigger:', err.message);
  }
}

export async function fetchNotifications() {
  try {
    const { data, error } = await supabase
      .from('time_tasks_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao carregar notificações:', err.message);
    return [];
  }
}

export async function renderNotifications() {
  const notifList = document.getElementById('notifications-list');
  const notifEmpty = document.getElementById('notifications-empty');
  if (!notifList || !notifEmpty) return;

  const notifications = await fetchNotifications();
  notifList.innerHTML = '';

  if (notifications.length === 0) {
    notifEmpty.hidden = false;
    return;
  }

  notifEmpty.hidden = true;
  notifications.forEach(notif => renderNotificationItem(notif));
}

function renderNotificationItem(notif) {
  const notifList = document.getElementById('notifications-list');
  if (!notifList) return;

  const item = document.createElement('div');
  item.className = `notification-item ${notif.read ? '' : 'notification-item--unread'}`;
  item.innerHTML = `
    <div class="notification-item__icon">${notif.icon || '📢'}</div>
    <div class="notification-item__body">
      <p class="notification-item__title">${escapeHtml(notif.title)}</p>
      <p class="notification-item__summary">${escapeHtml(notif.message)}</p>
      <p class="notification-item__meta">${formatRelativeTime(notif.created_at)}</p>
    </div>
    <button class="btn-icon notification-item__close" data-notif-id="${notif.id}"
            aria-label="Marcar como lido">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  const closeBtn = item.querySelector('.notification-item__close');
  closeBtn?.addEventListener('click', () => markNotificationRead(notif.id));

  notifList.appendChild(item);
}

async function markNotificationRead(notifId) {
  try {
    const { error } = await supabase
      .from('time_tasks_notifications')
      .update({ read: true })
      .eq('id', notifId);

    if (error) throw error;
    renderNotifications();
  } catch (err) {
    console.error('Erro ao marcar como lido:', err.message);
  }
}

function getTriggerTypeLabel(type) {
  const labels = {
    weather: '🌤️ Clima',
    summary: '📋 Resumo',
    reminder: '🔔 Lembrete'
  };
  return labels[type] || type;
}

function formatSchedule(schedule) {
  const labels = {
    daily: 'Diariamente',
    weekly: 'Semanalmente',
    monthly: 'Mensalmente',
    manual: 'Manual'
  };
  return labels[schedule] || schedule;
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
