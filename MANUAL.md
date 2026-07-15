# 📘 Manual do Usuário — Time Tasks

> Guia completo de uso da aplicação Time Tasks.

---

## Índice

1. [Introdução](#1-introdução)
2. [Primeiros Passos](#2-primeiros-passos)
3. [Interface Principal](#3-interface-principal)
4. [Navegação](#4-navegação)
5. [Gerenciando Eventos](#5-gerenciando-eventos)
6. [Calendários](#6-calendários)
7. [Tema Dark / Light](#7-tema-dark--light)
8. [Atalhos de Teclado](#8-atalhos-de-teclado)
9. [Armazenamento de Dados](#9-armazenamento-de-dados)
10. [FAQ — Perguntas Frequentes](#10-faq--perguntas-frequentes)

---

## 1. Introdução

### O que é o Time Tasks?

**Time Tasks** é uma aplicação de calendário web moderna, projetada para ajudá-lo a organizar seu tempo de forma visual e intuitiva. Inspirado no [Toki Calendar](https://toki.day), o Time Tasks oferece uma experiência elegante para gerenciar seus compromissos, tarefas e eventos do dia a dia.

### Principais Características

- ✅ Funciona **100% no navegador** — sem necessidade de conta ou login
- ✅ **Seus dados ficam salvos** automaticamente no seu navegador
- ✅ Interface **moderna e responsiva** com tema claro e escuro
- ✅ **Múltiplas visões** de calendário para diferentes necessidades
- ✅ **5 categorias** de calendário com cores distintas
- ✅ **Atalhos de teclado** para usuários avançados

### Para quem é?

O Time Tasks é ideal para qualquer pessoa que queira uma ferramenta simples e bonita para organizar compromissos pessoais, reuniões de trabalho, atividades de estudo, exercícios físicos e eventos sociais — tudo em um só lugar.

---

## 2. Primeiros Passos

### Como Instalar

#### Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** versão 18 ou superior → [Baixar Node.js](https://nodejs.org/)
- **npm** (já vem incluído com o Node.js)

#### Instalação Passo a Passo

```bash
# 1. Clone o repositório (ou baixe o ZIP)
git clone https://github.com/seu-usuario/time-tasks.git

# 2. Acesse a pasta do projeto
cd time-tasks

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Como Abrir

Após executar `npm run dev`, o terminal exibirá uma URL como:

```
Local: http://localhost:5173/
```

**Abra essa URL no seu navegador** (Chrome, Firefox, Edge ou Safari) para acessar o Time Tasks.

> 💡 **Dica:** O servidor de desenvolvimento atualiza automaticamente quando você faz alterações no código (Hot Module Replacement).

---

## 3. Interface Principal

A interface do Time Tasks é dividida em três áreas principais:

### 🟦 Sidebar (Barra Lateral Esquerda)

A sidebar contém:

- **Botão "Novo Evento"** — Abre o formulário para criar um novo evento rapidamente
- **Mini-Calendário** — Um calendário mensal compacto para navegação rápida entre datas
- **Lista de Calendários** — Mostra os 5 calendários disponíveis com opção de mostrar/ocultar cada um
- **Botão de Tema** — Alterna entre modo claro e escuro

### 🟩 Header (Cabeçalho Superior)

O header contém:

- **Título do Período** — Exibe o mês e ano atual (ex: "Julho 2025")
- **Botões de Navegação** — Setas para avançar/retroceder e botão "Hoje"
- **Seletor de Visão** — Botões para alternar entre Dia, 3 Dias, Semana e Mês

### 🟨 Área do Calendário (Centro)

A área principal exibe:

- **Grade de Horários** — Coluna lateral com as horas do dia (00h às 23h)
- **Colunas de Dias** — Uma coluna para cada dia visível na visão selecionada
- **Eventos** — Blocos coloridos posicionados nos horários correspondentes
- **Indicador "Agora"** — Uma linha vermelha horizontal que marca o horário atual em tempo real

---

## 4. Navegação

### 4.1 Botões Anterior / Próximo

Use os botões de **seta** ( ◀ ▶ ) no header para navegar entre períodos:

| Visão | ◀ Anterior | ▶ Próximo |
|---|---|---|
| **Dia** | Dia anterior | Próximo dia |
| **3 Dias** | 3 dias anteriores | Próximos 3 dias |
| **Semana** | Semana anterior | Próxima semana |
| **Mês** | Mês anterior | Próximo mês |

### 4.2 Botão "Hoje"

Clique no botão **"Hoje"** no header para retornar instantaneamente à data atual, independente de quão longe você navegou.

> 💡 **Atalho:** Pressione `T` no teclado para ir para Hoje.

### 4.3 Mini-Calendário

O mini-calendário na sidebar permite:

- **Ver o mês atual** em formato compacto
- **Clicar em qualquer dia** para navegar diretamente até ele
- **Navegar entre meses** usando as setas do mini-calendário
- O **dia atual** é destacado com um círculo
- O **dia/período selecionado** é destacado com uma cor de fundo

### 4.4 Seletor de Visão

Alterne entre as visões clicando nos botões do header:

#### 📋 Visão Dia
- Mostra **um único dia** em tela cheia
- Slots de horário com maior espaçamento
- Ideal para dias com muitos compromissos
- Atalho: `D`

#### 📋 Visão 3 Dias
- Mostra **3 dias consecutivos** lado a lado
- Equilíbrio entre detalhe e contexto
- Útil para planejar os próximos dias

#### 📋 Visão Semana
- Mostra **7 dias** (domingo a sábado ou segunda a domingo)
- Visão padrão e mais utilizada
- Atalho: `W`

#### 📋 Visão Mês
- Mostra o **mês inteiro** em formato de grade
- Eventos aparecem como barras compactas dentro dos dias
- Ideal para ter uma visão geral do mês
- Atalho: `M`

---

## 5. Gerenciando Eventos

### 5.1 Criar um Evento

Existem **duas formas** de criar um novo evento:

#### Método 1 — Clicando na Grade do Calendário

1. **Clique** em um slot de horário vazio na grade do calendário
2. O **formulário de novo evento** será aberto automaticamente
3. A **data e hora** serão preenchidas com base no slot clicado
4. Preencha o **título** do evento (obrigatório)
5. Ajuste a **hora de término** se necessário
6. Selecione o **calendário** (categoria/cor)
7. Marque **"Dia inteiro"** se aplicável
8. Adicione uma **descrição** (opcional)
9. Clique em **"Salvar"**

#### Método 2 — Botão "Novo Evento"

1. Clique no botão **"+ Novo Evento"** na sidebar (ou pressione `N`)
2. O formulário será aberto com a data e hora atuais
3. Preencha os campos e clique em **"Salvar"**

### 5.2 Editar um Evento

1. **Clique** em um evento existente na grade do calendário
2. Um **popover de preview** será exibido com o resumo do evento
3. Clique no botão **"Editar"** (ícone de lápis ✏️)
4. O **formulário de edição** será aberto com os dados atuais do evento
5. Faça as alterações desejadas
6. Clique em **"Salvar"** para confirmar

### 5.3 Excluir um Evento

Existem **duas formas** de excluir um evento:

#### Via Popover
1. **Clique** no evento na grade
2. No popover de preview, clique no botão **"Excluir"** (ícone de lixeira 🗑️)
3. **Confirme** a exclusão no diálogo de confirmação

#### Via Modal de Edição
1. Abra o evento para **edição** (conforme seção 5.2)
2. Clique no botão **"Excluir Evento"** na parte inferior do formulário
3. **Confirme** a exclusão

> ⚠️ **Atenção:** A exclusão de um evento é **permanente** e não pode ser desfeita.

### 5.4 Evento de Dia Inteiro

Para criar um evento que dure o dia inteiro:

1. Crie um novo evento (seção 5.1)
2. Marque a opção **"Dia inteiro"** no formulário
3. Os campos de hora serão desabilitados
4. O evento aparecerá na **área de dia inteiro** no topo da grade (nas visões Dia, 3 Dias e Semana) ou como uma barra no dia correspondente (na visão Mês)

---

## 6. Calendários

### 6.1 Calendários Disponíveis

O Time Tasks oferece **5 calendários** pré-configurados, cada um com sua cor distinta:

| Calendário | Cor | Uso Sugerido |
|---|---|---|
| 🟣 **Pessoal** | Roxo | Compromissos pessoais, lazer, vida pessoal |
| 🔵 **Trabalho** | Azul | Reuniões, deadlines, tarefas profissionais |
| 🟢 **Saúde** | Verde | Consultas médicas, exercícios, bem-estar |
| 🟠 **Estudos** | Laranja | Aulas, provas, atividades acadêmicas |
| 🩷 **Social** | Rosa | Encontros, festas, eventos sociais |

Ao criar ou editar um evento, você seleciona a qual calendário ele pertence. O evento será exibido na cor correspondente na grade.

### 6.2 Mostrar / Ocultar Calendários

Na sidebar, ao lado de cada calendário, há uma **checkbox** (caixa de seleção):

- ✅ **Marcado** — Os eventos desse calendário são **visíveis** na grade
- ⬜ **Desmarcado** — Os eventos desse calendário são **ocultados** da grade

Isso permite que você foque apenas nos calendários que são relevantes no momento. Por exemplo:
- Em horário de trabalho, mostre apenas **Trabalho**
- No fim de semana, mostre apenas **Pessoal** e **Social**
- Para planejar estudos, mostre apenas **Estudos**

> 💡 **Dica:** Ocultar calendários **não exclui** os eventos — eles continuam salvos e reaparecerão quando você marcar o calendário novamente.

---

## 7. Tema Dark / Light

### 7.1 Como Alternar o Tema

Clique no **botão de tema** na sidebar (ícone de sol ☀️ ou lua 🌙) para alternar entre:

- ☀️ **Modo Claro (Light)** — Fundo branco, texto escuro. Ideal para ambientes bem iluminados.
- 🌙 **Modo Escuro (Dark)** — Fundo escuro, texto claro. Ideal para uso noturno ou ambientes com pouca luz.

### 7.2 Detecção Automática do Sistema

Na primeira vez que você acessar o Time Tasks, o tema será configurado automaticamente com base na **preferência do seu sistema operacional**:

- Se seu sistema estiver em **modo escuro** → Time Tasks abrirá em modo escuro
- Se seu sistema estiver em **modo claro** → Time Tasks abrirá em modo claro

Após alternar manualmente, sua **preferência é salva** e será utilizada nas próximas visitas.

---

## 8. Atalhos de Teclado

Use atalhos de teclado para navegar com mais rapidez:

| Atalho | Ação | Descrição |
|---|---|---|
| `T` | **Hoje** | Navega para a data atual |
| `N` | **Novo Evento** | Abre o formulário de criação de evento |
| `D` | **Visão Dia** | Alterna para a visão de dia |
| `W` | **Visão Semana** | Alterna para a visão de semana |
| `M` | **Visão Mês** | Alterna para a visão de mês |
| `←` | **Anterior** | Navega para o período anterior |
| `→` | **Próximo** | Navega para o próximo período |
| `Esc` | **Fechar** | Fecha o modal ou popover aberto |

> 💡 **Nota:** Os atalhos de teclado são **desabilitados automaticamente** quando você está digitando em um campo de texto (input, textarea) para evitar conflitos.

---

## 9. Armazenamento de Dados

### Como os Dados são Salvos

O Time Tasks utiliza o **localStorage** do seu navegador para salvar todos os seus dados. Isso significa que:

- ✅ Seus eventos são salvos **automaticamente** a cada alteração
- ✅ Os dados **persistem** mesmo fechando o navegador
- ✅ **Nenhum dado** é enviado para servidores externos
- ✅ Sua **privacidade** é total — tudo fica local

### Limitações

- ❌ Os dados ficam **apenas neste navegador** — não sincronizam entre dispositivos
- ❌ Limpar os dados do navegador (cache/cookies) pode **apagar seus eventos**
- ❌ Usar modo **anônimo/privado** não salva os dados entre sessões

### Como Limpar os Dados

Se você deseja **apagar todos os eventos** e redefinir o Time Tasks:

#### Método 1 — Pelo Navegador

1. Abra as **Ferramentas do Desenvolvedor** (F12 ou Ctrl+Shift+I)
2. Vá na aba **Application** (Chrome) ou **Storage** (Firefox)
3. No menu lateral, clique em **Local Storage**
4. Encontre a entrada do Time Tasks
5. Clique com o botão direito e selecione **Delete**
6. Recarregue a página

#### Método 2 — Pelo Console

1. Abra as **Ferramentas do Desenvolvedor** (F12)
2. Vá na aba **Console**
3. Digite o seguinte comando e pressione Enter:

```javascript
localStorage.clear();
location.reload();
```

> ⚠️ **Atenção:** Esta ação é **irreversível**. Todos os seus eventos serão permanentemente apagados.

### Recomendação de Backup

Como os dados são armazenados apenas localmente, recomendamos:

- Anotar eventos importantes em outro lugar como backup
- Aguardar futuras versões com funcionalidade de exportação/importação (ICS)

---

## 10. FAQ — Perguntas Frequentes

### ❓ Meus eventos desapareceram. O que aconteceu?

Possíveis causas:
- Você limpou os dados do navegador (cache/cookies/localStorage)
- Você está acessando de um navegador ou perfil diferente
- Você estava usando o modo anônimo/privado

Infelizmente, se os dados do localStorage foram apagados, **não há como recuperá-los**.

---

### ❓ Posso acessar meus eventos de outro computador?

**Não na versão atual.** Os dados são salvos localmente no navegador. Cada navegador/computador terá seus próprios eventos. A sincronização entre dispositivos está planejada para versões futuras (veja o [Roadmap](./ROADMAP.md)).

---

### ❓ O Time Tasks funciona no celular?

O Time Tasks foi projetado com **responsividade** em mente, mas a melhor experiência é em telas maiores (desktop/tablet). Em telas pequenas, algumas funcionalidades podem ter layout adaptado.

---

### ❓ Preciso de internet para usar?

Você precisa de internet apenas para **baixar e instalar** o projeto (via `npm install`). Após isso, o servidor de desenvolvimento roda **localmente** e não requer conexão ativa com a internet.

---

### ❓ Como mudo o primeiro dia da semana?

Na versão atual, o calendário começa no **domingo**. A opção de configurar o primeiro dia da semana está planejada para versões futuras.

---

### ❓ Posso criar meus próprios calendários/categorias?

Na versão atual, os **5 calendários** são fixos (Pessoal, Trabalho, Saúde, Estudos, Social). A customização de calendários está planejada para versões futuras.

---

### ❓ Existe um limite de eventos?

Não há um limite fixo definido pela aplicação. O limite prático depende da capacidade do **localStorage** do seu navegador (geralmente entre 5MB e 10MB), o que comporta milhares de eventos sem problemas.

---

### ❓ Como reportar um bug ou sugerir uma melhoria?

Abra uma **Issue** no repositório do GitHub do projeto descrevendo:
- O que aconteceu (bug) ou o que você gostaria (sugestão)
- Passos para reproduzir (no caso de bugs)
- Seu navegador e sistema operacional

---

### ❓ O Time Tasks é gratuito?

**Sim!** O Time Tasks é um projeto **open source** distribuído sob a licença **MIT**. Você pode usar, modificar e distribuir livremente.

---

<p align="center">
  <em>Manual atualizado em Julho de 2025</em><br>
  <strong>⏰ Time Tasks</strong> — Organize seu tempo com estilo
</p>
