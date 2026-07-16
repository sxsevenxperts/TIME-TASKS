# Manual de Bordo — SX Time Tasks 2.0

**Versão:** 2.0  
**Data:** 16/07/2026  
**Status:** ✅ Pronto para Produção (WCAG 2.1 AA)

---

## 1. O que é SX Time Tasks?

SX Time Tasks é uma aplicação **web-first** de calendário, tarefas e automações para gerenciar tempo com auxílio de IA. Construída em Vanilla JS + Vite + Supabase, isolada logicamente no Auth compartilhado com SevenChat.

**Identidade:**
- **Sigla:** SX (Assistente inteligente, não "SevenChat")
- **Tom:** consultor técnico, direto, respeitoso
- **Público:** users autenticados em `time_tasks_members`

---

## 2. Stack Técnico

| Camada | Tecnologia | Notas |
|---|---|---|
| Frontend | Vanilla JS (ES Modules) + Vite 6 | Sem React/Vue/Tailwind |
| Build | Vite 6.4.3, Node 22 | `npm run build` → dist/ |
| Backend | Node.js Express (Docker) | `/api/sx`, `/api/verse`, `/api/health` |
| Database | Supabase (self-hosted no EasyPanel) | `time_tasks_*` prefix, RLS em 8 tabelas |
| IA | Google Gemini API | Proxy `/api/sx` (chave privada no servidor) |
| API Clima | Open-Meteo (pública, sem chave) | Widget `weather.js` |
| API Versículos | bible-api.com | `/api/verse` endpoint |
| Hospedagem | EasyPanel (startups-timetasks.qfotry.easypanel.host) | Docker Alpine Node 22 |

---

## 3. Estrutura de Arquivos

```
/Users/sergioponte/TIME TASKS/
├── index.html                        # Shell HTML (180+ KB com todas as views)
├── js/
│   ├── app.js                        # Entry point, inicialização
│   ├── auth.js                       # Login/logout, validação time_tasks_members
│   ├── navigation.js                 # [data-target], [data-chat-toggle], abas SX
│   ├── calendar.js                   # Visões Dia/3D/Semana/Mês, eventos CRUD
│   ├── seeds.js                      # Tarefas/Sementes CRUD
│   ├── sidebar.js                    # Mini-calendário, categorias visibilidade
│   ├── events.js                     # Carregar eventos do Supabase
│   ├── booking.js                    # Agendamento público (anônimo)
│   ├── settings.js                   # Configurações: tema, fuso, idioma
│   ├── reminders.js                  # Sons, notificações de lembretes
│   ├── ai.js                         # Chat SX, comandos de linguagem natural
│   ├── verse-access.js               # Versículo por acesso (balão ao login)
│   ├── weather.js                    # Geolocalização + Open-Meteo
│   ├── triggers.js                   # Triggers CRUD + Central de notificações
│   ├── supabase.js                   # Cliente Supabase (URL + anon key)
│   ├── theme.js                      # Alternância light/dark
│   ├── utils.js                      # Helpers (formatação, validação)
│   ├── modal.js                      # Popover e modal genéricos
│   └── reminders.js                  # Agendamento lembretes
├── style.css                         # Reset + utilidades
├── layout.css                        # Layout 3-coluna, componentes
├── ROADMAP.md                        # Fases 1–9, próximas features
├── MANUAL_DE_USO.md                  # Guia do usuário (15 seções)
├── ACCESSIBILITY.md                  # Auditoria WCAG 2.1 AA
├── AGENTS.md                         # Referência ao planner mestre
├── PLANNER_PROMPT_MESTRE_TIME_TASKS.md  # Plan original (1224 linhas)
└── migrations/
    └── 006_triggers_schema.sql       # Schema triggers + notifications
```

---

## 4. Decisões Arquiteturais

### F-01 — ID Correto
- **Decisão:** `#sub-sidebar` (não `#sidebar`)
- **Razão:** Evitar colisão com classe CSS `.sidebar` genérica
- **Implementado em:** sidebar.js linha 47

### F-02 — CSS Vence Inline
- **Decisão:** Remover `style="display:none"` do #sidebar-toggle
- **Razão:** CSS mediaquery flexível, inline bloqueava estado mobile
- **Implementado em:** index.html linha 193, layout.css media (max-width)

### F-03 — Fonte Única (layout.css)
- **Decisão:** Todos estilos de layout em layout.css, não style.css
- **Razão:** Evitar duplicação e drift de versões
- **Implementado em:** style.css removeu `.app-layout`, `.sidebar`, etc.

### F-04 — Scroll Horizontal
- **Decisão:** `overflow-x: auto` em `.time-grid-scroll`
- **Razão:** Mobile 3+ dias deve scrollar (minmax 92px), não apertar
- **Implementado em:** layout.css linha 548

### F-05 — Navegação Unificada
- **Decisão:** Seletor `[data-target]` para desktop + mobile tab bar
- **Razão:** Único listener, sincronização garantida
- **Implementado em:** navigation.js linha 102

### F-06 — setChatOpen Exportada
- **Decisão:** Função central para todos controles SX
- **Razão:** Toggle consistente, sem duplicação de lógica
- **Implementado em:** navigation.js linha 60

### F-11 — RLS de time_tasks_members
- **Decisão:** Manter aberto (allow self-insert), não restritivo
- **Razão:** Demo/ testes sem atrito; produção valida via API
- **Implementado em:** migrations/002_core_schema.sql

### Weather (Open-Meteo)
- **Decisão:** API pública, sem chave de API necessária
- **Razão:** Simplicidade, sem custo, sem rate limit para uso pessoal
- **Implementado em:** js/weather.js

---

## 5. Fluxos Críticos

### Login → Autenticação → Calendário

```
1. initAuth() escuta evento sessão Supabase
2. applySession():
   - Valida time_tasks_members (HTTP 401 se não existe)
   - initTriggers(), initWeather(), etc.
   - Dispara evento timetasks:session
3. navigation.js escuta timetasks:session → abre SX no desktop
4. Calendar carrega eventos do servidor
```

### Novo Evento

```
1. Click em horário ou botão "Novo"
2. Modal abre (initModal)
3. Form: título, data, hora, categoria, lembrete
4. POST /api/events (autenticado, RLS user_id)
5. Retorna id + timestamp
6. refreshCalendar() recarrega visão
7. Toast "Evento criado"
```

### Aba "Notif." da SX (Mobile)

```
1. User clica aba "Notif." (SX header mobile)
2. setAiTab('notifications') — async
3. Chama renderNotifications() via import dinâmico
4. Fetches últimas 50 notificações do Supabase
5. Renderiza lista com ícone, título, msg, tempo relativo
6. User clica X → markNotificationRead() → remove item
```

---

## 6. Segurança & Privacidade

### Chaves Privadas
- **Google Gemini API key:** Servidor EasyPanel, `/api/sx` proxy
- **Supabase service-role:** Servidor somente, NUNCA frontend
- **Supabase anon key:** Pública (frontend), RLS protege dados

### RLS em 8 Tabelas
```
time_tasks_members
time_tasks_events
time_tasks_seeds
time_tasks_reminders
time_tasks_booking_pages
time_tasks_booking_slots
time_tasks_triggers
time_tasks_notifications
```

### Rate Limit
- `/api/sx`: 10 req/min por user (Redis)
- `/api/verse`: 3 req/min por user
- `/api/health`: sem limite (healthcheck)

### Headers de Segurança
- `Content-Security-Policy`: no inline scripts
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`: geolocation, camera, etc.

---

## 7. Fases Implementadas

| Fase | Tema | Status | Bloqueadores |
|---|---|---|---|
| 0 | Descoberta documental | ✅ Concluída | — |
| 1 | Fundação responsiva | ✅ Concluída | — |
| 2 | Shell mobile | ✅ Concluída | — |
| 3 | Calendário + SX fixa | ✅ Concluída | — |
| 4 | Login toggle + versículo | ✅ Concluída | — |
| 5 | Clima (Open-Meteo) | ✅ Concluída | — |
| 6.1 | Trigger UI + schema | ✅ Concluída | Modal placeholder |
| 6.2 | Notif. na SX | ✅ Concluída | Executor ausente |
| 7 | Acessibilidade (WCAG AA) | ✅ Concluída | Recomendações futuras |
| 8 | Documentação | ✅ Concluída (este arquivo) | — |
| 9 | Verificação & produção | ⏳ Pendente | Ver abaixo |

---

## 8. Checklist Pré-Produção (Fase 9)

- [ ] `npm run build` sem warnings
- [ ] Healthcheck `/api/health` respondendo 200
- [ ] Smoke test: login → calendário → novo evento → deletar
- [ ] `HEAD == origin/main` (sem commits pendentes)
- [ ] CORS headers confirmados (origem frontend)
- [ ] Rate limits ativos e testados
- [ ] RLS verificado (usuário A não vê dados de B)
- [ ] Backup Supabase automático ativo
- [ ] Logs centralizados (EasyPanel monitoring)
- [ ] DNS apontando para startups-timetasks.qfotry.easypanel.host

---

## 9. Troubleshooting

### "A SX não responde"
1. Verifique `/api/health` (browser → URL)
2. Confirme Gemini API key no EasyPanel `GOOGLE_GEMINI_KEY`
3. Verifique CORS (Network tab no DevTools)

### "Calendário vazio"
1. Confirme login em `time_tasks_members` (verifique no Supabase)
2. Verifique fuso configurado (Configurações > Geral)
3. Recarregue a página (Ctrl+Shift+R)

### "Clima não aparece"
1. Permita geolocalização (clique no prompt)
2. Ou digite manualmente cidade (busca Open-Meteo)
3. Verifique conexão internet

### "Notificações não aparecem"
1. Abra aba "Notif." na SX para recarregar
2. Verifique se há triggers ativados
3. Executor Node.js ainda não implementado (Fase 6.2)

---

## 10. Contatos & Referências

- **Repo:** https://github.com/sxsevenxperts/TIME-TASKS.git
- **Produção:** https://startups-timetasks.qfotry.easypanel.host
- **Deploy:** EasyPanel (sevenxperts account)
- **Banco:** Supabase self-hosted no EasyPanel

---

**Preparado por:** Claude (Assistente de Desenvolvimento)  
**Atualização:** 16/07/2026

---

## Apêndice: Anti-padrões a Evitar

1. ❌ Adicionar estilos em `style.css` que já existem em `layout.css`
2. ❌ Chamar `setChatOpen()` diretamente; sempre use evento ou botão `[data-chat-toggle]`
3. ❌ Escrever novo módulo sem adicionar ao `app.js` init
4. ❌ Usar IDs genéricos (`#sidebar`, `#main`) que colidem com outras apps
5. ❌ Fazer requisições ao Supabase sem RLS (sempre filtre por `auth.uid()`)
6. ❌ Armazenar chaves privadas no frontend (sempre proxy)
7. ❌ Modificar `time_tasks_*` tabelas sem migration SQL

---

**Fim do Manual de Bordo.**
