// ============================================================
// ai.js — Integração com SX IA (Gemini Mock/Real)
// ============================================================

import { createEvent } from './events.js';

let geminiApiKey = localStorage.getItem('sx_gemini_key') || '';

export function initAI(callbacks = {}) {
  const input = document.getElementById('ai-input');
  const btnSubmit = document.getElementById('btn-ai-submit');
  const chatHistory = document.getElementById('ai-chat-history');
  
  // Modal de API Key
  const btnConfig = document.getElementById('btn-ai-config');
  const modal = document.getElementById('apikey-modal');
  const closeBtn = document.getElementById('apikey-close');
  const saveBtn = document.getElementById('apikey-save');
  const inputKey = document.getElementById('apikey-input');

  // Event Listeners para o Modal
  if (btnConfig) {
    btnConfig.addEventListener('click', () => {
      inputKey.value = geminiApiKey;
      modal.setAttribute('aria-hidden', 'false');
      inputKey.focus();
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      geminiApiKey = inputKey.value.trim();
      localStorage.setItem('sx_gemini_key', geminiApiKey);
      modal.setAttribute('aria-hidden', 'true');
      addSystemMessage('Chave API salva! SX está pronta para ajudar.');
    });
  }

  // Envio de Mensagem
  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;
    
    // UI: Adicionar mensagem do usuário
    addUserMessage(text);
    input.value = '';
    
    // Lógica de resposta (Mock básico ou Gemini Real)
    if (!geminiApiKey) {
      setTimeout(() => {
        addSystemMessage('Eu entendi o seu comando, mas preciso que você configure sua Chave de API do Google Gemini em **Configurações > IA (Gemini)** para criar o evento de verdade.');
      }, 800);
      return;
    }

    // Usar a API do Gemini
    addSystemMessage('Processando...', 'ai-loading');
    
    try {
      const result = await processWithGemini(text);
      document.querySelector('.ai-loading')?.remove();
      
      if (result.action === 'CREATE_EVENT' && result.event) {
        // Salvar evento no DB local
        createEvent(result.event);
        addSystemMessage(`Pronto! Criei o evento **${result.event.title}** para você no dia ${result.event.date}.`);
        if (callbacks.onEventCreated) callbacks.onEventCreated();
      } else {
        addSystemMessage(result.message || 'Desculpe, não entendi o que você quis dizer.');
      }
    } catch (err) {
      document.querySelector('.ai-loading')?.remove();
      addSystemMessage('Erro de conexão com a API do Gemini. Verifique sua chave.');
      console.error(err);
    }
  };

  btnSubmit.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Funções UI
  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg--user';
    div.textContent = text;
    chatHistory.appendChild(div);
    scrollToBottom();
  }

  function addSystemMessage(htmlText, customClass = '') {
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg--system ${customClass}`;
    
    // Converter markdown básico (negrito)
    const formatted = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    div.innerHTML = formatted;
    
    chatHistory.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

// ── Gemini API Integration ──────────────────────────────────────────────
async function processWithGemini(userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  
  // Data atual para dar contexto temporal à IA
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const timeString = today.toTimeString().split(' ')[0].substring(0, 5);

  const prompt = `
Você é a SX, a assistente virtual inteligente do aplicativo de calendário Time Tasks.
O usuário digitou o seguinte comando: "${userText}"
Hoje é ${dateString} e são ${timeString}.

Seu objetivo é extrair as informações e retornar APENAS um objeto JSON válido, sem markdown, sem código extra, estritamente no seguinte formato:
{
  "action": "CREATE_EVENT",
  "event": {
    "title": "Título do Evento",
    "date": "YYYY-MM-DD",
    "start": "HH:MM",
    "end": "HH:MM",
    "allDay": false,
    "calendarId": "pessoal",
    "description": ""
  }
}
Se não for possível identificar data/hora, use a data de hoje e adicione 1 hora ao horário atual. Se não for um comando de criar evento, retorne {"action": "CHAT", "message": "Sua resposta amigável aqui."}.
  `;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('API Error');
  }

  const data = await response.json();
  const responseText = data.candidates[0].content.parts[0].text;
  
  // Limpar possível markdown do JSON (ex: \`\`\`json ... \`\`\`)
  let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Gemini response:", responseText);
    return { action: 'CHAT', message: 'Entendi o comando, mas houve um erro interno ao processar a data/hora.' };
  }
}
