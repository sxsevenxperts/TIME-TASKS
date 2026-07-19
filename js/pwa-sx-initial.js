/**
 * PWA SX Initial — DESATIVADO
 * Este módulo foi escrito contra um DOM fantasma e causa bugs na UI.
 * Manter como stub vazio para evitar erros de import em app.js.
 */

/**
 * PWA SX Initial (desativado — módulo usa seletores DOM inexistentes)
 * Toda a lógica aqui (@configureInitialLayout, setupVoiceInputDefault, etc)
 * foi escrita contra (#sx-panel, .navigation-bottom, [data-sx-input])
 * que não existem em index.html. A regra real é: #ai-sidebar (não #sx-panel),
 * #mobile-tabbar (não .navigation-bottom), #ai-input (não [data-sx-input]).
 *
 * Quando reescrever, use os seletores reais e avoid duplica
r initVoiceAssistant()
 * que já roda em app.js:71-73.
 */
export async function initPWASXInitial() {
  // noop: módulo está offline até ser portado para os seletores reais
}



export function setupSXModeToggle() {
  // noop (was trying to toggle #sx-panel which doesn't exist; use navigation.js instead)
}

export default {
  initPWASXInitial,
  setupSXModeToggle
};
