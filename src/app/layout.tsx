import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

export const metadata: Metadata = {
  title: {
    template: '%s | PitchConnect',
    default: 'PitchConnect - Elite Sports Team Management Platform',
  },
  description:
    'Professional team management, tactical analysis, and player development platform for coaches, managers, and athletes across all sports.',
  keywords: [
    'team management',
    'sports management',
    'football coaching',
    'athletics',
    'tactics',
    'player development',
    'club management',
    'league management',
    'sports software',
    'coaching app',
  ],
  authors: [{ name: 'PitchConnect Team' }],
  creator: 'PitchConnect',
  publisher: 'PitchConnect',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://pitchconnect.app',
    title: 'PitchConnect - Elite Sports Team Management Platform',
    description:
      'Professional team management, tactical analysis, and player development for all sports.',
    siteName: 'PitchConnect',
    images: [
      {
        url: 'https://pitchconnect.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PitchConnect Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pitchconnect',
    creator: '@pitchconnect',
    title: 'PitchConnect - Elite Sports Team Management',
    description: 'Professional team management for coaches and athletes.',
    images: ['https://pitchconnect.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

// ============================================================================
// VIEWPORT CONFIGURATION (Next.js 15+)
// ============================================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#D4AF37' },
    { media: '(prefers-color-scheme: dark)', color: '#FF6B35' },
  ],
};

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={inter.variable}
    >
      <head>
        {/* 
          ============================================================================
          BRAND COLOR PSYCHOLOGY - PitchConnect Design System
          ============================================================================
          
          PRIMARY COLORS (from screenshot):
          
          🥇 GOLD (#D4AF37)
            Psychology: Premium, achievement, trust, leadership, excellence
            Usage: Primary CTAs, highlights, premium features, badges
            Emotion: Aspirational, professional, high-value
            
          🔥 ORANGE (#FF6B35)
            Psychology: Energy, action, enthusiasm, athletic momentum
            Usage: Highlights, success states, secondary CTAs, hover effects
            Emotion: Motivating, energetic, dynamic
            
          💜 PURPLE (#A855F7)
            Psychology: Innovation, creativity, team collaboration, sophistication
            Usage: Feature highlights, interactive elements, team-related UX
            Emotion: Forward-thinking, collaborative, modern
            
          ⬛ CHARCOAL (#1F2937)
            Psychology: Authority, trust, professionalism, clarity
            Usage: Primary text, navigation, structural elements
            Emotion: Trustworthy, professional, confident
            
          🤍 WHITE (#FFFFFF)
            Psychology: Clarity, simplicity, professionalism, openness
            Usage: Backgrounds, cards, content areas
            Emotion: Clean, modern, accessible
          
          ============================================================================
          TARGET AUDIENCE PSYCHOLOGY:
          
          👨‍🏫 Coaches: Need authority (charcoal/gold), efficiency (clean design), success (gold/orange)
          👥 Players: Want inspiration (gold/orange/purple), growth tracking (clean data)
          🏢 Managers: Require trust (charcoal), professional image (gold), data clarity (white)
          ⚽ Athletes: Seek achievement (gold), energy (orange), community (purple)
          
          Design Principle: Minimalist + Corporate + Athletic Energy
          ============================================================================
        */}
        <style>{`
          :root {
            color-scheme: light dark;
          }
        `}</style>
        
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon & Icons */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload Critical Resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>

      <body
        className="bg-white dark:bg-charcoal-900 text-charcoal-800 dark:text-white font-inter antialiased transition-colors duration-200"
        suppressHydrationWarning
      >
        {/* SKIP TO MAIN CONTENT LINK (Accessibility) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-gold focus:text-white focus:font-bold"
        >
          Skip to main content
        </a>

        <Providers>
          {/* MAIN CONTENT */}
          <main id="main-content" className="min-h-screen">
            {children}
          </main>

          {/* FOOTER - Professional, Branded with Dark Mode */}
          <footer className="bg-charcoal-800 dark:bg-charcoal-900 text-white border-t border-gold/20 dark:border-gold/10 transition-colors duration-200">
            <div className="container-max py-12">
              {/* Footer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
                {/* Branding Section */}
                <div className="col-span-1">
                  <h3 className="text-xl font-bold mb-2">
                    <span className="gradient-text-gold">PitchConnect</span>
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed">
                    Elite team management platform for professional coaches, managers, and athletes across all sports.
                  </p>
                  <div className="flex gap-4 mt-6">
                    <a
                      href="#"
                      className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors"
                      aria-label="Twitter"
                    >
                      <span className="text-lg">𝕏</span>
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors"
                      aria-label="LinkedIn"
                    >
                      <span className="text-lg">in</span>
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors"
                      aria-label="GitHub"
                    >
                      <span className="text-lg">⚙️</span>
                    </a>
                  </div>
                </div>

                {/* Product Links */}
                <div>
                  <h4 className="text-gold font-semibold mb-4">Product</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#features"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#pricing"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Roadmap
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        FAQ
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h4 className="text-gold font-semibold mb-4">Company</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        About
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Careers
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Resources Links */}
                <div>
                  <h4 className="text-gold font-semibold mb-4">Resources</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        API
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Status
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Legal Links */}
                <div>
                  <h4 className="text-gold font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        Cookie Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 dark:text-gray-500 hover:text-gold dark:hover:text-gold transition-colors text-sm"
                      >
                        GDPR
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer Bottom */}
              <div className="border-t border-gold/10 dark:border-gold/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-500 dark:text-gray-600 text-sm">
                  &copy; 2025 PitchConnect. All rights reserved. | Elevating sports team management globally.
                </p>
                <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-600">
                  <a href="#" className="hover:text-gold dark:hover:text-gold transition-colors">
                    Privacy
                  </a>
                  <a href="#" className="hover:text-gold dark:hover:text-gold transition-colors">
                    Terms
                  </a>
                  <a href="#" className="hover:text-gold dark:hover:text-gold transition-colors">
                    Cookies
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
