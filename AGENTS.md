# AGENTS.md — SX Time Tasks

Instruções para qualquer agente (Claude Code ou outro) que operar neste repositório.

## Escopo absoluto

- Projeto autorizado: `/Users/sergioponte/TIME TASKS`.
- Remoto autorizado: `https://github.com/sxsevenxperts/TIME-TASKS.git`.
- Nunca abrir, editar, commitar ou implantar nada em `/Users/sergioponte/APPS/ELEVENCHAT`, SEVENCHAT, ElevenChat ou qualquer outro produto a partir de uma tarefa aberta neste repositório.
- Antes de qualquer alteração, executar e conferir:
  ```bash
  pwd
  git status --short --branch
  git remote -v
  git rev-parse HEAD
  git rev-parse origin/main
  ```
  Se o diretório ou o remoto não forem exatamente os esperados, parar e reportar o bloqueio em vez de prosseguir.

## Documento mestre da evolução visual/funcional

O plano completo de evolução (shell mobile, SX sempre aberta no desktop, calendário compacto, Seed/Trigger, clima, versículo por acesso, mostrar/ocultar senha, 15 falhas já identificadas, 9 fases de implementação e matriz de critérios de aceite) está em:

- [`PLANNER_PROMPT_MESTRE_TIME_TASKS.md`](./PLANNER_PROMPT_MESTRE_TIME_TASKS.md)

Esse arquivo é a fonte de verdade para qualquer tarefa relacionada às referências visuais do Toki adaptadas ao SX Time Tasks. Ele não foi executado ainda — é plano, não implementação. Ao iniciar essa evolução:

1. Copiar a seção **Prompt mestre para execução** para a tarefa ativa.
2. Seguir a ordem de fases (Fase 0 a Fase 9) descrita no documento.
3. Criar e manter `MANUAL_DE_BORDO.md` conforme especificado na Fase 8, registrando cada item com as etiquetas `PEDIDO`, `PERGUNTA`, `DECISÃO`, `IDEIA`, `FALHA`, `CORREÇÃO`, `VALIDAÇÃO`, `PENDÊNCIA` ou `RISCO`.
4. Não declarar uma fase concluída sem os gates de verificação descritos na própria fase.

## Documentação existente

- [`README.md`](./README.md) — arquitetura, estado atual, tabelas Supabase.
- [`ROADMAP.md`](./ROADMAP.md) — roadmap do produto.
- [`MANUAL_DE_USO.md`](./MANUAL_DE_USO.md) — fluxos de uso validados.
- [`MANUAL.md`](./MANUAL.md) — ponte para o manual oficial.
- [`MANUAL_DE_BORDO.md`](./MANUAL_DE_BORDO.md) — diário de bordo do projeto (criado em 16/07/2026); atualizar a cada fase concluída com as etiquetas padronizadas.

## Anti-padrões proibidos (resumo)

Ver lista completa na seção 11 do planner mestre. Destaques:

- Não renomear o produto ou a assistente SX para "Toki" — é só referência visual.
- Não introduzir React, Vue, FullCalendar ou Tailwind sem justificativa arquitetural aprovada — a base é vanilla JS + Vite.
- Não usar `data-target="seed"` — o target existente é `seeds` (plural).
- Não marcar toggle de Trigger como ativo sem executor funcional real.
- Não expor service-role, chave de IA ou segredo de provedor no frontend.
- Não editar `dist/` manualmente — gerar pelo build.
- Não fazer commit de `.env*`, token, chave ou credencial.
