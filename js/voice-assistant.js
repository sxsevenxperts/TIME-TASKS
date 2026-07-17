/**
 * Voice Assistant for JWS PWA
 * Reconhece fala, agenda eventos/tarefas, confirma com áudio
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

let isListening = false;
let recognitionInstance = null;

/**
 * Inicializa Voice Assistant
 */
export function initVoiceAssistant() {
  if (!SpeechRecognition) {
    console.warn('❌ Web Speech API não suportada');
    return false;
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.continuous = false;
  recognitionInstance.interimResults = true;
  recognitionInstance.lang = 'pt-BR';

  setupRecognitionHandlers();
  setupVoiceUI();

  console.log('✅ Voice Assistant inicializado');
  return true;
}

/**
 * Setup recognition event handlers
 */
function setupRecognitionHandlers() {
  recognitionInstance.onstart = () => {
    isListening = true;
    updateVoiceUI('listening');
    console.log('🎤 Ouvindo...');
  };

  recognitionInstance.onresult = (event) => {
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      }
    }

    if (finalTranscript) {
      processVoiceCommand(finalTranscript.trim());
    }
  };

  recognitionInstance.onerror = (event) => {
    console.error('Erro:', event.error);
    updateVoiceUI('error', event.error);
  };

  recognitionInstance.onend = () => {
    isListening = false;
    updateVoiceUI('idle');
  };
}

/**
 * Inicia reconhecimento de voz
 */
export function startListening() {
  if (!SpeechRecognition) {
    alert('Voice não suportado');
    return;
  }

  if (isListening) {
    stopListening();
    return;
  }

  recognitionInstance.start();
}

/**
 * Para reconhecimento de voz
 */
export function stopListening() {
  if (recognitionInstance && isListening) {
    recognitionInstance.stop();
  }
}

/**
 * Processa comando de voz
 */
async function processVoiceCommand(text) {
  console.log('📝 Comando:', text);
  recognitionInstance.abort();
  updateVoiceUI('processing');

  const sxInput = document.querySelector('[data-sx-input]');
  if (sxInput) {
    sxInput.value = text;
    const submitBtn = document.querySelector('[data-sx-submit]');
    if (submitBtn) {
      submitBtn.click();
    }
  }

  await speakText(`Entendido. ${text.substring(0, 40)}...`);
}

/**
 * Text-to-Speech
 */
export async function speakText(text, rate = 1) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Feedback de sucesso
 */
export async function speakSuccess(message) {
  await speakText(message, 1);
}

/**
 * Setup UI para voice
 */
function setupVoiceUI() {
  const voiceButton = document.getElementById('sx-voice-button');
  if (!voiceButton) return;

  voiceButton.addEventListener('click', (e) => {
    e.preventDefault();
    startListening();
  });

  voiceButton.setAttribute('data-voice-state', 'idle');
}

/**
 * Atualiza UI de voice
 */
function updateVoiceUI(state, transcript = '') {
  const voiceButton = document.getElementById('sx-voice-button');
  if (!voiceButton) return;

  voiceButton.setAttribute('data-voice-state', state);

  switch (state) {
    case 'listening':
      voiceButton.style.background = 'rgba(155, 232, 0, 0.7)';
      break;
    case 'processing':
      voiceButton.style.background = 'rgba(155, 232, 0, 0.3)';
      break;
    case 'error':
      voiceButton.style.background = 'rgba(255, 0, 0, 0.7)';
      break;
    default:
      voiceButton.style.background = '';
  }
}

/**
 * Verifica suporte de voice
 */
export function isVoiceSupported() {
  return !!SpeechRecognition && !!window.speechSynthesis;
}

/**
 * Setup atalho de voz
 */
export function setupVoiceShortcut() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      startListening();
    }

    if (e.key === 'Escape' && isListening) {
      stopListening();
    }
  });

  console.log('✅ Atalho: Ctrl+Shift+V');
}

/**
 * Criar evento por voz
 */
export async function createEventByVoice(text) {
  const sxInput = document.querySelector('[data-sx-input]');
  if (sxInput) {
    sxInput.value = text;
    const submitBtn = document.querySelector('[data-sx-submit]');
    if (submitBtn) {
      submitBtn.click();
    }
  }
}

/**
 * Pedir permissão de microfone
 */
export async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Microfone negado:', error);
    return false;
  }
}

export default {
  initVoiceAssistant,
  startListening,
  stopListening,
  speakText,
  speakSuccess,
  isVoiceSupported,
  createEventByVoice,
  requestMicrophonePermission,
  setupVoiceShortcut
};
