import { supabase, supabaseConfigError } from './supabase.js';
import { loadEventsFromServer } from './events.js';
import { refreshCalendar } from './calendar.js';

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

  const ensureAppMembership = async (userId, createIfMissing = false) => {
    const { data, error } = await supabase
      .from('time_tasks_members')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error('Não foi possível validar o acesso exclusivo do Time Tasks.');
    if (data) return true;
    if (!createIfMissing) return false;
    const { error: insertError } = await supabase
      .from('time_tasks_members')
      .insert({ user_id: userId });
    if (insertError && insertError.code !== '23505') throw insertError;
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
          await ensureAppMembership(existing.user.id, true);
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
      let allowed = false;
      try {
        allowed = await ensureAppMembership(session.user.id, registering);
      } catch (error) {
        authError.style.color = 'var(--color-danger)';
        authError.textContent = error.message || 'Não foi possível validar este acesso.';
        await supabase.auth.signOut();
        return;
      }
      if (!allowed) {
        authError.style.color = 'var(--color-danger)';
        authError.textContent = 'Esta conta não possui acesso ao Time Tasks. Use “Criar conta” para cadastrar este acesso.';
        await supabase.auth.signOut();
        return;
      }
      registering = false;
      lastSessionId = session.user.id;
      currentUser = session.user;
      
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
      // Show Auth UI, Hide App
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
    // O callback não fica bloqueado por uma consulta ao banco.
    void applySession(session);
  });

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    authError.textContent = 'Não foi possível restaurar sua sessão. Faça login novamente.';
    finishLoading();
  } else {
    await applySession(data.session);
  }

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
  if (supabase) await supabase.auth.signOut();
}
