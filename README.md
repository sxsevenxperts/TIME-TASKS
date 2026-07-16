# ⏰ Time Tasks / SevenChat

> Um calendário web moderno e elegante, inspirado no [Toki Calendar](https://toki.day), construído com HTML, CSS e JavaScript puro.

![Time Tasks Preview](./docs/screenshot.png)

---

## 📋 Sobre o Projeto

**Time Tasks** é uma aplicação de calendário SaaS com autenticação por e-mail e senha, persistência de eventos no Supabase self-hosted e interface moderna com múltiplas visões, temas dark/light e SevenChat.

Ideal para quem busca uma ferramenta de organização pessoal leve, rápida e visualmente agradável.

---

## ✨ Funcionalidades

- 📅 **Calendário Semanal** — Visualização principal com grade de horários
- 🌓 **Modo Dark / Light** — Alternância de tema com detecção automática do sistema
- 🗓️ **Mini-Calendário** — Navegação rápida pela sidebar
- ✏️ **CRUD de Eventos** — Criar, visualizar, editar e excluir eventos
- 👁️ **Múltiplas Visões** — Dia, 3 Dias, Semana e Mês
- ⌨️ **Atalhos de Teclado** — Navegação rápida sem usar o mouse
- 🔐 **Supabase Auth** — Acesso autenticado por e-mail e senha
- ☁️ **Persistência PostgreSQL** — Eventos salvos no Supabase self-hosted
- 🛡️ **RLS** — Cada usuário acessa somente os próprios eventos
- 🎨 **5 Calendários Coloridos** — Pessoal, Trabalho, Saúde, Estudos e Social
- 🔍 **Detecção de Conflitos** — Alerta visual para eventos sobrepostos
- 🪟 **Glassmorphism UI** — Design moderno com efeitos de vidro e transparência
- 📱 **Responsivo** — Adaptado para diferentes tamanhos de tela
- 🔔 **Toast Notifications** — Feedback visual para todas as ações

---

## 🛠️ Tech Stack

| Tecnologia | Descrição |
|---|---|
| **HTML5** | Estrutura semântica da aplicação |
| **CSS3** | Estilização com Custom Properties, Glassmorphism, animações |
| **JavaScript ES6+** | Lógica da aplicação com módulos nativos |
| **Vite** | Build tool e dev server com Hot Module Replacement |
| **Supabase** | Auth, PostgreSQL, API REST e Row Level Security |
| **Docker / Easypanel** | Build e hospedagem do frontend em Node 22 Alpine |

---

## 🚀 Instalação e Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v22 ou superior)
- [npm](https://www.npmjs.com/) (incluído com Node.js)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/time-tasks.git

# 2. Entre na pasta do projeto
cd time-tasks

# 3. Instale as dependências
npm ci

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000` (ou a porta indicada no terminal).

### Build para Produção

```bash
# Gerar build otimizado
npm run build

# Pré-visualizar a build
npm run preview
```

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `T` | Ir para **Hoje** |
| `N` | Abrir formulário de **Novo Evento** |
| `D` | Alternar para visão de **Dia** |
| `W` | Alternar para visão de **Semana** |
| `M` | Alternar para visão de **Mês** |
| `←` | Navegar para o **período anterior** |
| `→` | Navegar para o **próximo período** |
| `Esc` | Fechar modal / popover aberto |

---

## 📁 Estrutura do Projeto

```
time-tasks/
├── index.html          # Página principal
├── package.json        # Dependências e scripts
├── vite.config.js      # Configuração do Vite
├── js/                 # Módulos do front-end
├── style.css           # Tokens e componentes visuais
├── layout.css          # Layout, responsividade e SevenChat
├── .env.production     # Configuração pública do build (URL/anon key)
├── supabase/schema.sql  # Tabela events, RLS e permissões do SaaS
├── README.md           # Este arquivo
├── ROADMAP.md          # Roadmap do projeto
└── MANUAL.md           # Manual do usuário
```

---

## 📄 Documentação

- 📖 [Manual do Usuário](./MANUAL.md) — Guia completo de uso, deploy e SevenChat
- 🗺️ [Roadmap](./ROADMAP.md) — Fases de desenvolvimento e funcionalidades futuras

## Banco Supabase no Easypanel

O schema [`supabase/schema.sql`](./supabase/schema.sql) está aplicado no Supabase self-hosted. O script idempotente cria `public.events`, ativa RLS e restringe cada usuário aos próprios eventos; execute-o novamente apenas ao provisionar ou restaurar o banco.

### Produção

- Frontend: [startups-timetasks.qfotry.easypanel.host](https://startups-timetasks.qfotry.easypanel.host/)
- Builder no Easypanel: `Dockerfile`
- Runtime: Node 22 Alpine, servidor estático `serve` na porta interna `3000`

### Isolamento obrigatório

Cada conta acessa somente os próprios eventos por login e senha e pelas políticas RLS. O endpoint Supabase atualmente configurado também foi encontrado no Smart Stoma; portanto, os dados de `public.events` estão isolados, mas o namespace de Auth ainda é compartilhado. Para isolamento absoluto de cadastro, e-mail e senha entre aplicativos, provisionar um compose Supabase dedicado ao Time Tasks e substituir a URL e as chaves do build.

---

## 📜 Licença

Este projeto está licenciado sob a **MIT License**.

```
MIT License

Copyright (c) 2025 Time Tasks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Créditos

- Inspirado no [Toki Calendar](https://toki.day) — um calendário web minimalista e elegante
- Tipografia: [Inter](https://fonts.google.com/specimen/Inter) por Rasmus Andersson
- Ícones: SVG customizados

---

<p align="center">
  Feito com ❤️ e ☕ — <strong>Time Tasks</strong>
</p>
