# 📘 Manual do Usuário — Time Tasks (SaaS)

> Guia completo de uso da aplicação Time Tasks, com armazenamento em nuvem e inteligência artificial (SX).

---

## Índice

1. [Introdução](#1-introdução)
2. [Acesso e Autenticação](#2-acesso-e-autenticação)
3. [Interface Principal e IA (SX)](#3-interface-principal)
4. [Navegação](#4-navegação)
5. [Gerenciando Eventos](#5-gerenciando-eventos)
6. [Calendários](#6-calendários)
7. [Tema Dark / Light](#7-tema-dark--light)
8. [Atalhos de Teclado](#8-atalhos-de-teclado)
9. [Segurança e Nuvem (Supabase)](#9-segurança-e-nuvem)
10. [FAQ — Perguntas Frequentes](#10-faq--perguntas-frequentes)

---

## 1. Introdução

**Time Tasks** é uma aplicação de calendário web moderna, projetada para ajudá-lo a organizar seu tempo de forma visual e intuitiva. Com a nova arquitetura SaaS, seus dados são armazenados de forma isolada e segura na nuvem (Supabase), permitindo acessos autenticados e inteligência artificial avançada.

### Principais Características
- ✅ **SaaS Completo e Isolado** — Autenticação segura por e-mail e senha
- ✅ **Armazenamento em Nuvem** — Seus dados não são mais perdidos ao limpar o cache do navegador
- ✅ **SX, sua Assistente de IA (Gemini)** — Agende eventos usando apenas linguagem natural
- ✅ **Interface Moderna** — Tema claro/escuro e Glassmorphism
- ✅ **Múltiplas Visões** — Dia, 3 Dias, Semana e Mês

---

## 2. Acesso e Autenticação

Para garantir que ninguém tenha acesso aos seus eventos, o sistema agora exige **Login**.

### Criando sua conta
1. Ao abrir o aplicativo, você verá o modal de Autenticação escurecendo o fundo.
2. Caso não tenha conta, clique em **Não tem uma conta? Criar conta**.
3. Insira seu e-mail e digite uma senha segura.
4. Clique em **Criar Conta**. Você será autenticado instantaneamente.

### Entrando
1. Na tela principal, insira seu e-mail e senha.
2. Clique em **Entrar**.
3. Seus eventos serão baixados instantaneamente do servidor (Supabase) para o calendário.

> Se o botão ficar em “Aguarde...” ou aparecer “Failed to fetch”, o problema não é a senha: o domínio do frontend ainda não está autorizado no CORS do Supabase. No EasyPanel, adicione o domínio publicado como origem permitida e mantenha `Access-Control-Allow-Credentials: true` sem usar `*` como origem.

### Como Sair (Logout)
- Na barra lateral esquerda, expanda o menu de **Configurações**.
- Clique na opção **Conta**.
- Clique no botão vermelho **Sair**.

---

## 3. Interface Principal e IA (SX)

A interface do Time Tasks é dividida em áreas principais:

### 🤖 SevenChat / Assistente SX (IA Gemini)
- Abra pelo botão de chat na faixa vertical esquerda; o painel aparece à direita e recebe foco automaticamente.
- Basta abrir o chat, digitar algo como *"Tenho médico amanhã às 15h"* e pressionar Enter.
- A SX analisará seu texto e criará o evento no calendário automaticamente!
- **Nota:** Você precisa fornecer a sua chave de API do Gemini no menu de Configurações (IA Gemini) para habilitar o processamento avançado.

### 🟦 Sidebar (Barra Lateral Esquerda)
- **Botão "Novo Evento"** — Abre o formulário clássico
- **Mini-Calendário** — Para navegação rápida
- **Filtro de Calendários** — Mostra os 5 calendários coloridos para exibir/ocultar eventos

### 🟩 Header (Cabeçalho Superior)
- **Título do Período** — Exibe o mês e ano atual
- **Seletor de Visão** — Dia, 3 Dias, Semana e Mês

### 🟨 Área do Calendário (Centro)
- **Grade de Horários e Eventos** — Onde a mágica acontece.
- **Indicador "Agora"** — Linha vermelha mostrando a hora atual.

---

## 4. Navegação

### Botões Anterior / Próximo e "Hoje"
Use as setas (◀ ▶) para pular dias/semanas. Clique em **Hoje** para voltar instantaneamente para o dia corrente.

### Visões Disponíveis
- **Dia (`D`)**: Foco intenso.
- **3 Dias**: O meio-termo perfeito.
- **Semana (`W`)**: A visão clássica (padrão).
- **Mês (`M`)**: Visão em formato de grade mensal para ver tudo de longe.

---

## 5. Gerenciando Eventos

Existem **três formas** de criar um evento:

1. **Via Inteligência Artificial (Avançado)**
   - Fale com a SX: *"Crie um evento de Estudos sexta feira o dia inteiro"*. Ela cuidará do resto.
2. **Clicando na Grade do Calendário (Prático)**
   - Clique em qualquer quadrado vazio no dia/horário desejado.
3. **Botão "Novo Evento" (Clássico)**
   - Clique em "+ Novo Evento" ou aperte a tecla `N`.

### Editar e Excluir
- **Para editar:** Clique no evento na grade e depois clique no ícone do Lápis ✏️ no resumo.
- **Para excluir:** Clique no evento e aperte a lixeira 🗑️ (ação irreversível, removida diretamente do banco de dados na nuvem).

---

## 6. Calendários e Cores

O Time Tasks tem 5 calendários fixos com cores para manter tudo organizado:
- 🟣 **Pessoal** | 🔵 **Trabalho** | 🟢 **Saúde** | 🟠 **Estudos** | 🩷 **Social**

Use os "checkboxes" na barra lateral para **ocultar temporariamente** algum deles. Ocultar **NÃO** deleta o evento do banco de dados, apenas limpa a sua visão momentânea.

---

## 7. Tema Dark / Light

Clique no **botão de tema** na sidebar (sol ☀️ ou lua 🌙) para alternar o modo noturno. O app também detecta automaticamente se o Windows/Mac/Linux do seu PC está configurado para o modo escuro.

---

## 8. Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `T` | Ir para Hoje |
| `N` | Abrir modal de Novo Evento |
| `D` | Visão Dia |
| `W` | Visão Semana |
| `M` | Visão Mês |
| `←` / `→` | Anterior / Próximo |
| `Esc` | Fechar modal ou popover |

*(Os atalhos são desabilitados se você estiver digitando no chat da IA ou no formulário de edição).*

---

## 9. Segurança e Nuvem (Supabase)

A mudança mais significativa da versão atual é o **Banco de Dados Real**. 

### Como os Dados são Salvos
Todos os seus eventos não ficam mais no cache local do navegador. Eles são transmitidos criptografados via protocolo HTTPS para o nosso banco de dados em nuvem operando no **Supabase**. Toda a infraestrutura deste SaaS roda de forma privada em servidor próprio (via Easypanel), garantindo soberania total dos dados.

### Isolamento 100% (RLS)
Sua conta possui **Row Level Security (RLS)**. Isso significa que o servidor Easypanel bloqueia rigidamente no nível do banco de dados qualquer tentativa de um usuário carregar eventos de outro, isolando 100% as contas e acessos. Seu UUID único (Authentication ID) é exigido em qualquer transação (Criação, Edição, Deleção).

### Deploy e Integração Contínua (Easypanel)
O frontend desta aplicação foi desenhado para ser implantado diretamente via **GitHub para o Easypanel** (utilizando Nixpacks e o servidor estático `serve`). 

**Correção Recente (Variáveis de Ambiente):**
Inicialmente, as chaves do Supabase (URL e ANON_KEY) foram configuradas em um arquivo `.env.local` para testes, o que fazia com que o Git ignorasse o arquivo. Isso resultava em um erro onde o Easypanel compilava o código sem as credenciais do banco de dados. 
Para resolver esse gargalo sem que o administrador precise preencher manualmente chaves no painel do servidor, foi adotado o arquivo `.env.production`, que é versionado nativamente. Isso garante que cada push (commit) na `main` construa perfeitamente a integração de dados no servidor SaaS.

### Checklist de publicação

- Confirmar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no build.
- Confirmar CORS do Supabase com o domínio publicado do frontend; wildcard não é compatível com credenciais.
- Abrir o SevenChat e confirmar `aria-expanded=true`/painel visível.
- Testar login, logout e uma operação CRUD real antes de considerar o deploy concluído.
- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em arquivos versionados; o script administrativo exige essa variável somente no ambiente local seguro.

---

## 10. FAQ — Perguntas Frequentes

### ❓ O que acontece se eu limpar o cache do meu navegador?
**Nada.** Seus eventos estão seguros na nuvem! Você apenas precisará fazer login com seu e-mail e senha novamente para baixá-los do servidor para a tela.

### ❓ A IA (SX) criou um evento no dia errado.
A SX interpreta o contexto do texto baseado na data de hoje. Tente ser mais específico nas datas quando enviar o comando para a assistente (ex: *"Reunião dia 10 de Agosto às 14h"*).

### ❓ Posso acessar de outro PC ou do celular?
**Sim!** Como o app se tornou um SaaS real na nuvem, qualquer dispositivo conectado à internet que abrir o aplicativo e fizer login na sua conta mostrará todos os seus eventos perfeitamente sincronizados.

---

<p align="center">
  <em>Manual atualizado em Julho de 2026 (Versão SaaS & IA)</em><br>
  <strong>⏰ Time Tasks</strong> — Organize seu tempo com IA e segurança na nuvem.
</p>
