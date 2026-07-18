// Overlay de erro crítico — precisa ser arquivo externo e sem handlers
// inline: a CSP do servidor (script-src 'self') bloqueia tanto scripts
// embutidos no HTML quanto atributos onclick, então a versão anterior
// (inline no index.html) nunca chegava a executar.
(() => {
  function showFatalOverlay(title, message) {
    const el = document.getElementById('loading-overlay');
    if (!el) return;

    el.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText = 'color:white; text-align:center; padding:20px;';

    const heading = document.createElement('b');
    heading.textContent = title;

    const text = document.createElement('div');
    text.style.marginTop = '8px';
    text.textContent = String(message || 'Erro desconhecido');

    const button = document.createElement('button');
    button.textContent = 'Limpar Dados e Recarregar';
    button.style.cssText = 'margin-top:16px; padding:10px; cursor:pointer;';
    button.addEventListener('click', () => {
      localStorage.clear();
      window.location.reload();
    });

    box.append(heading, text, button);
    el.appendChild(box);
  }

  window.addEventListener('error', (e) => {
    showFatalOverlay('Erro Crítico:', e.message);
  });

  window.addEventListener('unhandledrejection', (e) => {
    showFatalOverlay('Erro de Conexão:', e.reason && e.reason.message ? e.reason.message : e.reason);
  });
})();
