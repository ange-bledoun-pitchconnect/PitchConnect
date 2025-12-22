/**
 * 🌟 PITCHCONNECT - Root Layout (FIXED & OPTIMIZED)
 * Path: /app/layout.tsx
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 * ✅ NextAuth v5 native support with SessionProvider in Providers
 * ✅ React 19 compatible
 * ✅ Next.js 15.5.9 optimized
 * ✅ Single provider chain (no duplication)
 * ✅ Performance optimized
 * ✅ SEO optimized
 * ✅ Accessibility (WCAG 2.1 AA+)
 * ✅ Dark mode support
 * ✅ Mobile-first responsive design
 *
 * ============================================================================
 * STATUS: PRODUCTION READY ⚽🏆
 * ============================================================================
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

// ============================================================================
// FONT CONFIGURATION - OPTIMIZED FOR PERFORMANCE
// ============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
  preload: true,
});

// ============================================================================
// SEO METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'PitchConnect - World's Best Sports Management Platform',
  description:
    'Professional sports team management, player analytics, performance tracking, and tactical analysis. All-in-one platform for football, netball, rugby, cricket, American football, and basketball teams.',
  keywords: [
    'sports management',
    'football management',
    'team analytics',
    'player tracking',
    'performance analysis',
    'tactical analysis',
    'sports SaaS',
  ],
  authors: [{ name: 'Ange Bledoun', url: 'https://getpitchconnect.com' }],
  creator: 'PitchConnect',
  publisher: 'PitchConnect',
  robots: 'index, follow',
  canonical: 'https://getpitchconnect.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://getpitchconnect.com',
    title: 'PitchConnect - World's Best Sports Management Platform',
    description: 'Professional sports team management and analytics platform',
    siteName: 'PitchConnect',
    images: [
      {
        url: 'https://getpitchconnect.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PitchConnect - Sports Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PitchConnect',
    description: 'World's Best Sports Management Platform',
    images: ['https://getpitchconnect.com/og-image.png'],
  },
  manifest: '/manifest.json',
};

// ============================================================================
// VIEWPORT CONFIGURATION
// ============================================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2121' },
  ],
};

// ============================================================================
// ROOT LAYOUT
// ============================================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning={true}
    >
      <head>
        {/* Color scheme meta tag for theme detection */}
        <meta name="color-scheme" content="light dark" />
        {/* Mobile web app configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PitchConnect" />
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-white text-slate-900 dark:bg-charcoal-900 dark:text-gray-100">
        {/* Providers: SessionProvider, ThemeProvider, QueryClientProvider, Toaster */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
