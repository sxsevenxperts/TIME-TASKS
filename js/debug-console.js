/**
 * Console visual no app — mostra logs direto na tela do iPhone
 */

const MAX_LOGS = 20;
let logs = [];
let debugPanel = null;

function initDebugPanel() {
  if (debugPanel) return;

  debugPanel = document.createElement('div');
  debugPanel.id = 'debug-console-panel';
  debugPanel.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 10px;
    width: 280px;
    max-height: 250px;
    background: #1a1a1a;
    border: 1px solid #00dd00;
    border-radius: 8px;
    padding: 8px;
    font-family: monospace;
    font-size: 11px;
    color: #00dd00;
    overflow-y: auto;
    z-index: 9999;
    display: none;
    box-shadow: 0 0 10px rgba(0, 221, 0, 0.3);
  `;

  const header = document.createElement('div');
  header.style.cssText = 'font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #00dd00; padding-bottom: 4px; display: flex; justify-content: space-between;';
  header.innerHTML = '<span>DEBUG LOG</span><button style="background:none;border:none;color:#00dd00;cursor:pointer;font-size:12px;" onclick="document.getElementById(\'debug-console-panel\').style.display=\'none\'">✕</button>';
  debugPanel.appendChild(header);

  const logContainer = document.createElement('div');
  logContainer.id = 'debug-log-container';
  logContainer.style.cssText = 'max-height: 200px; overflow-y: auto;';
  debugPanel.appendChild(logContainer);

  document.body.appendChild(debugPanel);

  // Toggle com clique longo no botão de profile
  document.addEventListener('timetasks:session', () => {
    const profileBtn = document.getElementById('btn-ai-profile');
    if (profileBtn) {
      profileBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'flex' : 'none';
      });
    }
  });
}

export function addLog(message) {
  if (!debugPanel) initDebugPanel();

  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `${timestamp} ${message}`;
  logs.push(logEntry);
  if (logs.length > MAX_LOGS) logs.shift();

  const container = document.getElementById('debug-log-container');
  if (container) {
    container.innerHTML = logs.map(log => `<div style="margin:2px 0; word-break:break-all;">${log}</div>`).join('');
    container.scrollTop = container.scrollHeight;
  }
}

export function showDebugPanel() {
  if (!debugPanel) initDebugPanel();
  debugPanel.style.display = 'flex';
}

// Interceptar console.log para capturar
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
  originalLog(...args);
  const message = args.join(' ');
  if (message.includes('[') && message.includes(']')) {
    addLog(message);
  }
};

console.warn = function(...args) {
  originalWarn(...args);
  const message = '⚠ ' + args.join(' ');
  if (message.includes('[') && message.includes(']')) {
    addLog(message);
  }
};

console.error = function(...args) {
  originalError(...args);
  const message = '✗ ' + args.join(' ');
  if (message.includes('[') && message.includes(']')) {
    addLog(message);
  }
};
