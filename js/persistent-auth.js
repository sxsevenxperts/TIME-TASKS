import { supabase } from './supabase.js';

/**
 * Persistent Auth Manager para o PWA do Time Tasks.
 *
 * PRINCÍPIO CENTRAL (correção definitiva do "Sua sessão expirou"):
 * o supabase-js é a ÚNICA fonte de verdade da sessão. Ele já persiste
 * (persistSession) e renova (autoRefreshToken) sozinho, com deduplicação
 * interna e rotação correta do refresh token.
 *
 * O bug anterior: existiam 5 mecanismos de renovação em paralelo
 * (autoRefreshToken do supabase, setInterval próprio, silentAutoLogin,
 * ensureFreshSession e handlers de retomada), vários chamando
 * refreshSession() com uma CÓPIA do refresh token guardada no localStorage.
 * Como o refresh token do Supabase é de uso único e rotaciona a cada
 * renovação, reutilizar uma cópia antiga é detectado como reuso e o
 * Supabase REVOGA a sessão inteira — quebrando TODAS as requisições
 * seguintes com 401 ("Sua sessão expirou") mesmo logo após o login.
 *
 * Agora o localStorage é apenas um BACKUP de leitura. Quando o storage do
 * supabase-js some (Safari/iOS pode limpar), restauramos via setSession(),
 * devolvendo os tokens ao supabase-js para que ELE assuma a rotação.
 * Nunca mais chamamos refreshSession() com um token explícito em paralelo.
 */

const AUTH_KEY = 'timetasks_auth_persistent';

// No iOS o PWA é suspenso e as chamadas de auth do supabase-js podem ficar
// presas no navigator.locks ao retomar — todo await de auth precisa de teto.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms))
  ]);
}

// Erros que significam "refresh token realmente inválido/revogado". Só nesses
// casos o backup local deve ser descartado; erro de rede NUNCA derruba login.
function isFatalAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('invalid refresh token')
    || message.includes('refresh token not found')
    || message.includes('refresh_token_not_found')
    || message.includes('already used')
    || message.includes('invalid claim')
    || error?.status === 400;
}

/**
 * Salva um BACKUP da sessão no localStorage. Não agenda renovação própria:
 * quem renova é o autoRefreshToken do supabase-js (fonte única de verdade).
 */
export function savePersistentSession(session) {
  if (!session) {
    localStorage.removeItem(AUTH_KEY);
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
  } catch (error) {
    console.error('Erro ao salvar backup da sessão:', error);
  }
}

/**
 * Lê o backup da sessão do localStorage (não faz chamadas de rede).
 */
export function restorePersistentSession() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data?.accessToken || !data?.refreshToken) return null;

    return {
      user: data.user,
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expires_at: data.expiresAt
    };
  } catch (error) {
    console.error('Erro ao ler backup da sessão:', error);
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

/**
 * Restaura o backup entregando os tokens ao supabase-js via setSession().
 * A partir daí o supabase-js assume a posse e a rotação — sem corrida.
 * Retorna a sessão resultante ou null. Só descarta o backup em erro fatal.
 */
async function restoreIntoSupabase(backup) {
  if (!backup?.refresh_token) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.setSession({
        access_token: backup.access_token,
        refresh_token: backup.refresh_token
      }),
      8000
    );

    if (error) {
      console.warn('[restoreIntoSupabase] setSession falhou:', error.message);
      // Token de fato revogado → limpar backup. Erro de rede/timeout mantém.
      if (isFatalAuthError(error)) localStorage.removeItem(AUTH_KEY);
      return null;
    }

    if (data?.session) {
      savePersistentSession(data.session);
      return data.session;
    }
    return null;
  } catch (error) {
    console.warn('[restoreIntoSupabase] Exceção/timeout:', error?.message || error);
    return null; // timeout não descarta o backup
  }
}

/**
 * Login silencioso ao abrir o app (PWA com login permanente).
 * 1) Pergunta a sessão ao supabase-js (ele renova sozinho se preciso).
 * 2) Se não houver, restaura o backup via setSession().
 */
export async function silentAutoLogin() {
  if (!supabase) return null;
  try {
    // Fonte primária: supabase-js. getSession() já renova o access token
    // vencido usando o refresh token que ELE guarda e rotaciona.
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 6000);
      if (data?.session) {
        savePersistentSession(data.session);
        return data.session;
      }
    } catch (nativeError) {
      console.warn('[silentAutoLogin] getSession timeout/erro:', nativeError.message);
    }

    // Reserva: storage do supabase-js foi limpo (Safari/iOS). Restaura o
    // backup entregando os tokens ao supabase-js — sem refresh paralelo.
    const backup = restorePersistentSession();
    if (backup) {
      const restored = await restoreIntoSupabase(backup);
      if (restored) return restored;
    }

    return null;
  } catch (error) {
    console.error('Erro no auto-login silencioso:', error);
    return null;
  }
}

/**
 * Garante uma sessão com access token válido.
 *
 * Delega ao supabase-js: getSession() devolve a sessão atual e renova o
 * access token vencido automaticamente (com deduplicação interna — chamadas
 * concorrentes NÃO disparam refresh duplicado, evitando a revogação por
 * reuso). Só forçamos refreshSession() (sem token explícito) após um 401.
 */
export async function ensureFreshSession(options = {}) {
  if (!supabase) {
    console.warn('[ensureFreshSession] supabase não está pronto');
    return null;
  }

  try {
    // Após um 401 do servidor (options.force): forçar UMA renovação através
    // do próprio supabase-js, que usa e rotaciona o refresh token dele.
    if (options.force) {
      try {
        const { data, error } = await withTimeout(supabase.auth.refreshSession(), 8000);
        if (!error && data?.session) {
          savePersistentSession(data.session);
          return data.session;
        }
        if (error) console.warn('[ensureFreshSession] refresh forçado falhou:', error.message);
      } catch (e) {
        console.warn('[ensureFreshSession] refresh forçado timeout:', e.message);
      }
      // Se o refresh forçado falhou, tenta restaurar do backup (storage sumiu).
      const backup = restorePersistentSession();
      if (backup) {
        const restored = await restoreIntoSupabase(backup);
        if (restored) return restored;
      }
      return null;
    }

    // Caminho normal: getSession() renova sozinho se o token estiver vencido.
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 6000);
      if (data?.session?.access_token) {
        savePersistentSession(data.session);
        return data.session;
      }
    } catch (e) {
      console.warn('[ensureFreshSession] getSession timeout/erro:', e.message);
    }

    // getSession não devolveu sessão (storage limpo ou travado no iOS):
    // restaura o backup via setSession(), devolvendo posse ao supabase-js.
    const backup = restorePersistentSession();
    if (backup) {
      const restored = await restoreIntoSupabase(backup);
      if (restored) return restored;
      // Último recurso: devolver o backup mesmo (o caller trata um eventual
      // 401 forçando renovação). Melhor tentar do que falhar de imediato.
      return backup;
    }

    return null;
  } catch (error) {
    console.error('[ensureFreshSession] Exceção:', error?.message || error);
    return null;
  }
}

/**
 * Renova a sessão quando o PWA volta do background. iOS congela timers, então
 * ao retomar pedimos ao supabase-js a sessão (ele renova se necessário) em vez
 * de esperar o próximo tick do autoRefresh. Não força refresh — só sincroniza.
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
 * Logout completo (limpa backup e encerra só este aparelho).
 */
export async function logout() {
  localStorage.removeItem(AUTH_KEY);
  try {
    // scope local: encerra só este aparelho. O scope global revogava o refresh
    // token de TODOS os aparelhos — um erro no iPhone derrubava o desktop.
    await withTimeout(supabase.auth.signOut({ scope: 'local' }), 6000);
  } catch (error) {
    console.warn('[logout] signOut timeout/erro (ignorado):', error?.message || error);
  }

  document.dispatchEvent(new CustomEvent('timetasks:logout', {
    detail: { reason: 'session-expired' }
  }));
}

/**
 * Informações da sessão de backup (sem chamadas ao servidor).
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
 * Atualiza o backup e notifica outras abas.
 */
export function notifySessionUpdate(session) {
  savePersistentSession(session);
  if (typeof window !== 'undefined' && session) {
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
 * Ao logar, apenas guardamos o backup. A renovação automática fica por conta
 * do autoRefreshToken do supabase-js — não criamos mais timers concorrentes
 * (era a origem da corrida que revogava a sessão).
 */
export function startAutoRefresh(session) {
  if (session) savePersistentSession(session);
}

/**
 * Sincroniza o estado de auth entre abas/janelas.
 */
export function setupAuthSyncListener() {
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        document.dispatchEvent(new CustomEvent('timetasks:auth-synced', {
          detail: { user: data.user }
        }));
      } catch (error) {
        console.error('Erro ao sincronizar auth entre abas:', error);
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
