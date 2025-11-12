/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable TypeScript type checking but don't fail on errors
  typescript: {
    // Set to true to ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Enable HTTP compression
  compress: true,

  // Optimize font loading
  optimizeFonts: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Experimental features
  experimental: {
    serverActions: true,
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },

  // Disable source maps in production (for better performance)
  productionBrowserSourceMaps: false,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects (optional - add any you need)
  async redirects() {
    return [];
  },

  // Rewrites (optional - add any you need)
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
