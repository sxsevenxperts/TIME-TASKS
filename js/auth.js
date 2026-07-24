import { supabase, supabaseConfigError } from './supabase.js';
import { loadEventsFromServer } from './events.js';
import { refreshCalendar } from './calendar.js';
import {
  savePersistentSession,
  silentAutoLogin,
  startAutoRefresh,
  setupAuthSyncListener,
  setupResumeRefresh,
  getPersistedSessionInfo
} from './persistent-auth.js';

let currentUser = null;

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

export async function initAuth() {
  const authOverlay = document.getElementById('auth-overlay');
  const appLayout = document.querySelector('.app-layout');
  
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const authError = document.getElementById('auth-error');
  const toggleModeBtn = document.getElementById('auth-toggle-mode');
  const submitBtn = document.getElementById('auth-submit');
  
  let isLoginMode = true;
  let registering = false;

  const togglePasswordVisibility = document.getElementById('auth-toggle-password');
  if (togglePasswordVisibility) {
    togglePasswordVisibility.addEventListener('click', (e) => {
      e.preventDefault();
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePasswordVisibility.classList.toggle('active', type === 'text');
    });
  }

  // Garante a linha em time_tasks_members de forma idempotente e resiliente.
  // Qualquer usuário autenticado é membro: se a linha faltar, criamos (RLS
  // insert_own permite auth.uid() = user_id). Erros de leitura NÃO derrubam o
  // acesso — o servidor também auto-cura a membership. Antes, contas criadas
  // fora do cadastro do app (ex.: Auth compartilhado) ficavam sem linha e a SX
  // acusava "sessão expirou" para sempre.
  const ensureAppMembership = async (userId) => {
    try {
      const { data } = await supabase
        .from('time_tasks_members')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) return true;
    } catch (error) {
      console.warn('Leitura de membership falhou (seguindo para insert):', error?.message || error);
    }
    const { error: insertError } = await supabase
      .from('time_tasks_members')
      .insert({ user_id: userId });
    if (insertError && insertError.code !== '23505') {
      // Não bloquear: token válido já autentica; servidor provisiona também.
      console.warn('Insert de membership falhou (não fatal):', insertError.message);
    }
    return true;
  };

  const loadingOverlay = document.getElementById('loading-overlay');

  const finishLoading = () => {
    if (!loadingOverlay) return;
    loadingOverlay.style.opacity = '0';
    setTimeout(() => loadingOverlay.remove(), 300);
  };

  if (supabaseConfigError || !supabase) {
    authError.textContent = supabaseConfigError || 'Serviço de autenticação indisponível.';
    finishLoading();
    return;
  }

  // Toggle between Login and Register
  toggleModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
      submitBtn.textContent = 'Entrar';
      toggleModeBtn.innerHTML = 'Não tem uma conta? <span>Criar conta</span>';
    } else {
      submitBtn.textContent = 'Criar Conta';
      toggleModeBtn.innerHTML = 'Já tem uma conta? <span>Entrar</span>';
    }
    authError.textContent = '';
  });

  // Handle form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = '';
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      authError.textContent = 'Preencha todos os campos.';
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Aguarde...';
      
      if (isLoginMode) {
        registering = false;
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          12000,
          'O serviço demorou para responder. Verifique o CORS e a disponibilidade do Supabase.'
        );
        if (error) throw error;
      } else {
        registering = true;
        const { data, error } = await withTimeout(
          supabase.auth.signUp({ email, password, options: { data: { app: 'time-tasks' } } }),
          12000,
          'O serviço demorou para responder. Verifique o CORS e a disponibilidade do Supabase.'
        );
        if (error) throw error;
        let registrationSession = data.session;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          const { data: existing, error: loginError } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            12000,
            'O serviço demorou para responder.'
          );
          if (loginError || !existing.user) throw new Error('Este e-mail já existe e a senha informada não corresponde.');
          await ensureAppMembership(existing.user.id);
          registrationSession = existing.session;
        }

        if (registrationSession === null) {
          authError.style.color = 'var(--color-success)';
          authError.textContent = 'Conta criada! Verifique sua caixa de e-mail para confirmar.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Criar Conta';
          return;
        }
      }
    } catch (err) {
      registering = false;
      authError.style.color = 'var(--color-danger)';
      authError.textContent = err.message || 'Erro na autenticação.';
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
    }
  });

  // Atualiza a interface tanto no primeiro carregamento quanto após login/logout.
  let lastSessionId = null;
  const applySession = async (session) => {
    if (session && session.user) {
      if (lastSessionId === session.user.id) return;
      // Um token válido já autentica. Garantimos a linha de membership em
      // segundo plano (idempotente, auto-curável) SEM bloquear a sessão nem
      // revogar login por instabilidade de rede/RLS. O servidor também provisiona
      // a membership ao atender /api/sx, então a SX funciona no primeiro uso.
      void ensureAppMembership(session.user.id).catch(error => {
        console.warn('ensureAppMembership em segundo plano falhou (não fatal):', error?.message || error);
      });
      registering = false;
      lastSessionId = session.user.id;
      currentUser = session.user;

      // Salvar sessão persistentemente e agendar refresh
      savePersistentSession(session);
      startAutoRefresh(session);

      // Hide Auth UI, Show App
      authOverlay.style.display = 'none';
      appLayout.style.visibility = 'visible';
      appLayout.style.opacity = '1';
      finishLoading();
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';

      // Carregar os eventos do servidor
      await loadEventsFromServer();
      refreshCalendar();
      document.dispatchEvent(new CustomEvent('timetasks:session', {
        detail: { user: session.user, session }
      }));
    } else {
      lastSessionId = null;
      currentUser = null;
      // Show Auth UI, Hide App. Campos limpos permitem cadastrar outra conta
      // no mesmo dispositivo sem carregar credenciais da sessão anterior.
      emailInput.value = '';
      passwordInput.value = '';
      passwordInput.type = 'password';
      authOverlay.style.display = 'flex';
      appLayout.style.visibility = 'hidden';
      appLayout.style.opacity = '0';
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
      finishLoading();
      document.dispatchEvent(new CustomEvent('timetasks:session', {
        detail: { user: null, session: null }
      }));
    }
  };

  supabase.auth.onAuthStateChange((_event, session) => {
    // setTimeout(0): o supabase-js segura o lock de auth (navigator.locks)
    // enquanto o callback roda. Chamar .from()/getSession() dentro dele trava
    // o app no Safari/iOS (deadlock documentado). Saímos do callback antes.
    setTimeout(() => {
      if (session) {
        savePersistentSession(session);
        startAutoRefresh(session);
      }
      void applySession(session);
    }, 0);
  });

  // Tentar auto-login silencioso (para PWA JWS com login permanente)
  let sessionToRestore = null;
  try {
    sessionToRestore = await silentAutoLogin();
  } catch (error) {
    console.warn('Auto-login silencioso falhou:', error);
  }

  // Se não conseguiu auto-login, tentar restaurar sessão normal
  if (!sessionToRestore) {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      authError.textContent = 'Não foi possível restaurar sua sessão. Faça login novamente.';
      finishLoading();
    } else {
      sessionToRestore = data.session;
      if (sessionToRestore) {
        savePersistentSession(sessionToRestore);
        startAutoRefresh(sessionToRestore);
      }
    }
  }

  // Aplicar a sessão restaurada
  if (sessionToRestore) {
    await applySession(sessionToRestore);
  } else {
    finishLoading();
  }

  // Sincronizar auth entre abas/janelas
  setupAuthSyncListener();

  // iOS congela timers em background: renovar token ao retomar o PWA
  setupResumeRefresh();

  // Bind Logout Button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut();
    });
  }
}

export function getCurrentUser() {
  return currentUser;
}

export async function signOut() {
  // scope local: sair aqui não derruba a sessão dos outros aparelhos
  if (supabase) await supabase.auth.signOut({ scope: 'local' });
}
