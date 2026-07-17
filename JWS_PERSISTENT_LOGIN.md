# Login Permanente — App JWS (PWA)

## Overview

O **SX Time Tasks JWS** é um PWA (Progressive Web App) instalável em Android, iOS e desktop que precisa manter o usuário **sempre logado** para:

✅ Emitir notificações push sem abrir o app  
✅ Sincronizar dados em background  
✅ Funcionar offline com acesso aos dados do usuário  
✅ Restaurar sessão ao reabrir o app  
✅ Renovar token automaticamente  

---

## Como Funciona

### 1. **Persistent Session Storage** (`persistent-auth.js`)

Todas as sessões são salvas em `localStorage` sob a chave `timetasks_auth_persistent`:

```json
{
  "user": { "id": "uuid", "email": "user@example.com", ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresAt": 1721270400,
  "savedAt": 1721266800000
}
```

**Quando salva:**
- Após login bem-sucedido
- Após renovação de token (refresh)
- Via `onAuthStateChange` do Supabase

---

### 2. **Auto-Login Silencioso**

Ao iniciar o app:

1. ✅ Verifica se há sessão salva em `localStorage`
2. ✅ Se houver, tenta renovar com o `refresh_token`
3. ✅ Se sucesso, o usuário entra **sem ver a tela de login**
4. ✅ Se falhar, mostra tela de login normalmente

**Fluxo:**

```
App aberto
    ↓
Há sessão em localStorage?
    ├─ SIM → Renovar com refresh_token
    │        ├─ Sucesso → Auto-login (direto pro app)
    │        └─ Falha → Mostrar tela de login
    │
    └─ NÃO → Mostrar tela de login
```

---

### 3. **Token Refresh Automático**

Após login, um timer automático renova o token **5 minutos antes de expirar**:

```javascript
// Token expira em 60 minutos
// Sistema renova em 55 minutos automaticamente
// Se app fecha durante esse tempo, ao reabreir renova imediatamente
```

**Benefícios:**
- Token sempre válido para chamadas à API
- Notificações push continuam funcionando
- Sincronização de calendários não interrompe

---

### 4. **Sincronização Entre Abas/Janelas**

Se o usuário abrir o app em múltiplas abas:

- Login em uma aba → **toadas as outras são notificadas** via `storage` event
- Logout em uma aba → **todas recebem notificação** de logout
- Token renovado → **compartilhado entre abas**

---

### 5. **Service Worker Authentication Check**

O Service Worker verifica autenticação periodicamente:

```javascript
// A cada 5 minutos, SW verifica se há token válido
// Se expirou, limpa localStorage
// Se válido, mantém cache e sincronização ativa
```

---

## APIs Disponíveis

### `persistent-auth.js`

```javascript
import {
  savePersistentSession,      // Salva sessão
  restorePersistentSession,   // Restaura do localStorage
  silentAutoLogin,            // Tenta auto-login com refresh_token
  startAutoRefresh,           // Agenda renovação de token
  logout,                     // Logout completo
  getPersistedSessionInfo,    // Info da sessão (sem chamada ao servidor)
  notifySessionUpdate,        // Notifica outras abas
  setupAuthSyncListener       // Escuta mudanças de auth
} from './persistent-auth.js';
```

**Exemplo:**

```javascript
// Auto-login silencioso
const session = await silentAutoLogin();
if (session) {
  console.log('Usuário:', session.user.email);
  // Já está autenticado!
} else {
  console.log('Precisa fazer login');
}

// Obter info da sessão
const info = getPersistedSessionInfo();
// { userId, email, expiresAt, savedAt }

// Logout
await logout();
// Limpa localStorage, faz logout no Supabase, mostra tela de login
```

---

## Fluxo de Notificações

1. **Usuário instala o app** → auto-login silencioso
2. **App pede permissão de notificações** → concede
3. **Servidor envia notificação push** → Service Worker intercepta
4. **SW verifica autenticação** → sempre válida (token renovado)
5. **SW dispara notificação** → usuário recebe mesmo com app fechado

---

## Configuração para JWS

### Ativar Modo "Always-Logged-In"

No `index.html`, o app agora:

✅ Tenta auto-login antes de mostrar a tela de login  
✅ Restaura sessão ao reabrir  
✅ Renova token automaticamente  
✅ Sincroniza auth entre abas  

Nenhuma configuração adicional necessária — funciona por padrão.

### Customizações Opcionais

**Se quiser desabilitar persistent auth para um usuário específico:**

```javascript
// Remove a sessão permanente
localStorage.removeItem('timetasks_auth_persistent');

// Força logout
import { logout } from './persistent-auth.js';
await logout();
```

**Se quiser forçar refresh de token manualmente:**

```javascript
// Será feito automaticamente, mas se precisar:
const { data } = await supabase.auth.refreshSession();
if (data.session) {
  savePersistentSession(data.session);
}
```

---

## Segurança

### Access Token vs Refresh Token

- **Access Token** — validade curta (60 min), usado em chamadas à API
- **Refresh Token** — validade longa (7-365 dias), usado só para renovar

**O app guarda ambos em localStorage:**

```
localStorage['timetasks_auth_persistent']
├── accessToken (curta validade)
├── refreshToken (longa validade)
└── expiresAt (timestamp do access token)
```

### XSS Prevention

- Tokens em localStorage são **acessíveis via JS** — risco de XSS
- **Mitigação:** CSP restritivo (`script-src 'self'`), sem `eval()`, sanitização de inputs
- **Alternativa futura:** mover para `httpOnly` cookies (requires backend)

### Session Hijacking Prevention

- Refresh token renovado toda vez que usado
- Token expirado remove a sessão (força re-login)
- Sincronização entre abas via `storage` event (detecta logout em outra aba)

---

## Troubleshooting

### "O app mostra tela de login mesmo após fazer login antes"

**Causa:** localStorage foi limpo (ou navegador está em modo privado)

**Solução:**
- Verificar se localStorage está habilitado (F12 → Application → Local Storage)
- Modo privado/incógnito não persiste — pedir para instalar o app na home screen

### "Notificações param depois de algumas horas"

**Causa:** Token expirou e não conseguiu renovar

**Solução:**
- Abrir o app uma vez → força refresh de token
- Verificar conexão com internet e Supabase
- Verificar logs em `console` (F12)

### "Logout não funciona"

**Causa:** Aplicar do Supabase pode estar fora do ar

**Solução:**
```javascript
// Forçar logout local (mesmo se servidor estiver down)
localStorage.removeItem('timetasks_auth_persistent');
location.reload();
```

---

## Próximos Passos

1. ✅ Persistent session + auto-login
2. ✅ Token refresh automático
3. ✅ Service Worker auth check
4. ⏳ **Web Push notifications** — back-end para enviar notificações
5. ⏳ **Background Sync** — sincronizar dados offline quando reconectar
6. ⏳ **Periodic Sync** — atualizar calendários a cada 24h sem abrir app
7. ⏳ **Dark Mode Persistence** — lembrar preferência de tema

---

## Referência Técnica

**Arquivos modificados:**
- `js/persistent-auth.js` — novo módulo
- `js/auth.js` — integração com persistent-auth
- `public/pwa-register.js` — auth check no SW
- `public/service-worker.js` — handler de mensagens

**Chaves do localStorage:**
- `timetasks_auth_persistent` — sessão completa (user, tokens, expires_at)

**Eventos customizados:**
- `timetasks:session` — mudança de sessão (login/logout)
- `timetasks:logout` — logout com motivo (session-expired, user-action)
- `timetasks:auth-synced` — auth sincronizada entre abas

**Intervalos de timer:**
- Token refresh: 55 minutos (antes de 60 min expirar)
- Auth check no SW: 5 minutos
- Update check: 1 minuto

---

**Versão:** 1.0 Persistent Auth  
**Última atualização:** 2026-07-16
