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

## Fase 5 ✅ Gestão de Eventos

> Sistema completo de criação, edição e exclusão de eventos.

- **CRUD Completo** — Criar, Ler, Atualizar e Deletar eventos
- **Persistência localStorage** — Eventos salvos automaticamente no navegador
- **Formulário Modal** para criação e edição de eventos com campos:
  - Título do evento
  - Data e hora de início
  - Data e hora de término
  - Calendário / categoria (com cor)
  - Opção de evento de dia inteiro
  - Descrição (opcional)
- **Popover de Preview** — Ao clicar em um evento, exibe resumo com opções de editar/excluir
- **Detecção de Conflitos** — Identificação visual de eventos com horários sobrepostos
- **Cores por Calendário** — Cada calendário possui sua cor distinta:
  - 🟣 Pessoal (roxo)
  - 🔵 Trabalho (azul)
  - 🟢 Saúde (verde)
  - 🟠 Estudos (laranja)
  - 🩷 Social (rosa)
- Renderização de eventos na grade com posicionamento por horário
- Criação rápida de evento ao clicar em um slot de horário
- Validação de formulário (título obrigatório, horários válidos)
- Confirmação antes de excluir eventos

---

## Fase 6 ✅ Experiência do Usuário

> Polimento da interface e interações avançadas.

- **Atalhos de Teclado** para navegação rápida:
  - `T` → Hoje | `N` → Novo Evento
  - `D` → Dia | `W` → Semana | `M` → Mês
  - `←` / `→` → Navegar períodos
  - `Esc` → Fechar modal/popover
- **Micro-animações** em botões, cards e transições de visão
- **Toast Notifications** — Feedback visual para ações (evento criado, editado, excluído)
- **Responsividade** — Adaptação para tablets e telas menores
- Efeitos hover e focus em elementos interativos
- Animação de entrada/saída para modais e popovers
- Feedback tátil visual ao interagir com a grade
- Estados de loading e empty states
- Scroll suave para o horário atual ao abrir

---

## Fase 7 ✅ Documentação

> Documentação completa do projeto.

- 📖 **README.md** — Apresentação do projeto, instalação, uso e créditos
- 🗺️ **ROADMAP.md** — Este documento com todas as fases de desenvolvimento
- 📘 **MANUAL.md** — Manual completo do usuário com instruções detalhadas
- Documentação de atalhos de teclado
- Guia de estrutura do projeto
- Informações de licença (MIT)

---

## Fase 8 ✅ GitHub

> Publicação e versionamento do projeto.

- Criação do repositório no GitHub
- Configuração do `.gitignore` para Node.js/Vite
- Commit inicial com toda a base de código
- Push para o repositório remoto
- Organização de branches (main)
- Documentação no repositório (README visível no GitHub)

---

## Fase 9 🔮 Futuro

> Funcionalidades planejadas para versões futuras.

### 🖱️ Interações Avançadas
- **Drag-and-Drop** para mover eventos entre horários e dias
- **Resize de Eventos** — Arrastar bordas para alterar duração
- Copiar e colar eventos
- Desfazer/Refazer ações (Ctrl+Z / Ctrl+Shift+Z)

### 🔄 Recorrência de Eventos
- Eventos recorrentes (diário, semanal, mensal, anual)
- Edição de evento único vs. toda a série
- Padrões de recorrência customizados
- Exceções em recorrências

### 🌐 Integrações
- **Google Calendar API** — Sincronização bidirecional com Google Calendar
- **Outlook Calendar** — Integração com Microsoft 365
- **CalDAV** — Suporte a servidores de calendário abertos

### 📲 Progressive Web App (PWA)
- Manifest e Service Worker para instalação como app
- Funcionamento offline completo
- **Notificações Push** — Lembretes de eventos via navegador
- Sincronização em background

### 🔍 Busca e Filtros
- **Busca de Eventos** — Pesquisar por título, descrição ou calendário
- Filtros avançados por data, calendário e tipo
- Resultados com navegação rápida para o evento

### 📁 Importação e Exportação
- **Exportar ICS** — Exportar eventos no formato iCalendar (.ics)
- **Importar ICS** — Importar eventos de outros calendários
- Exportar para PDF / imagem
- Backup e restauração de dados

### 🌍 Internacionalização
- **Multi-idioma** — Suporte a Português, Inglês, Espanhol
- Formatação de datas por localidade
- Primeiro dia da semana configurável (Domingo/Segunda)
- Fuso horário configurável

### 🤖 Inteligência Artificial
- **AI Scheduling** — Sugestões inteligentes de horários
- Agendamento automático baseado em padrões
- Análise de produtividade e relatórios
- Resumo semanal gerado por AI
- Detecção inteligente de conflitos com sugestões de resolução

### 🎨 Personalização
- Temas customizados pelo usuário
- Cores de calendário editáveis
- Layout configurável (sidebar esquerda/direita, compacto/expandido)
- Densidade da grade (15min, 30min, 1h)

### 👥 Colaboração
- Compartilhamento de calendários
- Convites para eventos
- Disponibilidade de participantes
- Calendários de equipe

---

<p align="center">
  <em>Roadmap atualizado em Julho de 2025</em><br>
  <strong>⏰ Time Tasks</strong>
</p>
