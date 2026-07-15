import { supabase } from './supabase.js';
import { loadEventsFromServer } from './events.js';
import { refreshCalendar } from './calendar.js';

let currentUser = null;

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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            authError.textContent = 'Este e-mail já está em uso.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Conta';
            return;
        }

        if (data.session === null) {
          authError.style.color = 'var(--color-success)';
          authError.textContent = 'Conta criada! Verifique sua caixa de e-mail para confirmar.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Criar Conta';
          return;
        }
      }
    } catch (err) {
      authError.style.color = 'var(--color-danger)';
      authError.textContent = err.message || 'Erro na autenticação.';
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
    }
  });

  // Listen to Auth State Changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);
    }

    if (session && session.user) {
      currentUser = session.user;
      
      // Hide Auth UI, Show App
      authOverlay.style.display = 'none';
      appLayout.style.visibility = 'visible';
      appLayout.style.opacity = '1';

      // Carregar os eventos do servidor
      await loadEventsFromServer();
      refreshCalendar();
    } else {
      currentUser = null;
      // Show Auth UI, Hide App
      authOverlay.style.display = 'flex';
      appLayout.style.visibility = 'hidden';
      appLayout.style.opacity = '0';
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
    }
  });

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
  await supabase.auth.signOut();
}
