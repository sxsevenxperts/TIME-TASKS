import { supabase } from './supabase.js';

/**
 * Persistent Auth Manager for JWS PWA
 * Mantém login permanente, restaura sessão, renova token automaticamente
 */

const AUTH_KEY = 'timetasks_auth_persistent';
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutos (token expira em 60)

let refreshIntervalId = null;
let refreshPromise = null;

// No iOS o PWA é suspenso e as chamadas de auth do supabase-js podem ficar
// presas no navigator.locks ao retomar — todo await de auth precisa de teto.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms))
  ]);
}

// Erros que significam "refresh token realmente inválido/revogado". Só nesses
// casos a sessão local deve ser descartada; erro de rede NUNCA derruba login.
function isFatalAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('invalid refresh token')
    || message.includes('refresh token not found')
    || message.includes('refresh_token_not_found')
    || message.includes('already used')
    || error?.status === 400;
}

/**
 * Salva sessão persistentemente no localStorage
 */
export function savePersistentSession(session) {
  if (!session) {
    localStorage.removeItem(AUTH_KEY);
    clearTokenRefresh();
    return;
  }

  try {
    const data = {
      user: session.user,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      savedAt: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    scheduleTokenRefresh(session.expires_at);
  } catch (error) {
    console.error('Erro ao salvar sessão persistente:', error);
  }
}

/**
 * Restaura sessão salva do localStorage
 */
export function restorePersistentSession() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // O access token expira em ~60min, mas quem mantém o login permanente é
    // o refresh token, que continua válido. Sessão com access token vencido
    // NÃO é descartada: o silentAutoLogin renova com o refresh token.
    // (Descartar aqui forçava novo login a cada reabertura após ~55min.)

    return {
      user: data.user,
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expires_at: data.expiresAt
    };
  } catch (error) {
    console.error('Erro ao restaurar sessão persistente:', error);
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

/**
 * Tenta fazer login silencioso com refresh_token
 */
export async function silentAutoLogin() {
  try {
    // Fonte primária: a sessão persistida pelo próprio supabase-js
    // (persistSession + autoRefreshToken), que sempre carrega o refresh
    // token mais recente. O Supabase rotaciona o refresh token a cada
    // renovação — renovar com uma cópia antiga é tratado como reuso e pode
    // revogar a sessão inteira, forçando login sem necessidade.
    // Timeout curto (5s): iOS PWA suspende o app e bloqueia auth calls.
    try {
      const { data: native } = await withTimeout(supabase.auth.getSession(), 5000);
      if (native?.session) {
        savePersistentSession(native.session);
        return native.session;
      }
    } catch (nativeError) {
      console.warn('[silentAutoLogin] Native session timeout/erro:', nativeError.message);
    }

    // Reserva: cópia própria (ex.: storage do supabase-js foi limpo).
    const persistedSession = restorePersistentSession();

    if (!persistedSession) {
      return null;
    }

    // Tentar restaurar com o refresh token
    const { data, error } = await withTimeout(
      supabase.auth.refreshSession({ refresh_token: persistedSession.refresh_token }),
      5000
    );

    if (error) {
      console.warn('Falha ao renovar sessão:', error.message);
      // Só descarta a cópia local se o token foi de fato revogado.
      // Erro de rede/timeout mantém a cópia para a próxima tentativa.
      if (isFatalAuthError(error)) localStorage.removeItem(AUTH_KEY);
      return null;
    }

    // Sucesso! Salvar nova sessão
    if (data.session) {
      savePersistentSession(data.session);
      return data.session;
    }

    return null;
  } catch (error) {
    console.error('Erro no auto-login silencioso:', error);
    return null;
  }
}

/**
 * Agenda renovação automática de token
 */
function scheduleTokenRefresh(expiresAt) {
  clearTokenRefresh();

  // Renovar 5 minutos antes de expirar
  const now = Date.now();
  const expiresAtMs = expiresAt * 1000;
  const timeUntilRefresh = Math.max(0, expiresAtMs - now - 5 * 60 * 1000);

  if (timeUntilRefresh <= 0) {
    // Já está próximo de expirar, renovar imediatamente
    refreshToken();
    return;
  }

  refreshIntervalId = setTimeout(() => {
    refreshToken();
    // Agendar próxima renovação em 55 minutos
    refreshIntervalId = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
  }, timeUntilRefresh);

  console.log(`Token refresh agendado para ${new Date(now + timeUntilRefresh).toLocaleTimeString()}`);
}

/**
 * Renova o token de acesso
 */
async function refreshToken() {
  if (refreshPromise) {
    console.log('refreshToken já em andamento, aguardando...');
    return refreshPromise; // Evitar múltiplas renovações simultâneas
  }

  refreshPromise = (async () => {
    try {
      console.log('[refreshToken] Iniciando renovação de token');
      const { data, error } = await withTimeout(supabase.auth.refreshSession(), 10000);

      if (error) {
        console.error('[refreshToken] Erro ao renovar:', error.message, error.status);
        // Só derruba a sessão quando o refresh token foi revogado de verdade.
        // Erro transitório (rede, timeout, suspensão do iOS) mantém o login.
        if (isFatalAuthError(error)) {
          console.error('[refreshToken] Erro fatal — revogando logout');
          logout();
        } else {
          console.warn('[refreshToken] Erro transitório — mantendo sessão');
        }
        return null;
      }

      if (data.session) {
        savePersistentSession(data.session);
        console.log('[refreshToken] ✓ Token renovado com sucesso, expira em:', new Date(data.session.expires_at * 1000).toLocaleTimeString());
        return data.session;
      }

      console.warn('[refreshToken] Sucesso mas sem session nos dados');
      return null;
    } catch (error) {
      console.error('[refreshToken] Exceção:', error?.message || error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Garante uma sessão com access token válido, renovando se necessário.
 * ESTRATÉGIA: Prefere localStorage (mais confiável em iOS PWA) que native Supabase.
 */
export async function ensureFreshSession(options = {}) {
  if (!supabase) {
    console.warn('[ensureFreshSession] supabase não está pronto');
    return null;
  }
  try {
    // PRIORIDADE 1: Restaurar do localStorage (mais confiável em iOS PWA)
    const persisted = restorePersistentSession();
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (persisted?.access_token) {
      const stillValid = persisted.expires_at && persisted.expires_at - nowSeconds > 120;
      console.log(`[ensureFreshSession] localStorage: ${persisted ? '✓' : '✗'}, válido=${stillValid}, force=${options.force}`);

      if (stillValid && !options.force) {
        console.log('[ensureFreshSession] ✓ Token localStorage ainda válido');
        return persisted;
      }
    }

    // Token vencido ou forçada renovação. Renovar com refresh_token
    if (persisted?.refresh_token) {
      console.log('[ensureFreshSession] Tentando renovar com refresh_token persistido...');
      const { data: alt, error } = await withTimeout(
        supabase.auth.refreshSession({ refresh_token: persisted.refresh_token }),
        5000
      ).catch(() => ({ data: null, error: null }));

      if (!error && alt?.session) {
        savePersistentSession(alt.session);
        console.log('[ensureFreshSession] ✓ Renovação bem-sucedida');
        return alt.session;
      } else {
        console.warn('[ensureFreshSession] Refresh falhou:', error?.message);
      }
    }

    // PRIORIDADE 2: Tentar native session como último recurso
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 3000);
      const nativeSession = data?.session || null;
      if (nativeSession?.access_token) {
        savePersistentSession(nativeSession);
        console.log('[ensureFreshSession] ✓ Usando native session como fallback');
        return nativeSession;
      }
    } catch (e) {
      console.warn('[ensureFreshSession] Native session indisponível:', e.message);
    }

    // Se nada funcionou, devolver session com token vencido (caller trata 401)
    if (persisted?.access_token) {
      console.warn('[ensureFreshSession] Devolvendo token vencido (caller tratará 401)');
      return persisted;
    }

    console.error('[ensureFreshSession] ✗ Sem sessão disponível');
    return null;
  } catch (error) {
    console.error('[ensureFreshSession] Exceção:', error?.message || error);
    return null;
  }
}

/**
 * Renova a sessão quando o PWA volta do background (iOS congela timers:
 * o refresh agendado nunca dispara durante a suspensão — ao retomar,
 * renovamos na hora em vez de esperar o próximo tick).
 */
export function setupResumeRefresh() {
  let lastRun = 0;
  const onResume = () => {
    const now = Date.now();
    if (now - lastRun < 5000) return; // visibilitychange+pageshow+focus juntos
    lastRun = now;
    void ensureFreshSession();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onResume();
  });
  window.addEventListener('pageshow', onResume);
  window.addEventListener('focus', onResume);
}

/**
 * Limpa agendamento de refresh
 */
function clearTokenRefresh() {
  if (refreshIntervalId) {
    clearTimeout(refreshIntervalId);
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
}

/**
 * Logout completo (limpa tudo)
 */
export async function logout() {
  clearTokenRefresh();
  localStorage.removeItem(AUTH_KEY);
  // scope local: encerra só este aparelho. O scope global (padrão) revogava o
  // refresh token de TODOS os aparelhos — um erro no iPhone derrubava o desktop.
  await supabase.auth.signOut({ scope: 'local' });

  // Despachar evento para UI atualizar
  document.dispatchEvent(new CustomEvent('timetasks:logout', {
    detail: { reason: 'session-expired' }
  }));
}

/**
 * Retorna informações da sessão atual (sem chamadas ao servidor)
 */
export function getPersistedSessionInfo() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    return {
      userId: data.user?.id,
      email: data.user?.email,
      expiresAt: new Date(data.expiresAt * 1000),
      savedAt: new Date(data.savedAt)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Notifica que a sessão foi atualizada (para sincronizar abas/janelas)
 */
export function notifySessionUpdate(session) {
  savePersistentSession(session);

  // Notificar outras abas via storage event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new StorageEvent('storage', {
      key: AUTH_KEY,
      newValue: JSON.stringify({
        user: session.user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
        savedAt: Date.now()
      }),
      storageArea: localStorage
    }));
  }
}

/**
 * Inicia token refresh automático ao fazer login
 */
export function startAutoRefresh(session) {
  if (session?.expires_at) {
    scheduleTokenRefresh(session.expires_at);
  }
}

/**
 * Sincroniza auth state entre abas/janelas
 */
export function setupAuthSyncListener() {
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        console.log('Auth sincronizada entre abas');
        document.dispatchEvent(new CustomEvent('timetasks:auth-synced', {
          detail: { user: data.user }
        }));
      } catch (error) {
        console.error('Erro ao sincronizar auth:', error);
      }
    }
  });
}

export default {
  savePersistentSession,
  restorePersistentSession,
  silentAutoLogin,
  ensureFreshSession,
  setupResumeRefresh,
  logout,
  getPersistedSessionInfo,
  notifySessionUpdate,
  startAutoRefresh,
  setupAuthSyncListener
};
