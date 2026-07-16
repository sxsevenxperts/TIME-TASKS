# Planner e prompt mestre — evolução visual e funcional do SX Time Tasks

> Documento criado em 16/07/2026 para ser copiado e colado em uma nova tarefa
> do projeto **SX Time Tasks**. Este arquivo consolida somente os pedidos que
> vieram acompanhados das referências visuais do Toki e que não pertencem ao
> SEVENCHAT/ELEVENCHAT.

## Como usar este documento

1. Abra uma nova tarefa vinculada ao repositório `/Users/sergioponte/TIME TASKS`.
2. Copie integralmente a seção **Prompt mestre para execução**.
3. Anexe novamente as imagens de referência se elas estiverem disponíveis.
4. Não execute este prompt em nenhum repositório do SEVENCHAT/ELEVENCHAT.
5. Considere o texto deste planner a fonte de verdade quando uma imagem estiver
   indisponível ou ambígua.

---

# Prompt mestre para execução

## 1. Papel, objetivo e regra absoluta de escopo

Atue como engenheiro de software sênior, arquiteto de produto, especialista em
frontend responsivo, Supabase, acessibilidade, segurança, UX de calendários e
operações Git. Trabalhe até entregar e validar uma evolução coerente do **SX
Time Tasks**, usando as imagens do aplicativo Toki apenas como referência de
composição, densidade, navegação e comportamento.

### Regra absoluta

- O único projeto autorizado é:
  `/Users/sergioponte/TIME TASKS`.
- O repositório remoto correto é:
  `https://github.com/sxsevenxperts/TIME-TASKS.git`.
- Não abrir, editar, formatar, commitar, enviar ou implantar nada em:
  `/Users/sergioponte/APPS/ELEVENCHAT`, SEVENCHAT, ElevenChat ou qualquer outro
  produto.
- Antes de qualquer alteração, execute `pwd`, `git status --short --branch`,
  `git remote -v`, `git rev-parse HEAD` e `git rev-parse origin/main`.
- Se o diretório ou o remoto não forem exatamente os esperados, pare e reporte
  o bloqueio.

## 2. Contexto verificado do produto

Use este estado como ponto de partida, mas confirme-o no início da execução:

- Produto: **SX Time Tasks**.
- Versão documentada: `2.0.0`.
- Stack: HTML, CSS e JavaScript vanilla com ES Modules; Vite 6; Node.js 22;
  `@supabase/supabase-js` 2.110.6.
- Produção:
  `https://startups-timetasks.qfotry.easypanel.host/`.
- Dados: Supabase self-hosted, PostgreSQL, Auth e RLS.
- IA: assistente SX via `POST /api/sx`, autenticado no servidor.
- Versículos: `GET /api/verse`, autenticado no servidor.
- Saúde: `GET /api/health`.
- Estado Git observado em 16/07/2026 antes deste planner:
  `main`, árvore limpa e `HEAD == origin/main == fc9ccfe4c33cc6c9c96a4523e4728592c1316e5e`.
- Não existe `AGENTS.md` no projeto no estado observado.
- Não existe `MANUAL_DE_BORDO.md` no estado observado.

### Arquivos centrais já existentes

- `index.html`: login, layout, navegação, calendário, Sementes, configurações e
  painel SX.
- `style.css`: design system, calendário e media queries antigas.
- `layout.css`: estrutura de layout, barra lateral e painel SX.
- `js/navigation.js`: alternância das views e abertura da SX.
- `js/sidebar.js`: mini-calendário e controle da barra contextual.
- `js/calendar.js`: Dia, 3 Dias, Semana e Mês.
- `js/auth.js`: login, cadastro, sessão e vínculo de membro.
- `js/ai.js`: chat SX, voz e ações `CREATE_EVENT`, `CREATE_SEED` e `CHAT`.
- `js/seeds.js`: CRUD de Sementes/tarefas.
- `js/reminders.js`: lembretes, notificações e versículos.
- `js/settings.js`: conta, aparência, alertas, IA e preferências.
- `js/modal.js`: padrão atual de abertura, fechamento e `Escape`.
- `server.js`: arquivos estáticos, CSP, Permissions-Policy e APIs privadas.
- `supabase/schema.sql`: schema idempotente, tabelas `time_tasks_*` e RLS.
- `README.md`, `ROADMAP.md`, `MANUAL_DE_USO.md` e `MANUAL.md`:
  documentação atual.

## 3. Intenção do produto

Transformar a experiência do SX Time Tasks em uma agenda pessoal com IA de uso
rápido, clara no celular e produtiva no desktop. O resultado deve combinar:

- calendário compacto e legível;
- assistente SX sempre disponível;
- Sementes como lista de ações;
- Triggers persistentes para rotinas automáticas;
- central de notificações;
- previsão climática contextual;
- mensagem bíblica acolhedora por acesso;
- autenticação acessível;
- continuidade total entre mobile e desktop.

O objetivo não é clonar o Toki. O objetivo é adaptar os padrões úteis das
referências à marca, aos dados, à arquitetura e às regras reais do SX Time
Tasks.

## 4. Decisões de produto que devem ser tratadas como resolvidas

Não interrompa a implementação para perguntar novamente sobre estes pontos.
Use as decisões abaixo:

1. **Marca:** o aplicativo continua se chamando **SX Time Tasks** e a
   assistente continua se chamando **SX**. “Toki” é apenas referência visual.
2. **Desktop:** em viewport desktop, a SX deve ficar aberta permanentemente na
   lateral direita; o calendário ocupa a região central restante sem ser
   coberto.
3. **Calendário menor:** significa reduzir a área e a densidade visual do
   calendário central para acomodar a SX fixa, mantendo textos, eventos e ações
   legíveis. Não significa trocar o calendário principal pelo mini-calendário.
4. **Mobile:** a navegação principal inferior contém **Calendário**,
   **Seed/Sementes** e **Trigger**; a SX aparece como botão circular separado.
5. **Histórico:** o botão circular de relógio ao lado do compositor da SX abre a
   view existente de Sementes, cujo target interno válido é `seeds`.
6. **Trigger:** o raio abre uma nova área funcional chamada **Trigger**. Não é
   apenas outro botão para abrir a SX.
7. **Notificações:** “Notif.” abre uma central cronológica de notificações e
   resumos. Não é apenas um atalho para a configuração de permissões.
8. **Configurações de notificações:** continuam existindo e controlam permissão,
   som, horários e preferências; são diferentes da central de notificações.
9. **Versículo por acesso:** mostrar um único versículo quando o aplicativo entra
   em estado autenticado em uma nova abertura/acesso. Navegar entre telas ou
   renovar o token não deve mostrar outro versículo. Recarregar/abrir novamente
   o aplicativo constitui um novo acesso.
10. **Fechar versículo:** o `X` fecha o balão somente no acesso atual. Não
    desativa a preferência de versículos e não apaga o histórico.
11. **Clima:** a localização padrão deve ser configurável manualmente. Uma opção
    de usar geolocalização pode existir somente após consentimento explícito e
    revisão da Permissions-Policy.
12. **Sem dados falsos:** não apresentar previsão, Trigger executado,
    notificação, quota, plano ou sincronização como real se não houver contrato e
    persistência reais.

## 5. Referências visuais recebidas

As imagens foram enviadas como referência de UX. Seus nomes originais ajudam a
identificar o enquadramento, mas podem ser temporários:

1. `codex-clipboard-efdfb030-e419-4962-8dec-7382c434cb56.png`
   - Home/SX mobile com cartão de clima, eventos, aviso, compositor e botão de
     Histórico.
2. `codex-clipboard-5b43a28c-22a1-4f17-90e5-1dd08929c43d.png`
   - Detalhe do botão circular de Histórico ao lado do compositor.
3. `codex-clipboard-9bcb0faa-b07a-44f9-8cc5-c2ada7a57fa4.png`
   - Cabeçalho mobile com perfil, Bate-papo, Notif. e menu.
4. `codex-clipboard-0cddd47b-c4cd-405d-8bd9-10d4667dbccb.png`
   - Configurações mobile agrupadas em cartões.
5. `codex-clipboard-dc164acd-85c9-4197-84a0-2e13e9b58a20.png`
   - Seed mobile com checklist, botão `+` e navegação inferior.
6. `codex-clipboard-c7fa870b-14d7-488e-9bba-955dbb34f7e8.png`
   - Desktop em três regiões: barra/contas à esquerda, calendário central mais
     compacto e assistente aberta à direita.
7. `codex-clipboard-48d3723e-8add-45a2-8c26-8560e45260ec.png`
   - Trigger mobile com card Clima, toggle e horário.
8. `codex-clipboard-7e6cb8c3-ba4a-4569-95ce-01504b2781fc.png`
   - Trigger mobile com card Resumo semanal e horário semanal.
9. `codex-clipboard-026fed0d-50e8-42a2-a9af-d3815962af27.png`
   - Calendário mensal mobile compacto e navegação inferior.
10. `codex-clipboard-0e582bda-01c9-4032-8476-de0d62bb6520.png`
    - Central mobile de notificações com clima e resumo semanal.

### O que não copiar das referências

- nome, logotipo, mascote ou identidade do Toki;
- anúncios, banners esportivos ou promoções;
- aviso de limite semanal, plano FREE ou upgrade;
- textos de quota e cobrança não existentes no SX Time Tasks;
- imagens, ilustrações ou ativos proprietários do aplicativo de referência;
- barra de status falsa do iOS dentro da página web.

## 6. Direção visual global

### Linguagem

- Fundo cinza muito claro, superfícies brancas e texto quase preto.
- Cartões com cantos grandes, borda sutil e sombra leve.
- Espaçamento generoso, sem perder densidade em calendário.
- Controles circulares ou em cápsula.
- Ícones SVG inline com `currentColor`, seguindo a base atual; não instalar uma
  biblioteca inteira apenas para estes ícones.
- Manter a identidade SX preta, verde e amarelo-neon como cor de marca. Tons
  azuis ou laranja das referências podem orientar hierarquia, mas não devem
  substituir a paleta SX sem decisão registrada.
- Respeitar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`.
- Alvos de toque com no mínimo 44 × 44 px.
- Estado de foco visível em todos os controles.
- Texto ajustável sem cortar ações em zoom de 200%.

### Breakpoints de validação

- Mobile principal: `390 × 844`.
- Mobile estreito: `360 × 800`.
- Tablet: `768 × 1024`.
- Desktop mínimo: `1280 × 800`.
- Desktop principal: `1440 × 900`.
- Desktop amplo: `1920 × 1080`.

Nenhum breakpoint pode produzir scroll horizontal involuntário, controles
cobertos pela navegação inferior ou conteúdo escondido atrás da SX.

## 7. Especificação detalhada por experiência

### 7.1 Shell mobile

Criar um shell mobile real, não apenas reduzir o desktop.

#### Cabeçalho da área SX

- botão circular de perfil/menu à esquerda;
- aba **Bate-papo**;
- aba **Notif.**, com ponto de atenção apenas quando existir notificação real
  não lida;
- botão de mais opções à direita;
- cabeçalho leve, com blur apenas se não comprometer desempenho/contraste;
- não renderizar uma barra de status de sistema falsa.

#### Navegação inferior global

- cápsula principal com:
  1. Calendário;
  2. Seed/Sementes, usando o ícone de relógio/histórico;
  3. Trigger, usando o raio;
- botão circular separado para abrir a SX;
- destacar somente o destino ativo;
- usar `aria-current="page"` ou equivalente;
- preservar o destino ao alternar views;
- não cobrir o último item rolável;
- permanecer acessível com teclado e leitor de tela.

### 7.2 Bate-papo/SX mobile

- A SX deve ocupar uma view própria no mobile.
- Exibir mensagens e cartões operacionais em ordem cronológica.
- O compositor fica na base, acima da safe area, com:
  - botão `+` para ações anexas futuras ou menu de comandos existentes;
  - campo de texto;
  - botão de voz quando Web Speech API estiver disponível;
  - botão de envio quando houver texto;
  - botão circular de Histórico separado à esquerda.
- O Histórico deve chamar `activateView('seeds')`, não criar um target
  inexistente `seed`.
- O cartão de clima pode aparecer como notificação/resumo e abrir detalhes com
  data, ícone, descrição curta e ação **Entendi**.
- Eventos próximos podem aparecer como cartões resumidos, mas devem usar dados
  reais de `time_tasks_events`.
- Não recriar o bug de duplicação do histórico da SX já corrigido no commit
  `fc9ccfe`.

### 7.3 Central de notificações mobile

- A aba **Notif.** abre uma central persistente e cronológica.
- Agrupar itens por momento: hoje, ontem, dia da semana ou data.
- Tipos iniciais:
  - previsão/clima;
  - resumo semanal;
  - resultado/erro de Trigger;
  - lembrete relevante quando persistido.
- Cada item contém:
  - ícone/tipo;
  - título;
  - período/data;
  - resumo em até duas linhas;
  - estado lido/não lido;
  - ação de abrir detalhe;
  - ação de dispensar quando permitido.
- Não inventar badge nem notificações de exemplo em produção.
- A Notification API continua sendo canal de alerta; a central é o histórico
  persistente dentro do produto.

### 7.4 Seed/Sementes mobile

- Reutilizar a view e o CRUD reais de Sementes.
- Título visual pode ser **Seed**, mantendo **Sementes** na documentação em
  português para coerência.
- Cabeçalho com informação contextual e botão `+` para nova tarefa.
- Lista em um cartão grande, com:
  - checkbox/concluir;
  - ícone ou emoji opcional derivado do conteúdo, sem depender disso para
    significado;
  - título truncado com acesso ao conteúdo completo;
  - prazo/horário quando existir;
  - edição, reabertura e exclusão disponíveis de forma acessível.
- O estado concluído deve persistir no Supabase.
- Não transformar conversas da SX em Sementes automaticamente sem confirmação.

### 7.5 Calendário mobile

- A view mensal deve ser compacta e ocupar a largura útil.
- Cabeçalho com mês/ano, ação **Hoje** ou **Atualizar** conforme a função real e
  seletor de visão.
- Nunca iniciar com sete colunas horárias comprimidas e ilegíveis.
- Em mobile, escolher conscientemente uma destas regras e registrar a decisão:
  - abrir Mês por padrão; ou
  - abrir Dia por padrão e permitir Mês.
- Na visão mensal:
  - sete colunas estáveis;
  - dia atual destacado;
  - evento compacto com categoria, título e horário;
  - truncamento previsível;
  - `+N` quando não couberem todos os eventos;
  - toque abre resumo/edição;
  - células sem altura excessiva.
- Nas visões Dia/3 Dias/Semana:
  - permitir scroll adequado;
  - não bloquear `overflow-x` se a largura necessária for maior;
  - manter labels de horário legíveis;
  - ajustar `HOUR_HEIGHT` por breakpoint sem deformar duração do evento.
- Preservar CRUD, conflitos, categorias e atalhos desktop existentes.

### 7.6 Trigger mobile

Criar uma view funcional **Trigger**, acessada pelo raio.

#### Cards iniciais

1. **Clima**
   - ícone meteorológico;
   - descrição curta;
   - toggle real ativar/desativar;
   - horário configurável, padrão sugerido `07:00`;
   - localização configurada;
   - estado da última execução e próxima execução.
2. **Resumo semanal**
   - ícone de resumo/gráfico;
   - descrição curta;
   - toggle real;
   - dia e horário configuráveis, padrão sugerido domingo `18:00`;
   - última execução, próxima execução e resultado.

#### Área explicativa

- Explicar que Triggers verificam condições ou executam rotinas em cronograma.
- Mostrar exemplos como:
  - previsão diária;
  - resumo semanal da agenda;
  - monitoramento futuro de notícias ou calendário esportivo.
- O botão **Criar um Trigger** abre um fluxo de criação real.

#### Regra de honestidade

- Não mostrar toggle ativo se nenhuma rotina persistente puder executar.
- Não usar `setInterval` do navegador como mecanismo definitivo: ele para com a
  aba fechada e não garante execução.
- Antes de implementar o executor, verificar se o Supabase self-hosted oferece
  `pg_cron`, Edge Functions ou outro mecanismo adequado.
- Se não houver scheduler confiável, implementar worker no servidor com lease,
  idempotência, `next_run_at`, retry e registro de falha, ou entregar a UI
  claramente marcada como indisponível — nunca simular execução.

### 7.7 Desktop com SX sempre aberta

Em viewport desktop:

```text
barra global | barra contextual | calendário compacto | SX fixa
```

- Preservar a barra global de aproximadamente 60 px.
- Preservar a barra contextual de aproximadamente 260 px quando útil.
- A SX ocupa aproximadamente 350–380 px à direita.
- O calendário usa `minmax(0, 1fr)` e reduz densidade sem ficar ilegível.
- A SX deve estar aberta após autenticação e troca de views no desktop.
- Não exigir clique no botão atual `#btn-toggle-chat` para vê-la.
- Não sobrepor a grade do calendário.
- O scroll da SX deve ser independente do calendário.
- O compositor da SX fica fixo na base do painel, sem sair da viewport.
- Em largura insuficiente para as quatro regiões, aplicar transição controlada
  para tablet/mobile; não comprimir o calendário abaixo do limite legível.
- Se existir opção de recolher a SX, ela não pode contrariar “sempre aberta” no
  desktop principal. Trate recolhimento apenas como exceção de viewport ou
  acessibilidade, registrando a decisão.

### 7.8 Configurações mobile

- Exibir como painel/tela com grupos em cartões:
  - perfil;
  - Sementes/tarefas;
  - páginas de agendamento;
  - preferências gerais;
  - calendários;
  - permissões;
  - conta;
  - atualizações/documentação;
  - sair.
- Mapear somente opções reais do produto.
- Não copiar plano FREE, upgrade, conta Toki ou e-mail da referência.
- Manter saída da sessão visível e com confirmação adequada.
- Permitir acesso à configuração de clima e à gestão de Triggers.

### 7.9 Login com mostrar/ocultar senha

- Adicionar controle de olho dentro ou ao lado do campo de senha.
- Alternar exclusivamente entre `type="password"` e `type="text"`.
- Preservar valor, foco, seleção/caret e submissão do formulário.
- Estado inicial sempre oculto.
- Usar `aria-label` dinâmico: **Mostrar senha** / **Ocultar senha**.
- Usar `aria-pressed` ou estado equivalente.
- Adicionar `autocomplete="current-password"` no login e
  `autocomplete="new-password"` no cadastro.
- Associar labels com `for`.
- Exibir erros em região `aria-live`/`role="alert"`.
- Não salvar senha em localStorage, `time_tasks_settings`, logs ou banco próprio.
- Não implementar recuperação de senha como efeito colateral desta tarefa sem
  registrar separadamente no roadmap. A descoberta mostrou que esse fluxo não
  existe e deve ser catalogado como pendência P1.

### 7.10 Versículo bíblico por acesso

- Aguardar o carregamento das preferências reais; somente quando a preferência
  de versículos estiver ativa, confirmar sessão e vínculo em
  `time_tasks_members`, buscar e mostrar um único versículo.
- Não mostrar antes de validar o membro.
- Não disparar novamente por:
  - navegação interna;
  - troca de view;
  - atualização de dados;
  - evento `TOKEN_REFRESHED`;
  - abertura/fechamento da SX.
- Em uma nova abertura autenticada do app, mostrar novamente um versículo,
  respeitando o histórico antirrepetição.
- O balão/cartão contém:
  - referência;
  - texto;
  - botão `X` com nome acessível;
  - animação discreta, respeitando `prefers-reduced-motion`.
- O fechamento:
  - afeta somente o acesso atual;
  - não desativa “Versículos diários”;
  - não apaga `time_tasks_verse_deliveries`;
  - não impede o uso do app.
- Tratar a preferência religiosa com transparência, minimização e retenção
  adequada. Não usar histórico de versículos para segmentação, marketing,
  perfil religioso ou decisão automatizada.
- A regra atual manhã/tarde deve ser preservada ou migrada conscientemente. O
  schema observado aceita apenas períodos `morning` e `afternoon`; para registrar
  uma entrega por acesso, criar migração idempotente com um motivo/período
  `access` ou um modelo equivalente, sempre com RLS por usuário.
- Evitar empilhar o versículo com modal de clima. Usar fila de apresentações ou
  manter o clima na central de notificações.

### 7.11 Previsão climática

#### Experiência

- Mostrar condição atual e previsão diária curta.
- Conteúdo mínimo:
  - localização;
  - data;
  - condição;
  - temperatura atual;
  - mínima/máxima;
  - probabilidade de chuva quando disponível;
  - recomendação curta e neutra;
  - horário da atualização.
- Permitir **Entendi/Fechar** no detalhe.
- Registrar a previsão gerada pelo Trigger na central de notificações.
- Mostrar estado de carregamento, indisponibilidade, dado em cache e horário da
  última atualização.

#### Localização

- Prioridade 1: cidade/localização manual persistida em preferências.
- Prioridade 2: botão opcional **Usar minha localização**, após gesto e
  consentimento explícitos.
- A política atual do servidor bloqueia geolocalização; revisar
  `Permissions-Policy` antes de habilitar.
- Não solicitar localização no carregamento.
- Permitir revogar ou alterar a localização.

#### Arquitetura

- Pesquisar e ler a documentação oficial atual do provedor antes de codificar.
- Verificar licença e condição de uso comercial antes de selecionar o provider.
  A modalidade gratuita do Open-Meteo não deve ser presumida como autorizada
  para produção comercial; registrar a decisão contratual e a atribuição
  exigida.
- Preferir provedor sem chave no cliente ou proxy seguro no servidor.
- Criar rota autenticada no servidor, por exemplo `/api/weather`, somente após
  definir e documentar o contrato.
- Aplicar timeout, validação de parâmetros, cache de curta duração, limite de
  requisições e fallback para último dado válido.
- Atualizar CSP/`connect-src` apenas com o domínio necessário.
- Nunca expor service-role, chave privada ou segredo de provedor no frontend.
- Não fabricar previsão quando o provedor falhar.

## 8. Falhas reais já identificadas e correções obrigatórias

Trate estes itens antes de afirmar que o mobile está pronto:

### F-01 — seletor responsivo divergente

- DOM real: `#sub-sidebar.sub-sidebar`.
- `js/sidebar.js` ainda procura `#sidebar`.
- `style.css` responsivo ainda manipula `.sidebar`.
- Correção: alinhar DOM, JavaScript e CSS em um único contrato
  `#sub-sidebar/.sub-sidebar` e um único estado, por exemplo
  `.sub-sidebar--open`.

### F-02 — botão mobile bloqueado por estilo inline

- `#sidebar-toggle` possui `style="display:none"`.
- Isso vence a tentativa da media query de mostrá-lo.
- Correção: remover estilo crítico inline e controlar visibilidade pelo CSS.

### F-03 — layout duplicado

- `.app-layout` existe em `style.css` e `layout.css`.
- `layout.css`, carregado depois, vence silenciosamente.
- Correção: definir uma única fonte de verdade para o layout e remover drift.

### F-04 — calendário mobile começa em Semana

- `js/calendar.js` inicia em `week`.
- Sete colunas ficam comprimidas no celular.
- `overflow-x: hidden` impede saída legível.
- Correção: selecionar Mês/Dia por breakpoint e corrigir estratégia de overflow.

### F-05 — navegação atual é apenas desktop

- `js/navigation.js` escuta `.nav-strip .nav-btn[data-target]`.
- Adicionar HTML mobile isoladamente não funcionará.
- Correção: centralizar a lista de controles, sincronizar estado ativo e expor
  funções únicas de navegação.

### F-06 — estado da SX duplicável

- A abertura atual depende de `.ai-sidebar--open` em listener desktop.
- Correção: extrair `setChatOpen(open)` e reutilizar em desktop/mobile.
- Exceção: o Trigger é view própria; não deve chamar `setChatOpen` como destino.

### F-07 — autenticação incompleta para acessibilidade

- Campo sem mostrar/ocultar senha.
- Labels e região de erro precisam ser auditados.
- Correção: implementar toggle acessível e atributos sem alterar o contrato
  seguro do Supabase.

### F-08 — versículo não atende “um por acesso”

- O fluxo atual trabalha com manhã/tarde e carrega o último versículo ao iniciar.
- O cartão não tem `X`.
- Correção: definir estado por acesso, impedir repetição por refresh interno,
  adicionar fechamento e migrar persistência se necessário.

### F-09 — clima inexistente

- Não há módulo, rota, provedor nem configuração de localização.
- A Permissions-Policy bloqueia geolocalização.
- Correção: implementar contrato completo, consentimento e fallback; não apenas
  um cartão estático.

### F-10 — Trigger e central de notificações inexistentes

- Não há view, tabela, executor, inbox ou contador.
- Correção: projetar dados, RLS, execução e histórico antes da UI final.

### F-11 — vínculo de membro pode não ser uma allowlist segura

- A política observada permite que usuário autenticado insira a própria linha
  em `time_tasks_members`.
- O trigger de criação usa `raw_user_meta_data.app`, que é controlável pelo
  usuário e não deve decidir autorização.
- Se o produto for aberto, documentar formalmente esse comportamento.
- Se o produto for privado, substituir por aprovação administrativa ou
  `app_metadata` confiável e testar que usuário de outro app recebe negação.
- Não expandir Triggers, clima e APIs privadas antes de resolver essa decisão de
  acesso.

### F-12 — corrida entre sessão, preferências e lembretes

- `timetasks:session` inicia carregamentos assíncronos, mas lembretes podem rodar
  com defaults antes de `loadSettings()` terminar.
- `loadLatestVerse()` pode renderizar conteúdo mesmo quando o usuário desativou
  a preferência.
- Correção: estabelecer bootstrap ordenado: sessão → membro → preferências →
  dados → lembretes/cards por acesso.

### F-13 — notificação é marcada antes de confirmar entrega

- O fluxo atual grava `notified_at` antes de saber se áudio/Notification API
  realmente funcionaram.
- Correção: separar tentativa, sucesso e falha, com retry controlado e sem
  duplicação.

### F-14 — reservas públicas dependem demais do frontend

- A validação forte de disponibilidade/duração/futuro não pode ficar apenas no
  cliente.
- Registrar como risco de segurança P1: validação server-side/RPC, rate limit,
  limites de tamanho e mitigação de spam.

### F-15 — smoke sem assertions e ausência de CI

- `test-dist.js` apenas imprime resultados no estado observado.
- Correção: criar assertions que retornem código diferente de zero em falha e
  evoluir para suíte E2E/CI antes de usar o smoke como evidência de release.

## 9. Arquitetura proposta para novos dados

Não aplique esta proposta cegamente. Primeiro confira o schema, a versão do
Supabase, o mecanismo de migrations e a disponibilidade do scheduler.

### 9.1 `time_tasks_triggers`

Campos mínimos sugeridos:

- `id uuid primary key`;
- `user_id uuid not null`;
- `type text` com tipos inicialmente permitidos;
- `name text`;
- `enabled boolean`;
- `schedule jsonb` ou campos normalizados para dia/horário;
- `timezone text`;
- `config jsonb` validado por tipo;
- `next_run_at timestamptz`;
- `last_run_at timestamptz`;
- `last_status text`;
- `last_error text` sanitizado;
- `created_at` e `updated_at`.

Tipos iniciais:

- `weather_daily`;
- `weekly_summary`.

RLS mínima:

- `SELECT`, `INSERT`, `UPDATE` e `DELETE` somente quando
  `(select auth.uid()) = user_id`;
- `UPDATE` com `USING` e `WITH CHECK`;
- não usar apenas `TO authenticated` sem predicado de dono;
- não usar `user_metadata` para autorização;
- não usar `SECURITY DEFINER` como correção de permissão.

### 9.2 `time_tasks_notifications`

Campos mínimos sugeridos:

- `id uuid primary key`;
- `user_id uuid not null`;
- `type text`;
- `title text`;
- `body text`;
- `payload jsonb`;
- `source_trigger_id uuid null`;
- `occurred_at timestamptz`;
- `read_at timestamptz null`;
- `dismissed_at timestamptz null`;
- `created_at timestamptz`.

Aplicar RLS de propriedade em todas as operações. Indexar por
`(user_id, occurred_at desc)` e, se necessário, por não lidas.

### 9.3 Evolução de `time_tasks_verse_deliveries`

- Preservar histórico existente.
- Permitir distinguir `morning`, `afternoon` e `access`, ou registrar um
  `delivery_reason` equivalente.
- Não remover constraints sem substituição válida.
- Garantir antirrepetição por usuário.
- Definir claramente se cada acesso cria entrega ou reaproveita um versículo
  ainda não exibido.

### 9.4 Preferências

Antes de criar colunas/tabelas novas, verificar se `time_tasks_settings` pode
armazenar de forma segura:

- cidade;
- latitude/longitude arredondadas quando consentidas;
- timezone;
- unidade de temperatura;
- Trigger de clima ativo/horário;
- preferência de versículos.

Não armazenar senha, token privado, service-role ou segredo de provedor.

## 10. APIs e padrões permitidos

### Existentes

- Supabase Auth:
  - `signInWithPassword`;
  - `signUp`;
  - `signOut`;
  - `getSession`;
  - `onAuthStateChange`;
  - `updateUser` apenas se uma fase futura de senha for autorizada.
- Supabase Data API via `.from(...).select/insert/update/delete/upsert`, sempre
  sob RLS.
- `POST /api/sx`.
- `GET /api/verse`.
- `GET /api/health`.
- Browser APIs já usadas:
  - Notification API;
  - Web Audio API;
  - Web Speech API;
  - `fetch`;
  - `Intl`;
  - media queries/matchMedia.
- Event bus existente por `CustomEvent`, incluindo eventos `timetasks:*`.
- Componentes CSS existentes, quando adequados:
  `.btn-primary`, `.btn-secondary`, `.btn-icon`, `.form-input`,
  `.form-select`, `.modal-overlay`, `.feature-card`, `.view-container`,
  `.nav-btn` e `.ai-msg`.

### Novos contratos

- Não inventar assinatura de clima, Trigger ou notificações durante o coding.
- Na Fase 0, escrever contratos de request/response e fontes oficiais.
- Se usar Supabase, consultar changelog e documentação atual antes de migrations.
- Descobrir comandos da CLI com `supabase --help`; não adivinhar flags.
- Identificar se o projeto usa schema declarativo ou migrations imperativas
  antes de alterar `supabase/`.

## 11. Anti-padrões proibidos

- Alterar qualquer arquivo do SEVENCHAT/ELEVENCHAT.
- Renomear SX Time Tasks para Toki.
- Copiar anúncios, mascote, plano ou assets das screenshots.
- Introduzir React, Vue, FullCalendar ou Tailwind sem justificativa arquitetural
  aprovada; a base atual é vanilla.
- Criar `data-target="seed"`; o target existente é `seeds`.
- Tratar o Trigger como simples alias da SX.
- Tratar “Notif.” como simples botão de permissão do navegador.
- Criar badge de não lidas sem dados persistentes.
- Marcar toggle de Trigger como ativo sem executor funcional.
- Usar timer apenas no navegador para execução garantida.
- Solicitar geolocalização ou Notification API automaticamente.
- Chamar provedor meteorológico diretamente do navegador se isso expuser chave,
  quebrar CSP ou impedir controle de cache/rate limit.
- Expor service-role, chave da IA, senha do banco ou segredo no frontend.
- Autorizar por `user_metadata`.
- Criar política RLS somente com `TO authenticated` sem validar `user_id`.
- Usar `SECURITY DEFINER` para contornar RLS.
- Persistir senha no app.
- Executar navegação durante bootstrap de autenticação de forma que pisque dados
  privados antes da sessão ser validada.
- Declarar “responsivo” apenas porque há media query.
- Declarar “concluído” antes de build, teste visual, runtime e Git parity.
- Editar `dist/` manualmente; gerar pelo build.
- Fazer commit de `.env*`, token, chave ou credencial.

## 12. Plano de implementação em fases

Cada fase deve ser autocontida, deixar o projeto funcional e registrar evidência
no manual de bordo.

### Fase 0 — descoberta documental e contratos

#### Implementar

- Confirmar checkout, branch, remoto, SHA e worktree.
- Ler integralmente README, roadmap, manual, schema e arquivos em escopo.
- Conferir APIs reais e documentação oficial atual de Supabase e clima.
- Decidir scheduler após verificar recursos do Supabase/EasyPanel.
- Decidir explicitamente se o acesso é aberto ou por allowlist e corrigir
  `time_tasks_members`/metadata antes de ampliar APIs privadas.
- Verificar licença comercial e atribuição do provedor de clima.
- Documentar contratos de:
  - Trigger;
  - notificação;
  - clima;
  - versículo por acesso.
- Criar/atualizar o plano antes de código.

#### Referências locais

- `README.md:32-55` — arquitetura e isolamento.
- `README.md:57-70` — tabelas atuais.
- `server.js` — CSP, membro e rotas privadas.
- `supabase/schema.sql` — schema e RLS.

#### Verificação

- Nenhum endpoint ou método sem fonte.
- Nenhum segredo no plano.
- Decisões de dados e scheduler registradas.
- Modelo de autorização e licença do clima registrados.

#### Guardas

- Não editar schema antes de decidir workflow de migration.
- Não assumir que `pg_cron` existe.

### Fase 1 — reparar a fundação responsiva

#### Implementar

- Corrigir `#sidebar` versus `#sub-sidebar`.
- Corrigir `.sidebar` versus `.sub-sidebar`.
- Remover `display:none` inline do toggle.
- Consolidar `.app-layout` em uma fonte de verdade.
- Centralizar navegação e estado da SX.
- Preservar comportamento desktop atual durante a correção.

#### Referências locais

- `index.html:60-92` e `168-299`.
- `js/navigation.js:3-48`.
- `js/sidebar.js:42-45`.
- `style.css:1213-1265`.
- `layout.css:82-236`.

#### Verificação

- Mobile e desktop abrem/fecham a barra correta.
- Nenhum seletor morto `#sidebar/.sidebar` permanece sem justificativa.
- Sem overflow horizontal em 390 px.

#### Guardas

- Não esconder a barra contextual sem manter **Novo Evento** acessível.

### Fase 2 — shell e navegação mobile

#### Implementar

- Criar cabeçalho mobile.
- Criar navegação inferior com Calendário, Seed e Trigger.
- Criar botão circular SX.
- Sincronizar estado ativo, foco e `aria-current`.
- Adaptar o painel SX para largura mobile real.
- Reservar espaço inferior no conteúdo.

#### Referências locais

- `index.html` — estrutura das views.
- `js/navigation.js` — `activateView`.
- `layout.css` — nav e painel SX.
- padrão SVG inline existente.

#### Verificação

- Cada botão abre o destino correto.
- `seeds` plural funciona.
- Trigger abre view própria.
- SX abre e fecha sem duplicar listener.
- Navegação não cobre conteúdo.

#### Guardas

- Não criar rota ou framework novo para uma SPA existente sem necessidade.

### Fase 3 — calendário mobile e desktop compacto

#### Implementar

- Adaptar visão inicial por breakpoint.
- Compactar mês, eventos e `+N`.
- Corrigir overflow das visões horárias.
- Tornar SX sempre aberta no desktop.
- Redimensionar calendário central de forma fluida.
- Manter scrolls independentes.

#### Referências locais

- `js/calendar.js`: `initCalendar`, `renderView`, `renderTimeGrid`,
  `renderDayColumns`, `renderEventsInColumn`, `renderMonthView`.
- `HOUR_HEIGHT` atual em `js/calendar.js`.
- `#calendar-container`, `#month-grid`, `#time-grid` em `index.html`.

#### Verificação

- Eventos reais abrem e editam.
- Dia atual correto.
- Mais de três eventos não quebram célula.
- Desktop mantém SX visível e calendário utilizável.
- Todas as seis dimensões de viewport aprovadas.

#### Guardas

- Não reduzir fonte abaixo de legibilidade para “caber”.

### Fase 4 — login e versículo por acesso

#### Implementar

- Mostrar/ocultar senha com acessibilidade.
- Corrigir labels, autocomplete e região de erro.
- Criar controlador de versículo uma vez por acesso autenticado.
- Ordenar bootstrap para carregar preferências antes de lembretes/versículo.
- Adicionar balão e botão `X`.
- Preservar histórico antirrepetição.
- Fazer migration somente se necessária e segura.

#### Referências locais

- `index.html:34-58` — auth.
- `js/auth.js:14-199` — sessão.
- `index.html:124` — cartão atual de versículo.
- `js/reminders.js:145-262` — renderização/entrega.
- `js/modal.js:25` — fechamento/Escape.
- `supabase/schema.sql` — `time_tasks_verse_deliveries`.

#### Verificação

- Senha nunca aparece sem ação.
- Toggle mantém valor e foco.
- Um único versículo por acesso.
- Token refresh não duplica.
- `X` fecha e app continua operável.
- Novo acesso apresenta outro item conforme regra antirrepetição.
- Preferência desativada não carrega nem mostra cartão.

#### Guardas

- Não guardar senha.
- Não disparar versículo para usuário sem vínculo de membro.

### Fase 5 — clima

#### Implementar

- Configuração de localização.
- Proxy autenticado `/api/weather` ou contrato equivalente.
- Cache, timeout, rate limit e fallback.
- Cartão/resumo e detalhe.
- Estados loading/error/stale.
- Integração com central de notificações.

#### Referências locais

- padrão de autenticação/proxy em `server.js`.
- registro de rotas e middleware de membro.
- CSP/Permissions-Policy atuais.
- preferências em `js/settings.js` e `time_tasks_settings`.

#### Verificação

- Localização manual funciona.
- Geolocalização só após consentimento, se implementada.
- Falha do provedor não mostra dado falso.
- Resposta de outro usuário não vaza.
- Cache e timestamp visíveis.

#### Guardas

- Não liberar geolocalização globalmente sem necessidade.
- Não expor chave.

### Fase 6 — Trigger e central de notificações

#### Implementar

- Schema/RLS.
- CRUD de Triggers.
- Cards Clima e Resumo semanal.
- Toggle, horário, timezone, próxima/última execução.
- Executor confiável e idempotente.
- Persistência da central de notificações.
- Leitura, abertura e dispensa.
- Integração com Notification API quando permitido.
- Registrar tentativa, entrega e falha sem marcar sucesso antecipadamente.

#### Referências locais

- padrões CRUD em `js/seeds.js`.
- padrões RLS `time_tasks_*` em `supabase/schema.sql`.
- padrões de alerta em `js/reminders.js`.
- timezone em preferências.

#### Verificação

- Trigger sobrevive a reload/restart.
- Execução não duplica.
- Toggle desativado impede próxima execução.
- Falha fica registrada sem segredo.
- Falha de Notification API não é registrada como entrega concluída.
- Usuário só vê os próprios Triggers/notificações.
- Clima e resumo aparecem na central.

#### Guardas

- Não usar timer de aba como garantia operacional.
- Não marcar toggle ativo sem backend funcional.

### Fase 7 — acessibilidade, segurança e robustez

#### Implementar

- Fluxo completo por teclado.
- `aria-*`, labels, foco e anúncio de estado.
- Contraste e zoom.
- `prefers-reduced-motion`.
- Revisão RLS e segredos.
- Sanitização de texto externo.
- Estados de rede e retry controlado.

#### Verificação

- Navegação sem mouse.
- Focus visível.
- Leitor de tela identifica destino e estado.
- Nenhum segredo no bundle/diff.
- Supabase advisors quando disponíveis.

### Fase 8 — documentação e manual de bordo

#### Implementar

- Atualizar `README.md` com arquitetura e provedor reais.
- Atualizar `ROADMAP.md` sem marcar pendente como concluído.
- Atualizar `MANUAL_DE_USO.md` com fluxos realmente validados.
- Manter `MANUAL.md` como ponte para o manual oficial.
- Criar `MANUAL_DE_BORDO.md`.

#### Manual de bordo obrigatório

Registrar tudo com uma destas etiquetas:

- `PEDIDO` — solicitado pelo usuário;
- `PERGUNTA` — dúvida levantada;
- `DECISÃO` — interpretação aprovada/adotada;
- `IDEIA` — imaginada, mas ainda não autorizada/entregue;
- `FALHA` — problema comprovado;
- `CORREÇÃO` — mudança implementada;
- `VALIDAÇÃO` — evidência técnica/visual;
- `PENDÊNCIA` — trabalho restante;
- `RISCO` — ameaça operacional, técnica ou de produto.

Cada entrada deve conter:

- data/hora;
- objetivo;
- branch/SHA inicial;
- arquivos alterados;
- decisões;
- comandos executados;
- resultados;
- evidência visual/runtime;
- falhas restantes;
- próximo passo;
- SHA local/remoto final;
- estado do deploy.

O manual deve diferenciar explicitamente:

- pedido versus ideia;
- planejado versus implementado;
- implementado versus validado;
- commit/push versus deploy;
- ambiente local versus produção.

### Fase 9 — verificação, Git e produção

#### Gates mínimos

```bash
node --check server.js
for file in js/*.js; do node --check "$file"; done
npm run build
npm audit --omit=dev
git diff --check
```

#### Gates funcionais

- login e cadastro reais;
- mostrar/ocultar senha;
- vínculo `time_tasks_members`;
- RLS por usuário;
- calendário e CRUD;
- Sementes e CRUD;
- SX texto/voz;
- Histórico → Sementes;
- navegação mobile;
- SX fixa desktop;
- versículo por acesso e `X`;
- clima e fallback;
- Trigger ativo/inativo;
- central de notificações;
- healthcheck;
- console sem erro inesperado;
- rede sem 4xx/5xx inesperado;
- ausência de overflow nas dimensões previstas.

#### Git

- Revisar diff inteiro.
- Não misturar arquivos alheios.
- Commit com escopo claro.
- Push para a branch autorizada.
- `git fetch origin` após push.
- Provar `git rev-parse HEAD == git rev-parse origin/main` quando a entrega for
  destinada diretamente à `main`.
- Provar árvore limpa.

#### Produção

- Push não prova deploy.
- Validar container/healthcheck no EasyPanel.
- Abrir o domínio público correto.
- Repetir login e fluxos críticos no navegador.
- Registrar SHA/bundle implantado no manual de bordo.

## 13. Matriz de critérios de aceite

| ID | Requisito | Critério objetivo |
|---|---|---|
| MOB-01 | Navegação inferior | Calendário, Seed e Trigger abrem destinos corretos em 390 × 844 |
| MOB-02 | Botão SX | Abre painel/view SX e expõe estado acessível |
| MOB-03 | Histórico | Relógio do compositor abre `seeds` |
| MOB-04 | Safe area | Nenhuma ação fica sob a barra inferior |
| MOB-05 | Notif. | Abre central persistente, sem dados simulados |
| CAL-01 | Mês compacto | Sete colunas legíveis, dia atual e `+N` |
| CAL-02 | Eventos | Abrir/editar/excluir continua funcional |
| CAL-03 | Overflow | Zero scroll horizontal involuntário |
| DESK-01 | SX fixa | Visível à direita sem clique em desktop principal |
| DESK-02 | Calendário menor | Ocupa espaço restante sem sobreposição/corte |
| DESK-03 | Scroll | SX e calendário rolam independentemente |
| AUTH-01 | Mostrar senha | Alterna tipo, preserva valor/foco e começa oculto |
| AUTH-02 | Segurança | Senha não é persistida/logada |
| VERSE-01 | Frequência | Exatamente um versículo por acesso autenticado |
| VERSE-02 | Duplicação | Navegação/token refresh não repetem o balão |
| VERSE-03 | Fechamento | `X` fecha só no acesso atual |
| WEA-01 | Localização | Manual funciona; geolocalização exige consentimento |
| WEA-02 | Integridade | Falha do provedor mostra erro/cache, nunca previsão falsa |
| WEA-03 | Segurança | Segredo não chega ao cliente |
| TRG-01 | Persistência | Trigger sobrevive a reload/restart |
| TRG-02 | Execução | Idempotente, timezone correto e sem duplicação |
| TRG-03 | Toggle | Desativado não executa; ativado agenda próxima execução |
| NOT-01 | Isolamento | Usuário vê apenas as próprias notificações |
| NOT-02 | Estado | Lido/dispensado persiste |
| DOC-01 | Roadmap | Pendente não aparece como entregue |
| DOC-02 | Bordo | Pedido, ideia, falha, correção e validação separados |
| GIT-01 | Paridade | HEAD/origin comprovados após push |
| PROD-01 | Runtime | Health + fluxo visível aprovados no domínio correto |

## 14. Falhas e ideias que devem entrar no roadmap, não necessariamente no P0

### P0 — necessários para esta experiência

- decisão/correção do modelo de acesso privado antes de ampliar APIs;
- bootstrap ordenado de sessão, membro, preferências e lembretes;
- fundação responsiva;
- shell mobile;
- calendário mobile/desktop compacto;
- SX sempre aberta no desktop;
- Histórico → Sementes;
- mostrar senha;
- versículo por acesso fechável;
- clima com contrato real;
- Trigger e central de notificações somente se puderem operar de ponta a ponta.

### P1 — correções relevantes descobertas

- recuperação de senha por e-mail;
- definição/alteração de senha autenticada;
- confirmação de senha no cadastro;
- Web Push/service worker para app fechado;
- monitoramento de disponibilidade do provedor de clima/versículos;
- métricas de execução dos Triggers;
- auditoria WCAG completa;
- validação server-side e proteção antispam de reservas públicas;
- suíte automatizada com assertions e CI;
- separar fisicamente o Supabase se isolamento lógico deixar de ser suficiente.

### P2 — ideias futuras, não implementar como efeito colateral

- triggers de notícias;
- acompanhamento esportivo;
- WhatsApp/Telegram;
- Google Calendar bidirecional;
- aplicativo nativo/lojas;
- billing/quota/planos;
- cards promocionais;
- resumo inteligente avançado de produtividade.

## 15. Formato obrigatório da resposta final da futura execução

Responder com:

1. resultado entregue;
2. arquivos alterados;
3. decisões adotadas;
4. falhas corrigidas;
5. falhas ainda abertas, ordenadas P0/P1/P2;
6. gates executados e resultado;
7. evidência visual desktop/mobile;
8. evidência Supabase/RLS quando aplicável;
9. SHA local e remoto;
10. estado do deploy, distinguindo claramente:
    - código local;
    - GitHub;
    - produção;
11. links para `ROADMAP.md`, `MANUAL_DE_USO.md` e `MANUAL_DE_BORDO.md`.

Não responder apenas “feito”. Não esconder teste não executado, integração
simulada, deploy pendente ou ambiguidade remanescente.

# Fim do prompt mestre

---

## Registro de origem dos requisitos

Este planner consolidou, em ordem lógica, os seguintes pedidos feitos pelo
usuário nas mensagens com imagens do Toki:

1. adaptar a experiência para dispositivo móvel conforme as referências;
2. fazer o botão de Histórico abrir Seed;
3. manter a SX sempre aberta ao lado no desktop;
4. deixar o calendário desktop menor/mais compacto;
5. incluir previsão climática;
6. incluir opção de mostrar/ocultar senha na página de login;
7. exibir uma mensagem bíblica por acesso;
8. permitir fechar o versículo pelo `X` do balão;
9. exibir, além de Seed, as opções Calendário e raio/Trigger;
10. criar/atualizar roadmap, manual de uso e manual de bordo na futura
    implementação;
11. registrar tudo que foi pedido, feito, imaginado, perguntado, corrigido e
    deixado como próximo passo;
12. validar localmente, sincronizar o repositório e comprovar a continuidade.

## Limite desta entrega de planner

Este arquivo é apenas o plano/prompt detalhado. Sua criação não significa que
as funcionalidades foram implementadas, testadas, commitadas, publicadas ou
implantadas. O futuro executor deve usar os critérios acima para transformar o
planejamento em produto real sem declarar falsos positivos.
