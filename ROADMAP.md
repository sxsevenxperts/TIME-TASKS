# Roadmap — SX Time Tasks

Última revisão técnica: **16/07/2026**.

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
- [x] Versículo da manhã e da tarde.
- [x] Unicidade por usuário, data/período e versículo.
- [x] Botão para testar o som.
- [x] Horários configuráveis.

### Infraestrutura e segurança

- [x] Servidor Node próprio para `dist/`, `/api/health`, `/api/sx` e `/api/verse`.
- [x] Dockerfile Node 22 Alpine com healthcheck.
- [x] CSP, Permissions-Policy, X-Frame-Options e nosniff.
- [x] Git remoto sem token embutido na URL.
- [x] Script administrativo de usuário demo removido.
- [x] `npm audit --omit=dev`: zero vulnerabilidades.
- [x] Build Vite e sintaxe de todos os módulos aprovados.

---

## Planner Mestre — Fases 1–5 (concluídas), Fase 6 (em andamento) em 16/07/2026

### Fase 1 — Fundação responsiva

- [x] F-01: `js/sidebar.js` corrigido para usar `#sub-sidebar` e classe `sub-sidebar--open`.
- [x] F-02: `style="display:none"` removido de `#sidebar-toggle`; `aria-controls`/`aria-expanded` adicionados.
- [x] F-03: `.app-layout`, `.sidebar`, `.sidebar__header`, `.sidebar__logo*` removidos de `style.css`; `layout.css` passa a ser fonte única.
- [x] F-04: `overflow-x: hidden` → `overflow-x: auto` em `.time-grid-scroll`.
- [x] F-05: Navegação unificada em `[data-target]` — nav-strip desktop e tab bar mobile servidos pelo mesmo listener.
- [x] F-06: `setChatOpen()` exportada; todos os controles de abertura/fechamento da SX usam a mesma função.

### Fase 2 — Shell e navegação mobile

- [x] `#mobile-tabbar` com quatro botões: Calendário, Seed, Trigger, SX.
- [x] Ao clicar no botão de histórico (relógio) dentro da SX, o painel fecha e navega para Seeds com `keepChatState: true`.
- [x] SX abre em tela cheia no mobile (`inset: 0`).
- [x] Cabeçalho duplo na SX: pill centralizada no desktop; abas Bate-papo/Notif. + botão de perfil no mobile.
- [x] Painel de notificações (`#ai-pane-notifications`) com lista e estado vazio.
- [x] `setAiTab()` sincroniza abas, paines e visibilidade da área de input.
- [x] Tab bar oculta `.nav-strip` no mobile (`@media max-width: 900px`).
- [x] `safe-area-inset-bottom` aplicado na tab bar e no padding do `.app-body` mobile.
- [x] Shell do Trigger: botão no nav-strip, sidebar `#sidebar-trigger`, view `#view-trigger`.

### Fase 3 — Calendário mobile e SX fixa no desktop

- [x] Calendário inicia em visão Mês no mobile, Semana no desktop (`initialViewForViewport()`).
- [x] `hourHeight()` retorna 44 px no mobile e 60 px no desktop (evita colunas ilegíveis).
- [x] Colunas do grid com `minmax(92px, 1fr)` no mobile com múltiplos dias — scroll horizontal habilitado.
- [x] `syncViewSelectorButtons()` aplica estado ativo nos botões ao inicializar.
- [x] No desktop (`≥901px`), `activateView()` abre a SX automaticamente em cada troca de view.
- [x] Evento `timetasks:session` abre a SX no desktop logo após login.
- [x] Layout de 3 colunas (sub-sidebar + main-content + ai-sidebar) entregue pelo flexbox existente sem CSS extra.
- [x] Correção de `.ai-input-wrapper` duplicado em `layout.css` (merged em única regra).

### Fase 4 — Login e versículo por acesso

- [x] Toggle mostrar/ocultar senha no formulário de login: botão com ícone de olho ao lado do campo.
- [x] `auth.js`: event listener do toggle que alterna `type='password'` e `type='text'`, marca botão com classe `.active`.
- [x] `verse-access.js`: novo módulo que escuta evento `timetasks:session` (dispara após login bem-sucedido).
- [x] Chamada a `/api/verse` com `type: 'access'` para obter versículo único por acesso.
- [x] Balão animado (bounce effect) exibindo versículo + referência, com botão X para fechar.
- [x] CSS para `.verse-access-balloon` com entrada/saída suave, backdrop blur, z-index 2000.
- [x] Integração em `app.js` — `initVerseAccess()` chamado após `initReminders()`.

### Fase 5 — Previsão climática

- [x] `weather.js`: novo módulo com geolocalização automática via `navigator.geolocation`.
- [x] Integração Open-Meteo API (pública, sem chave necessária) para dados de clima em tempo real.
- [x] `getLocation()`: armazena coordenadas em localStorage, fallback manual por entrada de cidade.
- [x] `fetchWeather()`: obtém temperatura, umidade, código climático WMO.
- [x] `searchCity()`: geocodificação reversa com Open-Meteo para entrada manual de cidade.
- [x] Mapeamento WMO Weather Codes → emoji + descrição em português (☀️ Limpo, 🌧️ Chuva, etc).
- [x] Cache local de 30 min para reduzir carga na API.
- [x] Widget compacto no header do calendário: temperatura + descrição em desktop, apenas emoji em mobile.
- [x] Prompt com botões "Ativar geolocalização" e "Buscar manualmente" quando localização negada.
- [x] Integração em `app.js` — `initWeather()` chamado após `initVerseAccess()`.

### Fase 6 — Trigger & Central de Notificações (Parcial — 6.1)

**6.1 — Schema e UI base (concluído):**

- [x] Schema `time_tasks_triggers`: name, type (weather/summary/reminder), enabled, condition/action JSONB, schedule, next_run_at
- [x] Schema `time_tasks_notifications`: trigger_id, type, title, message, icon, read, expires_at (30 dias)
- [x] RLS em ambas as tabelas por user_id
- [x] `js/triggers.js`: módulo frontend para CRUD de triggers e exibição de notificações
- [x] `renderTriggers()`: lista com toggle enable/disable, editar, deletar
- [x] `renderNotifications()`: lista com ícone, título, mensagem, tempo relativo, marcar lido
- [x] `fetchNotifications()`: GET 50 itens ordenados por created_at
- [x] CSS `.trigger-card`, `.badge--weather/summary/reminder`, `.toggle-switch`, `.feature-empty`
- [x] Integração em `app.js` — `initTriggers()` após `initWeather()`

**6.2 — Executor Node.js (pendente):**

- [ ] Worker Node.js para polling/cronograma de triggers
- [ ] Lógica de disparo de notificações baseada em tipo (weather, summary, reminder)
- [ ] Modal de criação/edição de triggers
- [ ] Testes no backend

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

## Falhas & Limitações Fase 6

| # | Falha/Limitação | Estado | Impacto |
|---|---|---|---|
| 6.1 | Modal de criação/edição é placeholder (alert) | ⏳ Pendente | Usuários não conseguem criar triggers ainda |
| 6.2 | Executor Node.js não implementado | ⏳ Pendente | Triggers não disparam notificações automaticamente |
| 6.3 | Aba "Notif." não chama renderNotifications() ao abrir | ⏳ Pendente (verificar navigation.js `setAiTab`) | Notificações não recarregam ao trocar de aba |
| 6.4 | Botão historico (relógio) não sincroniza estado de notificações lidas | ⏳ Não implementado | Ponto vermelho de notificações pode não desaparecer |

---

## Próximas fases

### Fase 6 — Trigger e central de notificações

- [ ] Schema `time_tasks_triggers` com RLS por usuário.
- [ ] UI de criação/edição de triggers (tipo, condição, canal de entrega).
- [ ] Worker Node.js para polling/cronograma e despacho de notificações.
- [ ] Preencher `#ai-pane-notifications` com notificações reais do banco.
- [ ] Dot indicador (`#notifications-dot`) ativo quando há itens não lidos.

### Fase 7 — Acessibilidade, segurança e robustez

- [ ] Auditoria WCAG: foco, contraste, roles, labels, navegação por teclado.
- [ ] `npm audit` limpo após novas dependências das fases anteriores.
- [ ] Rate limit e validação de entrada nas novas rotas do servidor.
- [ ] Smoke test automatizado dos fluxos críticos.

### Fase 8 — Documentação

- [ ] Criar `MANUAL_DE_BORDO.md` consolidando todo o histórico, decisões e anti-padrões.
- [ ] Atualizar `README.md` com as fases concluídas e instruções de deploy atualizadas.
- [ ] Revisar `AGENTS.md` para refletir o estado atual dos módulos.

### Fase 9 — Verificação, build e produção

- [ ] `npm run build` limpo.
- [ ] `node --check` em todos os módulos JS.
- [ ] `HEAD == origin/main` verificado.
- [ ] Deploy no EasyPanel validado com healthcheck e smoke test.
- [ ] Paridade entre local e produção confirmada.

---

## Critério permanente de pronto

Uma entrega só é considerada concluída quando passa por build, banco/RLS, autenticação, CRUD real, teste visual, healthcheck, deploy público e paridade `HEAD == origin/main`.
