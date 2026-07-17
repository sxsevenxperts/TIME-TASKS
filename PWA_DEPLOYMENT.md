# 🚀 PWA Deployment Checklist

## ✅ Fase 1: Arquivos PWA Criados

- ✅ `public/manifest.webmanifest` — Web App Manifest (metadados, atalhos, ícones)
- ✅ `public/service-worker.js` — Service Worker (offline, caching, sync)
- ✅ `public/pwa-register.js` — Registro SW + PWA utilities
- ✅ `public/browserconfig.xml` — Configuração Windows/Microsoft tiles
- ✅ `public/icon-192.png` — Ícone 192x192 (recomendado)
- ✅ `public/icon-192-maskable.png` — Ícone maskable (adaptive)
- ✅ `public/icon-512.png` — Ícone 512x512 (splash screens)
- ✅ `public/icon-512-maskable.png` — Ícone maskable grande
- ✅ Meta tags PWA no `index.html` (iOS, Android, Windows)
- ✅ Script de geração de ícones `scripts/generate-pwa-icons.js`
- ✅ Build automatizado (ícones gerados antes do build)

## 🔍 Verificação Local

### 1️⃣ Build & Preview
```bash
npm run build      # Build com geração automática de ícones
npm run preview    # Servir em http://localhost:4173
```

### 2️⃣ DevTools Validation (Chrome/Edge/Brave)
```
F12 → Application → Manifest
- ✓ Verificar se manifest.webmanifest carrega
- ✓ Status deve ser "valid" ou com warnings apenas
```

### 3️⃣ Service Worker Status
```
F12 → Application → Service Workers
- ✓ Verificar se service-worker.js está registered
- ✓ Clicar "offline" e testar funcionalidade
```

### 4️⃣ Lighthouse PWA Audit
```
F12 → Lighthouse
- Select: Performance, PWA
- Run audit
- Target: Score > 90, sem erros críticos
```

## 📱 Testar em Dispositivos

### Android
1. Abrir app em Chrome/Firefox
2. Menu → "Install app" (ou "Add to Home Screen")
3. Verificar:
   - Ícone correto
   - Nome: "SX Time Tasks"
   - Modo fullscreen
   - Offline functionality

### iOS
1. Abrir app em Safari
2. Menu → "Add to Home Screen"
3. Verificar:
   - Ícone correto (apple-touch-icon)
   - Nome: "Time Tasks"
   - Modo fullscreen (apple-mobile-web-app-capable)
   - Barra de status translúcida

## 🌐 Pré-Deploy Checklist

### HTTPS (Obrigatório)
- [ ] Certificado SSL/TLS válido
- [ ] Redirecionamento HTTP → HTTPS
- [ ] Mixed content bloqueado

### Headers & Caching
```nginx
# Nginx example
add_header Cache-Control "public, max-age=31536000" for static assets (js, css, png)
add_header Cache-Control "public, max-age=300" for HTML, manifest, SW

# Importante: Service Worker NÃO deve ser cacheado por muito tempo
```

### CORS (se necessário)
```bash
# Verificar se manifest, ícones, SW estão acessíveis
curl -i https://seu-dominio.com/manifest.webmanifest
curl -i https://seu-dominio.com/service-worker.js
```

### Meta Tags Validação
```html
✓ <meta name="theme-color" content="#9be800" />
✓ <link rel="manifest" href="/manifest.webmanifest" />
✓ <link rel="apple-mobile-web-app-capable" content="yes" />
✓ <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

## 🚀 Deploy Steps

### 1. Deploy Files
```bash
# Build local
npm run build

# Upload dist/ para seu servidor
# Certifique-se que os seguintes arquivos estão acessíveis:
# - /dist/index.html
# - /dist/manifest.webmanifest
# - /dist/service-worker.js
# - /dist/pwa-register.js
# - /dist/browserconfig.xml
# - /dist/icon-*.png
```

### 2. Configure Server Headers
```nginx
# /etc/nginx/sites-available/seu-site

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    # SSL config
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/dist;
    
    # Service Worker: não cache por muito tempo
    location ~* ^/service-worker\.js$ {
        add_header Cache-Control "public, max-age=300";
        add_header Service-Worker-Allowed "/";
    }
    
    # Manifest: não cache por muito tempo
    location ~* ^/manifest\.webmanifest$ {
        add_header Cache-Control "public, max-age=300";
        add_header Content-Type "application/manifest+json";
    }
    
    # Assets estáticos: cache agressivo
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }
    
    # HTML: cache moderado
    location ~* \.html$ {
        add_header Cache-Control "public, max-age=3600";
        try_files $uri $uri/ /index.html;
    }
    
    # Default
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Verify Deploy
```bash
# Testar HTTPS + cert válido
curl -I https://seu-dominio.com

# Testar manifest
curl https://seu-dominio.com/manifest.webmanifest | jq .

# Testar Service Worker
curl https://seu-dominio.com/service-worker.js | head -20
```

## 📊 Pós-Deploy Monitoring

### Lighthouse CI
```bash
# Integrar com CI/CD
npm install -D @lhci/cli@*.* @lhci/server

# Ver logs
lhci autorun
```

### Sentry / Error Tracking
Monitorar erros no Service Worker:
```javascript
// Adicionar no service-worker.js
self.addEventListener('error', (event) => {
  console.error('SW Error:', event);
  // Enviar para Sentry/observability
});
```

### Analíticos PWA
Rastrear:
- App installs (via `appinstalled` event)
- Offline usage
- Service Worker update cycles

## 🔧 Manutenção Futura

### Atualizações de Ícone
```bash
# Se logo mudar, regenerar ícones:
npm run pwa:icons
```

### Novas Features PWA
1. **Push Notifications** — back-end implementar
2. **Background Sync** — implementar sincronização offline
3. **Shortcuts Dinâmicas** — atualizar atalhos com eventos recentes
4. **Share Target** — compartilhar eventos com app

### Atualizações do Manifest
- Adicionar novos `shortcuts`
- Atualizar `categories`
- Adicionar `screenshots` com novos designs

## 📚 Recursos

- [PWA Checklist — Google](https://developers.google.com/web/progressive-web-apps/checklist)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Workers Spec](https://w3c.github.io/ServiceWorker/)
- [PWA Builder — Validar PWA](https://www.pwabuilder.com/)
- [Lighthouse — Auditar](https://developers.google.com/web/tools/lighthouse)

---

**Status:** ✅ Pronto para deploy
**Versão:** 1.0.0 PWA
**Data:** 2026-07-16
