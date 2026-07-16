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

## Falhas encontradas e corrigidas nesta revisão

| Falha | Correção | Evidência |
|---|---|---|
| Tabelas genéricas colidiam com SevenChat | Prefixo `time_tasks_*` | `sx_messages` do SevenChat permaneceu intacta |
| APIs aceitavam qualquer usuário do Auth compartilhado | Checagem obrigatória em `time_tasks_members` | conta temporária de outro app recebeu HTTP 401 |
| Estado vazio de tarefas ficava visível | regra `[hidden]` específica | teste visual após criação |
| Confirmação de reserva quebrava após `await` | referência do formulário preservada antes da operação | mensagem de sucesso exibida no link público |
| Horários apareciam com segundos | normalização no mapeamento do evento | exibição `HH:MM` |
| Chave da IA poderia ir ao cliente | proxy autenticado no servidor | frontend não contém chave privada |
| Documentação descrevia demo/SevenChat/`public.events` | manual, README e roadmap reescritos | documentação 2.0 |

## Próximas fases

### P1 — infraestrutura

- [ ] Provisionar uma instância Supabase dedicada se o requisito evoluir de isolamento lógico para isolamento físico de Auth, banco, chaves e recursos.
- [ ] Web Push + service worker + fila de entrega para notificações com navegador totalmente fechado.
- [ ] Monitoramento de erros, disponibilidade da API de versículos e métricas da SX.
- [ ] Rotação periódica de todas as credenciais operacionais.

### P2 — integrações

- [ ] Google Calendar bidirecional com OAuth.
- [ ] Canais WhatsApp e Telegram.
- [ ] Eventos recorrentes e edição em série.
- [ ] Sugestão automática de reagendamento em conflitos.

### P3 — evolução do produto

- [ ] Drag-and-drop e redimensionamento de eventos.
- [ ] Modo offline com sincronização posterior.
- [ ] Resumo semanal e indicadores de produtividade pela SX.
- [ ] Aplicativos móveis/lojas, caso o uso web valide a demanda.

## Critério permanente de pronto

Uma entrega só é considerada concluída quando passa por build, banco/RLS, autenticação, CRUD real, teste visual, healthcheck, deploy público e paridade `HEAD == origin/main`.
