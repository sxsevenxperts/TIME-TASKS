// Triggers Modal UI — Fase 12.2
// Modal para criar e editar triggers

export function renderTriggersModal() {
  const html = `
    <div class="triggers-modal" id="triggers-modal">
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Criar Trigger</h2>
          <button class="btn-close" id="close-triggers-modal">✕</button>
        </div>

        <form id="trigger-form">
          <!-- Nome -->
          <div class="form-group">
            <label>Nome do Trigger</label>
            <input type="text" id="trigger-name" placeholder="ex: Alerta de calor" required />
          </div>

          <!-- Tipo de Trigger -->
          <div class="form-group">
            <label>Tipo</label>
            <select id="trigger-type" onchange="updateTriggerFields()" required>
              <option value="">Selecione um tipo...</option>
              <option value="weather">🌡️ Clima</option>
              <option value="summary">📅 Resumo da Agenda</option>
              <option value="reminder">⏰ Lembrete</option>
            </select>
          </div>

          <!-- Weather Trigger Fields -->
          <div id="weather-fields" class="trigger-fields" style="display:none;">
            <div class="form-group">
              <label>Cidade</label>
              <input type="text" id="weather-city" placeholder="São Paulo" />
            </div>
            <div class="form-group">
              <label>Temperatura Limite (°C)</label>
              <input type="number" id="weather-temp" value="30" />
            </div>
            <p class="help-text">Notificação será enviada quando temperatura ultrapassar o limite</p>
          </div>

          <!-- Summary Trigger Fields -->
          <div id="summary-fields" class="trigger-fields" style="display:none;">
            <div class="form-group">
              <label>Dia da Semana</label>
              <select id="summary-day">
                <option value="0">Domingo</option>
                <option value="1">Segunda</option>
                <option value="2">Terça</option>
                <option value="3">Quarta</option>
                <option value="4">Quinta</option>
                <option value="5">Sexta</option>
                <option value="6">Sábado</option>
              </select>
            </div>
            <div class="form-group">
              <label>Horário</label>
              <input type="time" id="summary-time" value="08:00" />
            </div>
            <p class="help-text">Resumo da agenda será enviado neste dia e horário</p>
          </div>

          <!-- Reminder Trigger Fields -->
          <div id="reminder-fields" class="trigger-fields" style="display:none;">
            <div class="form-group">
              <label>Mensagem</label>
              <textarea id="reminder-message" placeholder="Digite a mensagem do lembrete..." rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Frequência</label>
              <select id="reminder-frequency">
                <option value="once">Uma vez</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
              </select>
            </div>
            <p class="help-text">Você receberá esta notificação conforme configurado</p>
          </div>

          <!-- Ativo -->
          <div class="form-group checkbox">
            <input type="checkbox" id="trigger-enabled" checked />
            <label>Ativar este trigger</label>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" onclick="closeTriggerModal()">Cancelar</button>
            <button type="submit" class="btn-primary">Criar Trigger</button>
          </div>
        </form>
      </div>
    </div>

    <style>
      .triggers-modal {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
      }

      .modal-content {
        position: relative;
        background: var(--card-bg);
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .modal-header h2 {
        font-size: 20px;
        margin: 0;
        color: var(--text-primary);
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 6px;
        color: var(--text-primary);
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 14px;
        background: var(--input-bg);
        color: var(--text-primary);
        font-family: inherit;
      }

      .form-group textarea {
        resize: vertical;
      }

      .form-group.checkbox {
        display: flex;
        align-items: center;
      }

      .form-group.checkbox input {
        width: auto;
        margin-right: 8px;
      }

      .form-group.checkbox label {
        margin-bottom: 0;
      }

      .help-text {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 4px;
        font-style: italic;
      }

      .trigger-fields {
        background: var(--card-bg-alt);
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
      }

      .btn-cancel,
      .btn-primary {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        font-weight: 500;
      }

      .btn-cancel {
        background: var(--gray-light);
        color: var(--text-primary);
      }

      .btn-cancel:hover {
        background: var(--gray-lighter);
      }

      .btn-primary {
        background: #a8d5ba;
        color: #1a3a2d;
      }

      .btn-primary:hover {
        background: #8bc9a8;
      }

      @media (prefers-color-scheme: dark) {
        .modal-content {
          background: #1e1e1e;
        }

        .trigger-fields {
          background: #2a2a2a;
        }

        .btn-primary {
          background: #2d4a3f;
          color: #a8d5ba;
        }

        .btn-primary:hover {
          background: #3d5a4f;
        }
      }
    </style>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  // Event listeners
  document.getElementById('close-triggers-modal')?.addEventListener('click', closeTriggerModal);
  document.getElementById('trigger-form')?.addEventListener('submit', handleTriggerSubmit);
  document.querySelector('.modal-backdrop')?.addEventListener('click', closeTriggerModal);
}

function updateTriggerFields() {
  const type = document.getElementById('trigger-type').value;

  document.getElementById('weather-fields').style.display = type === 'weather' ? 'block' : 'none';
  document.getElementById('summary-fields').style.display = type === 'summary' ? 'block' : 'none';
  document.getElementById('reminder-fields').style.display = type === 'reminder' ? 'block' : 'none';
}

function closeTriggerModal() {
  document.getElementById('triggers-modal')?.remove();
}

async function handleTriggerSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('trigger-type').value;
  const name = document.getElementById('trigger-name').value;
  const enabled = document.getElementById('trigger-enabled').checked;

  let condition = {};

  if (type === 'weather') {
    condition = {
      city: document.getElementById('weather-city').value || 'São Paulo',
      temperature_threshold: Number(document.getElementById('weather-temp').value)
    };
  } else if (type === 'summary') {
    condition = {
      day_of_week: Number(document.getElementById('summary-day').value),
      time: document.getElementById('summary-time').value
    };
  } else if (type === 'reminder') {
    condition = {
      message: document.getElementById('reminder-message').value,
      frequency: document.getElementById('reminder-frequency').value
    };
  }

  try {
    const response = await fetch('/api/triggers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        condition,
        enabled
      })
    });

    if (response.ok) {
      alert('✅ Trigger criado com sucesso!');
      closeTriggerModal();
      // Refresh triggers list
      location.reload();
    } else {
      alert('❌ Erro ao criar trigger');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao criar trigger');
  }
}

export function openTriggerModal() {
  if (!document.getElementById('triggers-modal')) {
    renderTriggersModal();
  }
  document.getElementById('triggers-modal').style.display = 'flex';
}
