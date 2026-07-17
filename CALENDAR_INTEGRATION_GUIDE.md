# Guia de Integração — Google Calendar e Apple Calendar

## 1. Setup Google Calendar

### 1.1 Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API **Google Calendar API**:
   - Menu: APIs & Services → Library
   - Busque "Google Calendar"
   - Clique em "Google Calendar API"
   - Clique "Enable"

### 1.2 OAuth 2.0 Credentials

1. Vá para **APIs & Services → Credentials**
2. Clique **Create Credentials → OAuth 2.0 Client ID**
3. Escolha "Web application"
4. Configure:
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/google/callback` (dev)
   - **Authorized redirect URIs:** `https://startups-timetasks.qfotry.easypanel.host/api/auth/google/callback` (prod)
5. Salve o `Client ID` e `Client Secret`

### 1.3 Configurar Variáveis de Ambiente

**Em `.env.local` (desenvolvimento):**
```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**No EasyPanel (produção):**
- Settings → Environment Variables
- Adicione as mesmas chaves com URLs de produção

### 1.4 Teste Local

1. `npm run dev`
2. Abra `http://localhost:3000`
3. Vá em **Configurações > Integrações**
4. Clique **Conectar Google Calendar**
5. Faça login com sua conta Google
6. Autorize permissões de calendário
7. Confirme sucesso

---

## 2. Setup Apple Calendar (CalDAV)

### 2.1 iCloud Account

1. Apple Calendar usa CalDAV via iCloud
2. Você precisa de:
   - E-mail da conta iCloud
   - Senha (ou app-specific password para 2FA)

### 2.2 Habilitar CalDAV

1. Acesse [iCloud.com](https://www.icloud.com)
2. Vá em Settings → Advanced
3. Verifique se CalDAV está habilitado
4. Crie uma **app-specific password** (se tiver 2FA ativo):
   - Acesse [appleid.apple.com](https://appleid.apple.com)
   - Security → App-specific passwords
   - Gere uma nova senha

### 2.3 Teste Local

1. Em **Configurações > Integrações**
2. Clique **Conectar Apple Calendar**
3. Insira e-mail e app-specific password
4. Selecione qual calendário sincronizar
5. Confirme sucesso

---

## 3. Sincronização Automática

### 3.1 Como Funciona

- **Pull (Google/Apple → SX):** A cada 5 minutos
  - Busca eventos novos/modificados
  - Cria/atualiza em Time Tasks automaticamente
  - Status registrado em `time_tasks_sync_logs`

- **Push (SX → Google/Apple):** Imediato ao criar evento
  - Novo evento em SX é publicado em todos os calendários conectados
  - `external_id` armazena referência do evento externo

### 3.2 Sincronização Manual

- Botão **"Sincronizar agora"** em Settings
- Força busca imediata de eventos
- Útil se ocorrer delay ou erro

### 3.3 Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| "Token expirado" | Credencial caducou | Desconectar e reconectar |
| "Erro ao buscar calendários" | iCloud 2FA | Use app-specific password |
| "Evento não aparece em Google" | Sincronização ainda em progresso | Aguarde 5 min e recarregue |
| "Credenciais incorretas" | Senha errada | Confirme e tente novamente |

---

## 4. Monitoramento em Produção

### 4.1 Verificar Status de Sincronização

```sql
SELECT id, provider, last_sync_at, sync_errors, is_active
FROM time_tasks_calendar_integrations
WHERE user_id = 'user_uuid'
ORDER BY updated_at DESC;
```

### 4.2 Ver Logs de Sincronização

```sql
SELECT created_at, provider, status, events_synced, error_message
FROM time_tasks_sync_logs
WHERE user_id = 'user_uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### 4.3 Alertas

- Monitore `sync_errors` para problemas recorrentes
- Se `last_sync_at` > 10 min, o job pode estar travado
- Verifique `time_tasks_events.is_syncing` para bloqueios

---

## 5. Roadmap Futuro

- [ ] UI dashboard: status de sincronização em tempo real
- [ ] Configurar intervalo de sincronização (5 min, 15 min, 1 hora)
- [ ] Resolver conflitos automáticos ou por usuário
- [ ] Suporte para Microsoft Outlook/Exchange (CalDAV)
- [ ] Web Push notifications para eventos sincronizados
- [ ] Encriptação de credenciais CalDAV no banco

---

**Atualizado:** 16/07/2026
