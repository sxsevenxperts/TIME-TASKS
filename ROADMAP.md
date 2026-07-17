# Roadmap — SX Time Tasks

**Última revisão técnica:** 17/07/2026
**Status:** Fases 1–5 e 7–8 do planner concluídas; SX 2.1 (memória + gestão de eventos) entregue; Fase 6.2 (executor de triggers) pendente; Fase 9 em validação de produção.

## Versão 2.0 — entregue

### Produto e identidade

- [x] Remoção do modo demonstração e de dados simulados.
- [x] Identidade visual baseada na marca circular SX.
- [x] Nome da assistente padronizado como **SX** e menu exibido apenas como **IA**.
- [x] Layout responsivo com calendário, tarefas, agendamentos e configurações.
- [x] Manifesto web e ícone do aplicativo.

### Acesso e dados

- [x] Login e criação de conta por e-mail e senha.
- [x] Vínculo exclusivo de acesso em `time_tasks_members`.
- [x] Oito tabelas com prefixo `time_tasks_*` para evitar colisão com SevenChat.
- [x] RLS ativo em todas as tabelas e 28 políticas aplicadas.
- [x] Migração idempotente de eventos legados.
- [x] Conta operacional vinculada ao Time Tasks.
- [x] APIs privadas recusam usuários autenticados que não sejam membros do app.

### Agenda e tarefas

- [x] CRUD completo de eventos.
- [x] Visões Dia, 3 Dias, Semana e Mês.
- [x] Categorias Pessoal, Trabalho, Saúde, Estudos e Social.
- [x] Duração, evento de dia inteiro, lembrete e verificação de conflitos.
- [x] Tarefas/Sementes com prazo, lembrete, conclusão, edição e exclusão.
- [x] Correção do estado vazio que permanecia visível após criar uma tarefa.
- [x] Normalização visual de horários para `HH:MM`.

### SX

- [x] Chave da IA somente no servidor EasyPanel.
- [x] Endpoint `/api/sx` autenticado, com validação de membro e rate limit.
- [x] Interpretação de linguagem natural em português.
- [x] Criação real de evento, tarefa e lembrete.
- [x] Entrada por voz nos navegadores que oferecem Web Speech API.
- [x] Histórico privado de mensagens da SX.
- [x] Testes reais: `CREATE_EVENT` e `CREATE_SEED` persistidos no Supabase.

### Agendamento público

- [x] Criação, edição, ativação/pausa e exclusão de páginas.
- [x] Link público por slug.
- [x] Disponibilidade por dias, intervalo e duração.
- [x] Reserva anônima protegida por política específica.
- [x] Bloqueio de reserva duplicada no mesmo horário.
- [x] Lista e cancelamento pelo proprietário.
- [x] Correção da confirmação pública após operação assíncrona.

### Notificações e versículos

- [x] Som de dois tons no momento do lembrete.
- [x] Toast interno e Notification API quando permitida.
- [x] ~~Versículo da manhã e da tarde~~ — substituído em 16/07/2026 por **um único versículo por acesso** (balão com botão X).
- [x] Botão para testar o som.

### Infraestrutura e segurança

- [x] Servidor Node próprio para `dist/`, `/api/health`, `/api/sx` e `/api/verse`.
- [x] Dockerfile Node 22 Alpine com healthcheck.
- [x] CSP, Permissions-Policy, X-Frame-Options e nosniff.
- [x] Git remoto sem token embutido na URL.
- [x] Script administrativo de usuário demo removido.
- [x] `npm audit --omit=dev`: zero vulnerabilidades.
- [x] Build Vite e sintaxe de todos os módulos aprovados.

---

## Planner Mestre — estado por fase (17/07/2026)

### Fase 1 — Fundação responsiva (concluída)

- [x] F-01: `js/sidebar.js` corrigido para usar `#sub-sidebar` e classe `sub-sidebar--open`.
- [x] F-02: `style="display:none"` removido de `#sidebar-toggle`; `aria-controls`/`aria-expanded` adicionados.
- [x] F-03: `.app-layout`, `.sidebar`, `.sidebar__header`, `.sidebar__logo*` removidos de `style.css`; `layout.css` passa a ser fonte única.
- [x] F-04: `overflow-x: hidden` → `overflow-x: auto` em `.time-grid-scroll`.
- [x] F-05: Navegação unificada em `[data-target]` — nav-strip desktop e tab bar mobile servidos pelo mesmo listener.
- [x] F-06: `setChatOpen()` exportada; todos os controles de abertura/fechamento da SX usam a mesma função.

### Fase 2 — Shell e navegação mobile (concluída)

- [x] `#mobile-tabbar` com quatro botões: Calendário, Seed, Trigger, SX.
- [x] Ao clicar no botão de histórico (relógio) dentro da SX, o painel fecha e navega para Seeds com `keepChatState: true`.
- [x] SX abre em tela cheia no mobile (`inset: 0`).
- [x] Cabeçalho duplo na SX: pill centralizada no desktop; abas Bate-papo/Notif. + botão de perfil no mobile.
- [x] Painel de notificações (`#ai-pane-notifications`) com lista e estado vazio.
- [x] `setAiTab()` sincroniza abas, paines e visibilidade da área de input.
- [x] Tab bar oculta `.nav-strip` no mobile (`@media max-width: 900px`).
- [x] `safe-area-inset-bottom` aplicado na tab bar e no padding do `.app-body` mobile.
- [x] Shell do Trigger: botão no nav-strip, sidebar `#sidebar-trigger`, view `#view-trigger`.

### Fase 3 — Calendário mobile e SX fixa no desktop (concluída)

- [x] Calendário inicia em visão Mês no mobile, Semana no desktop (`initialViewForViewport()`).
- [x] `hourHeight()` retorna 44 px no mobile e 60 px no desktop (evita colunas ilegíveis).
- [x] Colunas do grid com `minmax(92px, 1fr)` no mobile com múltiplos dias — scroll horizontal habilitado.
- [x] `syncViewSelectorButtons()` aplica estado ativo nos botões ao inicializar.
- [x] No desktop (`≥901px`), `activateView()` abre a SX automaticamente em cada troca de view.
- [x] Evento `timetasks:session` abre a SX no desktop logo após login.
- [x] Layout de 3 colunas (sub-sidebar + main-content + ai-sidebar) entregue pelo flexbox existente sem CSS extra.
- [x] Correção de `.ai-input-wrapper` duplicado em `layout.css` (merged em única regra).

### Fase 4 — Login e versículo por acesso (concluída, com correções pós-entrega)

- [x] Toggle mostrar/ocultar senha no formulário de login: botão com ícone de olho ao lado do campo.
- [x] `auth.js`: event listener do toggle que alterna `type='password'` e `type='text'`, marca botão com classe `.active`.
- [x] `verse-access.js`: módulo que escuta `timetasks:session` e exibe balão animado com versículo + referência e botão X.
- [x] CSS para `.verse-access-balloon` com entrada/saída suave, backdrop blur, z-index 2000.
- [x] **Correção pós-entrega:** o balão nunca aparecia em produção — `verse-access.js` chamava `POST /api/verse` sem token e esperava `{verse}`; corrigido para `GET` autenticado consumindo `{text, reference}`.
- [x] **Correção pós-entrega:** campos de e-mail/senha limpos ao encerrar a sessão, permitindo cadastrar várias contas em sequência pelo botão **Criar conta**.

### Fase 5 — Previsão climática (concluída, com correções pós-entrega)

- [x] `weather.js`: geolocalização automática via `navigator.geolocation` com fallback manual de cidade.
- [x] Integração Open-Meteo (pública, sem chave) para temperatura, umidade e código WMO.
- [x] Mapeamento WMO → emoji + descrição em português; cache local de 30 min.
- [x] Widget compacto no header do calendário; prompt com "Ativar geolocalização" e "Buscar manualmente".
- [x] **Correção pós-entrega:** o CSP de produção (`connect-src 'self' + Supabase`) bloqueava `api.open-meteo.com` e `geocoding-api.open-meteo.com`; domínios adicionados ao `connect-src`.
- [x] **Correção pós-entrega:** `Permissions-Policy: geolocation=()` bloqueava a geolocalização no próprio app; alterado para `geolocation=(self)`.

### Fase 6 — Trigger & Central de Notificações (parcial)

**6.1 — Schema e UI base (concluído):**

- [x] Schema `time_tasks_triggers` (name, type weather/summary/reminder, enabled, condition/action JSONB, schedule, next_run_at).
- [x] Schema `time_tasks_notifications` (trigger_id, type, title, message, icon, read, expires_at 30 dias).
- [x] RLS em ambas as tabelas por usuário.
- [x] `js/triggers.js`: CRUD de triggers e exibição de notificações; `renderTriggers()`, `renderNotifications()`, `fetchNotifications()`.
- [x] CSS `.trigger-card`, `.badge--weather/summary/reminder`, `.toggle-switch`, `.feature-empty`.
- [x] `renderNotifications()` chamado ao abrir a aba Notif. da SX.
- [x] **Correção pós-entrega:** a migração `006_triggers_schema.sql` não era idempotente (`CREATE POLICY`/`CREATE INDEX` sem guardas), não tinha `grant`/`revoke` e a política de INSERT de notificações (`with check (true)`) permitia escrita anônima; corrigida, incorporada ao `supabase/schema.sql` canônico e aplicada em produção.

**6.2 — Executor (pendente):**

- [ ] Worker Node.js para polling/cronograma de triggers.
- [ ] Lógica de disparo por tipo (weather, summary, reminder).
- [ ] Modal real de criação/edição de triggers (hoje é placeholder).
- [ ] Dot indicador (`#notifications-dot`) sincronizado com itens não lidos.

### Fase 7 — Acessibilidade, segurança e robustez (concluída)

- [x] Auditoria WCAG 2.1 AA documentada em `ACCESSIBILITY.md`.
- [x] `npm audit --omit=dev`: zero vulnerabilidades.
- [x] Rate limit e validação de entrada nas rotas do servidor.

### Fase 8 — Documentação (concluída)

- [x] `MANUAL_DE_BORDO.md` unificado: diário cronológico + referência técnica do projeto.
- [x] `MANUAL_DE_USO.md` revisado a cada entrega.
- [x] `SMOKE_TEST.md` com roteiro de verificação.
- [ ] `README.md` atualizado com as fases concluídas (pendente).
- [ ] `AGENTS.md` revisado para o estado atual dos módulos (parcial).

### Fase 9 — Verificação, build e produção (concluída em 17/07/2026)

- [x] `npm run build` limpo.
- [x] `node --check` em todos os módulos JS.
- [x] Migrações aplicadas e verificadas no banco de produção (coluna `completed`; triggers/notifications).
- [x] Deploy no EasyPanel validado: auto-deploy no push para `main` publicou o bundle do merge; `/api/health` com `sx: true` e `supabase: true`.
- [x] Paridade entre local e produção confirmada: hash do bundle em produção idêntico ao build local do merge; CSP com Open-Meteo e `geolocation=(self)` ativos; APIs recusando requisições sem token.

---

## SX 2.1 — Memória e gestão total de eventos (concluída em 16–17/07/2026)

### Memória de conversa

- [x] O frontend envia as últimas 20 mensagens da conversa (`history`) e um recorte da agenda com até 50 eventos (`agenda`, com `id`, título, data, horário, lembrete, baixa e `createdAt`) para `/api/sx`.
- [x] O servidor injeta o histórico como turnos reais da conversa no Gemini e a agenda como contexto, permitindo resolver referências como "o último evento criado", "a reunião de amanhã" e "me lembre 5 minutos antes".
- [x] A memória é recarregada do histórico persistido (`time_tasks_sx_messages`) ao entrar e é zerada ao sair da sessão.

### Novas ações da SX

- [x] `UPDATE_EVENT` — reeditar quantas vezes precisar e adiar/remarcar (só os campos citados mudam; horário novo sem fim explícito preserva a duração atual do evento).
- [x] `DELETE_EVENT` — desmarcar/cancelar/apagar evento pela conversa.
- [x] `SET_EVENT_STATUS` — dar baixa (SIM) ou reabrir (NÃO) um evento.
- [x] O servidor valida que o `eventId` retornado pelo modelo existe na agenda enviada; referência ambígua vira pergunta (`CHAT`), nunca ação inventada.
- [x] Verificação de conflitos aplicada também em remarcações feitas pela SX.

### Persona humanizada

- [x] SX conversa em tom natural e caloroso, chama o usuário pelo nome (nome de exibição das Configurações) e não usa jargão de sistema.
- [x] Quando o usuário menciona que um compromisso "foi cancelado", a SX confirma antes de desmarcar; quando "já aconteceu", sugere dar baixa.
- [x] Política de identidade: a SX não se descreve como IA nem usa frases robóticas; se perguntada diretamente, apresenta-se como "a SX, sua assistente do Time Tasks", sem alegar ser humana.

### Baixa de eventos (SIM/NÃO)

- [x] Coluna `completed` em `time_tasks_events` (migração idempotente, aplicada e verificada em produção em 16/07/2026).
- [x] Toggle **Sim/Não** "Dar baixa (concluído)" no formulário do evento.
- [x] Botão **Dar baixa**/**Reabrir** no popover de resumo do evento.
- [x] Evento com baixa aparece riscado/esmaecido nas visões Semana/Dia/3 Dias, Dia inteiro e Mês.
- [x] Evento com baixa não dispara lembrete; reabrir reativa o lembrete.

### Mensagem bíblica unificada

- [x] Apenas um canal de mensagem bíblica: **um versículo por acesso**, em balão com botão X para fechar.
- [x] Removidos: entregas por período (manhã/tarde), cartão fixo da sidebar e configurações de horário de versículo.
- [x] `time_tasks_verse_deliveries` e colunas `verse_*` de settings mantidas no banco por preservação de histórico (limpeza futura opcional).

---

## Falhas encontradas e corrigidas (histórico consolidado)

| Falha | Correção | Evidência |
|---|---|---|
| Tabelas genéricas colidiam com SevenChat | Prefixo `time_tasks_*` | `sx_messages` do SevenChat permaneceu intacta |
| APIs aceitavam qualquer usuário do Auth compartilhado | Checagem obrigatória em `time_tasks_members` | conta temporária de outro app recebeu HTTP 401 |
| Estado vazio de tarefas ficava visível | regra `[hidden]` específica | teste visual após criação |
| Confirmação de reserva quebrava após `await` | referência do formulário preservada antes da operação | mensagem de sucesso exibida no link público |
| Horários apareciam com segundos | normalização no mapeamento do evento | exibição `HH:MM` |
| Chave da IA poderia ir ao cliente | proxy autenticado no servidor | frontend não contém chave privada |
| Documentação descrevia demo/SevenChat/`public.events` | manual, README e roadmap reescritos | documentação 2.0 |
| `#sidebar` referenciado em sidebar.js em vez de `#sub-sidebar` | corrigido para ID correto + `sub-sidebar--open` | toggle mobile funciona |
| `style="display:none"` bloqueava CSS do sidebar-toggle | atributo removido, aria adicionado | botão visível e acessível |
| `.app-layout` e `.sidebar` duplicados entre style.css e layout.css | removidos de style.css; layout.css é fonte única | sem drift entre arquivos |
| Navegação desktop não funcionava na tab bar mobile | seletor unificado `[data-target]` em navigation.js | ambas as barras sincronizadas |
| Múltiplos controles da SX sem estado central | `setChatOpen()` exportada e usada em todos os pontos | toggle consistente |
| `.ai-input-wrapper` definido duas vezes em layout.css | regras merged em uma única declaração | sem override inesperado |
| SX esquecia o contexto: "ME LEMBRE 5 MINUTOS ANTES" e "DO ÚLTIMO EVENTO CRIADO" falhavam | histórico da conversa e agenda enviados ao modelo a cada pedido | referências resolvidas por `createdAt`/título |
| SX só criava: não editava, adiava, desmarcava nem dava baixa | ações `UPDATE_EVENT`, `DELETE_EVENT` e `SET_EVENT_STATUS` no servidor e no frontend | teste do fluxo no endpoint e build |
| SX podia agir sobre evento inventado pelo modelo | `eventId` validado contra a agenda enviada; ambiguidade vira pergunta | `INVALID_EVENT_REFERENCE` → 502 controlado |
| Eventos não tinham baixa | coluna `completed` + toggle SIM/NÃO no modal e popover | migração idempotente no schema |
| Lembrete disparava para evento já concluído | filtro `event.completed` em `checkEvents` | lembrete silenciado após baixa |
| Versículo por acesso (Fase 4) nunca aparecia | `POST` sem token e formato `{verse}` trocados por `GET` autenticado com `{text, reference}` | balão funcional após login |
| Fase 4 entregue sem atualização do roadmap | fase marcada como concluída com as correções registradas | este documento |
| Formulário de login retinha credenciais após logout | campos limpos ao encerrar sessão | cadastro de múltiplas contas em sequência |
| Duas mensagens bíblicas concorrentes (manhã/tarde + acesso) | canal único: versículo por acesso em balão fechável | seção 2 do manual atualizada |
| Banco de produção sem a coluna `completed` (salvar evento falharia após deploy) | `schema.sql` executado via postgres-meta com verificação antes/depois | `42703` → coluna presente, evento "CÉLULA" intacto |
| Duas sessões de desenvolvimento divergiram (main × branch de trabalho) | merge manual preservando os dois trabalhos; roadmap/manuais unificados | histórico do git em 17/07/2026 |
| CSP de produção bloqueava Open-Meteo (clima nunca carregaria) | `api.open-meteo.com` e `geocoding-api.open-meteo.com` no `connect-src` | fase 5 corrigida |
| `Permissions-Policy: geolocation=()` bloqueava a geolocalização do clima | `geolocation=(self)` | fase 5 corrigida |
| Migração 006 sem idempotência, sem grants e com INSERT anônimo em notificações | migração reescrita, incorporada ao `schema.sql` e aplicada em produção | política restrita a `auth.uid() = user_id` |

---

## Próximos passos

### Fase 6.2 — Executor de triggers

- [ ] Worker Node.js para polling/cronograma e despacho de notificações.
- [ ] Modal real de criação/edição de triggers.
- [ ] Dot indicador de não lidos sincronizado.

### Documentação restante

- [ ] Atualizar `README.md` com as fases concluídas e instruções de deploy atualizadas.
- [ ] Revisar `AGENTS.md` para refletir o estado atual dos módulos.

### Infraestrutura futura

- [ ] Web Push + service worker para alertas com o navegador fechado.
- [ ] Limpeza opcional de `time_tasks_verse_deliveries` e colunas `verse_*` de settings.
- [ ] Rotação das credenciais operacionais compartilhadas durante a sessão de 16–17/07/2026 (GitHub, EasyPanel, service-role).

---

## Critério permanente de pronto

Uma entrega só é considerada concluída quando passa por build, banco/RLS, autenticação, CRUD real, teste visual, healthcheck, deploy público, paridade `HEAD == origin/main` **e registro no MANUAL_DE_BORDO + ROADMAP + MANUAL_DE_USO**.

---

## Fase 10 — Integrações de Calendário Externo

### Fase 10.1 — Google Calendar OAuth (✅ CONCLUÍDO - 16/07/2026)

**Objetivo:** Integração OAuth com Google Calendar para sincronização bidirecional.

**Alterações:**
- [x] Criada tabela `time_tasks_calendar_integrations` com campos: provider, access_token, refresh_token, token_expires_at, calendar_id, calendar_name, is_active, last_sync_at, sync_errors.
- [x] Adicionados campos em `time_tasks_events`: external_id, external_source (google/apple), external_calendar_id, synced_at, is_syncing.
- [x] Implementado módulo `js/google-calendar-handler.js` com funções: buildGoogleAuthUrl, exchangeGoogleCode, refreshGoogleToken, fetchGoogleCalendars, fetchGoogleEvents, createGoogleEvent.
- [x] Adicionados endpoints no server.js:
  - GET `/api/auth/google/connect` → redireciona para Google OAuth
  - GET `/api/auth/google/callback` → recebe authorization_code e troca por access_token
- [x] Adicionadas variáveis de ambiente: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.
- [x] RLS aplicado em `time_tasks_calendar_integrations` (select, insert, update, delete own).
- [x] Migração SQL: `migrations/007_calendar_integrations.sql`.

**Status:** ✅ Backend pronto. Frontend e sincronização → Fase 10.2.

---

### Fase 10.2 — Apple Calendar CalDAV (⏳ Próxima)

**Objetivo:** Integração CalDAV com Apple Calendar (iCloud, macOS, iOS).

**Scope:**
- [ ] Módulo `js/apple-calendar-handler.js` com CalDAV discovery e autenticação.
- [ ] Endpoint GET `/api/auth/apple/connect` → setup formulário de credenciais.
- [ ] Endpoint POST `/api/auth/apple/setup` → salva credenciais encriptadas.
- [ ] Parse de eventos `.ics` e mapeamento para schema interno.
- [ ] Teste com iCloud calendário público.

---

### Fase 10.3 — Sincronização Bidirecional (⏳ Próxima)

**Objetivo:** Puxar eventos de Google/Apple e criar/editar/deletar no Time Tasks.

**Scope:**
- [ ] Job de sincronização: pull a cada 5 minutos.
- [ ] Dedup por `external_id`.
- [ ] Conflito de horário: regra de prioridade (SX > Google > Apple).
- [ ] Push: novo evento SX → cria em Google + Apple.
- [ ] UI em Settings → "Calendários Conectados".
- [ ] Botão de sincronização manual.

---

### Fase 10.4 — Configuração, Testes e Deploy (⏳ Próxima)

**Objetivo:** Finalizar, testar e documentar integrações.

**Scope:**
- [ ] Instruções de setup Google Cloud Console + Apple Developer.
- [ ] Smoke test: criar evento SX → aparece em Google Calendar.
- [ ] Teste CalDAV com iCloud.
- [ ] Tratamento de erros: token expirado, calendário removido, conflito.
- [ ] Documentação em MANUAL_DE_USO.md.
- [ ] Deploy em produção com healthcheck.
