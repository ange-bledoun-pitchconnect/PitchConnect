/**
 * ============================================================================
 * BUNDLE & PERFORMANCE CONFIGURATION
 * ============================================================================
 * 
 * Configuration for:
 * - Dynamic imports & code splitting
 * - Performance budgets
 * - Bundle size limits
 * - Route-based optimization
 * 
 * Usage in next.config.js:
 * import { getPerformanceBudget } from '@/lib/performance/bundle-config';
 */

// ============================================================================
// PERFORMANCE BUDGET CONFIGURATION
// ============================================================================

/**
 * Performance budget for routes and components
 * Size in KB (after gzip)
 */
export const PERFORMANCE_BUDGET = {
  // Pages
  'pages/dashboard': 250,
  'pages/players': 200,
  'pages/teams': 200,
  'pages/matches': 200,
  'pages/standings': 180,
  'pages/schedule': 180,
  'pages/statistics': 220,
  'pages/settings': 150,
  
  // Shared layouts
  'layouts/main': 100,
  'layouts/auth': 80,
  
  // Components
  'components/dashboard': 150,
  'components/tables': 120,
  'components/charts': 140,
  'components/forms': 100,
  'components/modals': 80,
  'components/cards': 60,
  
  // Libraries
  'lib/api': 50,
  'lib/utils': 40,
  'lib/performance': 30,
  'lib/export': 80,
} as const;

// ============================================================================
// BUNDLE SIZE ALERTS
// ============================================================================

/**
 * Size thresholds for CI/CD warnings
 * Size in KB (after gzip)
 */
export const BUNDLE_SIZE_ALERTS = {
  WARNING: 350, // Warn if bundle > 350KB
  CRITICAL: 500, // Error if bundle > 500KB
} as const;

// ============================================================================
// CODE SPLITTING CONFIGURATION
// ============================================================================

/**
 * Components and libraries that should be code-split
 */
export const CODE_SPLIT_TARGETS = {
  // Heavy charting libraries
  charts: ['recharts', 'react-chartjs-2', 'chart.js'],
  
  // Export functionality
  export: ['jspdf', 'html2canvas', 'papaparse'],
  
  // Form libraries
  forms: ['react-hook-form', 'zod'],
  
  // Modal/Dialog
  dialogs: ['@radix-ui/react-dialog'],
  
  // Date utilities
  dates: ['date-fns', 'dayjs'],
  
  // Analytics
  analytics: ['@sentry/nextjs', 'posthog-js'],
} as const;

// ============================================================================
// LAZY LOAD ROUTES
// ============================================================================

/**
 * Routes that should be lazy loaded with dynamic imports
 */
export const LAZY_LOAD_ROUTES = [
  '/statistics',
  '/analytics',
  '/reports',
  '/export',
  '/settings',
  '/admin',
] as const;

// ============================================================================
// PREFETCH CONFIGURATION
// ============================================================================

/**
 * Routes and assets to prefetch for performance
 */
export const PREFETCH_CONFIG = {
  // Critical routes to prefetch
  routes: ['/', '/dashboard', '/players', '/teams'],
  
  // Critical assets
  assets: [
    '/api/auth/session',
    '/api/dashboard',
  ],
  
  // DNS prefetch
  dns: [
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  
  // Preconnect
  preconnect: [
    'https://fonts.gstatic.com',
  ],
} as const;

// ============================================================================
// DYNAMIC IMPORT HELPERS
// ============================================================================

/**
 * Get dynamic import configuration for heavy components
 * @param componentType - Type of component
 * @returns Dynamic import config
 */
export function getDynamicImportConfig(componentType: string): {
  loading: React.ComponentType<any>;
  ssr: boolean;
} {
  const configs: Record<
    string,
    {
      loading: React.ComponentType<any>;
      ssr: boolean;
    }
  > = {
    chart: {
      loading: () => <div className="h-64 bg-gray-100 dark:bg-charcoal-800 animate-pulse rounded-lg" />,
      ssr: false,
    },
    modal: {
      loading: () => <div className="h-96 bg-gray-100 dark:bg-charcoal-800 animate-pulse rounded-lg" />,
      ssr: false,
    },
    table: {
      loading: () => <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-charcoal-800 animate-pulse rounded" />
        ))}
      </div>,
      ssr: false,
    },
    form: {
      loading: () => <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-charcoal-800 animate-pulse rounded" />
        ))}
      </div>,
      ssr: false,
    },
  };

  return configs[componentType] || { loading: () => null, ssr: false };
}

// ============================================================================
// IMAGE OPTIMIZATION SETTINGS
// ============================================================================

/**
 * Image optimization configuration
 */
export const IMAGE_OPTIMIZATION = {
  // Default image quality by type
  quality: {
    avatar: 40,
    thumbnail: 50,
    card: 75,
    hero: 90,
    banner: 90,
  },
  
  // Image sizes for srcset
  sizes: {
    avatar: [32, 64, 96],
    thumbnail: [80, 160, 240],
    card: [300, 600, 900],
    hero: [400, 800, 1200],
    banner: [600, 1200, 1600],
  },
  
  // Blur placeholder settings
  blur: {
    enabled: true,
    quality: 10,
    size: [10, 10],
  },
  
  // Format priorities
  formats: ['image/avif', 'image/webp', 'image/jpeg'],
} as const;

// ============================================================================
// PERFORMANCE MONITORING SETTINGS
// ============================================================================

/**
 * Web Vitals and performance monitoring configuration
 */
export const PERFORMANCE_MONITORING = {
  // Core Web Vitals thresholds
  vitals: {
    LCP: 2500, // 2.5 seconds
    FID: 100, // 100 milliseconds
    CLS: 0.1, // 0.1 cumulative layout shift
    TTFB: 600, // 600 milliseconds
    FCP: 1800, // 1.8 seconds
  },
  
  // Sampling rates
  sampling: {
    analytics: 0.1, // 10% of users
    errors: 1.0, // 100% of errors
    traces: 0.05, // 5% of requests
  },
  
  // Enable profiling
  profiling: {
    enabled: process.env.NODE_ENV === 'development',
    sampleRate: 0.1,
  },
  
  // Enable error tracking
  errorTracking: {
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
} as const;

// ============================================================================
// NEXT.JS CONFIG ENHANCEMENT
// ============================================================================

/**
 * Get Next.js config enhancements for performance
 * 
 * Usage in next.config.js:
 * const { getNextConfig } = require('@/lib/performance/bundle-config');
 * const config = getNextConfig();
 */
export function getNextConfig() {
  return {
    // Compression
    compress: true,
    
    // Optimization
    swcMinify: true,
    
    // Image optimization
    images: {
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      cacheControl: 'public, max-age=31536000, immutable',
      minimumCacheTTL: 31536000,
    },
    
    // Redirects for performance
    async redirects() {
      return [
        // Remove trailing slashes for performance
        {
          source: '/:path+/',
          destination: '/:path+',
          permanent: true,
        },
      ];
    },
    
    // Headers for caching
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=3600' },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        },
      ];
    },
    
    // Enable experimental features
    experimental: {
      optimizePackageImports: [
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        'date-fns',
        'lucide-react',
      ],
    },
    
    // Webpack optimization
    webpack: (config: any) => {
      // Add custom webpack optimizations
      return config;
    },
  };
}

// ============================================================================
// BUNDLE ANALYZER CONFIG
// ============================================================================

/**
 * Next.js bundle analyzer configuration
 * 
 * Usage:
 * ANALYZE=true npm run build
 */
export const BUNDLE_ANALYZER_CONFIG = {
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
  analyzerMode: 'static' as const,
  reportFilename: '.next/bundle-report.html',
  generateStatsFile: true,
  statsFilename: '.next/stats.json',
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export type PerformanceBudget = typeof PERFORMANCE_BUDGET;
export type CodeSplitTarget = typeof CODE_SPLIT_TARGETS;
export type LazyLoadRoute = (typeof LAZY_LOAD_ROUTES)[number];

export default {
  PERFORMANCE_BUDGET,
  BUNDLE_SIZE_ALERTS,
  CODE_SPLIT_TARGETS,
  LAZY_LOAD_ROUTES,
  PREFETCH_CONFIG,
  IMAGE_OPTIMIZATION,
  PERFORMANCE_MONITORING,
  BUNDLE_ANALYZER_CONFIG,
  getDynamicImportConfig,
  getNextConfig,
};
