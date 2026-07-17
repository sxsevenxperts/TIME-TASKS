# PWA Setup — SX Time Tasks

## ✅ Completado

- [x] `manifest.webmanifest` — configuração PWA completa com atalhos
- [x] `service-worker.js` — cache offline, sync background, notificações
- [x] `pwa-register.js` — registro SW, PWA utils, install prompt
- [x] Meta tags PWA no `index.html` (iOS, Android, Windows)
- [x] `browserconfig.xml` — configuração Windows/Microsoft tiles

## 🎨 Gerar Ícones PNG

Você precisa gerar ícones em múltiplos tamanhos a partir do logo:

**Opção 1: ImageMagick (CLI)**
```bash
convert public/sx-time-tasks-logo.png -resize 192x192 public/icon-192.png
convert public/sx-time-tasks-logo.png -resize 192x192 public/icon-192-maskable.png
convert public/sx-time-tasks-logo.png -resize 512x512 public/icon-512.png
convert public/sx-time-tasks-logo.png -resize 512x512 public/icon-512-maskable.png
```

**Opção 2: Online (recomendado)**
1. Acesse [pwa-asset-generator](https://www.pwabuilder.com/imageGenerator) ou [Favicon.io](https://favicon.io/)
2. Faça upload de `sx-time-tasks-logo.png`
3. Baixe os ícones gerados:
   - `icon-192.png` (192x192, não maskable)
   - `icon-192-maskable.png` (192x192, maskable)
   - `icon-512.png` (512x512, não maskable)
   - `icon-512-maskable.png` (512x512, maskable)
4. Salve em `/public/`

**Opção 3: Node.js script (criar posteriormente)**
```bash
npm install sharp
node scripts/generate-pwa-icons.js
```

## 🚀 Features PWA Habilitadas

### Service Worker
- ✅ **Network-first** para API/Supabase
- ✅ **Cache-first** para assets estáticos (JS, CSS, imagens)
- ✅ **Offline fallback** para requests que falham
- ✅ Limpeza automática de caches antigos

### Manifest
- ✅ Display standalone (app full-screen)
- ✅ Atalhos (Novo Evento, Minha Agenda, Tarefas)
- ✅ Screenshots para app stores
- ✅ Categorias: productivity, utilities
- ✅ Suporte maskable icons (adaptive)

### HTML Meta Tags
- ✅ iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- ✅ Android: `mobile-web-app-capable`
- ✅ Windows: `msapplication-TileColor`, `msapplication-config`
- ✅ Theme color: #9be800 (verde SX)

### PWA API Utils (`window.PWA`)
```javascript
// Verificar se está em standalone
if (window.PWA.isStandalone) { ... }

// Mostrar prompt de instalação
window.PWA.register();

// Limpar cache dinâmico
window.PWA.clearCache();

// Enviar notificação
window.PWA.showNotification('Novo evento', {
  body: 'Você tem um novo evento agendado',
  tag: 'event-notification'
});
```

## 📋 Checklist de Implementação

- [ ] Gerar ícones PNG (192x192, 512x512 + maskable)
- [ ] Testar em Chrome DevTools → Application → Manifest
- [ ] Testar Service Worker registration
- [ ] Testar offline mode (desabilitar internet)
- [ ] Testar "Add to Home Screen" em Android
- [ ] Testar "Add to Home Screen" em iOS (Settings → Home Screen)
- [ ] Validar PWA em [PWA Builder](https://www.pwabuilder.com/) ou [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [ ] Testar notificações push
- [ ] Deploy em produção com HTTPS

## 🔧 Próximas Melhorias

1. **Push Notifications** — implementar backend para notificações de eventos
2. **Background Sync** — sincronizar eventos offline
3. **Periodic Sync** — atualizar calendarios a cada 24h
4. **Shortcuts Dinâmicas** — atualizar atalhos com eventos recentes
5. **Share Target** — permitir compartilhar eventos via "Compartilhar para app"

## 🌐 Testar PWA Localmente

```bash
npm run build
npm run preview
# Acesse http://localhost:4173
```

## 📱 Deploy

Certifique-se de:
- ✅ HTTPS habilitado (obrigatório para PWA)
- ✅ `manifest.webmanifest` acessível
- ✅ `service-worker.js` acessível
- ✅ Ícones PNG servidos corretamente
- ✅ Cache headers configurados (~1 ano para assets, ~5min para HTML)

---

**Próximo passo:** Gerar os ícones PNG e testar em DevTools.
