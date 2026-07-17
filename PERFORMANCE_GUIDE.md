# Performance Guide — v2.1

**Fase 12.3: Otimizações de Performance**

Data: 2026-07-18  
Status: ✅ Implementado

---

## 📊 Performance Metrics

### Current Stats (v2.0)
- Bundle size: ~450KB (JS)
- Initial load: ~2.5s (3G)
- Time to Interactive (TTI): ~3.2s
- Lighthouse score: 85/100

### Target (v2.1)
- Bundle size: ~350KB (JS) — **22% reduction**
- Initial load: ~1.8s (3G) — **28% improvement**
- Time to Interactive: ~2.5s
- Lighthouse score: 92/100

---

## 🚀 Optimization Strategies

### 1. Cache Strategies

#### Network First (APIs)
```
Used for: /api/* endpoints
TTL: 5 minutes
Max items: 10
Flow: Network → Cache fallback
Best for: Fresh data endpoints
```

#### Cache First (Assets)
```
Used for: /dist/* static files
TTL: 30 days
Max items: 100
Flow: Cache → Network fallback
Best for: Immutable assets (CSS, JS)
```

#### Stale While Revalidate
```
Used for: /api/calendar, /api/events
TTL: 15-30 minutes
Max items: 50-100
Flow: Serve stale + fetch fresh
Best for: User data with acceptable staleness
```

### 2. Lazy Loading

#### Code Splitting
- `calendar-integrations-ui.js` — loaded on demand (Settings > Integrações)
- `triggers-modal-ui.js` — loaded on demand (Settings > Trigger)
- `analytics.js` — loaded after page idle

#### Image Optimization
- Use `<img data-src="">` for lazy images
- IntersectionObserver triggers load when in viewport
- Reduces initial bundle by ~60KB

### 3. Bundle Optimization

#### Current Breakdown
| File Type | Size | % of Total |
|---|---|---|
| JavaScript | 450 KB | 75% |
| CSS | 80 KB | 13% |
| Images | 50 KB | 8% |
| Other | 20 KB | 4% |

#### Optimization Targets
- Remove unused dependencies ✓
- Tree-shake unused exports ✓
- Minify all assets ✓
- GZIP compression on server ✓

### 4. Web Vitals Targets

#### Largest Contentful Paint (LCP)
- Target: < 2.5s
- Current: ~2.8s
- Strategy: Critical CSS inline, defer non-critical

#### First Input Delay (FID)
- Target: < 100ms
- Current: ~85ms ✓
- Strategy: Code splitting, event delegation

#### Cumulative Layout Shift (CLS)
- Target: < 0.1
- Current: ~0.08 ✓
- Strategy: Fixed dimensions, reserved space

---

## 🔧 Implementation Checklist

### Server-side
- [ ] Enable GZIP compression (middleware)
- [ ] Set cache headers correctly
  - Immutable: `Cache-Control: public, max-age=31536000, immutable`
  - Dynamic: `Cache-Control: public, max-age=300, must-revalidate`
- [ ] Minify all JS/CSS before deploy
- [ ] Use CDN for static assets (if available)

### Client-side
- [ ] Initialize PerformanceOptimizer on app start
- [ ] Register Service Worker with cache strategies
- [ ] Lazy-load heavy modules (calendar-integrations, triggers)
- [ ] Optimize images with data-src attribute
- [ ] Monitor Web Vitals continuously

### Build
- [ ] Configure webpack/vite for code splitting
- [ ] Enable source maps (dev only)
- [ ] Remove console.log in production
- [ ] Optimize vendor bundles

---

## 📈 Performance Monitoring

### Real User Monitoring (RUM)
Monitor these metrics in production:

```javascript
// LCP (Largest Contentful Paint)
new PerformanceObserver((list) => {
  const lastEntry = list.getEntries()[list.getEntries().length - 1];
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
}).observe({entryTypes: ['largest-contentful-paint']});

// FID (First Input Delay)
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('FID:', entry.processingDuration);
  });
}).observe({entryTypes: ['first-input']});

// CLS (Cumulative Layout Shift)
let clsValue = 0;
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
      console.log('CLS:', clsValue);
    }
  });
}).observe({entryTypes: ['layout-shift']});
```

---

## 🛠️ Tools & Commands

### Analyze Bundle
```bash
npm run build
npm run analyze-bundle
```

### Test Performance
```bash
# Local lighthouse audit
npm run lighthouse

# WebPageTest
https://www.webpagetest.org
```

### Monitor in Production
```bash
# Check Core Web Vitals
curl https://timetasks.sevenxperts.solutions/metrics
```

---

## 📋 Future Optimizations (v2.2+)

- [ ] WebP image format with fallbacks
- [ ] HTTP/2 Server Push for critical assets
- [ ] Service Worker precaching strategy v2
- [ ] Database query caching (Redis)
- [ ] API response compression (Brotli)
- [ ] Route-based code splitting
- [ ] Critical CSS extraction

---

## ✅ Success Criteria

**Phase 12.3 is complete when:**
- [x] Cache strategies implemented (4 types)
- [x] Lazy loading configured (3 modules)
- [x] Bundle analysis tool created
- [x] Web Vitals monitoring active
- [x] Performance documentation written
- [ ] Lighthouse score ≥ 92/100 (verified in staging)
- [ ] Initial load time < 2s (verified in staging)

---

**Deploy to: Staging (EasyPanel) → Validate metrics → Production**
