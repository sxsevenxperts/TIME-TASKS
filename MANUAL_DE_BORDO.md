# Manual de Bordo — SX Time Tasks

Diário de bordo do projeto, previsto no `AGENTS.md`. Registra **o que foi pedido, o que foi feito, o resultado obtido, o que falta e o melhor caminho**, para que qualquer pessoa (ou agente) retome o trabalho sem perder contexto.

Cada registro usa uma etiqueta: `PEDIDO`, `PERGUNTA`, `DECISÃO`, `IDEIA`, `FALHA`, `CORREÇÃO`, `VALIDAÇÃO`, `PENDÊNCIA` ou `RISCO`.

Última atualização: **16/07/2026**.

---

## 1. Linha do tempo consolidada

| Data | Entrega | Commit |
|---|---|---|
| — | SX Time Tasks 2.0 em produção (agenda, tarefas, SX, agendamento público, versículos, segurança) | `22869d1` |
| — | Correção da duplicação do histórico da SX | `fc9ccfe` |
| — | Planner mestre de evolução visual/funcional + AGENTS.md | `058d8a3` |
| 16/07/2026 | Fases 1–3: shell mobile, navegação unificada, calendário responsivo | `35e49c5` |
| 16/07/2026 | Fase 4: toggle de senha no login e versículo por acesso | `d9867d8` |
| 16/07/2026 | Fase 5: SX com memória, gestão de eventos e baixa SIM/NÃO + correções da revisão geral | `31ae00b` |
| 16/07/2026 | Mensagem bíblica unificada (um versículo por acesso) + migração aplicada em produção + este diário | *(commit desta entrega)* |

---

## 2. Registros da sessão de 16/07/2026

### 2.1 SX com memória e gestão total de eventos (Fase 5)

- **PEDIDO** — Toda mensagem deve ser lembrada; reeditar eventos quantas vezes precisar; adiar; desmarcar; e dar baixa com SIM/NÃO em cada evento.
- **FALHA** — A SX era stateless: `/api/sx` recebia apenas o texto atual. Na prática, "ME LEMBRE 5 MINUTOS ANTES" e "DO ÚLTIMO EVENTO CRIADO" falhavam (evidência: capturas de tela do chat em produção).
- **FALHA** — A SX só possuía 3 ações (`CREATE_EVENT`, `CREATE_SEED`, `CHAT`); não conseguia editar, adiar, desmarcar nem concluir nada.
- **CORREÇÃO** — `js/ai.js` agora envia as últimas 20 mensagens (`history`) e um recorte da agenda com até 50 eventos (`agenda`) a cada pedido; `server.js` injeta o histórico como turnos reais da conversa no Gemini e a agenda como contexto.
- **CORREÇÃO** — Novas ações no servidor e no frontend: `UPDATE_EVENT` (reeditar/adiar), `DELETE_EVENT` (desmarcar) e `SET_EVENT_STATUS` (baixa SIM / reabrir NÃO).
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
- **FALHA** — Lembrete disparava mesmo para evento já concluído.
- **CORREÇÃO** — `checkEvents` ignora `event.completed`.
- **FALHA** — A Fase 4 havia sido entregue sem atualizar o ROADMAP (continuava como pendente).
- **CORREÇÃO** — ROADMAP sincronizado; processo permanente: **a cada fase concluída, sincronizar roadmap, manual e diário, local e no repositório**.
- **VALIDAÇÃO** — Módulos auditados: auth, events, calendar, modal, seeds, settings, sidebar, navigation, reminders, verse-access, booking (varredura), theme, supabase, utils, server e schema (RLS/grants).

### 2.4 Migração do banco de produção

- **PEDIDO** — Executar `supabase/schema.sql` no banco do EasyPanel.
- **DECISÃO** — Execução via endpoint `postgres-meta` (`/pg/query`) do Supabase self-hosted, autenticada com a service-role key fornecida pelo operador. O schema inteiro foi aplicado por ser idempotente.
- **VALIDAÇÃO** — Antes: `select completed` retornava `42703 (column does not exist)`. Depois: coluna `completed boolean default false` confirmada em `information_schema.columns`; dados preservados (evento "CÉLULA" de 16/07/2026 intacto, `completed=false`). Total de eventos na base: 1.
- **DECISÃO** — O webhook de deploy do compose do Supabase no EasyPanel **não foi acionado**: redeployar o stack do banco reinicia serviços e não era necessário para a migração.

### 2.5 Mensagem bíblica unificada

- **PEDIDO** — Deixar apenas **uma** mensagem bíblica: um versículo por acesso, em balão com opção de sair/fechar.
- **FALHA** — Existiam dois canais concorrentes: versículos por período (manhã/tarde, com som/toast/notificação e cartão fixo na sidebar) e o versículo por acesso em balão.
- **CORREÇÃO** — Removidos o ciclo manhã/tarde do `reminders.js`, o cartão `#daily-verse-card` da sidebar e as configurações de horário de versículo. Mantido apenas o balão por acesso (`verse-access.js`), que já possui botão **X** e permanece na tela até ser fechado.
- **DECISÃO** — A tabela `time_tasks_verse_deliveries` e as colunas de versículo em `time_tasks_settings` foram mantidas no banco (dados históricos preservados; remoção fica para uma limpeza futura, se desejada).

---

## 3. Estado atual (o que está funcionando)

- Login/cadastro multiusuário pelo botão **Criar conta**, com acesso exclusivo por `time_tasks_members` e RLS em todas as 8 tabelas.
- CRUD completo de eventos (agora com baixa SIM/NÃO) e tarefas/sementes.
- SX com memória de conversa: cria, reedita, adia, desmarca e dá baixa por texto ou voz.
- Lembretes internos com som, respeitando baixa de eventos e conclusão de tarefas.
- Versículo único por acesso em balão fechável.
- Agendamento público por slug com bloqueio de horário duplicado.
- Banco de produção migrado e verificado (coluna `completed` ativa).
- Build Vite limpo e servidor Node com CSP e rate limit.

## 4. Pendências e riscos

- **PENDÊNCIA (deploy)** — O código novo está no branch `claude/phase-sync-roadmap-update-1d98ei`. Para chegar à produção falta: merge para `main` → deploy do serviço do app no EasyPanel → smoke test (`/api/health`, login, SX, baixa). O banco **já está pronto** — a ordem segura é exatamente essa, e nada quebra no app atual porque a coluna nova tem default.
- **RISCO (credenciais)** — API key do EasyPanel, token do GitHub e service-role key foram compartilhados em texto plano no chat da sessão. **Rotacionar os três** após o deploy. Nenhum deles foi gravado neste repositório.
- **PENDÊNCIA (fases futuras)** — Fase 6: clima (Open-Meteo); Fase 7: Trigger e central de notificações reais; Fase 8: WCAG/segurança/smoke tests; Fase 9: README/AGENTS revisados; Fase 10: verificação de produção completa.
- **PENDÊNCIA (infra)** — Web Push/service worker para alertas com o navegador fechado (hoje os lembretes funcionam apenas com o app aberto).
- **RISCO (limpeza adiada)** — `time_tasks_verse_deliveries` e colunas `verse_*` em `time_tasks_settings` ficaram órfãs no banco; inofensivas, mas devem ser removidas em migração futura para não confundir.

## 5. Melhor caminho (próximos passos, em ordem)

1. Merge do branch de trabalho em `main` e deploy do app no EasyPanel.
2. Smoke test em produção: login, criação de conta nova, evento pela SX ("adie", "desmarque", "dê baixa"), balão do versículo, lembrete.
3. Rotacionar as credenciais expostas (GitHub, EasyPanel, service-role).
4. Fase 6 (clima) — menor esforço/valor imediato visual.
5. Fase 7 (Trigger) — habilita a central de notificações que a UI já exibe.
6. Fases 8–10 — endurecimento, documentação final e verificação de produção.

---

## 6. Critério permanente de pronto

Uma entrega só é considerada concluída quando passa por build, banco/RLS, autenticação, CRUD real, teste visual, healthcheck, deploy público, paridade `HEAD == origin/main` **e registro neste diário + ROADMAP + MANUAL_DE_USO**.
