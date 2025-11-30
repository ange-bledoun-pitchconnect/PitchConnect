import withBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================================
  // CORE SETTINGS
  // ============================================================================
  
  reactStrictMode: true,
  
  // Output mode for Vercel deployment
  output: 'standalone',
  
  // Disable X-Powered-By header (security)
  poweredByHeader: false,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Enable compression
  compress: true,

  // ============================================================================
  // COMPILER & BUILD OPTIMIZATION
  // ============================================================================
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    reactRemoveProperties: {
      properties: ['^data-testid$'],
    },
  },

  // ============================================================================
  // ESLint CONFIGURATION
  // ============================================================================
  
  eslint: {
    dirs: ['src', 'lib', 'pages', 'utils'],
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // ============================================================================
  // TYPESCRIPT CONFIGURATION
  // ============================================================================
  
  typescript: {
    // Don't fail on TypeScript errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  
  experimental: {
    // Optimize package imports for better bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================
  
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: 'https',
        hostname: 'vxxdhzfmgapfnmkqixgw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // AWS S3 Standard
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // AWS S3 Alternative
      {
        protocol: 'https',
        hostname: 's3.*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // CloudFlare Images
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      // Gravatar (user avatars)
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/**',
      },
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    
    // Image optimization formats
    formats: ['image/avif', 'image/webp'],
    
    // Device and image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Caching strategy
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year for static assets
    
    // Disable optimization in development for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================
  
  async headers() {
    return [
      // API Security Headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Static Assets - Long Cache
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public Assets - Browser Cache
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers for all pages
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ============================================================================
  // REDIRECTS
  // ============================================================================
  
  async redirects() {
    return [
      // Legacy routes
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      // Dashboard default route
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
      // Old paths
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // ============================================================================
  // REWRITES
  // ============================================================================
  
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/health',
          destination: '/api/health',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================
  
  env: {
    NEXT_PUBLIC_APP_NAME: 'PitchConnect',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // ============================================================================
  // PERFORMANCE TUNING
  // ============================================================================
  
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Disable source maps in production (reduce bundle size)
  productionBrowserSourceMaps: false,

  // ============================================================================
  // WEBPACK CUSTOMIZATION
  // ============================================================================
  
  webpack: (config, { isServer }) => {
    // Client-side optimizations
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    // Add support for markdown files (if needed)
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });

    return config;
  },
};

export default nextConfig;

