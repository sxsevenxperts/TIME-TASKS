# Setup Web Push (v2.1.0) — VAPID Configuration

**Data:** 20/07/2026  
**Status:** ✅ Chaves VAPID geradas e prontas  
**Tempo estimado:** 10 minutos

---

## 🔑 Suas Chaves VAPID

```
VAPID_PUBLIC_KEY=BK6R9qxPJRPornnp2QKPtiKLigIcwulTOMAKlNc_1qj7jqsYjrJ6Ms3BYKmrZ_TJ7BPcXdjHGSXW4BVyApYElMA
VAPID_PRIVATE_KEY=H3BFnYN-7YNE4EGsmWFSz5NTAHakeODfQCOkr0KfEWA
VAPID_SUBJECT=mailto:markalancamentos7d@gmail.com
```

⚠️ **IMPORTANTE:**
- A **chave privada** é secreta — não compartilhe, não commit no git
- O arquivo `.env.vapid.local` já está no `.gitignore`
- As chaves já estão no arquivo local: `.env.vapid.local`

---

## ✅ Passo 1: Adicionar Variáveis no EasyPanel (5 min)

1. Acesse **EasyPanel** → Painel de Controle
2. Procure o serviço **Time Tasks**
3. Vá para **Environment** (ou Settings → Environment)
4. Adicione 3 novas variáveis:

   ```
   VAPID_PUBLIC_KEY=BK6R9qxPJRPornnp2QKPtiKLigIcwulTOMAKlNc_1qj7jqsYjrJ6Ms3BYKmrZ_TJ7BPcXdjHGSXW4BVyApYElMA
   VAPID_PRIVATE_KEY=H3BFnYN-7YNE4EGsmWFSz5NTAHakeODfQCOkr0KfEWA
   VAPID_SUBJECT=mailto:markalancamentos7d@gmail.com
   ```

5. Clique **"Save"** ou **"Redeploy"** (aguarde a confirmação ✅)

**Verificação:**
- Logs mostram "✅ Web Push enabled" quando as chaves estão corretas
- Se faltar as chaves, mostra aviso mas nada quebra (graceful degradation)

---

## ✅ Passo 2: Executar Migration no Supabase (3 min)

1. Acesse **Supabase** → seu projeto → **SQL Editor**
2. Copie o conteúdo de `migrations/009_push_subscriptions.sql`
3. Cole e execute a query
4. Verifique: tabela `time_tasks_push_subscriptions` criada ✅

**Ou via CLI:**
```bash
supabase db push  # se tiver CLI configurada
```

---

## ✅ Passo 3: Testar Web Push no Aparelho (2 min)

### iPhone (iOS 16.4+)
1. Abra o app (Time Tasks) instalado na home screen
2. Vá para **Configurações** (⚙️ ícone)
3. Clique em **Notificações**
4. Toque em **"Solicitar permissão"** (ou aceite o prompt)
5. **Permissão concedida** = app está inscrito ✅

### Android (Chrome, Firefox, Edge)
1. Abra o app Time Tasks no navegador
2. Vá para **Configurações** → **Notificações**
3. Clique em **"Permitir notificações"** ou aceite o prompt
4. **Permissão concedida** = app está inscrito ✅

### Testar Push
1. Criar um evento para **1 minuto depois** (ex: "Teste Push")
2. Fechar completamente o app (swipe up, ou fechar abas)
3. Aguardar o horário do lembrete
4. **Notificação push aparece na barra de status** ✅

---

## 🔍 Troubleshooting

### "Notificação não chegou"
- ✅ Aparelho tem permissão? (Configurações → Notificações)
- ✅ App está completamente fechado? (swipe up)
- ✅ Event/tarefa tem lembrete configurado?
- ✅ EasyPanel mostra "✅ Web Push enabled" nos logs?
- ✅ Migration 009 foi executada no Supabase?

### "Erro: Falta VAPID_PRIVATE_KEY"
- Adicione as 3 variáveis no EasyPanel
- Clique "Redeploy" e aguarde confirmação

### "Erro: Tabela push_subscriptions não existe"
- Execute a migration 009 no Supabase SQL Editor

### "Permissão bloqueada no navegador"
- iPhone: Settings → Safari → Notifications → Time Tasks → Allow
- Android: Chrome → Settings → Notifications → Time Tasks → Allow

---

## 📊 Status Checklist

- [ ] Chaves VAPID copiadas
- [ ] 3 variáveis adicionadas no EasyPanel
- [ ] EasyPanel em modo "Redeploy" (aguardando confirmação)
- [ ] Migration 009 executada no Supabase
- [ ] Tabela `time_tasks_push_subscriptions` criada
- [ ] Aparelho concedeu permissão de notificação
- [ ] Evento criado com lembrete
- [ ] App fechado completamente
- [ ] Push recebido ✅

---

## 🚀 Próximas Ações

Uma vez que Web Push esteja funcional:

1. **Tag v2.1.0** — criar release no GitHub
2. **Documentação** — release notes, changelog
3. **Fase 13** — consolidação triggers (UI de gerenciamento)
4. **Fase 14** — dashboard de notificações

---

**Setup v2.1.0 Web Push:** ✅ Pronto para ativar  
**Tempo total:** ~10 minutos  
**Bloqueador:** Nenhum (degradation gracioso sem VAPID)

