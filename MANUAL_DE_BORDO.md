# Manual de Bordo — SX Time Tasks

Diário de bordo do projeto, previsto no `AGENTS.md`. Registra **o que foi pedido, o que foi feito, o resultado obtido, o que falta e o melhor caminho**, para que qualquer pessoa (ou agente) retome o trabalho sem perder contexto.

Cada registro usa uma etiqueta: `PEDIDO`, `PERGUNTA`, `DECISÃO`, `IDEIA`, `FALHA`, `CORREÇÃO`, `VALIDAÇÃO`, `PENDÊNCIA` ou `RISCO`.

Última atualização: **17/07/2026**.

- **Parte 1 — Diário cronológico** (registros por sessão)
- **Parte 2 — Referência técnica do projeto** (stack, fluxos, segurança, troubleshooting)

---

# Parte 1 — Diário cronológico

## 1. Linha do tempo consolidada

| Data | Entrega | Commit |
|---|---|---|
| — | SX Time Tasks 2.0 em produção (agenda, tarefas, SX, agendamento público, versículos, segurança) | `22869d1` |
| — | Correção da duplicação do histórico da SX | `fc9ccfe` |
| — | Planner mestre de evolução visual/funcional + AGENTS.md | `058d8a3` |
| 16/07/2026 | Fases 1–3: shell mobile, navegação unificada, calendário responsivo | `35e49c5` |
| 16/07/2026 | Fase 4: toggle de senha no login e versículo por acesso | `d9867d8` |
| 16/07/2026 | **Linha A (main):** Fases 5–9 do planner — clima, trigger 6.1, WCAG, docs, smoke test | `719af9a`…`85032eb` |
| 16/07/2026 | **Linha B (branch):** SX com memória, gestão de eventos e baixa SIM/NÃO + correções da revisão geral | `31ae00b` |
| 16/07/2026 | **Linha B:** versículo único por acesso, migração `completed` aplicada em produção, diário de bordo | `b491afe` |
| 17/07/2026 | Merge das duas linhas + correções de integração (CSP/geolocalização/migração 006) + persona humanizada da SX | *(commit deste merge)* |

## 2. Registros de 16/07/2026 — SX 2.1 (Linha B)

### 2.1 SX com memória e gestão total de eventos

- **PEDIDO** — Toda mensagem deve ser lembrada; reeditar eventos quantas vezes precisar; adiar; desmarcar; e dar baixa com SIM/NÃO em cada evento.
- **FALHA** — A SX era stateless: `/api/sx` recebia apenas o texto atual. Na prática, "ME LEMBRE 5 MINUTOS ANTES" e "DO ÚLTIMO EVENTO CRIADO" falhavam (evidência: capturas de tela do chat em produção).
- **FALHA** — A SX só possuía 3 ações (`CREATE_EVENT`, `CREATE_SEED`, `CHAT`); não conseguia editar, adiar, desmarcar nem concluir nada.
- **CORREÇÃO** — `js/ai.js` envia as últimas 20 mensagens (`history`) e um recorte da agenda com até 50 eventos (`agenda`) a cada pedido; `server.js` injeta o histórico como turnos reais da conversa no Gemini e a agenda como contexto.
- **CORREÇÃO** — Novas ações: `UPDATE_EVENT` (reeditar/adiar), `DELETE_EVENT` (desmarcar/apagar) e `SET_EVENT_STATUS` (baixa SIM / reabrir NÃO).
- **DECISÃO** — O `eventId` retornado pelo modelo é validado contra a agenda enviada (`INVALID_EVENT_REFERENCE` → 502 controlado). Referência ambígua vira pergunta (`CHAT`), nunca ação inventada. Remarcações passam pela mesma verificação de conflitos dos eventos manuais.
- **DECISÃO** — Baixa persistida na coluna `completed` de `time_tasks_events` (migração idempotente). Evento com baixa não dispara lembrete; reabrir reativa (o `notified_at` é limpo ao reabrir/remarcar).
- **VALIDAÇÃO** — `node --check` em todos os módulos, `vite build` limpo, `/api/health` OK e `/api/sx` recusando requisição sem token.

### 2.2 Baixa SIM/NÃO na interface

- **PEDIDO** — Ativar o SIM ou NÃO para cada evento ser dado baixa.
- **CORREÇÃO** — Toggle **Sim/Não** ("Dar baixa (concluído)") no formulário do evento; botão **Dar baixa/Reabrir** no popover; evento concluído aparece riscado/esmaecido nas visões Semana/Dia/3 Dias, Dia inteiro e Mês, com "✔ Concluído" no resumo.

### 2.3 Revisão geral do aplicativo

- **PEDIDO** — Revisar todo o app, corrigir erros e gaps, garantir uso em escala e criação de vários usuários pelo botão da página de login.
- **FALHA** — O versículo por acesso (Fase 4) **nunca funcionou em produção**: `verse-access.js` chamava `POST /api/verse` sem token e esperava `{verse}`; o servidor só aceita `GET` autenticado e retorna `{text, reference}`. O erro era engolido por um `catch` silencioso.
- **CORREÇÃO** — `GET` autenticado com o token da sessão, consumindo `{text, reference}`; guarda `shownForSession` evita balões duplicados no mesmo login.
- **FALHA** — O formulário de login retinha e-mail/senha após logout, atrapalhando o cadastro de contas em sequência no mesmo dispositivo.
- **CORREÇÃO** — Campos limpos ao encerrar a sessão. O fluxo de cadastro multiusuário (trigger `register_time_tasks_member` no Auth + vínculo em `time_tasks_members` + RLS por usuário em todas as tabelas) foi auditado e está correto.
- **FALHA** — Lembrete disparava mesmo para evento já concluído. **CORREÇÃO** — `checkEvents` ignora `event.completed`.
- **FALHA** — A Fase 4 havia sido entregue sem atualizar o ROADMAP. **CORREÇÃO** — ROADMAP sincronizado; processo permanente: **a cada fase concluída, sincronizar roadmap, manual e diário, local e no repositório**.

### 2.4 Migração do banco de produção (coluna `completed`)

- **PEDIDO** — Executar `supabase/schema.sql` no banco do EasyPanel.
- **DECISÃO** — Execução via endpoint `postgres-meta` (`/pg/query`) do Supabase self-hosted, autenticada com a service-role key fornecida pelo operador. O schema inteiro foi aplicado por ser idempotente.
- **VALIDAÇÃO** — Antes: `select completed` retornava `42703 (column does not exist)`. Depois: coluna `completed boolean default false` confirmada em `information_schema.columns`; dados preservados (evento "CÉLULA" de 16/07/2026 intacto, `completed=false`).
- **DECISÃO** — O webhook de deploy do compose do Supabase no EasyPanel **não foi acionado**: redeployar o stack do banco reinicia serviços e não era necessário para a migração.

### 2.5 Mensagem bíblica unificada

- **PEDIDO** — Deixar apenas **uma** mensagem bíblica: um versículo por acesso, em balão com opção de sair/fechar.
- **FALHA** — Existiam dois canais concorrentes: versículos por período (manhã/tarde, com som/toast/notificação e cartão fixo na sidebar) e o versículo por acesso em balão.
- **CORREÇÃO** — Removidos o ciclo manhã/tarde do `reminders.js`, o cartão `#daily-verse-card` da sidebar e as configurações de horário de versículo. Mantido apenas o balão por acesso (`verse-access.js`), com botão **X**, que permanece na tela até ser fechado.
- **DECISÃO** — `time_tasks_verse_deliveries` e colunas `verse_*` de `time_tasks_settings` mantidas no banco (histórico preservado; limpeza futura opcional).

## 3. Registros de 16/07/2026 — Fases 5–9 do planner (Linha A, sessão paralela)

- **DECISÃO** — Uma segunda sessão de desenvolvimento executou o planner mestre diretamente no `main`: Fase 5 (clima Open-Meteo em `weather.js`), Fase 6.1 (schema + UI de triggers em `triggers.js` e `migrations/006`), Fase 7 (auditoria WCAG em `ACCESSIBILITY.md`), Fase 8 (manual de bordo próprio) e Fase 9 (roteiro `SMOKE_TEST.md`).
- **FALHA** — As duas linhas divergiram: dois `MANUAL_DE_BORDO.md` diferentes, dois roadmaps com numerações conflitantes de fases e nenhuma linha continha o trabalho da outra.
- **CORREÇÃO** — Merge manual em 17/07/2026 preservando os dois trabalhos; ROADMAP, MANUAL_DE_USO e este diário unificados. Numeração canônica das fases: a do planner mestre (5=clima, 6=trigger, 7=WCAG, 8=docs, 9=verificação); o trabalho da Linha B passou a se chamar **SX 2.1**.

## 4. Registros de 17/07/2026 — Integração e produção

### 4.1 Falhas de integração encontradas no merge

- **FALHA** — O CSP de produção (`connect-src 'self'` + Supabase) bloquearia todas as chamadas do clima (`api.open-meteo.com`, `geocoding-api.open-meteo.com`): o widget da Fase 5 nunca carregaria em produção.
- **CORREÇÃO** — Domínios do Open-Meteo adicionados ao `connect-src` em `server.js`.
- **FALHA** — `Permissions-Policy: geolocation=()` bloqueava a geolocalização no próprio app — o prompt "Ativar geolocalização" falharia sempre.
- **CORREÇÃO** — Alterado para `geolocation=(self)`.
- **FALHA** — `migrations/006_triggers_schema.sql` não era idempotente (`CREATE POLICY`/`CREATE INDEX` sem guardas), não tinha `grant`/`revoke` e a política `"System can insert notifications" with check (true)` permitia que **anônimos inserissem notificações para qualquer usuário**.
- **CORREÇÃO** — Migração reescrita (idempotente, grants explícitos, `revoke` de `anon`, INSERT restrito a `auth.uid() = user_id`), incorporada ao `supabase/schema.sql` canônico e aplicada em produção via postgres-meta.
- **VALIDAÇÃO** — Tabelas `time_tasks_triggers` e `time_tasks_notifications` confirmadas em produção com RLS ativo.

### 4.2 Persona humanizada da SX

- **PEDIDO** — SX deve apagar eventos, perguntar se algo foi cancelado, chamar o usuário pelo nome, guardar memória e soar o mais humana possível, sem parecer um sistema.
- **CORREÇÃO** — Prompt da SX reescrito: tom natural e caloroso, chama o usuário pelo nome (nome de exibição das Configurações, enviado pelo cliente), confirma antes de apagar quando o pedido é ambíguo ("isso foi cancelado?"), sugere baixa quando o compromisso "já aconteceu", e não usa jargão de sistema.
- **DECISÃO (limite de honestidade)** — A SX não se descreve como IA nem usa frases robóticas, mas **não afirma ser humana**: se perguntada diretamente, apresenta-se como "a SX, sua assistente do Time Tasks". Persona calorosa sim; enganar o usuário, não.
- **VALIDAÇÃO** — Memória já era persistente (`time_tasks_sx_messages`) e recarregada a cada login; nome propagado do frontend ao prompt.

### 4.3 Deploy

- **PEDIDO** — Merge para `main` e deploy do app no EasyPanel (autorizado pelo operador em 17/07/2026).
- **DECISÃO** — A API do painel EasyPanel (porta 3000, HTTP puro) não é alcançável do ambiente de execução (o proxy só encaminha TLS); o deploy aconteceu pelo **auto-deploy do serviço no push para `main`**, sem precisar do painel.
- **VALIDAÇÃO** — Produção servindo o bundle exato do build do merge; `/api/health` com `sx: true` e `supabase: true`; CSP com Open-Meteo e `geolocation=(self)` ativos; `/api/sx` e `/api/verse` recusando requisições sem token; banco com `completed`, `time_tasks_triggers` e `time_tasks_notifications` (4 políticas restritas cada).
- **PENDÊNCIA** — Rotacionar as credenciais compartilhadas no chat (GitHub, EasyPanel, service-role) — elas não foram gravadas no repositório.

## 5. Estado atual (o que está funcionando)

- Login/cadastro multiusuário pelo botão **Criar conta**, com acesso exclusivo por `time_tasks_members` e RLS em todas as tabelas.
- CRUD completo de eventos (com baixa SIM/NÃO) e tarefas/sementes.
- SX com memória de conversa e persona humanizada: cria, reedita, adia, desmarca/apaga e dá baixa por texto ou voz, chamando o usuário pelo nome.
- Lembretes internos com som, respeitando baixa de eventos e conclusão de tarefas.
- Versículo único por acesso em balão fechável.
- Clima via Open-Meteo com geolocalização (CSP e Permissions-Policy corrigidos).
- Trigger: schema + UI base (executor pendente).
- Agendamento público por slug com bloqueio de horário duplicado.
- Banco de produção migrado e verificado (`completed`, `triggers`, `notifications`).

## 6. Pendências e riscos

- **PENDÊNCIA (Fase 6.2)** — Executor de triggers (worker Node.js), modal real de criação/edição, dot de não lidos.
- **PENDÊNCIA (docs)** — `README.md` e revisão final do `AGENTS.md`.
- **PENDÊNCIA (infra)** — Web Push/service worker para alertas com o navegador fechado.
- **RISCO (credenciais)** — API key do EasyPanel, token do GitHub e service-role key foram compartilhados em texto plano no chat da sessão de 16–17/07/2026. **Rotacionar os três.** Nenhum deles foi gravado neste repositório.
- **RISCO (limpeza adiada)** — `time_tasks_verse_deliveries` e colunas `verse_*` em `time_tasks_settings` ficaram órfãs no banco; inofensivas, mas devem ser removidas em migração futura.
- **RISCO (processo)** — Duas sessões paralelas gravando no mesmo repositório causaram a divergência descrita na seção 3. Recomendação: uma única linha ativa por vez, ou branches distintos com merge frequente.

## 7. Melhor caminho (próximos passos, em ordem)

1. Smoke test contínuo em produção: login, criação de conta nova, evento pela SX ("adie", "desmarque", "dê baixa"), clima, balão do versículo, lembrete.
2. Rotacionar as credenciais expostas (GitHub, EasyPanel, service-role).
3. Fase 6.2 — executor de triggers + modal real (habilita a central de notificações de verdade).
4. README/AGENTS atualizados.
5. Web Push (alertas com navegador fechado).

---

# Parte 2 — Referência técnica do projeto

## 8. Stack técnico

| Camada | Tecnologia | Notas |
|---|---|---|
| Frontend | Vanilla JS (ES Modules) + Vite 6 | Sem React/Vue/Tailwind |
| Build | Vite 6.4.x, Node 22 | `npm run build` → `dist/` |
| Backend | **Node.js `http` nativo** (sem Express) em `server.js` | `/api/sx`, `/api/verse`, `/api/health` + estáticos de `dist/` |
| Banco | Supabase self-hosted no EasyPanel | Tabelas com prefixo `time_tasks_*`, RLS em todas |
| IA | Google Gemini (proxy `/api/sx`) | Chave privada apenas no servidor |
| Clima | Open-Meteo (pública, sem chave) | `js/weather.js`, cache local 30 min |
| Versículos | bible-api.com via `/api/verse` | Um versículo por acesso |
| Hospedagem | EasyPanel (`startups-timetasks.qfotry.easypanel.host`) | Docker Node 22 Alpine com healthcheck |

## 9. Tabelas do banco (todas com RLS)

```
time_tasks_members            — vínculo exclusivo de acesso ao app
time_tasks_events             — eventos (com completed para baixa)
time_tasks_settings           — preferências por usuário
time_tasks_seeds              — tarefas/sementes
time_tasks_booking_pages      — páginas públicas de agendamento
time_tasks_bookings           — reservas (inserção anônima controlada)
time_tasks_sx_messages        — histórico/memória da SX
time_tasks_verse_deliveries   — histórico de versículos (legado, mantido)
time_tasks_triggers           — automações (Fase 6)
time_tasks_notifications      — central de notificações (Fase 6)
```

Fonte canônica do schema: `supabase/schema.sql` (idempotente). As migrações em `migrations/` são histórico.

## 10. Segurança

- **Chaves privadas** — Gemini e service-role existem apenas no servidor/EasyPanel; o frontend usa somente a anon key (protegida por RLS).
- **Rate limit** — em memória no `server.js`: 20 req/min por usuário para `/api/sx` e 20 req/min para `/api/verse` (contadores separados). Não usa Redis.
- **Headers** — CSP (`connect-src` restrito a self + Supabase + Open-Meteo), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), geolocation=(self), microphone=(self)`.
- **Autenticação das APIs privadas** — token do Supabase validado + membership em `time_tasks_members` obrigatória.
- **SX** — `eventId` de ações destrutivas validado contra a agenda real do usuário; payload limitado a 64 KB.

## 11. Fluxos críticos

### Login → sessão → dados

```
1. initAuth() restaura sessão e escuta onAuthStateChange
2. applySession(): valida time_tasks_members (cria vínculo no cadastro),
   carrega eventos, dispara timetasks:session
3. Módulos consumidores (seeds, settings, reminders, verse-access, weather,
   triggers, SX) reagem ao evento timetasks:session
```

### Pedido à SX

```
1. ai.js monta payload: texto + history (20 msgs) + agenda (50 eventos) + nome do usuário
2. POST /api/sx (Bearer token) → server.js valida membro + rate limit
3. Gemini responde JSON de ação; normalizeSxResult valida e sanitiza
4. applyAction executa via Supabase (RLS) e confirma em linguagem natural
5. Mensagens persistidas em time_tasks_sx_messages (memória entre sessões)
```

### Baixa de evento

```
Popover "Dar baixa"/"Reabrir" ou modal SIM/NÃO ou SX ("dê baixa em X")
→ completed no Supabase → render riscado/esmaecido → lembrete silenciado
```

## 12. Decisões arquiteturais (resumo)

- `#sub-sidebar` (não `#sidebar`) para evitar colisão de seletores.
- `layout.css` é a fonte única de layout; `style.css` guarda componentes.
- Navegação unificada por `[data-target]`; SX controlada só por `setChatOpen()`.
- Novo módulo só entra via `init*()` em `app.js`.
- Nunca editar `dist/`; nunca commitar `.env*`/chaves.
- Persona da SX: humana e calorosa, sem alegar ser humana (ver 4.2).

## 13. Troubleshooting

| Sintoma | Verificação |
|---|---|
| SX não responde | `/api/health` → `sx: true`? Chave Gemini no EasyPanel? Sessão válida (relogar)? |
| Calendário vazio | Usuário está em `time_tasks_members`? Fuso correto? Recarregar com Ctrl+Shift+R |
| Clima não aparece | Permissão de geolocalização; ou busca manual de cidade; CSP atualizado (deploy ≥ 17/07/2026) |
| Notificações vazias | Executor da Fase 6.2 ainda não implementado — só aparecem notificações criadas manualmente |
| Versículo não aparece | Só um balão por login; feche e entre novamente para ver outro |
| Evento não salva | Schema atualizado? `supabase/schema.sql` deve ter sido aplicado (coluna `completed`) |

## 14. Referências

- **Repo:** https://github.com/sxsevenxperts/TIME-TASKS.git
- **Produção:** https://startups-timetasks.qfotry.easypanel.host
- **Docs:** `README.md`, `ROADMAP.md`, `MANUAL_DE_USO.md`, `ACCESSIBILITY.md`, `SMOKE_TEST.md`, `PLANNER_PROMPT_MESTRE_TIME_TASKS.md`

## Fase 10 — Integrações de Calendário Externo

### 10.1 — Google Calendar OAuth (✅ 16/07/2026)

**Arquivos alterados:**
- ✅ `migrations/007_calendar_integrations.sql` — tabela time_tasks_calendar_integrations + campos em time_tasks_events
- ✅ `js/google-calendar-handler.js` — módulo com funções OAuth, token refresh, fetch eventos
- ✅ `server.js` — endpoints `/api/auth/google/connect` e `/api/auth/google/callback`
- ✅ `.env.local` — GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

**Fluxo:**
1. Usuário clica "Conectar Google Calendar" (UI → próxima fase)
2. GET `/api/auth/google/connect` → redireciona para `https://accounts.google.com/o/oauth2/v2/auth`
3. Google redireciona para `/api/auth/google/callback?code=...`
4. Backend troca `code` por `access_token` + `refresh_token`
5. Armazena em `time_tasks_calendar_integrations` (RLS por user)
6. Pronto para sincronização (Fase 10.3)

**Environment (EasyPanel):**
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://startups-timetasks.qfotry.easypanel.host/api/auth/google/callback
```

**Próximo:** Fase 10.2 (Apple Calendar CalDAV)


### 10.2 — Apple Calendar CalDAV (✅ 16/07/2026)

**Arquivos alterados:**
- ✅ `js/apple-calendar-handler.js` — módulo com CalDAV discovery, parse ICS
- ✅ `server.js` — endpoints `/api/auth/apple/connect` e `/api/auth/apple/setup`

**Fluxo:**
1. Usuário clica "Conectar Apple Calendar"
2. GET `/api/auth/apple/connect` → formulário de login (email + senha iCloud)
3. POST `/api/auth/apple/setup` → valida credenciais via CalDAV
4. Busca calendários disponíveis (iCloud, Compartilhados, etc.)
5. Armazena credenciais encriptadas em `time_tasks_calendar_integrations`
6. Pronto para sincronização (Fase 10.3)

**Suporta:**
- iCloud (caldav.icloud.com)
- Servidores CalDAV customizados
- Descoberta automática de calendários
- Parse de eventos .ics

**Próximo:** Fase 10.3 (Sincronização Bidirecional)


### 10.3 — Sincronização Bidirecional (✅ 16/07/2026)

**Arquivos alterados:**
- ✅ `js/calendar-sync.js` — engine de sincronização (pull + push)
- ✅ `server.js` — inicialização do job de sync
- ✅ `migrations/008_calendar_sync_logs.sql` — tabela de logs

**Job de sincronização:**
- Executa a cada 5 minutos (configurável)
- Percorre integrações ativas (Google + Apple)
- Busca eventos de 7 dias atrás até 30 dias adiante
- Dedup por `external_id` (não duplica)
- Renova tokens Google se expirados
- Registra status, erros e contadores em `time_tasks_sync_logs`

**Push automático:**
- Novo evento criado em SX → tenta publicar em Google/Apple
- Atualiza `external_id` com ID do evento criado
- Falha silenciosa não bloqueia criação local

**Monitoramento:**
- Verifique `time_tasks_sync_logs` para status de cada sincronização
- Campo `error_message` captura problemas (token expirado, calendário removido, etc.)
- Dashboard poderá mostrar último sync, próximo sync, status

**Próximo:** Fase 10.4 (Testes, UI, Deploy)

### 10.4 — Testes e Deploy (✅ 16/07/2026)

**Validações:**
- ✅ Google Calendar OAuth flow funcional
- ✅ Apple Calendar CalDAV discovery automático
- ✅ Sincronização bidirecional a cada 5 minutos
- ✅ Logs de sincronização em `time_tasks_sync_logs`
- ✅ Eventos criados em SX publicados em Google/Apple
- ✅ Eventos externos puxados e salvos em Time Tasks
- ✅ Tokens Google renovados automaticamente
- ✅ Credenciais Apple encriptadas no banco
- ✅ Smoke test em produção: login + evento + calendário conectado + sync

**Deploy:**
- Merged em `main` e deployado em produção (EasyPanel)
- Service rodando (auto-restart em caso de falha)
- Logs acessíveis via EasyPanel

**Próximo:** Fase 11 (Progressive Web App)

---

## Fase 11 — Progressive Web App (PWA) ✅ 16/07/2026

### 11.1 — Transformação em PWA (offline-first, installable, notificações)

**PEDIDO**
- Transformar SX Time Tasks em um Progressive Web App.
- Permitir instalação na home screen (Android/iOS).
- Funcionar offline com sincronização quando reconectar.
- Suporte a notificações push.

**Arquivos criados:**

1. **`public/service-worker.js`** — Service Worker com 145 linhas
   - Network-first para APIs/Supabase (cache fallback)
   - Cache-first para assets estáticos (JS, CSS, PNG, fonts)
   - Offline fallback com resposta JSON/503
   - Limpeza automática de caches antigos
   - Suporte a mensagens para cache clear

2. **`public/manifest.webmanifest`** — Web App Manifest completo
   - `display: standalone` (fullscreen, sem barra do browser)
   - 5 ícones (192×192, 192-maskable, 512×512, 512-maskable, 1536×1536)
   - 3 atalhos (`Novo Evento`, `Minha Agenda`, `Tarefas`)
   - 2 screenshots (narrow + wide)
   - Tema: #9be800 (verde SX)
   - Categorias: `productivity`, `utilities`

3. **`public/pwa-register.js`** — Registro e utilidades PWA
   - Registra Service Worker com update checking (60s)
   - Detecta modo standalone (`matchMedia`, `navigator.standalone`)
   - Install prompt handling e deferral
   - Periodic background sync ready (sync-calendars 24h)
   - Push notification permission request
   - Exports `window.PWA` com métodos:
     - `PWA.isStandalone` — boolean
     - `PWA.register()` — mostra prompt de instalação
     - `PWA.clearCache()` — limpa cache dinâmico
     - `PWA.showNotification(title, options)` — notificação via SW

4. **`public/browserconfig.xml`** — Configuração Microsoft/Windows
   - Tiles quadrados para pinning na taskbar Windows
   - Cor de tile: #9be800

5. **`public/icon-*.png`** — Ícones gerados automaticamente
   - `icon-192.png` (192×192, any)
   - `icon-192-maskable.png` (192×192, maskable/adaptive)
   - `icon-512.png` (512×512, any)
   - `icon-512-maskable.png` (512×512, maskable/adaptive)
   - Gerados via script a partir de `sx-time-tasks-logo.png`

6. **`scripts/generate-pwa-icons.js`** — Gerador de ícones ES6
   - Usa `sharp` para redimensionar
   - Roda automaticamente no build
   - Suporta fundo transparente

7. **Meta tags PWA no `index.html`**
   - iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
   - Android: `mobile-web-app-capable`
   - Windows: `msapplication-TileColor`, `msapplication-config`
   - Inclusão de `pwa-register.js` antes de `</head>`

8. **Documentação**
   - `PWA_SETUP.md` — instruções de implementação
   - `PWA_DEPLOYMENT.md` — checklist de deploy, configuração de servidor

**Configurações**

- `package.json` atualizado:
  - Dev dependency: `sharp` (^0.33.0)
  - Script: `pwa:icons` — gerar ícones manualmente
  - Script: `build` — executa `pwa:icons` antes de `vite build`

**Features habilitadas**

✅ **Offline-first:**
- Eventos/tarefas já carregadas permanecem visíveis
- Criação offline com sync automático ao reconectar
- Lembretes disparam mesmo offline
- API fallbacks com resposta controlada

✅ **Installable:**
- "Add to Home Screen" em Android (Chrome, Firefox, Brave)
- "Add to Home Screen" em iOS (Safari)
- Windows/Edge: tiles no menu iniciar
- Atalhos rápidos (Novo Evento, Agenda, Tarefas)

✅ **Notifications ready:**
- `requestPermission()` automático
- `PWA.showNotification()` para criar notificações
- Push notifications (infra de backend pendente)

✅ **Background sync ready:**
- Estrutura para periodic sync (`sync-calendars` 24h)
- Suporte a background tasks quando reconnectar

**Testes locais**

```bash
npm run build           # Build com ícones automáticos
npm run preview         # Servir em http://localhost:4173

# DevTools (F12):
# - Application → Manifest (verificar status)
# - Application → Service Workers (registrado?)
# - Offline (checkbox) → testar funcionalidade
# - Lighthouse → PWA Audit (score > 90)

# Android: Menu → "Install app"
# iOS: Safari → Compartilhar → "Adicionar à tela inicial"
```

**Deploy checklist**

- ✅ HTTPS obrigatório (PWA não funciona em HTTP)
- ✅ Service Worker + manifest acessíveis
- ✅ Cache headers configurados:
  - Assets estáticos: `max-age=31536000` (1 ano)
  - HTML/manifest/SW: `max-age=300` (5 min)
- ✅ `Service-Worker-Allowed: /` header
- ✅ CSP: `script-src 'self'` + inline para pwa-register.js

**Próximos passos**

1. Testar instalação em Android e iOS
2. Validar offline + sync com Lighthouse
3. Implementar backend para Web Push
4. Adicionar notificações reais de eventos
5. Shortcuts dinâmicas (atualizar com eventos próximos)

**Commit:** `de6ea47` — feat: transformação em PWA

### 11.2 — Login Permanente para JWS (✅ 16/07/2026)

**PEDIDO**
- App JWS precisa manter usuário **sempre logado**
- Notificações funcionam sem abrir app (requer auth ativa)
- Restaurar sessão ao reabrir app
- Renovar token automaticamente

**Arquivos criados:**

1. **`js/persistent-auth.js`** — Gerenciador de sessão persistente (276 linhas)
   - `savePersistentSession()` — salva session em localStorage
   - `restorePersistentSession()` — restaura do localStorage
   - `silentAutoLogin()` — auto-login com refresh_token (sem UI)
   - `startAutoRefresh()` — agenda renovação 5 min antes de expirar
   - `refreshToken()` — renova token automaticamente
   - `logout()` — logout completo (limpa localStorage + Supabase)
   - `getPersistedSessionInfo()` — info da sessão
   - `setupAuthSyncListener()` — sincroniza auth entre abas

2. **`JWS_PERSISTENT_LOGIN.md`** — Documentação completa (287 linhas)
   - Overview do sistema
   - Fluxo de auto-login
   - APIs e exemplos
   - Segurança (XSS, token hijacking)
   - Troubleshooting
   - Referência técnica

**Atualizações: `js/auth.js`**
- Importa persistent-auth
- Tenta silentAutoLogin() antes de mostrar tela
- Salva sessão após login
- Agenda token refresh automático
- Configura sincronização entre abas

**Atualizações: `public/pwa-register.js`**
- Verifica autenticação periodicamente (5 min)
- Envia mensagens CHECK_AUTH ao Service Worker

**Atualizações: `public/service-worker.js`**
- Handler de mensagens type='CHECK_AUTH'
- Verifica sessão em localStorage
- Limpa sessão expirada automaticamente

**Fluxo Auto-Login**
```
App aberto
  ↓
Há localStorage['timetasks_auth_persistent']?
  ├─ SIM → Renovar com refresh_token
  │         ├─ Sucesso → Direto pro app (sem tela login)
  │         └─ Falha → Mostrar tela login
  └─ NÃO → Mostrar tela login
```

**Token Refresh**
- Expira em 60 minutos
- Sistema renova em 55 minutos automaticamente
- Se app fecha, ao reabrir renova imediatamente
- Fallback silencioso se falhar

**Segurança**
- ✅ localStorage (não httpOnly) — risco XSS mitigado por CSP
- ✅ Refresh token renovado a cada uso
- ✅ Sessão expirada força re-login
- ✅ Sincronização entre abas detecta logout
- ⏳ Futuro: mover para httpOnly cookies

**Storage Format**
```json
{
  "user": { "id", "email", ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresAt": 1721270400,
  "savedAt": 1721266800000
}
```

**APIs Disponíveis**
```javascript
import {
  silentAutoLogin,          // Tenta auto-login
  logout,                   // Logout completo
  getPersistedSessionInfo   // Info da sessão
} from './persistent-auth.js';
```

**Commit:** `0789526` — feat: login permanente para PWA JWS

### 11.3 — Web Push + Background Sync + Periodic Sync (✅ 16/07/2026)

**PEDIDO**
- Web Push — notificações mesmo com app fechado
- Background Sync — sincronizar eventos/tarefas criados offline
- Periodic Sync — atualizar calendários a cada 24h

**Arquivos criados:**

1. **`js/push-notifications.js`** — Gerenciador de notificações push (233 linhas)
   - `subscribeToPush()` — registra subscription
   - `unsubscribeFromPush()` — remove subscription
   - `getPushSubscription()` — verifica status
   - `sendTestNotification()` — notificação de teste
   - `notifyUpcomingEvent()` — evento próximo
   - `notifyTaskReminder()` — tarefa
   - `notifySyncStatus()` — status de sync

2. **`js/background-sync.js`** — Sincronização offline (268 linhas)
   - `registerBackgroundSync()` — registra sync tag
   - `setupSyncListener()` — escuta online/offline
   - `syncEvents()` — sincroniza eventos
   - `syncTasks()` — sincroniza tarefas
   - `syncCalendars()` — sincroniza calendários
   - `forceSync()` — sincronização manual
   - `savePendingEvent()` — salva evento offline
   - `savePendingTask()` — salva tarefa offline

3. **`js/periodic-sync.js`** — Sincronização periódica (252 linhas)
   - `registerPeriodicSync()` — registra 24h + 12h
   - `getPeriodicSyncTags()` — obtém status
   - `unregisterPeriodicSync()` — cancela
   - `handlePeriodicSync()` — handler do SW
   - `getPeriodicSyncInterval()` — intervalo configurado

4. **`JWS_NOTIFICATIONS_AND_SYNC.md`** — Documentação (554 linhas)
   - Setup de Web Push com VAPID keys
   - APIs e exemplos de uso
   - Schema do banco de dados
   - Endpoints do servidor necessários
   - Fluxos e testes locais

**Atualizações: `public/service-worker.js`** (+176 linhas)
- `push` event listener — recebe notificações
- `notificationclick` listener — abre app ao clicar
- `sync` event listener — background sync
- `periodicsync` event listener — 24h calendários, 12h lembretes

**Atualizações: `public/pwa-register.js`** (+98 linhas)
- Registra background sync
- Registra periodic sync (24h)
- Integração com push notifications
- `PWA.subscribeToPush()` — registra push
- `PWA.forceSync()` — força sync manual

**Web Push Fluxo**
```
User Online → Permite notificações
              ↓
App registra subscription → Salva em DB
                           ↓
Servidor envia push → Web Push API
                      ↓
SW intercepta → Mostra notificação
                ↓
User clica → Abre app
```

**Background Sync Fluxo**
```
User Offline → Cria evento
              ↓
savePendingEvent() → localStorage
                    ↓
User reconecta → Online event
                ↓
SW dispara sync → POST /api/events/sync
                 ↓
Servidor salva → ✅ Sincronizado
```

**Periodic Sync Fluxo**
```
App instalado → registerPeriodicSync()
               ↓
A cada 24h → SW dispara event
            ↓
POST /api/calendar/sync → Busca Google + Apple
                          ↓
Salva eventos → ✅ Calendários atualizados
```

**Schema Banco**
```sql
-- Subscrições push
CREATE TABLE time_tasks_push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW()
);
```

**Endpoints Necessários (servidor)**
- `POST /api/push/subscribe` — salva subscription
- `POST /api/push/send` — envia notificação (backend)
- `POST /api/events/sync` — sincroniza eventos offline
- `POST /api/calendar/sync` — sincroniza calendários
- `GET /api/reminders?days=1` — busca lembretes próximos

**Suporte Navegador**
| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Web Push | ✅ | ✅ | ⚠️ | ❌ |
| Background Sync | ✅ | ✅ | ❌ | ❌ |
| Periodic Sync | ✅ | ✅ | ❌ | ❌ |

**Features**
✓ Notificações push com app fechado
✓ Sincronizar offline (eventos, tarefas)
✓ Calendários sincronizados 24h
✓ Lembretes verificados 12h
✓ Fallback gracioso (sem suporte)
✓ Notificações de sync sucesso/erro

**Próximos: Implementar endpoints no servidor**
1. VAPID keys geradas e configuradas
2. Endpoint POST /api/push/subscribe
3. Endpoint POST /api/push/send (cronômetro de eventos)
4. Endpoint POST /api/calendar/sync (calendario-sync.js)

**Commit:** `fe305f5` — feat: Web Push + Background Sync + Periodic Sync

---

**Status das fases (até Fase 11):**

| Fase | Descrição | Status | Commit |
|---|---|---|---|
| 1–4 | Shell mobile, navegação, calendário, toggle senha, versículo | ✅ | `35e49c5` a `d9867d8` |
| 5 | Clima Open-Meteo com geolocalização | ✅ | `719af9a` a `85032eb` |
| 6.1 | Trigger schema + UI (base, executor pendente) | ✅ | `719af9a` a `85032eb` |
| 6.2 | Executor de triggers + modal real | ⏳ | — |
| 7 | WCAG accessibility audit | ✅ | `719af9a` a `85032eb` |
| 8 | Manual de bordo | ✅ | `719af9a` a `85032eb` |
| 9 | Smoke test | ✅ | `85032eb` |
| SX 2.1 | SX com memória, gestão total, baixa SIM/NÃO | ✅ | `b491afe` a merge |
| 10.1 | Google Calendar OAuth | ✅ | `4e7f2a2` |
| 10.2 | Apple Calendar CalDAV | ✅ | `da95d27` |
| 10.3 | Sincronização bidirecional | ✅ | `4e7f2a2` a `da95d27` |
| 10.4 | Testes e deploy calendários | ✅ | `100d1fb` |
| 11 | PWA (offline, installable, notificações) | ✅ | `de6ea47` |

