/**
 * Root Layout
 * Main layout wrapper for entire application
 * Handles providers, theme, and global UI
 */

import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/app/providers';
import { Navbar } from '@/components/sections/navbar';
import { siteConfig } from '@/config/site';

// Metadata for SEO
export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'football',
    'soccer',
    'management',
    'team',
    'coaching',
    'player development',
    'tactics',
    'analytics',
    'grassroots',
    'league management',
  ],
  authors: [
    {
      name: 'PitchConnect',
      url: siteConfig.url,
    },
  ],
  creator: 'PitchConnect',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitter,
  },
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
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteConfig.name,
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
};

// Viewport settings for mobile
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * ROOT LAYOUT COMPONENT
 * Wraps entire application
 * Sets up HTML, head, body with all meta tags and providers
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Character encoding and compatibility */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />

        {/* Preload fonts for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/* PWA manifest for installable app */}
        <link rel="manifest" href="/manifest.json" />

        {/* Mobile app settings */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content={siteConfig.name} />

        {/* Prevent automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />

        {/* Disable tap highlight on mobile */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Privacy and security headers */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta
          httpEquiv="Permissions-Policy"
          content="camera=(), microphone=(), geolocation=()"
        />

        {/* Color scheme for dark mode detection */}
        <meta name="color-scheme" content="light dark" />

        {/* Preload critical resources */}
        <link rel="preload" as="style" href="/fonts/inter.css" />
      </head>

      <body className="bg-background text-foreground">
        <Providers>
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-gold focus:text-brand-black focus:px-4 focus:py-2 focus:rounded"
          >
            Skip to main content
          </a>

          {/* Main app container with flex layout */}
          <div className="relative min-h-screen flex flex-col">
            {/* Navigation bar - Smart component that changes based on auth */}
            <Navbar />

            {/* Main content area - fills remaining space */}
            <main id="main-content" className="flex-1 w-full">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-background py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  {/* Brand column */}
                  <div>
                    <h3 className="text-lg font-bold text-hero mb-4">
                      PitchConnect
                    </h3>
                    <p className="text-foreground/60 text-sm">
                      The world&apos;s best football management platform
                    </p>
                  </div>

                  {/* Product links */}
                  <div>
                    <h4 className="font-semibold mb-4">Product</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a
                          href="/#features"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Features
                        </a>
                      </li>
                      <li>
                        <a
                          href="/#pricing"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Pricing
                        </a>
                      </li>
                      <li>
                        <a
                          href="/roadmap"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Roadmap
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Company links */}
                  <div>
                    <h4 className="font-semibold mb-4">Company</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a
                          href="/about"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          About
                        </a>
                      </li>
                      <li>
                        <a
                          href="/blog"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Blog
                        </a>
                      </li>
                      <li>
                        <a
                          href="/contact"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Contact
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Legal links */}
                  <div>
                    <h4 className="font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a
                          href="/privacy"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Privacy
                        </a>
                      </li>
                      <li>
                        <a
                          href="/terms"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Terms
                        </a>
                      </li>
                      <li>
                        <a
                          href="/cookies"
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          Cookies
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-foreground/60">
                  <p>&copy; 2025 PitchConnect. All rights reserved.</p>
                  <div className="flex gap-6 mt-4 md:mt-0">
                    <a
                      href="https://twitter.com/pitchconnect"
                      className="hover:text-foreground transition-colors"
                    >
                      Twitter
                    </a>
                    <a
                      href="https://github.com/pitchconnect"
                      className="hover:text-foreground transition-colors"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://discord.gg/pitchconnect"
                      className="hover:text-foreground transition-colors"
                    >
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
