import { supabase } from './supabase.js';

/**
 * Persistent Auth Manager for JWS PWA
 * Mantém login permanente, restaura sessão, renova token automaticamente
 */

const AUTH_KEY = 'timetasks_auth_persistent';
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutos (token expira em 60)

let refreshIntervalId = null;
let refreshPromise = null;

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

    // Verificar se a sessão não expirou (com margem de 5min)
    const expiresAt = data.expiresAt * 1000; // converter para ms
    const now = Date.now();
    const margin = 5 * 60 * 1000; // 5 minutos

    if (now > expiresAt - margin) {
      // Sessão expirada, remover
      localStorage.removeItem(AUTH_KEY);
      return null;
    }

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
    const persistedSession = restorePersistentSession();

    if (!persistedSession) {
      return null;
    }

    // Tentar restaurar com o refresh token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: persistedSession.refresh_token
    });

    if (error) {
      console.warn('Falha ao renovar sessão:', error.message);
      localStorage.removeItem(AUTH_KEY);
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
    return refreshPromise; // Evitar múltiplas renovações simultâneas
  }

  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Erro ao renovar token:', error.message);
        // Sessão inválida, fazer logout
        logout();
        return null;
      }

      if (data.session) {
        savePersistentSession(data.session);
        console.log('Token renovado com sucesso');
        return data.session;
      }

      return null;
    } catch (error) {
      console.error('Exceção ao renovar token:', error);
      logout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
  await supabase.auth.signOut();

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
  logout,
  getPersistedSessionInfo,
  notifySessionUpdate,
  startAutoRefresh,
  setupAuthSyncListener
};
