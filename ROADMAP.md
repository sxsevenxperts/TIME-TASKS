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

## Fase 7 ✅ IA (SX) e Autenticação (SaaS Completo)

> Segurança, isolamento de dados e assistente de inteligência artificial.

- **Autenticação Segura** — Tela de login e registro via Supabase Auth
- **Row Level Security (RLS)** — Isolamento completo dos dados; cada usuário só acessa os seus próprios eventos
- **SX IA (Integração Gemini)** — Chat inteligente embutido na interface
- **Criação de Eventos por Linguagem Natural** — A IA interpreta frases ("reunião amanhã às 14h") e salva automaticamente no calendário
- **Deploy no Servidor Easypanel** — Banco de dados hospedado em servidor Cloud

---

## Fase 8 ✅ Documentação

> Documentação completa do projeto.

- 📖 **README.md** — Apresentação do projeto e instruções
- 🗺️ **ROADMAP.md** — Todas as fases de desenvolvimento
- 📘 **MANUAL.md** — Manual do usuário, atalhos, login e IA

---

## Fase 9 ✅ GitHub

> Publicação e versionamento do projeto.

- Repositório no GitHub configurado com as chaves ofuscadas
- `.gitignore` protegendo as variáveis locais `.env.local`
- Versionamento do Schema SQL do banco de dados

---

## Fase 10 🔮 Futuro

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
