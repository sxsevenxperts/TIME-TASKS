// Performance Optimizer — Fase 12.3
// Estratégias de cache, lazy-loading e compressão

export class PerformanceOptimizer {
  constructor() {
    this.cacheStrategies = new Map();
    this.lazyModules = new Map();
    this.bundleStats = {
      totalSize: 0,
      cachedSize: 0,
      compressionRatio: 0
    };
  }

  // ============================================================
  // CACHE STRATEGIES
  // ============================================================

  registerCacheStrategy(route, strategy) {
    this.cacheStrategies.set(route, strategy);
    console.log(`📦 Cache strategy registrado: ${route} → ${strategy}`);
  }

  async initializeCacheStrategies() {
    // Estratégia: Network First (APIs)
    this.registerCacheStrategy('/api/', {
      type: 'network-first',
      cacheName: 'api-cache',
      expiration: 5 * 60 * 1000, // 5 minutos
      maxAge: 10 // máx 10 items
    });

    // Estratégia: Cache First (Assets estáticos)
    this.registerCacheStrategy('/dist/', {
      type: 'cache-first',
      cacheName: 'assets-cache',
      expiration: 30 * 24 * 60 * 60 * 1000, // 30 dias
      maxAge: 100
    });

    // Estratégia: Stale While Revalidate (Calendário)
    this.registerCacheStrategy('/api/calendar', {
      type: 'stale-while-revalidate',
      cacheName: 'calendar-cache',
      expiration: 30 * 60 * 1000, // 30 minutos
      maxAge: 50
    });

    // Estratégia: Stale While Revalidate (Eventos)
    this.registerCacheStrategy('/api/events', {
      type: 'stale-while-revalidate',
      cacheName: 'events-cache',
      expiration: 15 * 60 * 1000, // 15 minutos
      maxAge: 100
    });

    console.log('✅ Cache strategies inicializadas (4 strategies)');
  }

  // ============================================================
  // LAZY LOADING
  // ============================================================

  registerLazyModule(name, importFn) {
    this.lazyModules.set(name, importFn);
  }

  async loadModule(name) {
    if (!this.lazyModules.has(name)) {
      throw new Error(`Módulo não registrado: ${name}`);
    }

    const importFn = this.lazyModules.get(name);
    console.log(`📥 Loading módulo: ${name}`);
    return await importFn();
  }

  initializeLazyModules() {
    // Módulos lazy: calendário-integrations (usado em Settings)
    this.registerLazyModule('calendar-integrations-ui', () =>
      import('./calendar-integrations-ui.js')
    );

    // Módulos lazy: triggers (usado em Settings)
    this.registerLazyModule('triggers-modal-ui', () =>
      import('./triggers-modal-ui.js')
    );

    // Módulos lazy: analytics (opcional)
    this.registerLazyModule('analytics', () =>
      import('./analytics.js')
    );

    console.log('✅ Lazy modules registrados (3 modules)');
  }

  // ============================================================
  // BUNDLE OPTIMIZATION
  // ============================================================

  async analyzeBundle() {
    // Análise do bundle (fetch de todos os recursos)
    try {
      const resources = performance.getEntriesByType('resource');

      let totalSize = 0;
      const breakdown = {};

      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        const ext = resource.name.split('.').pop().toLowerCase();

        breakdown[ext] = (breakdown[ext] || 0) + size;
        totalSize += size;
      });

      this.bundleStats.totalSize = totalSize;

      console.log('📊 Bundle Analysis:');
      console.log(`   Total size: ${this.formatBytes(totalSize)}`);
      Object.entries(breakdown).forEach(([ext, size]) => {
        console.log(`   .${ext}: ${this.formatBytes(size)}`);
      });

      return breakdown;
    } catch (error) {
      console.error('Erro ao analisar bundle:', error);
      return {};
    }
  }

  // ============================================================
  // IMAGE OPTIMIZATION
  // ============================================================

  optimizeImages() {
    // Lazy-load imagens
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);

            console.log(`📷 Imagem carregada: ${img.src}`);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
      console.log(`✅ ${images.length} imagens otimizadas (lazy-load)`);
    }
  }

  // ============================================================
  // CODE SPLITTING
  // ============================================================

  async enableCodeSplitting() {
    // Dinâmico import de módulos pesados
    const heavyModules = [
      'calendar-integrations-ui',
      'triggers-modal-ui'
    ];

    for (const module of heavyModules) {
      // Carregar após DOM ready
      await new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });

      try {
        await this.loadModule(module);
        console.log(`✅ Code splitting: ${module} carregado`);
      } catch (error) {
        console.warn(`⚠️  Erro ao carregar ${module}:`, error);
      }
    }
  }

  // ============================================================
  // COMPRESSION
  // ============================================================

  enableGzipCompression() {
    // Nota: Compressão GZIP é feita no servidor
    // Aqui documentamos a estratégia

    console.log(`
📦 GZIP Compression Strategy:
   • Server-side: Habilitar gzip em middleware
   • Threshold: 1KB+ (comprimir acima de 1KB)
   • Comprimir: .js, .css, .json, .html, .svg
   • Ratio esperado: 60-70% redução

Exemplo (Node.js):
   import compression from 'compression';
   app.use(compression());
    `);
  }

  // ============================================================
  // WEB VITALS MONITORING
  // ============================================================

  monitorWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`⚡ LCP: ${lastEntry.renderTime || lastEntry.loadTime}ms`);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP monitoring não suportado');
      }
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            console.log(`⚡ FID: ${entry.processingDuration}ms`);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID monitoring não suportado');
      }
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    if ('PerformanceObserver' in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              console.log(`⚡ CLS: ${clsValue.toFixed(3)}`);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS monitoring não suportado');
      }
    }

    console.log('✅ Web Vitals monitoring ativado');
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize() {
    console.log('🚀 Performance Optimizer inicializando...');

    // 1. Configurar estratégias de cache
    await this.initializeCacheStrategies();

    // 2. Registrar módulos lazy
    this.initializeLazyModules();

    // 3. Otimizar imagens
    this.optimizeImages();

    // 4. Monitorar Web Vitals
    this.monitorWebVitals();

    // 5. Habilitar compression
    this.enableGzipCompression();

    // 6. Code splitting (carregar após DOM pronto)
    setTimeout(() => this.enableCodeSplitting(), 0);

    // 7. Analisar bundle após load
    window.addEventListener('load', () => this.analyzeBundle());

    console.log('✅ Performance Optimizer pronto');
  }
}

// Exportar singleton
export const performanceOptimizer = new PerformanceOptimizer();
