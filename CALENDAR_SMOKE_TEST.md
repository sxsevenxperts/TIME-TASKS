# Smoke Test — Integrações de Calendário

## Pré-requisitos

- [ ] Google Cloud Console credenciais configuradas
- [ ] Apple iCloud account com CalDAV habilitado
- [ ] Servidor local rodando: `npm run dev`
- [ ] Browser com DevTools aberto

---

## Teste 1: Google Calendar OAuth Connect

**Cenário:** Conectar Google Calendar com sucesso

1. Abra `http://localhost:3000`
2. Faça login
3. Navegue para **Configurações > Integrações**
4. Clique **Conectar Google Calendar**
5. **Esperado:** Redirecionado para login Google
6. Faça login com sua conta Google
7. **Esperado:** Autorização solicitada (acesso a calendários)
8. Aceite permissões
9. **Esperado:** Redirecionado para `/` com mensagem "Google Calendar conectado"
10. Verifique em Supabase:
    ```sql
    SELECT * FROM time_tasks_calendar_integrations
    WHERE provider = 'google' AND user_id = 'YOUR_USER_ID';
    ```
11. **Esperado:** Registro criado com `access_token`, `refresh_token`, `calendar_id`

---

## Teste 2: Apple Calendar Setup

**Cenário:** Conectar Apple Calendar com credenciais iCloud

1. Em **Configurações > Integrações**, clique **Conectar Apple Calendar**
2. **Esperado:** Formulário com campos Email e Password
3. Insira credenciais iCloud válidas
4. Clique **Conectar**
5. **Esperado:** Lista de calendários Apple (iCloud, Compartilhados)
6. Selecione um calendário
7. **Esperado:** "Apple Calendar conectado" + URL do calendário salva

---

## Teste 3: Sincronização Pull (Google → SX)

**Cenário:** Evento criado em Google Calendar aparece em SX

1. Crie um evento em Google Calendar:
   - Título: "TEST: Google Sync"
   - Data: Hoje
   - Hora: 10:00-11:00

2. No Time Tasks, aguarde 5 minutos (ou clique Sincronizar Agora)

3. **Esperado:** Evento aparece em **Calendário > Dia/Semana**
   - Categoria: "Trabalho" (mapeamento de Google)
   - external_source: "google"
   - external_id: ID do evento Google

4. Verifique logs:
   ```sql
   SELECT * FROM time_tasks_sync_logs
   WHERE provider = 'google'
   ORDER BY created_at DESC LIMIT 1;
   ```
   **Esperado:** `status='success'`, `events_synced=1`

---

## Teste 4: Sincronização Push (SX → Google)

**Cenário:** Evento criado em SX aparece em Google Calendar

1. No Time Tasks, clique **Novo Evento**
   - Título: "TEST: SX Sync"
   - Data: Hoje + 1 dia
   - Hora: 14:00-15:00

2. Salve evento

3. **Esperado:** Evento é publicado em Google Calendar ~1 segundo depois

4. Abra Google Calendar em nova aba
   - Recarregue
   - **Esperado:** "TEST: SX Sync" aparece no calendário

5. Verifique `time_tasks_events`:
   ```sql
   SELECT title, external_id, external_source FROM time_tasks_events
   WHERE title = 'TEST: SX Sync' LIMIT 1;
   ```
   **Esperado:** `external_id` preenchido com ID do Google, `external_source='google'`

---

## Teste 5: Conflito de Edição

**Cenário:** Sincronização não duplica eventos

1. Crie evento "TEST: Dedup" em Google Calendar
2. Aguarde sincronização (5 min)
3. Evento aparece em SX
4. Edite o evento em Google (p.ex. altere hora)
5. Aguarde sincronização
6. **Esperado:** Evento em SX é atualizado, não duplicado
7. Verifique `time_tasks_events`:
   ```sql
   SELECT COUNT(*) FROM time_tasks_events
   WHERE external_id = 'google_event_id';
   ```
   **Esperado:** `1` (não 2)

---

## Teste 6: Token Refresh (Google)

**Cenário:** Sincronização funciona mesmo após token expirar

1. Crie evento em Google Calendar
2. Aguarde sincronização (5 min)
3. Force token expiration em Supabase:
   ```sql
   UPDATE time_tasks_calendar_integrations
   SET token_expires_at = NOW() - INTERVAL '1 hour'
   WHERE provider = 'google' AND user_id = 'YOUR_USER_ID';
   ```
4. Aguarde próxima sincronização (5 min)
5. **Esperado:** Sincronização ainda funciona (token foi renovado)
6. Verifique `access_token` foi atualizado:
   ```sql
   SELECT updated_at FROM time_tasks_calendar_integrations
   WHERE provider = 'google' LIMIT 1;
   ```

---

## Teste 7: Desconectar

**Cenário:** Desconectar calendário para sincronização

1. Em **Configurações > Integrações**, ao lado de "Google Calendar conectado", clique **Desconectar**
2. **Esperado:** `is_active=false` no banco
3. Criar novo evento em Google
4. Aguarde sincronização (5 min)
5. **Esperado:** Evento NÃO aparece em SX (integração desativada)

---

## Checklist Final

- [ ] Google OAuth completo
- [ ] Apple CalDAV conecta
- [ ] Sincronização pull (Google → SX) funciona
- [ ] Sincronização push (SX → Google) funciona
- [ ] Dedup por external_id funciona
- [ ] Token refresh funciona
- [ ] Desconectar desativa sincronização
- [ ] `npm run build` sem erros
- [ ] `/api/health` responde 200
- [ ] Logs limpos em produção

---

**Teste realizado:** [DATE]  
**Resultado:** ✅ PASSOU / ❌ FALHOU

