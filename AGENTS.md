# AGENTS.md — SX Time Tasks v2.1

**Instruções para agentes (Claude Code, etc.) operando neste repositório.**

---

## 🎯 Estado do projeto (19/07/2026)

**Versão:** 2.1 (PRODUÇÃO)  
**Fases completas:** 1–12  
**Entrega:** 6 PRs mergeados, deploy 12.10 verificado, Web Push em produção  
**Branch:** `main` (merged, histórico em `claude/pwa-mobile-layout-sync-fvxxf4`)

### ✅ Concluído

- Fase 1–3: Shell mobile, navegação, calendário responsivo
- Fase 4: Toggle de senha, versículo por acesso
- Fase 5–9: Clima, triggers, WCAG, docs, smoke test
- Fase 10–11: Calendários externos (Google/Apple), PWA completo
- **Fase 12:** Mobile layout otimizado + Web Push em produção
  - 12.1–12.3: Fix boot, mobile layout, chat inicial
  - 12.4–12.7: Web Push end-to-end, login persistente
  - 12.8–12.10: PWA fixes, cache headers (6 PRs)

### 📋 Pendências (Fase 13+)

1. Dashboard de notificações (✅ ADICIONADO em 19/07)
2. Executor de triggers (✅ FUNCIONAL, need UI modal real)
3. README/AGENTS finais (✅ ATUALIZADOS)
4. Rotacionar credenciais expostas (GitHub, EasyPanel, service-role)
5. Purge de cache Cloudflare (opcional, `?v=2` já contorna)

---

## 🔒 Escopo absoluto

**Projeto:** `/home/user/TIME-TASKS` (ou seu equivalente local)  
**Git remoto:** `https://github.com/sxsevenxperts/TIME-TASKS.git`  
**Branch ativo:** `main` (production) — feature work em branches descritivos

**NUNCA:**
- Abrir, editar ou commitar em `/Users/sergioponte/APPS/ELEVENCHAT`, SEVENCHAT ou qualquer outro produto
- Editar `dist/` manualmente (sempre via `npm run build`)
- Commitar `.env*`, tokens, chaves ou credenciais
- Expor service-role, chave Gemini ou segredo de provedor no frontend
- Desabilitar git hooks (`--no-verify`) ou CSP sem justificativa explícita

**ANTES de qualquer alteração:**
```bash
pwd                              # Verificar diretório
git status --short --branch      # Estado
git remote -v                    # Remoto
git rev-parse HEAD               # Commit atual
git rev-parse origin/main        # Comparar
```

---

## 📚 Documentação

| Arquivo | Propósito |
|---------|-----------|
| **README.md** | Visão geral, features, getting started, troubleshooting |
| **ROADMAP.md** | Fases (1–12), status, versões, entregáveis |
| **MANUAL_DE_BORDO.md** | Histórico técnico, decisões, stack, RLS, security, fluxos |
| **MANUAL_DE_USO.md** | Fluxos de usuário, como usar a SX, interface |
| **ACCESSIBILITY.md** | Auditoria WCAG 2.1, compliance |
| **SMOKE_TEST.md** | Testes manuais, checklist de deploy |
| **PERFORMANCE_GUIDE.md** | Cache, bundle analysis, Web Vitals |
| **PWA_DEPLOYMENT.md** | Service Worker, manifest, offline |
| **PLANNER_PROMPT_MESTRE_TIME_TASKS.md** | Evolução visual/funcional original (24 fases) |

**Fonte de verdade para novas features:** `PLANNER_PROMPT_MESTRE_TIME_TASKS.md`

---

## 🚀 Iniciando uma tarefa

### 1. Verificar scope

```bash
git checkout main
git pull origin main
git status
```

### 2. Criar branch descritivo

```bash
git checkout -b feature/descricao-curta
# ou: fix/numero-do-issue
# ou: docs/atualizacao-readme
```

### 3. Desenvolver

- Testar localmente (`npm run dev`)
- Build (`npm run build`) sem erros
- Validar sintaxe (`node --check js/**/*.js`)
- Audit de vulns (`npm audit --omit=dev`)

### 4. Commit & Push

```bash
git add arquivo.js js/modulo.js ...
git commit -m "feat: Descrição breve

Descrição detalhada (por quê, não o quê).
Referência a issue/tarefa se aplicável.

Co-Authored-By: Claude <noreply@anthropic.com>
Claude-Session: https://..."

git push -u origin feature/descricao-curta
```

### 5. Monitorar & Mergear

- GitHub Actions roda (lint, build, test)
- Review if needed (CODEOWNERS)
- Merge para `main` desencadeia auto-deploy em produção (EasyPanel)

---

## 🎬 Workflow de features (Fase 13+)

Ao iniciar uma nova fase:

1. **Ler planejamento:** `PLANNER_PROMPT_MESTRE_TIME_TASKS.md` (se aplicável) ou issue/PRD
2. **Criar branch:** `feature/fase-13-nome-descritivo`
3. **Implementar:** Testar localmente, validar no browser
4. **Documentar:** MANUAL_DE_BORDO.md com etiquetas (PEDIDO, CORREÇÃO, VALIDAÇÃO, etc.)
5. **Commit & Push:** Incluir Co-Authored-By
6. **Sincronizar:** ROADMAP.md, README.md, MANUAL_DE_BORDO.md
7. **Verficar:** Smoke test em produção

---

## ⚠️ Anti-padrões proibidos

- **Nomes:** Não chamar a assistente de "Toki" — referência visual apenas; mantém "SX"
- **Stack:** Sem React, Vue, Tailwind ou FullCalendar (vanilla JS + Vite é base)
- **Targets:** `data-target="seeds"` (plural), não "seed"
- **Toggles:** Não marcar Trigger/Feature como ativo sem executor real
- **Segurança:** Sem service-role, chaves de IA ou secrets no frontend
- **Build:** Sem edições manuais em `dist/` — sempre via `npm run build`
- **Git:** Sem `.env*`, tokens, credenciais em commits
- **Performance:** Sem lazy-loading de bundle inteiro; split code com cuidado

---

## 🔧 Stack técnico (não mudar sem justificativa)

```
Frontend:    Vanilla JS (ES Modules) + Vite 6
Backend:     Node.js 22 nativo (sem Express)
Banco:       Supabase (PostgreSQL, Auth, RLS)
IA:          Google Gemini 1.5 Flash
PWA:         Service Worker + Web Push
Auth:        JWT + Supabase Auth
Cache:       IndexedDB + HTTP cache strategies
Hospedagem:  Docker + EasyPanel (Node 22 Alpine)
```

---

## 🧪 Verificação antes de deploy

```bash
# Sintaxe
node --check server.js
for f in js/*.js; do node --check "$f"; done

# Build
npm run build

# Vulnerabilidades
npm audit --omit=dev

# Diffs
git diff --check
git status

# Smoke test local
# (19+ verificações em SMOKE_TEST.md)
```

---

## 📞 Escalation

**Bloqueios:** Reportar diretamente; não prosseguir se incerto sobre scope/branch  
**Credenciais expostas:** Reportar imediatamente para rotação  
**Production issues:** Verificar MANUAL_DE_BORDO.md § 13 Troubleshooting primeiro

---

**Última atualização:** 19/07/2026 — v2.1 completa, 12 fases entregues, produção estável
