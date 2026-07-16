# 🗺️ Roadmap — Time Tasks

> Planejamento completo de desenvolvimento do projeto Time Tasks.
> Cada fase representa um marco na construção da aplicação.

---

## Fase 1 ✅ Fundação

> Configuração inicial do projeto e infraestrutura de desenvolvimento.

- Inicialização do projeto com **Vite** como build tool
- Configuração do `package.json` com scripts de desenvolvimento e build
- Definição da estrutura de diretórios (`src/`, `public/`, `styles/`, `modules/`)
- Criação do `index.html` com estrutura semântica HTML5
- Configuração do `vite.config.js` para desenvolvimento local
- Setup do servidor de desenvolvimento com Hot Module Replacement (HMR)
- Organização modular do JavaScript com ES Modules

---

## Fase 2 ✅ Design System

> Criação do sistema visual completo da aplicação.

- Implementação de **CSS Custom Properties** (variáveis CSS) para tokens de design
- Criação da paleta de cores completa com variantes para tema claro e escuro
- Sistema de **tema Dark / Light** com alternância dinâmica
- Detecção automática da preferência de tema do sistema operacional (`prefers-color-scheme`)
- Tipografia com fonte **Inter** (Google Fonts) em múltiplos pesos
- Escala tipográfica consistente (headings, body, captions)
- Efeitos de **Glassmorphism** (backdrop-filter, transparência, blur)
- Sistema de espaçamento e border-radius padronizados
- Sombras e elevações por camada (surface, raised, overlay)
- Transições e animações CSS suaves para interações
- Reset CSS e estilos base normalizados

---

## Fase 3 ✅ Layout Principal

> Construção da estrutura visual e componentes de interface.

- **Sidebar** lateral com mini-calendário e lista de calendários
- **Header** com título do período, navegação (anterior/próximo/hoje) e seletor de visão
- **Grid do Calendário** com coluna de horários e colunas por dia
- **Mini-Calendário** navegável na sidebar com destaque do dia atual
- Botão de criação de novo evento ("+") na sidebar
- Botão de alternância de tema (ícone sol/lua)
- Layout responsivo com CSS Grid e Flexbox
- Indicadores visuais de dia atual na grade
- Separação visual entre dias da semana e fins de semana

---

## Fase 4 ✅ Motor do Calendário

> Lógica central de navegação temporal e renderização das visões.

- **Visão Semanal** — Grade de 7 dias com slots de horário (00h-23h)
- **Visão Diária** — Foco em um único dia com slots de horário expandidos
- **Visão 3 Dias** — Visualização compacta de 3 dias consecutivos
- **Visão Mensal** — Grade de calendário tradicional com dias do mês
- Navegação temporal com botões anterior/próximo por período
- Botão "Hoje" para retorno rápido à data atual
- Cálculo correto de semanas, meses e limites de período
- **Indicador "agora"** — Linha vermelha que marca o horário atual em tempo real
- Atualização automática do indicador de hora atual
- Sincronização entre mini-calendário e visão principal
- Transições suaves entre visões e períodos

---

## Fase 5 ✅ Gestão de Eventos (Migração SaaS - Supabase)

> Sistema completo de criação, edição e exclusão de eventos armazenados no Supabase.

- **CRUD Completo** — Criar, Ler, Atualizar e Deletar eventos (PostgreSQL via Supabase)
- **Persistência em Nuvem** — Eventos salvos e carregados diretamente do banco de dados (SaaS)
- **Formulário Modal** para criação e edição de eventos
- **Popover de Preview** — Ao clicar em um evento, exibe resumo com opções de editar/excluir
- **Detecção de Conflitos** — Identificação visual de eventos com horários sobrepostos
- **Cores por Calendário** — 5 categorias (Pessoal, Trabalho, Saúde, Estudos, Social)
- Renderização de eventos na grade com posicionamento por horário
- Criação rápida de evento ao clicar em um slot de horário

---

## Fase 6 ✅ Experiência do Usuário

> Polimento da interface e interações avançadas.

- **Atalhos de Teclado** para navegação rápida (T, N, D, W, M, setas, Esc)
- **Micro-animações** em botões, cards e transições de visão
- **Toast Notifications** — Feedback visual para ações
- **Responsividade** — Adaptação para tablets e telas menores
- Estados de loading e empty states
- Scroll suave para o horário atual ao abrir

---

## Fase 7 ⚠️ IA (SX), Autenticação e SevenChat

> Segurança, isolamento de dados e assistente de inteligência artificial.

- **Autenticação Segura** — Tela de login e registro via Supabase Auth
- **Row Level Security (RLS)** — Isolamento completo dos dados; cada usuário só acessa os seus próprios eventos
- **SX IA (Integração Gemini)** — Chat inteligente embutido na interface
- **Criação de Eventos por Linguagem Natural** — A IA interpreta frases ("reunião amanhã às 14h") e salva automaticamente no calendário
- **Deploy no Servidor Easypanel** — Banco de dados hospedado em servidor Cloud
- **SevenChat no front-end** — Sidebar com toggle, foco automático, estado acessível e layout responsivo
- **Tratamento de inicialização** — Configuração Supabase inválida não derruba o shell; sessão inicial é restaurada explicitamente
- **Persistência confirmada** — Criação, edição, exclusão e criação por IA aguardam o retorno do Supabase antes de exibir sucesso
- **Pendente de ambiente** — O Supabase remoto ainda precisa permitir o domínio real do frontend no CORS; `Access-Control-Allow-Origin: *` com credenciais causa `Failed to fetch` no navegador e mantém o login bloqueado

---

## Fase 8 ✅ Documentação

> Documentação completa do projeto.


---

### Fase 8 ⚠️ Infraestrutura e Deploy (Easypanel + Supabase)
- **Hospedagem Frontend**: Configurado build via Nixpacks (Vite + `serve` estático) no servidor Easypanel.
- **Banco de Dados Isolado**: Deploy do backend Supabase via container no Easypanel (SaaS 100% isolado).
- **Segurança de Variáveis (Correção de Falha)**: 
  - *Falha Apontada*: O arquivo `.env.local` é bloqueado pelo `.gitignore`. Logo, quando o Easypanel puxava o código do GitHub para fazer o build, as chaves do Supabase não existiam lá, quebrando a conexão. 
  - *Caminho de Resolução*: Para aplicações Frontend (onde a chave `ANON_KEY` é pública por design), a melhor prática para deploys automatizados sem precisar configurar o painel do servidor é utilizar um arquivo `.env.production` commitado no repositório.
  - *Ação Tomada*: O arquivo `.env.production` foi criado e enviado ao GitHub, garantindo que o build do Easypanel agora tenha acesso nativo às chaves do Supabase (URL e ANON_KEY) automaticamente, sem intervenção manual.
- **Autenticação Segura**: Melhorias na UX de Login (Loading overlay para evitar flicker) and feedback visual de exigência de confirmação de e-mail.
- **Falha atual identificada**: O endpoint remoto responde `200` via `curl`, mas o navegador bloqueia a autenticação por CORS incompatível. Corrigir no gateway/Supabase com `Access-Control-Allow-Origin` igual ao domínio publicado do frontend e `Access-Control-Allow-Credentials: true`; não usar `*` nesse cenário.
- **Falha de banco identificada**: O endpoint REST remoto retornou `PGRST205` porque `public.events` não existe. O schema idempotente foi adicionado em `supabase/schema.sql` e precisa ser executado no Postgres do Supabase self-hosted.
- **Segurança corrigida no repositório**: scripts administrativos não carregam mais service-role key hardcoded; usar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente seguro.

### Fase 8.1 🔧 Gate de publicação — próximo passo obrigatório

1. Configurar o domínio final do frontend na lista de origens permitidas do Supabase/EasyPanel.
2. Rebuild e redeploy do frontend.
3. Validar login, restauração de sessão, logout e abertura do SevenChat no navegador.
4. Validar criação, edição e exclusão de evento com retorno real do banco.
5. Registrar URL, horário do deploy e `HEAD` publicado no handoff.

## Fase 9 🔮 Futuro

> Funcionalidades planejadas para versões futuras.

### 🖱️ Interações Avançadas
- **Drag-and-Drop** para mover eventos entre horários e dias
- **Resize de Eventos** — Arrastar bordas para alterar duração

### 🔄 Recorrência de Eventos
- Eventos recorrentes (diário, semanal, mensal) e edições em série

### 🌐 Integrações & Notificações
- **Google Calendar API** — Sincronização bidirecional
- **Push Notifications** (PWA)

### 🤖 Evolução da Inteligência Artificial (SX)
- Agendamento automático para descobrir o melhor horário (AI Scheduling)
- Resumos da semana / Análise de produtividade
- Detecção inteligente de conflitos com sugestões de reagendamento sugeridas pela IA

---

<p align="center">
  <em>Roadmap atualizado em Julho de 2026 (Migração SaaS)</em><br>
  <strong>⏰ Time Tasks</strong>
</p>
