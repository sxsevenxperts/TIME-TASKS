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

Ao entrar na conta, um versículo bíblico aparece em um balão animado no topo da tela. Este é um versículo **por acesso** — único a cada vez que você faz login, diferente do histórico de notificações que usa períodos (manhã/tarde).

Você pode:
- Clicar em **X** para fechar o balão imediatamente.
- Deixar o balão desaparecer automaticamente.

O versículo fica armazenado apenas para referência pessoal durante a sessão.

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

### Categorias

Os calendários disponíveis são Pessoal, Trabalho, Saúde, Estudos e Social. As caixas na lateral ocultam/exibem categorias sem apagar os dados.

## 6. Tarefas/Sementes

1. Abra **Sementes** (aba Seed no mobile, botão na barra lateral no desktop).
2. Clique em **Nova tarefa**.
3. Informe tarefa, prazo, horário do lembrete e observações.
4. Use **Concluir**, **Editar**, **Reabrir** ou **Excluir** no cartão.

## 7. Assistente SX

Clique no botão SX (barra lateral no desktop ou aba SX no mobile) para abrir a assistente.

Exemplos:

- `Agende reunião amanhã das 15h às 16h e avise 10 minutos antes.`
- `Crie uma tarefa para enviar o relatório sexta às 14h.`
- `Marque consulta dia 20 às 09h no calendário Saúde.`

A SX interpreta a data no fuso configurado, valida o resultado e só então salva no Supabase. A chave privada da IA fica no servidor e não aparece nas configurações nem no navegador.

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

Acesse **Trigger** na barra de navegação. Esta seção está em desenvolvimento e permitirá criar automações — verificações de clima, resumos de agenda e, futuramente, notificações baseadas em condições externas.

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

## 11. Versículos diários

Em **Configurações > Notificações**:

1. Ative **Versículos diários**.
2. Escolha o horário da manhã e da tarde.
3. Mantenha o app aberto no horário para receber o som, toast e, se permitido, a notificação do navegador.

O histórico impede repetição do mesmo versículo para a conta e limita uma entrega por período em cada dia.

## 12. Configurações

- **Meu Plano** — estado do ambiente privado.
- **Conta** — nome de exibição, e-mail e sessão.
- **Geral** — idioma, tema, fuso, formato de hora e início da semana.
- **Calendários** — visibilidade e calendário padrão.
- **Notificações** — alertas, som e versículos.
- **IA** — resposta inteligente e entrada por voz.
- **Novos Eventos** — duração, lembrete e conflitos.
- **Sobre** — versão, privacidade e documentação.

WhatsApp, Telegram e Google Calendar são exibidos como indisponíveis até que as integrações reais sejam implementadas.

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

## 15. Solução de problemas

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
