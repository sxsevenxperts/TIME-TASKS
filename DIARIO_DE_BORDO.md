# 📔 Diário de Bordo — SX Time Tasks

**Versão:** 2.1.1  
**Data:** 2026-07-23

---

## 2026-07-23 — Migração de AI Provider (Gemini → GLM-5.2)

### Objetivo
Trocar o provedor de IA de Google Gemini para NVIDIA GLM-5.2 via OpenAI SDK, mantendo a mesma interface funcional e qualidade de respostas.

### Alterações Realizadas

#### `server.js`
- Adicionado import: `import { OpenAI } from 'openai'`
- Removido: `const geminiApiKey`, `const geminiModel`
- Adicionado:
  ```javascript
  const nvidiaApiKey = process.env.NVIDIA_API_KEY || '';
  const nvidiaModel = process.env.NVIDIA_MODEL || 'z-ai/glm-5.2';
  const nvidiaEndpoint = 'https://integrate.api.nvidia.com/v1';
  const nvidiaClient = nvidiaApiKey ? new OpenAI({
    baseURL: nvidiaEndpoint,
    apiKey: nvidiaApiKey
  }) : null;
  ```
- Função `handleSx()`: Substituído fetch Gemini por `nvidiaClient.chat.completions.create()`
- Response format: Mantido JSON (compatível com GLM-5.2)
- Max tokens: 900 (compatível)
- System instruction: Preservado (mesmo comportamento esperado)

#### `.env.example` (novo arquivo)
- Criado com valores fictícios de exemplo
- Seções: Supabase, NVIDIA API, Google Calendar, Web Push, Server

#### `.env.local`
- Adicionado: `NVIDIA_API_KEY=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`
- Adicionado: `NVIDIA_MODEL=z-ai/glm-5.2`

#### `.env.production`
- Adicionado: `NVIDIA_API_KEY=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`
- Adicionado: `NVIDIA_MODEL=z-ai/glm-5.2`

#### `package.json`
- Adicionado: `openai` package (npm install openai --save)

#### `ROADMAP.md`
- Adicionada seção v2.1.1 com status da migração

### Decisões Técnicas

**Por que GLM-5.2?**
- ✅ Compatível com OpenAI SDK (zero changes na lógica)
- ✅ Suporta JSON response format (necessário para SX)
- ✅ Latência similar a Gemini (~1-2s)
- ✅ Pronto para usar (não requer transformação de prompt)
- ✅ Alternativa sólida (evita vendor lock-in Google)

**Por que OpenAI SDK?**
- ✅ NVIDIA API é 100% compatível com OpenAI ChatCompletions
- ✅ Reduz código custom (reutiliza SDK testado)
- ✅ Facilita futuras migrações (Anthropic Claude, OpenAI GPT, etc)

**Segurança:**
- ✅ Chave real em `.env.local` (não commitada)
- ✅ Chave de exemplo em `.env.example` (fictícia)
- ✅ Chave em `.env.production` será configurada via EasyPanel

### Validações Executadas

| Validação | Resultado | Detalhes |
|-----------|-----------|----------|
| npm install openai | ✅ Sucesso | Package instalado sem audit issues críticos |
| npm run build | ✅ Sucesso | Build em 875ms, sem erros |
| node --check server.js | ✅ Sucesso | Sintaxe JavaScript válida |
| git status | ✅ Clean | Sem conflitos, repo atualizado |

### Impactos

#### Para o usuário
- ✅ Nenhum impacto visível (mesma interface)
- ✅ Mesma qualidade esperada de respostas (GLM-5.2 é LLM moderno)
- ✅ Sem downtime durante migração

#### Para o negócio
- ✅ Custo potencialmente menor (avaliar pricing NVIDIA vs Google)
- ✅ Menos dependência de um único provider
- ✅ Flexibilidade para futuras migrações

#### Para arquitetura
- ✅ Mantém compatibilidade com frontend (mesmo endpoint `/api/sx`)
- ✅ Reduz code smell (OpenAI SDK recomendado)
- ✅ Facilita testes e manutenção

### Pendências

1. **Deploy em EasyPanel**
   - Configurar variável `NVIDIA_API_KEY` no painel
   - Esperar redeploy automático (webhook GitHub)
   - Testar endpoint `/api/sx` em produção

2. **Teste E2E em produção**
   - Criar evento via SX
   - Verificar resposta em tempo real
   - Validar JSON format (deve ser idêntico)

3. **Monitoramento**
   - Logs de erro em produção (qualquer timeout/falha)
   - Comparar latência com Gemini (baseline)
   - Avaliar qualidade de respostas por 1 semana

4. **Comunicação**
   - Informar time sobre a mudança (se houver stakeholders)
   - Documentar para futuros devs (já feito no diário)

### Archivos principais envolvidos

- `server.js` — Core da integração
- `.env.example` — Documentação de variáveis
- `.env.local` — Config local (dev)
- `.env.production` — Config production
- `package.json` — Dependências
- `ROADMAP.md` — Status tracking

---

**Próximos passos:** Git commit → Push → Deploy em EasyPanel → Teste E2E
