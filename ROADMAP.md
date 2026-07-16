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

## Planner Mestre — Fases 1–3 (concluídas em 16/07/2026)

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
| SX esquecia o contexto: “ME LEMBRE 5 MINUTOS ANTES” e “DO ÚLTIMO EVENTO CRIADO” falhavam | histórico da conversa e agenda enviados ao modelo a cada pedido | referências resolvidas por `createdAt`/título |
| SX só criava: não editava, adiava, desmarcava nem dava baixa | ações `UPDATE_EVENT`, `DELETE_EVENT` e `SET_EVENT_STATUS` no servidor e no frontend | teste do fluxo no endpoint e build |
| SX podia agir sobre evento inventado pelo modelo | `eventId` validado contra a agenda enviada; ambiguidade vira pergunta | `INVALID_EVENT_REFERENCE` → 502 controlado |
| Eventos não tinham baixa | coluna `completed` + toggle SIM/NÃO no modal e popover | migração idempotente no schema |
| Lembrete disparava para evento já concluído | filtro `event.completed` em `checkEvents` | lembrete silenciado após baixa |
| Versículo por acesso (Fase 4) nunca aparecia | `POST` sem token e formato `{verse}` trocados por `GET` autenticado com `{text, reference}` | balão funcional após login |
| Fase 4 entregue sem atualização do roadmap | fase marcada como concluída com as correções registradas | este documento |
| Formulário de login retinha credenciais após logout | campos limpos ao encerrar sessão | cadastro de múltiplas contas em sequência |
| Duas mensagens bíblicas concorrentes (manhã/tarde + acesso) | canal único: versículo por acesso em balão fechável | seção 9 do manual atualizada |
| Banco de produção sem a coluna `completed` (salvar evento falharia após deploy) | `schema.sql` executado via postgres-meta com verificação antes/depois | `42703` → coluna presente, evento "CÉLULA" intacto |

---

## Fase 4 — Login e versículo por acesso (concluída em 16/07/2026)

- [x] Toggle mostrar/ocultar senha no formulário de login.
- [x] Versículo bíblico exibido em balão ao abrir o app, com botão X para fechar.
- [x] Um versículo por acesso (não por período do dia como nas notificações).
- [x] Correção pós-entrega: o balão nunca aparecia em produção porque `verse-access.js` chamava `POST /api/verse` sem token e esperava um formato de resposta inexistente; corrigido para `GET` autenticado consumindo `{text, reference}`.
- [x] Correção pós-entrega: campos de e-mail/senha agora são limpos ao encerrar a sessão, permitindo cadastrar várias contas em sequência pelo botão **Criar conta** da página de login.

---

## Fase 5 — SX com memória e gestão total de eventos (concluída em 16/07/2026)

### Memória de conversa

- [x] O frontend envia as últimas 20 mensagens da conversa (`history`) e um recorte da agenda com até 50 eventos (`agenda`, com `id`, título, data, horário, lembrete, baixa e `createdAt`) para `/api/sx`.
- [x] O servidor injeta o histórico como turnos reais da conversa no Gemini e a agenda como contexto, permitindo resolver referências como “o último evento criado”, “a reunião de amanhã” e “me lembre 5 minutos antes”.
- [x] A memória é recarregada do histórico persistido (`time_tasks_sx_messages`) ao entrar e é zerada ao sair da sessão.

### Novas ações da SX

- [x] `UPDATE_EVENT` — reeditar quantas vezes precisar e adiar/remarcar (só os campos citados mudam; horário novo sem fim explícito preserva a duração atual do evento).
- [x] `DELETE_EVENT` — desmarcar/cancelar evento pela conversa.
- [x] `SET_EVENT_STATUS` — dar baixa (SIM) ou reabrir (NÃO) um evento.
- [x] O servidor valida que o `eventId` retornado pelo modelo existe na agenda enviada; referência ambígua vira pergunta (`CHAT`), nunca ação inventada.
- [x] Verificação de conflitos aplicada também em remarcações feitas pela SX.

### Baixa de eventos (SIM/NÃO)

- [x] Coluna `completed` em `time_tasks_events` (migração idempotente).
- [x] Toggle **Sim/Não** “Dar baixa (concluído)” no formulário do evento.
- [x] Botão **Dar baixa**/**Reabrir** no popover de resumo do evento.
- [x] Evento com baixa aparece riscado/esmaecido nas visões Semana/Dia/3 Dias, Dia inteiro e Mês.
- [x] Evento com baixa não dispara lembrete; reabrir reativa o lembrete.
- [x] Migração aplicada e verificada no banco de produção do EasyPanel em 16/07/2026 (coluna `completed` confirmada via `information_schema`, dados preservados).

### Mensagem bíblica unificada

- [x] Apenas um canal de mensagem bíblica: **um versículo por acesso**, em balão com botão X para fechar.
- [x] Removidos: entregas por período (manhã/tarde), cartão fixo da sidebar e configurações de horário de versículo.
- [x] `time_tasks_verse_deliveries` e colunas `verse_*` de settings mantidas no banco por preservação de histórico (limpeza futura opcional).

### Diário de bordo

- [x] `MANUAL_DE_BORDO.md` criado com etiquetas do AGENTS.md, linha do tempo, falhas/correções, validações, pendências, riscos e próximos passos.

---

## Próximas fases

### Fase 6 — Previsão climática

- [ ] Widget de clima via Open-Meteo (sem chave de API).
- [ ] Exibição compacta no header ou sidebar do calendário.
- [ ] Geolocalização via `navigator.geolocation` com fallback manual de cidade.

### Fase 7 — Trigger e central de notificações

- [ ] Schema `time_tasks_triggers` com RLS por usuário.
- [ ] UI de criação/edição de triggers (tipo, condição, canal de entrega).
- [ ] Worker Node.js para polling/cronograma e despacho de notificações.
- [ ] Preencher `#ai-pane-notifications` com notificações reais do banco.
- [ ] Dot indicador (`#notifications-dot`) ativo quando há itens não lidos.

### Fase 8 — Acessibilidade, segurança e robustez

- [ ] Auditoria WCAG: foco, contraste, roles, labels, navegação por teclado.
- [ ] `npm audit` limpo após novas dependências das fases anteriores.
- [ ] Rate limit e validação de entrada nas novas rotas do servidor.
- [ ] Smoke test automatizado dos fluxos críticos.

### Fase 9 — Documentação

- [x] Criar `MANUAL_DE_BORDO.md` consolidando todo o histórico, decisões e anti-padrões (criado em 16/07/2026; manter atualizado a cada fase).
- [ ] Atualizar `README.md` com as fases concluídas e instruções de deploy atualizadas.
- [ ] Revisar `AGENTS.md` para refletir o estado atual dos módulos.

### Fase 10 — Verificação, build e produção

- [ ] `npm run build` limpo.
- [ ] `node --check` em todos os módulos JS.
- [ ] `HEAD == origin/main` verificado.
- [ ] Deploy no EasyPanel validado com healthcheck e smoke test.
- [ ] Paridade entre local e produção confirmada.

---

## Critério permanente de pronto

Uma entrega só é considerada concluída quando passa por build, banco/RLS, autenticação, CRUD real, teste visual, healthcheck, deploy público e paridade `HEAD == origin/main`.
