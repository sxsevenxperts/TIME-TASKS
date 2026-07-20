# SX Time Tasks — v2.1

**Gerenciador de eventos, tarefas e lembretes com assistente IA humanizada (SX).**

[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/sxsevenxperts/TIME-TASKS)
[![PWA](https://img.shields.io/badge/pwa-installable-blue.svg)](#pwa)
[![Lighthouse](https://img.shields.io/badge/lighthouse-92%2F100-green.svg)](./PERFORMANCE_GUIDE.md)
[![Security](https://img.shields.io/badge/security-rls%20%2B%20csp-brightgreen.svg)](./MANUAL_DE_BORDO.md#10-segurança)

![Identidade visual do SX Time Tasks](./public/sx-time-tasks-logo.png)

---

## 🎯 O que é

**SX Time Tasks** é um aplicativo web completo para gerenciar sua agenda com uma assistente inteligente que entende português natural. Crie, edite, adie ou conclua eventos apenas falando. Receba notificações automáticas (web push), sincronize com Google Calendar e Apple Calendar, configure lembretes customizados e muito mais.

**Versão:** 2.1 (Fases 1–12 completas)  
**Status:** ✅ Produção  
**Produção:** https://startups-timetasks.qfotry.easypanel.host

### ✨ Principais características

- **🗓️ Calendário completo:** Dia, 3 Dias, Semana, Mês com categorias
- **✨ SX — Assistente humanizada:** Cria, edita, adia, desmarca, dá baixa — por texto/voz
- **📱 PWA:** Installável, offline-first, notificações push com app fechado
- **🔔 Web Push:** Lembretes automáticos, triggers customizados (clima, resumo)
- **📅 Sincronização:** Google Calendar (OAuth) + Apple Calendar (CalDAV) — bidirecional
- **⚡ Triggers:** Automações de notificação (clima, resumo da agenda, lembretes)
- **🔐 Segurança:** RLS no Supabase, CSP, validação server-side
- **📱 Mobile-first:** Viewport otimizado, sem zoom manual necessário
- **🎤 Voz:** Web Speech API, português
- **📖 Versículo:** Um por acesso (bible-api.com)
- **🌍 Clima:** Open-Meteo com geolocalização
- **📝 Tarefas:** CRUD com prazos, lembretes, conclusão
- **🔗 Agendamento:** Links públicos com bloqueio de horários duplicados

---

## 🚀 Começar

### Pré-requisitos

```
Node.js 22+
npm 10+
Supabase (self-hosted ou Cloud)
Variáveis de ambiente (.env.local)
```

### Instalação & Dev

```bash
git clone https://github.com/sxsevenxperts/TIME-TASKS.git
cd TIME-TASKS
npm install

# .env.local (ver .env.example)
npm run dev
# Abre em http://localhost:5173
```

### Build & Produção

```bash
npm run build
PORT=3000 npm start

# ou deploy em Docker (EasyPanel, Railway, etc.)
```

---

## 📖 Documentação completa

| Arquivo | Conteúdo |
|---------|----------|
| **MANUAL_DE_BORDO.md** | Histórico técnico, decisões, stack, troubleshooting |
| **ROADMAP.md** | Fases (1–12), status, versões |
| **ACCESSIBILITY.md** | Auditoria WCAG 2.1 |
| **SMOKE_TEST.md** | Testes manuais, checklist |
| **PERFORMANCE_GUIDE.md** | Cache, bundle, Web Vitals |
| **PWA_DEPLOYMENT.md** | Service Worker, manifest, offline |

---

## 🏗️ Arquitetura

### Stack

```
Frontend:    Vanilla JS (ES Modules) + Vite 6
Backend:     Node.js 22 + http nativo
Banco:       Supabase (PostgreSQL, Auth, RLS)
IA:          Google Gemini 1.5 Flash
PWA:         Service Worker + Web Push
Clima:       Open-Meteo (gratuita)
Versículos:  bible-api.com
Hospedagem:  EasyPanel (Docker)
```

### Fluxo principal

```
Login → timetasks:session → carrega dados
  ↓
Criar evento (SX ou manual) → /api/sx (Gemini) ou Supabase CRUD
  ↓
Atualiza UI, persiste em RLS
  ↓
Lembretes/Triggers executam cada minuto (server-side)
  → Criam notificações → Enviam Web Push
  ↓
Offline? Service Worker serve cache
Reconectou? Background Sync sincroniza
```

### Tabelas (todas com RLS)

```
time_tasks_members              (acesso exclusivo)
time_tasks_events               (agenda)
time_tasks_seeds                (tarefas)
time_tasks_settings             (preferências)
time_tasks_sx_messages          (histórico SX)
time_tasks_triggers             (automações)
time_tasks_notifications        (central de notif.)
time_tasks_push_subscriptions   (device endpoints)
time_tasks_booking_pages        (agend. público)
time_tasks_bookings             (reservas)
time_tasks_calendar_integrations
time_tasks_sync_logs
```

---

## 🔐 Segurança

- **Autenticação:** Supabase Auth (JWT + refresh token)
- **Rate limit:** 20 req/min por usuário (/api/sx, /api/verse)
- **RLS:** Todas as tabelas com políticas row-level security
- **CSP:** `script-src 'self'`, `connect-src self + Supabase + APIs`
- **Validação:** Eventos destrutivos validados contra agenda real
- **Chaves:** Gemini, service-role, VAPID — apenas servidor
- **Headers:** X-Frame-Options, nosniff, Permissions-Policy

---

## 🎤 Usando a SX

### Criar eventos
- "Agende meu médico terça às 3pm"
- "Meeting com João amanhã 10h, 1 hora"
- "Remédio quinta e domingo 19h"

### Editar
- "Adie o médico para quarta"
- "Mude a meeting para 14h"

### Desmarcar/Excluir
- "Cancele o dentista"
- "Delete o evento de sexta"

### Dar baixa (concluído)
- "Dê baixa no exercício" → SIM/NÃO modal
- "Marque como pronto"

---

## 🔔 Notificações

### Lembretes automáticos
Som + toast (app aberto) ou Web Push (fechado).

### Dashboard de notificações
Clique no 🔔 (sino) na nav-strip:
- Filtros (Todas, Não lidas, Triggers, Lembretes, Sistema)
- Marcar como lido, deletar, limpar lidas
- Badge com contador

### Triggers customizados
Configure em **Triggers**:
- **Weather:** Notifique quando temperatura > limiar
- **Summary:** Resumo da agenda a uma hora fixa
- **Reminder:** Mensagem customizada periódica

---

## 📱 PWA

### Instalar
- **Android:** Chrome → menu → "Instalar app"
- **iOS:** Safari → Compartilhar → "Adicionar à Home"

### Offline
- Data cached (IndexedDB)
- Network-first para APIs (fallback cache)
- Cache-first para assets estáticos
- Sync automático ao reconectar

### Notificações com app fechado
Web Push via Service Worker (requer VAPID keys em produção).

---

## 🌐 Calendários externos

### Google Calendar
Configurações → Conectar Google → OAuth → Sync automático 5min

### Apple Calendar
Configurações → Conectar Apple → Email/Senha iCloud → Calendários descobertos

---

## 🛠️ Desenvolvimento

### Adicionar novo módulo

```js
// js/meu-modulo.js
export function initMeuModulo() {
  // código
}

// js/app.js
import { initMeuModulo } from './meu-modulo.js';
// ...
initMeuModulo();
```

### Testes

```bash
npm run build                   # Compilar
node --check js/**/*.js         # Sintaxe
npm audit --omit=dev            # Vulns
```

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| SX não responde | `/api/health` → `sx: true`? Chave Gemini ok? |
| Calendário vazio | Usuário em `time_tasks_members`? Ctrl+Shift+R |
| Clima não aparece | Permissão geolocalização? CSP atualizado? |
| Notificações não chegam | VAPID keys? Permissão navegador? |

Mais em **MANUAL_DE_BORDO.md**.

---

## 📊 Performance

- **Bundle:** 327 KB (gzip: 87 KB)
- **Lighthouse:** 92/100
- **TTI:** 2.5s
- **LCP:** < 2.8s

---

## 📜 Licença

Propriedade de **SX / Empresa Modelo**. Repositório privado.

---

## 📞 Suporte

- **Issues:** https://github.com/sxsevenxperts/TIME-TASKS/issues
- **Docs:** MANUAL_DE_BORDO.md
- **Roadmap:** ROADMAP.md

---

**Última atualização:** 19/07/2026 (v2.1, Fases 1–12 completas, Web Push em produção)
