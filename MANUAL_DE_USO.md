# Manual de uso — SX Time Tasks

## 1. Acesso

Abra [o SX Time Tasks em produção](https://startups-timetasks.qfotry.easypanel.host/).

### Entrar

1. Informe seu e-mail e senha.
2. Clique no ícone de olho ao lado da senha para mostrar/ocultar o texto digitado.
3. Clique em **Entrar**.
4. O calendário e os dados da conta serão carregados do Supabase.
5. Um versículo bíblico aparecerá em um balão no topo — clique em **X** para fechar ou deixe desaparecer automaticamente.

### Criar conta

1. Clique em **Não tem uma conta? Criar conta**.
2. Informe um e-mail válido e uma senha segura.
3. Clique em **Criar Conta**.
4. Se a confirmação de e-mail estiver ativa no servidor, confirme a mensagem recebida e depois entre.

Uma conta do Auth só acessa o Time Tasks quando também está vinculada a `time_tasks_members`. Usuários de outros aplicativos são recusados.

### Sair

Abra **Configurações** e clique em **Sair** no fim do menu.

## 2. Versículo de boas-vindas

Ao entrar na conta, um versículo bíblico aparece em um balão animado, com botão **X** para fechar quando quiser. O balão permanece visível até ser fechado.

Este é o **único** canal de mensagem bíblica do aplicativo: um versículo por acesso, sorteado automaticamente, sem configuração. As entregas por período (manhã/tarde) foram descontinuadas para evitar mensagens duplicadas.

## 3. Clima em tempo real

No calendário (desktop) ou acima do seletor de visão, um widget exibe a temperatura e a descrição do clima baseado na sua localização.

### Primeira vez

Se a localização estiver desativada, você verá um prompt com duas opções:

- **Ativar geolocalização** — permite ao navegador descobrir sua localização.
- **Buscar manualmente** — digite o nome da cidade (ex: "São Paulo").

As coordenadas são armazenadas localmente e a previsão é atualizada a cada 30 minutos.

### Mudar localização

Para alterar a localização, limpe o localStorage do navegador (F12 > Application > Local Storage > limpar dados do Time Tasks) ou clique em "Buscar manualmente" quando o prompt aparecer novamente.

O widget usa **Open-Meteo** (API pública, sem chave necessária) e oferece acesso offline parcial — a última previsão é armazenada em cache.

## 4. Navegação principal

### Desktop (≥ 901 px)

A barra vertical esquerda troca entre:

- **Calendário** — agenda visual.
- **Sementes** — tarefas rápidas.
- **Páginas de Agendamento** — links públicos e reservas.
- **Trigger** — automações e cronogramas (em desenvolvimento).
- **Configurações** — conta, aparência, alertas e IA.
- **SX** — botão superior que abre/fecha a assistente lateral.

No desktop, a SX abre automaticamente após o login e se mantém visível à direita enquanto você navega entre as seções. O calendário reduz sua largura para acomodar o painel lateral sem esconder conteúdo.

### Mobile (≤ 900 px)

A navegação fica na **barra inferior** com quatro abas:

| Ícone | Destino |
|---|---|
| 📅 Calendário | Agenda visual — inicia em visão Mês |
| 🕐 Seed | Tarefas/Sementes |
| ⚡ Trigger | Automações |
| Logo SX | Abre a assistente SX em tela cheia |

No mobile, a SX ocupa a tela inteira. Para fechar, use o botão X ou o botão de voltar do dispositivo. O botão de relógio dentro da SX fecha o painel e navega diretamente para Sementes.

No calendário, use **Hoje**, **Anterior**, **Próximo** e as visões **Dia**, **3 Dias**, **Semana** e **Mês**.

## 5. Eventos

### Criar manualmente

1. Clique em **Novo Evento**, pressione `N` ou clique em um horário livre.
2. Informe título, data, início/fim ou marque dia inteiro.
3. Escolha o calendário e o tempo do lembrete.
4. Clique em **Salvar**.

Se a verificação de conflitos estiver ativa, o sistema impede sobreposição de horários.

### Editar ou excluir

Clique no evento para abrir o resumo. Use **Editar** ou **Excluir**.

### Dar baixa (SIM/NÃO)

Cada evento tem um controle de baixa:

- No resumo do evento (popover), o botão **Dar baixa** marca o evento como concluído; ele muda para **Reabrir** quando o evento já está baixado.
- No formulário de edição, o campo **Dar baixa (concluído)** oferece os botões **Sim** e **Não**.

Eventos com baixa aparecem riscados e esmaecidos no calendário e **não disparam lembrete**. Reabrir o evento (NÃO) reativa o lembrete.

### Categorias

Os calendários disponíveis são Pessoal, Trabalho, Saúde, Estudos e Social. As caixas na lateral ocultam/exibem categorias sem apagar os dados.

## 6. Tarefas/Sementes

1. Abra **Sementes** (aba Seed no mobile, botão na barra lateral no desktop).
2. Clique em **Nova tarefa**.
3. Informe tarefa, prazo, horário do lembrete e observações.
4. Use **Concluir**, **Editar**, **Reabrir** ou **Excluir** no cartão.

## 7. Assistente SX

Clique no botão SX (barra lateral no desktop ou aba SX no mobile) para abrir a assistente.

A SX **lembra a conversa recente** e conhece a sua agenda: você pode se referir a eventos já criados ("o último evento criado", "a reunião de amanhã") e reeditar quantas vezes precisar.

Exemplos:

- `Agende reunião amanhã das 15h às 16h e avise 10 minutos antes.`
- `Crie uma tarefa para enviar o relatório sexta às 14h.`
- `Marque consulta dia 20 às 09h no calendário Saúde.`
- `Me lembre 5 minutos antes.` (aplica ao evento citado na conversa)
- `Adie a reunião de amanhã para sexta às 10h.`
- `Desmarque a consulta do dia 20.`
- `Dê baixa no evento CÉLULA.` / `Reabra o evento CÉLULA.`

O que a SX pode fazer com a agenda:

| Pedido | Ação |
|---|---|
| Criar evento ou tarefa | Cria e confirma com data/horário |
| Reeditar (título, horário, lembrete, calendário, descrição) | Atualiza só os campos citados |
| Adiar/remarcar | Move o evento para a nova data/horário |
| Desmarcar/cancelar | Remove o evento da agenda |
| Dar baixa (SIM) ou reabrir (NÃO) | Marca/desmarca o evento como concluído |

Se a referência for ambígua (dois eventos parecidos), a SX pergunta antes de agir. A SX interpreta a data no fuso configurado, valida o resultado e só então salva no Supabase. A chave privada da IA fica no servidor e não aparece nas configurações nem no navegador.

### Abas da SX (mobile)

No mobile, o cabeçalho da SX exibe duas abas:

- **Bate-papo** — conversa com a assistente e campo de texto/voz.
- **Notif.** — central de notificações com histórico de alertas.

O ponto vermelho na aba Notif. indica itens não lidos.

### Histórico / Ver Sementes

O botão de relógio ao lado do campo de texto fecha a SX e abre a view Sementes, permitindo consultar tarefas sem sair da sessão.

### Voz

Clique em **Falar com a SX**, permita o microfone e dite o pedido. A função depende do suporte do navegador à Web Speech API; quando indisponível, use o campo de texto.

## 8. Trigger

Acesse **Trigger** na barra de navegação para criar automações — verificações de clima, resumos de agenda e notificações baseadas em condições.

### Criar um Trigger

1. Clique em **Criar um Trigger**.
2. Escolha o tipo:
   - **🌤️ Clima** — notificar quando temperatura/umidade atinge condição.
   - **📋 Resumo** — resumo semanal/diário da agenda.
   - **🔔 Lembrete** — lembretes customizados.
3. Nomeie o trigger (ex: "Alerta calor > 30°").
4. Configure a condição (ex: `temp > 30` para clima).
5. Escolha o cronograma: Diariamente, Semanalmente, Mensalmente, ou Manual.
6. Salve.

O trigger aparecerá na lista com toggle **ativado por padrão**. Use os botões **Editar** e **Deletar** para gerenciar.

### Central de Notificações

Abra a aba **Notif.** na SX (mobile) ou verifique a central de notificações para ver:
- Notificações de triggers disparados
- Lembretes de eventos e tarefas
- Versículos e alertas do sistema

Clique no **X** de cada notificação para marcar como lida. Notificações expiram após 30 dias.

## 9. Páginas de agendamento

1. Abra **Páginas de Agendamento**.
2. Clique em **Criar página**.
3. Defina título, identificador do link, duração, dias e intervalo disponível.
4. Use **Copiar link** para compartilhar.

O visitante informa nome, e-mail, data e horário. A reserva aparece em **Próximos horários**, onde pode ser cancelada. O banco impede duas reservas confirmadas para a mesma página e horário.

## 10. Notificações e som

Abra **Configurações > Notificações**.

- **Lembretes de eventos e tarefas** ativa o disparo interno.
- **Som do lembrete** ativa o alerta de dois tons.
- **Ouvir agora** testa o volume.
- **Notificações do navegador** solicita a permissão do browser.

O alerta atual funciona enquanto o aplicativo está aberto. Com o navegador totalmente fechado, a entrega exige Web Push/service worker, item registrado no roadmap.

## 11. Configurações

- **Meu Plano** — estado do ambiente privado.
- **Conta** — nome de exibição, e-mail e sessão.
- **Geral** — idioma, tema, fuso, formato de hora e início da semana.
- **Calendários** — visibilidade e calendário padrão.
- **Notificações** — alertas e som.
- **IA** — resposta inteligente e entrada por voz.
- **Novos Eventos** — duração, lembrete e conflitos.
- **Sobre** — versão, privacidade e documentação.

WhatsApp, Telegram e Google Calendar são exibidos como indisponíveis até que as integrações reais sejam implementadas.

## 12. Integrações de Calendário

### Google Calendar

Sincronize seus eventos do Time Tasks com Google Calendar automaticamente.

1. Abra **Configurações > Integrações**.
2. Clique em **Conectar Google Calendar**.
3. Faça login na sua conta Google.
4. Autorize o acesso ao Google Calendar.
5. Selecione qual calendário Google receberá os eventos.

A partir de agora:
- Novos eventos criados no Time Tasks aparecem em Google Calendar.
- Eventos em Google Calendar são sincronizados para o Time Tasks a cada 5 minutos.
- Edições são refletidas em ambos os calendários.
- Clique em **Desconectar** para parar a sincronização.

### Apple Calendar

Sincronize com Apple Calendar (iCloud, macOS, iOS) usando CalDAV.

1. Abra **Configurações > Integrações**.
2. Clique em **Conectar Apple Calendar**.
3. Insira o e-mail e senha da sua conta iCloud.
4. Selecione qual calendário Apple receberá os eventos.

Mesma sincronização automática: eventos do Time Tasks → Apple Calendar, e vice-versa.

**Nota:** Google Calendar sincroniza a cada 5 minutos. Apple Calendar sincroniza com menor frequência devido ao protocolo CalDAV. Para sincronização imediata, clique em **Sincronizar agora**.

---

## 13. Atalhos

| Tecla | Ação |
|---|---|
| `T` | Hoje |
| `N` | Novo evento |
| `D` | Dia |
| `W` | Semana |
| `M` | Mês |
| `←` / `→` | Período anterior/próximo |

Os atalhos não são executados enquanto o foco estiver em campo de texto, seleção ou área de digitação.

## 14. Segurança e privacidade

- Todas as tabelas do aplicativo começam com `time_tasks_`.
- RLS usa `auth.uid()` para separar as contas.
- As APIs `/api/sx` e `/api/verse` exigem JWT válido e vínculo de membro.
- A anon key do Supabase é pública; service-role, senha do banco, tokens operacionais e chave da IA são privados.
- O Supabase atual é compartilhado fisicamente, mas o Time Tasks possui isolamento lógico de dados e acesso. Uma instância dedicada está prevista se for necessário isolamento físico.

## 15. Modo PWA (Progressive Web App)

### Login Permanente (JWS)

Ao fazer login uma vez, o Time Tasks **mantém você logado permanentemente**:

- **Auto-login silencioso** — ao abrir o app, entra direto (sem mostrar tela de login)
- **Sessão restaurada** — ao reabrir o app dias depois, continua logado
- **Token renovado automaticamente** — a cada hora, o acesso é renovado silenciosamente
- **Notificações funcionam** — mesmo com app fechado, recebe notificações (requer login ativo)

**Como funciona:**
1. Ao fazer login → sessão salva localmente no app
2. Ao reabrir app → auto-login com token renovado
3. Se token expirar → renova automaticamente sem avisar

**Logout permanente:**
- Abra **Configurações > Sair** para fazer logout
- Se aparecer "sessão expirada" → tente login novamente

**Nota:** Limpar dados do navegador (F12 > Storage > Clear All) remove o login permanente. Reinstale o app se isso acontecer.

### Instalar na home screen

O SX Time Tasks é um **Progressive Web App (PWA)** — você pode instalá-lo como um app nativo sem visitar uma app store.

#### Android
1. Abra o aplicativo em Chrome, Firefox ou navegador compatível.
2. Toque o menu (⋮) e escolha **"Instalar app"** ou **"Adicionar à tela inicial"**.
3. Confirme o nome e o ícone.
4. O app aparecerá como um ícone na home screen.

#### iOS / iPadOS
1. Abra em Safari.
2. Toque o botão Compartilhar (↗️).
3. Escolha **"Adicionar à tela inicial"**.
4. Confirme o nome (ex: "Time Tasks").
5. O app aparecerá como um ícone da home screen.

**Nota:** iOS trata PWAs como atalhos da web em tela cheia, sem acesso à app store.

### Funcionar offline

Uma vez instalado (ou mesmo no navegador), o Time Tasks funciona offline:

- **Eventos e tarefas** que já foram carregados permanecem visíveis.
- **Criação offline** — novos eventos/tarefas são salvos localmente e sincronizados quando a conexão voltar.
- **Lembretes** disparam mesmo offline (depende da instalação local).
- **API calls** que falham recebem uma resposta de fallback.

### Atalhos (app instalado)

Quando o app está instalado, você pode criar atalhos rápidos:

- **Novo Evento** — abrir diretamente no formulário de criar evento.
- **Minha Agenda** — ir direto para o calendário.
- **Tarefas** — abrir a aba de sementes.

Acesse os atalhos pela ação "Compartilhar para" → Time Tasks (onde disponível) ou pelo menu do app.

### Notificações push

O Time Tasks suporta notificações do navegador quando instalado. Ative a permissão quando solicitado para receber lembretes de eventos mesmo com o app fechado.

### Limpar cache e dados

Se o app estiver lento ou com dados desatualizados:

1. **No app:** Abra **Configurações > Sobre** e procure por opção de cache.
2. **No navegador:** F12 → Application → Clear Storage → Clear.
3. **Dados pessoais** (eventos, tarefas) sempre permanecem no Supabase — só o cache local é limpo.

Recarregue a página ou reinstale o app após limpar.

## 16. Solução de problemas

### A SX não responde

Confirme a conexão, atualize a página e faça login novamente. Se continuar, verifique `/api/health` e a variável privada da IA no EasyPanel.

### O som não toca

Abra **Notificações**, ative o som, clique em **Ouvir agora** e confirme que a aba não está silenciada. Alguns navegadores bloqueiam áudio antes da primeira interação.

### Não recebi notificação com o navegador fechado

Esse comportamento exige Web Push e ainda está no roadmap. Deixe o aplicativo aberto para os alertas atuais.

### A voz não aparece

O navegador não oferece a API de reconhecimento de voz ou o microfone foi bloqueado. Use texto ou libere a permissão nas configurações do navegador.

### Limpei o cache

Faça login novamente. Eventos, tarefas, preferências e reservas permanecem no Supabase.

### O calendário não aparece em visão Semana no celular

No mobile, o app inicia em visão **Mês** por padrão — Semana em 375 px é ilegível. Você pode trocar manualmente pelo seletor de visão no topo do calendário.

### O clima não aparece

O widget de clima requer geolocalização ativa ou uma cidade manual cadastrada. Se recusou permissão ao navegador, limpe o localStorage (F12 > Storage > clear all) e tente novamente. Verifique também se o navegador tem conexão para consultar a API Open-Meteo.
