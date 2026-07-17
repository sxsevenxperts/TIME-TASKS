// Calendar Integrations UI — Fase 12.1
// Componentes para conectar e gerenciar integrações de calendário

export async function renderCalendarIntegrations() {
  const container = document.getElementById('calendar-integrations-section');
  if (!container) return;

  const html = `
    <div class="calendar-integrations">
      <h2>Integrações de Calendário</h2>
      <p class="subtitle">Sincronize seus eventos com Google Calendar e Apple Calendar</p>

      <!-- Google Calendar -->
      <div class="integration-card google-calendar">
        <div class="integration-header">
          <div class="integration-info">
            <h3>Google Calendar</h3>
            <p class="description">Sincronize eventos bidireccionalmente com Google Calendar</p>
            <div class="sync-status" id="google-status">
              <span class="status-badge disconnected">Desconectado</span>
            </div>
          </div>
          <div class="integration-logo google">🔵</div>
        </div>

        <div class="integration-actions">
          <button class="btn-connect" id="btn-google-connect">
            Conectar Google Calendar
          </button>
          <button class="btn-disconnect" id="btn-google-disconnect" style="display:none;">
            Desconectar
          </button>
        </div>

        <div class="sync-info" id="google-info" style="display:none;">
          <p><strong>Calendário:</strong> <span id="google-calendar-name"></span></p>
          <p><strong>Última sincronização:</strong> <span id="google-last-sync">—</span></p>
          <button class="btn-sync-now">Sincronizar agora</button>
        </div>
      </div>

      <!-- Apple Calendar -->
      <div class="integration-card apple-calendar">
        <div class="integration-header">
          <div class="integration-info">
            <h3>Apple Calendar</h3>
            <p class="description">Sincronize com iCloud e servidores CalDAV</p>
            <div class="sync-status" id="apple-status">
              <span class="status-badge disconnected">Desconectado</span>
            </div>
          </div>
          <div class="integration-logo apple">🍎</div>
        </div>

        <div class="integration-actions">
          <button class="btn-connect" id="btn-apple-connect">
            Conectar Apple Calendar
          </button>
          <button class="btn-disconnect" id="btn-apple-disconnect" style="display:none;">
            Desconectar
          </button>
        </div>

        <div class="sync-info" id="apple-info" style="display:none;">
          <p><strong>Calendário:</strong> <span id="apple-calendar-name"></span></p>
          <p><strong>Última sincronização:</strong> <span id="apple-last-sync">—</span></p>
          <button class="btn-sync-now">Sincronizar agora</button>
        </div>
      </div>
    </div>

    <style>
      .calendar-integrations {
        padding: 20px;
        max-width: 800px;
      }

      .calendar-integrations h2 {
        font-size: 20px;
        margin-bottom: 8px;
        color: var(--text-primary);
      }

      .subtitle {
        color: var(--text-secondary);
        margin-bottom: 24px;
        font-size: 14px;
      }

      .integration-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        background: var(--card-bg);
      }

      .integration-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 16px;
      }

      .integration-info {
        flex: 1;
      }

      .integration-info h3 {
        font-size: 16px;
        margin-bottom: 4px;
        color: var(--text-primary);
      }

      .description {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .integration-logo {
        font-size: 32px;
        margin-left: 16px;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-badge.disconnected {
        background-color: var(--color-gray-light);
        color: var(--text-secondary);
      }

      .status-badge.connected {
        background-color: #d4edda;
        color: #155724;
      }

      .integration-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .btn-connect,
      .btn-disconnect,
      .btn-sync-now {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }

      .btn-connect {
        background-color: #a8d5ba;
        color: #1a3a2d;
      }

      .btn-connect:hover {
        background-color: #8bc9a8;
        transform: translateY(-1px);
      }

      .btn-disconnect {
        background-color: #f8d7da;
        color: #721c24;
      }

      .btn-disconnect:hover {
        background-color: #f5c6cb;
      }

      .btn-sync-now {
        background-color: var(--primary-light);
        color: var(--primary);
        flex: 1;
      }

      .sync-info {
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
      }

      .sync-info p {
        font-size: 13px;
        margin-bottom: 8px;
        color: var(--text-secondary);
      }

      @media (prefers-color-scheme: dark) {
        .btn-connect {
          background-color: #2d4a3f;
          color: #a8d5ba;
        }

        .btn-connect:hover {
          background-color: #3d5a4f;
        }

        .status-badge.connected {
          background-color: #1e5a35;
          color: #90ee90;
        }
      }
    </style>
  `;

  container.innerHTML = html;

  // Event listeners
  document.getElementById('btn-google-connect')?.addEventListener('click', handleGoogleConnect);
  document.getElementById('btn-apple-connect')?.addEventListener('click', handleAppleConnect);
  document.getElementById('btn-google-disconnect')?.addEventListener('click', handleGoogleDisconnect);
  document.getElementById('btn-apple-disconnect')?.addEventListener('click', handleAppleDisconnect);
}

async function handleGoogleConnect() {
  try {
    const response = await fetch('/api/auth/google/connect');
    const data = await response.json();

    if (data.authUrl) {
      window.location.href = data.authUrl;
    } else if (data.error) {
      alert(`Erro: ${data.error}`);
    }
  } catch (error) {
    console.error('Erro ao conectar Google Calendar:', error);
    alert('Falha ao conectar. Tente novamente.');
  }
}

async function handleAppleConnect() {
  // Abrir modal para Apple CalDAV setup
  const email = prompt('E-mail iCloud:');
  if (!email) return;

  const password = prompt('Senha ou app-specific password:');
  if (!password) return;

  try {
    const response = await fetch('/api/auth/apple/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success) {
      alert('Apple Calendar conectado com sucesso!');
      renderCalendarIntegrations();
    } else {
      alert(`Erro: ${data.error}`);
    }
  } catch (error) {
    console.error('Erro ao conectar Apple Calendar:', error);
    alert('Falha ao conectar. Verifique suas credenciais.');
  }
}

async function handleGoogleDisconnect() {
  if (confirm('Desconectar Google Calendar?')) {
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      renderCalendarIntegrations();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }
}

async function handleAppleDisconnect() {
  if (confirm('Desconectar Apple Calendar?')) {
    try {
      await fetch('/api/auth/apple/disconnect', { method: 'POST' });
      renderCalendarIntegrations();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }
}

export async function updateCalendarStatus() {
  // Buscar status de integração do usuário
  try {
    const response = await fetch('/api/calendar/status');
    const data = await response.json();

    // Atualizar Google status
    if (data.google) {
      document.getElementById('google-status').innerHTML =
        '<span class="status-badge connected">Conectado</span>';
      document.getElementById('google-calendar-name').textContent = data.google.calendarName;
      document.getElementById('google-last-sync').textContent =
        new Date(data.google.lastSync).toLocaleString();
      document.getElementById('btn-google-connect').style.display = 'none';
      document.getElementById('btn-google-disconnect').style.display = 'block';
      document.getElementById('google-info').style.display = 'block';
    }

    // Atualizar Apple status
    if (data.apple) {
      document.getElementById('apple-status').innerHTML =
        '<span class="status-badge connected">Conectado</span>';
      document.getElementById('apple-calendar-name').textContent = data.apple.calendarName;
      document.getElementById('apple-last-sync').textContent =
        new Date(data.apple.lastSync).toLocaleString();
      document.getElementById('btn-apple-connect').style.display = 'none';
      document.getElementById('btn-apple-disconnect').style.display = 'block';
      document.getElementById('apple-info').style.display = 'block';
    }
  } catch (error) {
    console.error('Erro ao buscar status:', error);
  }
}
