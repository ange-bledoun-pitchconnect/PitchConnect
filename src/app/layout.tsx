/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Root Layout v2.0
 * Path: src/app/layout.tsx
 * ============================================================================
 * 
 * ENTERPRISE-GRADE ROOT LAYOUT
 * 
 * Features:
 * ✅ Server-side session fetching (NextAuth v4)
 * ✅ Custom fonts (Inter, Space Grotesk, JetBrains Mono)
 * ✅ Theme provider with system preference detection
 * ✅ Error boundary wrapper
 * ✅ Comprehensive SEO metadata
 * ✅ PWA manifest and icons
 * ✅ Security headers
 * ✅ Analytics ready
 * 
 * ============================================================================
 */

import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { auth } from '@/auth';
import { Providers } from '@/app/providers';
import { ErrorBoundaryProvider } from '@/app/error-boundary-provider';
import '@/styles/globals.css';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

/**
 * Inter - Primary body font
 * Clean, modern sans-serif optimized for UI
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

/**
 * Space Grotesk - Display/heading font
 * Bold, distinctive geometric sans-serif
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  preload: true,
});

/**
 * JetBrains Mono - Monospace font
 * For code, stats, and tabular data
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: true,
});

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchconnect.com';

export const metadata: Metadata = {
  // Basic
  title: {
    default: 'PitchConnect - Elite Sports Team Management Platform',
    template: '%s | PitchConnect',
  },
  description:
    'The all-in-one sports management platform for coaches, managers, and players. Team scheduling, performance analytics, tactical tools, and more. Start your free trial today.',
  
  // Keywords
  keywords: [
    'sports management software',
    'team management app',
    'football management',
    'player analytics',
    'match scheduling',
    'tactical analysis',
    'sports coaching software',
    'club management',
    'netball management',
    'rugby team app',
    'cricket statistics',
    'basketball coaching',
    'sports performance tracking',
    'UK sports software',
  ],

  // Author & Publisher
  authors: [{ name: 'PitchConnect', url: siteUrl }],
  creator: 'PitchConnect',
  publisher: 'PitchConnect Ltd',

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: siteUrl,
    siteName: 'PitchConnect',
    title: 'PitchConnect - Elite Sports Team Management Platform',
    description:
      'Manage your sports team like never before. Performance analytics, match scheduling, tactical tools, and more.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PitchConnect - Sports Management Platform',
        type: 'image/png',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '@pitchconnect',
    creator: '@pitchconnect',
    title: 'PitchConnect - Elite Sports Management',
    description: 'The all-in-one platform for coaches, managers, and players.',
    images: [`${siteUrl}/twitter-image.png`],
  },

  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PitchConnect',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.jpg',
        media: '(device-width: 1024px) and (device-height: 1366px)',
      },
    ],
  },

  // Format Detection
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Manifest
  manifest: '/manifest.json',

  // Category
  category: 'sports',

  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#D4AF37',
      },
    ],
  },

  // Verification (add your IDs)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    // yandex: 'your-yandex-verification',
    // bing: 'your-bing-verification',
  },

  // Alternate Languages (if applicable)
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-GB': siteUrl,
      // 'en-US': `${siteUrl}/en-us`,
    },
  },

  // Other
  applicationName: 'PitchConnect',
  referrer: 'strict-origin-when-cross-origin',
  generator: 'Next.js',
};

// ============================================================================
// VIEWPORT CONFIGURATION
// ============================================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
  ],
  colorScheme: 'light dark',
};

// ============================================================================
// TYPES
// ============================================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================

export default async function RootLayout({ children }: RootLayoutProps) {
  // ---------------------------------------------------------------------------
  // FETCH SERVER SESSION
  // ---------------------------------------------------------------------------
  let session = null;

  try {
    session = await getServerSession(auth);

    if (process.env.NODE_ENV === 'development' && session) {
      console.log('[RootLayout] ✅ Session loaded:', {
        user: session.user?.email,
        role: session.user?.role,
      });
    }
  } catch (error) {
    console.error('[RootLayout] ❌ Session error:', error);
    // Graceful degradation - continue with null session
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//api.pitchconnect.com" />
        <link rel="dns-prefetch" href="//cdn.pitchconnect.com" />
        
        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#D4AF37" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Security */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>

      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>

        {/* Providers Wrapper */}
        <Providers session={session}>
          <ErrorBoundaryProvider>
            {/* Main Content */}
            <div id="main-content" className="relative flex min-h-screen flex-col">
              {children}
            </div>

            {/* Portal containers */}
            <div id="modal-root" />
            <div id="toast-root" />
          </ErrorBoundaryProvider>
        </Providers>

        {/* Development indicators */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-max flex items-center gap-2 rounded-full bg-charcoal-900 px-3 py-1 text-xs text-white font-mono">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden sm:inline">DEV</span>
            <span className="text-charcoal-400">|</span>
            <span className="sm:hidden">xs</span>
            <span className="hidden sm:inline md:hidden">sm</span>
            <span className="hidden md:inline lg:hidden">md</span>
            <span className="hidden lg:inline xl:hidden">lg</span>
            <span className="hidden xl:inline 2xl:hidden">xl</span>
            <span className="hidden 2xl:inline">2xl</span>
          </div>
        )}
      </body>
    </html>
  );
}