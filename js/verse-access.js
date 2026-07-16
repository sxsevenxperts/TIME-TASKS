/**
 * Versículo por acesso — disparado automaticamente logo após autenticação.
 * Um versículo diferente do histórico de notificações (que usa um versículo por período do dia).
 */

export async function initVerseAccess() {
  document.addEventListener('timetasks:session', async (event) => {
    if (!event.detail?.user) return;
    try {
      const response = await fetch('/api/verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'access' })
      });
      if (!response.ok) return;
      const { verse, reference } = await response.json();
      if (verse && reference) {
        showVerseAccessBalloon(verse, reference);
      }
    } catch (err) {
      console.warn('Versículo por acesso indisponível:', err.message);
    }
  });
}

function showVerseAccessBalloon(verse, reference) {
  let balloon = document.getElementById('verse-access-balloon');

  if (balloon) balloon.remove();

  balloon = document.createElement('div');
  balloon.id = 'verse-access-balloon';
  balloon.className = 'verse-access-balloon';
  balloon.setAttribute('role', 'alert');
  balloon.setAttribute('aria-live', 'polite');

  balloon.innerHTML = `
    <div class="verse-access-content">
      <div class="verse-access-text">
        <p class="verse-access-verse">"${verse}"</p>
        <p class="verse-access-reference">${reference}</p>
      </div>
      <button type="button" class="verse-access-close" aria-label="Fechar versículo" title="Fechar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(balloon);

  const closeBtn = balloon.querySelector('.verse-access-close');
  closeBtn.addEventListener('click', () => {
    balloon.classList.add('verse-access-balloon--closing');
    setTimeout(() => balloon.remove(), 300);
  });

  setTimeout(() => {
    if (balloon.parentNode) {
      balloon.classList.add('verse-access-balloon--visible');
    }
  }, 50);
}
