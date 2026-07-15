# ⏰ Time Tasks

> Um calendário web moderno e elegante, inspirado no [Toki Calendar](https://toki.day), construído com HTML, CSS e JavaScript puro.

![Time Tasks Preview](./docs/screenshot.png)

---

## 📋 Sobre o Projeto

**Time Tasks** é uma aplicação de calendário completa que roda diretamente no navegador. Com uma interface limpa e moderna, oferece múltiplas visões de calendário, gestão de eventos com CRUD completo, temas dark/light, e persistência local — tudo sem necessidade de backend ou conta de usuário.

Ideal para quem busca uma ferramenta de organização pessoal leve, rápida e visualmente agradável.

---

## ✨ Funcionalidades

- 📅 **Calendário Semanal** — Visualização principal com grade de horários
- 🌓 **Modo Dark / Light** — Alternância de tema com detecção automática do sistema
- 🗓️ **Mini-Calendário** — Navegação rápida pela sidebar
- ✏️ **CRUD de Eventos** — Criar, visualizar, editar e excluir eventos
- 👁️ **Múltiplas Visões** — Dia, 3 Dias, Semana e Mês
- ⌨️ **Atalhos de Teclado** — Navegação rápida sem usar o mouse
- 💾 **Persistência localStorage** — Seus dados salvos automaticamente no navegador
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

---

## 🚀 Instalação e Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [npm](https://www.npmjs.com/) (incluído com Node.js)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/time-tasks.git

# 2. Entre na pasta do projeto
cd time-tasks

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173` (ou a porta indicada no terminal).

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
├── src/
│   ├── main.js         # Ponto de entrada da aplicação
│   ├── styles/         # Arquivos CSS
│   └── modules/        # Módulos JavaScript
├── public/             # Assets estáticos
├── README.md           # Este arquivo
├── ROADMAP.md          # Roadmap do projeto
└── MANUAL.md           # Manual do usuário
```

---

## 📄 Documentação

- 📖 [Manual do Usuário](./MANUAL.md) — Guia completo de uso da aplicação
- 🗺️ [Roadmap](./ROADMAP.md) — Fases de desenvolvimento e funcionalidades futuras

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
