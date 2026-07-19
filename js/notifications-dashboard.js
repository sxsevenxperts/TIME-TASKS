// Dashboard de Notificações — Fase 13.1
// Modal com centro de notificações, filtros, ações (marcar como lido, deletar)

import { supabase } from './supabase.js';

export class NotificationsDashboard {
  constructor() {
    this.notifications = [];
    this.filter = 'all'; // all, unread, trigger, reminder, verse, system
    this.isOpen = false;
  }

  async init() {
    this.setupEventListeners();
    await this.loadNotifications();
  }

  setupEventListeners() {
    document.addEventListener('timetasks:session', () => this.loadNotifications());
    document.addEventListener('timetasks:logout', () => this.clearNotifications());
  }

  async loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('time_tasks_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      this.notifications = data || [];
      this.updateNotificationBadge();
      if (this.isOpen) this.render();
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  getFilteredNotifications() {
    if (this.filter === 'all') return this.notifications;
    if (this.filter === 'unread') return this.notifications.filter(n => !n.read);
    return this.notifications.filter(n => n.type === this.filter);
  }

  updateNotificationBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const badge = document.querySelector('[data-notifications-badge]');
    if (badge) {
      badge.textContent = unreadCount > 0 ? String(unreadCount) : '';
      badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('notifications-modal');
    if (modal) modal.remove();
  }

  render() {
    let modal = document.getElementById('notifications-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'notifications-modal';
      document.body.appendChild(modal);
    }

    const filtered = this.getFilteredNotifications();
    const unreadCount = this.notifications.filter(n => !n.read).length;

    modal.innerHTML = `
      <div class="notifications-overlay">
        <div class="notifications-panel">
          <div class="notifications-header">
            <h2>📬 Notificações</h2>
            <button class="notifications-close" aria-label="Fechar">✕</button>
          </div>

          <div class="notifications-toolbar">
            <button class="notif-filter" data-filter="all">
              Todas (${this.notifications.length})
            </button>
            <button class="notif-filter" data-filter="unread">
              Não lidas (${unreadCount})
            </button>
            <button class="notif-filter" data-filter="trigger">Triggers</button>
            <button class="notif-filter" data-filter="reminder">Lembretes</button>
            <button class="notif-filter" data-filter="system">Sistema</button>
          </div>

          <div class="notifications-list">
            ${filtered.length === 0
              ? '<div class="notif-empty">Nenhuma notificação</div>'
              : filtered.map(n => this.renderNotification(n)).join('')
            }
          </div>

          <div class="notifications-footer">
            <button class="notif-clear-all" ${filtered.length === 0 ? 'disabled' : ''}>
              Limpar lidas
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventHandlers(modal);
  }

  renderNotification(notif) {
    const date = new Date(notif.created_at);
    const timeStr = this.formatTime(date);
    const isRead = notif.read ? 'notif-read' : 'notif-unread';
    const icon = this.getTypeIcon(notif.type);

    return `
      <div class="notif-item ${isRead}" data-id="${notif.id}">
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
          <div class="notif-title">${this.escapeHtml(notif.title)}</div>
          <div class="notif-message">${this.escapeHtml(notif.message)}</div>
          <div class="notif-time">${timeStr}</div>
        </div>
        <div class="notif-actions">
          ${!notif.read ? `<button class="notif-mark-read" data-id="${notif.id}" title="Marcar como lido">✓</button>` : ''}
          <button class="notif-delete" data-id="${notif.id}" title="Deletar">🗑</button>
        </div>
      </div>
    `;
  }

  getTypeIcon(type) {
    const icons = {
      trigger: '⚡',
      reminder: '⏰',
      verse: '📖',
      system: '⚙️'
    };
    return icons[type] || '📬';
  }

  formatTime(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins}min`;
    if (hours < 24) return `há ${hours}h`;
    if (days < 7) return `há ${days}d`;
    return date.toLocaleDateString('pt-BR');
  }

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, c => map[c]);
  }

  attachEventHandlers(modal) {
    modal.querySelector('.notifications-close').addEventListener('click', () => this.close());
    modal.querySelector('.notifications-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    // Filtros
    modal.querySelectorAll('.notif-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this.filter);
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        this.render();
      });
    });

    // Marcar como lido
    modal.querySelectorAll('.notif-mark-read').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.markAsRead(id);
      });
    });

    // Deletar
    modal.querySelectorAll('.notif-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.deleteNotification(id);
      });
    });

    // Limpar lidas
    const clearBtn = modal.querySelector('.notif-clear-all');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearRead());
    }
  }

  async markAsRead(id) {
    try {
      await supabase
        .from('time_tasks_notifications')
        .update({ read: true })
        .eq('id', id);

      this.notifications = this.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      this.updateNotificationBadge();
      this.render();
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  }

  async deleteNotification(id) {
    try {
      await supabase
        .from('time_tasks_notifications')
        .delete()
        .eq('id', id);

      this.notifications = this.notifications.filter(n => n.id !== id);
      this.updateNotificationBadge();
      this.render();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }

  async clearRead() {
    try {
      const readIds = this.notifications.filter(n => n.read).map(n => n.id);
      if (readIds.length === 0) return;

      await supabase
        .from('time_tasks_notifications')
        .delete()
        .in('id', readIds);

      this.notifications = this.notifications.filter(n => !n.read);
      this.updateNotificationBadge();
      this.render();
    } catch (error) {
      console.error('Erro ao limpar lidas:', error);
    }
  }

  clearNotifications() {
    this.notifications = [];
    this.close();
    this.updateNotificationBadge();
  }
}

// Singleton
export const notificationsDashboard = new NotificationsDashboard();
