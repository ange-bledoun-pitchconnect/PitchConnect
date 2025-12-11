import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

// ============================================================================
// FONT CONFIGURATION - OPTIMIZED FOR PERFORMANCE & READABILITY
// ============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

// ============================================================================
// METADATA CONFIGURATION - SEO OPTIMIZED
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
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PitchConnect',
  },
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
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pitchconnect',
    creator: '@pitchconnect',
    title: 'PitchConnect - Elite Sports Team Management',
    description: 'Professional team management for coaches and athletes.',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  alternates: {
    canonical: 'https://pitchconnect.app',
  },
};

// ============================================================================
// VIEWPORT CONFIGURATION - MOBILE & DEVICE OPTIMIZATION
// ============================================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#D4AF37' },
    { media: '(prefers-color-scheme: dark)', color: '#FF6B35' },
  ],
};

// ============================================================================
// ROOT LAYOUT COMPONENT - PRODUCTION READY
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
          BRAND PSYCHOLOGY & DESIGN SYSTEM
          ============================================================================
          
          🥇 GOLD (#D4AF37)
            - Premium, achievement, trust, leadership, excellence
            - Primary CTAs, highlights, badges
            - Aspirational, professional, high-value
            
          🔥 ORANGE (#FF6B35)
            - Energy, action, enthusiasm, momentum
            - Secondary CTAs, success states, hover effects
            - Motivating, energetic, dynamic
            
          💜 PURPLE (#A855F7)
            - Innovation, creativity, collaboration, sophistication
            - Team features, interactive elements
            - Forward-thinking, collaborative, modern
            
          ⬛ CHARCOAL (#1F2937)
            - Authority, trust, professionalism, clarity
            - Text, navigation, structural elements
            - Trustworthy, confident, professional
            
          🤍 WHITE (#FFFFFF)
            - Clarity, simplicity, professionalism
            - Backgrounds, cards, content areas
            - Clean, modern, accessible
          
          ============================================================================
          TARGET AUDIENCE:
          
          👨‍🏫 Coaches: Authority (charcoal/gold), efficiency (clean), success (gold/orange)
          👥 Players: Inspiration (gold/orange/purple), growth (clean data)
          🏢 Managers: Trust (charcoal), professional image (gold), clarity (white)
          
          Design Principle: Minimalist + Corporate + Athletic Energy
          ============================================================================
        */}
        
        {/* PREVENT FLASH OF UNSTYLED CONTENT (FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        
        {/* CRITICAL STYLES - Prevent layout shift on load */}
        <style>{`
          :root {
            color-scheme: light dark;
          }
          
          /* Light mode defaults */
          html:not(.dark) body {
            background-color: #ffffff;
            color: #1f2937;
          }
          
          /* Dark mode */
          html.dark body {
            background-color: #0f172a;
            color: #f5f5f5;
          }
          
          /* Smooth transitions on theme change */
          body {
            transition: background-color 300ms ease-in-out, color 300ms ease-in-out;
          }

          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }

          /* Remove default margins */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* Improve text rendering */
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }

          /* Optimize images */
          img {
            max-width: 100%;
            height: auto;
          }
        `}</style>
        
        {/* FONT PRECONNECT - CRITICAL for LCP (Largest Contentful Paint) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS PREFETCH for External Resources */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        
        {/* FAVICON & ICONS */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* PRELOAD CRITICAL FONT */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          as="style"
        />
        
        {/* CANONICAL URL for SEO */}
        <link rel="canonical" href="https://pitchconnect.app" />
      </head>

      <body
        className="
          bg-white dark:bg-charcoal-900 
          text-charcoal-800 dark:text-white 
          font-inter antialiased 
          transition-colors duration-300
          min-h-screen flex flex-col
        "
        suppressHydrationWarning
      >
        {/* SKIP TO MAIN CONTENT LINK - WCAG AA Accessibility */}
        <a
          href="#main-content"
          className="
            sr-only 
            focus:not-sr-only 
            focus:fixed focus:top-0 focus:left-0 focus:z-50 
            focus:p-4 
            focus:bg-gold-600 focus:text-white focus:font-bold 
            focus:rounded-b-lg
            focus:animate-slide-down
          "
        >
          Skip to main content
        </a>

        <Providers>
          {/* MAIN CONTENT AREA */}
          <main 
            id="main-content" 
            className="
              flex-1
              w-full
              min-h-screen
              transition-colors duration-200
            "
          >
            {children}
          </main>

          {/* FOOTER - PROFESSIONAL & BRANDED */}
          <footer 
            className="
              w-full
              bg-charcoal-800 dark:bg-charcoal-900 
              text-white 
              border-t border-gold/20 dark:border-gold/10 
              transition-colors duration-200
              mt-auto
            "
            role="contentinfo"
          >
            <div className="
              w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12
              py-12 md:py-16 lg:py-20
            ">
              {/* FOOTER CONTENT GRID - RESPONSIVE */}
              <div className="
                grid gap-8
                grid-cols-1 
                sm:grid-cols-2
                md:grid-cols-3
                lg:grid-cols-5
                mb-8
              ">
                {/* BRANDING SECTION */}
                <div className="col-span-1">
                  <h3 className="
                    text-lg sm:text-xl font-bold mb-2 
                    text-gold dark:text-gold
                    hover:text-gold-600 dark:hover:text-gold-400
                    transition-colors
                  ">
                    PitchConnect
                  </h3>
                  <p className="
                    text-sm text-gray-400 dark:text-gray-500 
                    leading-relaxed mb-6
                  ">
                    Elite team management platform for professional coaches, managers, and athletes.
                  </p>
                  
                  {/* Social Links - Touch Friendly */}
                  <div className="flex gap-4">
                    <a
                      href="https://twitter.com/pitchconnect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-gray-400 dark:text-gray-500 
                        hover:text-gold dark:hover:text-gold 
                        transition-colors duration-200
                        p-2 rounded-lg hover:bg-charcoal-700 dark:hover:bg-charcoal-800
                      "
                      aria-label="Twitter"
                    >
                      <span className="text-lg font-semibold">𝕏</span>
                    </a>
                    <a
                      href="https://linkedin.com/company/pitchconnect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-gray-400 dark:text-gray-500 
                        hover:text-gold dark:hover:text-gold 
                        transition-colors duration-200
                        p-2 rounded-lg hover:bg-charcoal-700 dark:hover:bg-charcoal-800
                      "
                      aria-label="LinkedIn"
                    >
                      <span className="text-lg font-semibold">in</span>
                    </a>
                    <a
                      href="https://github.com/pitchconnect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-gray-400 dark:text-gray-500 
                        hover:text-gold dark:hover:text-gold 
                        transition-colors duration-200
                        p-2 rounded-lg hover:bg-charcoal-700 dark:hover:bg-charcoal-800
                      "
                      aria-label="GitHub"
                    >
                      <span className="text-lg font-semibold">⚙️</span>
                    </a>
                  </div>
                </div>

                {/* PRODUCT LINKS */}
                <nav className="col-span-1">
                  <h4 className="text-gold font-semibold mb-4">Product</h4>
                  <ul className="space-y-2">
                    {['Features', 'Pricing', 'Roadmap', 'FAQ'].map((item) => (
                      <li key={item}>
                        <a
                          href={`/#${item.toLowerCase()}`}
                          className="
                            text-sm text-gray-400 dark:text-gray-500 
                            hover:text-gold dark:hover:text-gold 
                            transition-colors duration-200
                          "
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* COMPANY LINKS */}
                <nav className="col-span-1">
                  <h4 className="text-gold font-semibold mb-4">Company</h4>
                  <ul className="space-y-2">
                    {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                      <li key={item}>
                        <a
                          href={`/${item.toLowerCase()}`}
                          className="
                            text-sm text-gray-400 dark:text-gray-500 
                            hover:text-gold dark:hover:text-gold 
                            transition-colors duration-200
                          "
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* RESOURCES LINKS */}
                <nav className="col-span-1">
                  <h4 className="text-gold font-semibold mb-4">Resources</h4>
                  <ul className="space-y-2">
                    {['Docs', 'Help', 'API', 'Status'].map((item) => (
                      <li key={item}>
                        <a
                          href={`/${item.toLowerCase()}`}
                          className="
                            text-sm text-gray-400 dark:text-gray-500 
                            hover:text-gold dark:hover:text-gold 
                            transition-colors duration-200
                          "
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* LEGAL LINKS */}
                <nav className="col-span-1">
                  <h4 className="text-gold font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2">
                    {['Privacy', 'Terms', 'Cookies', 'GDPR'].map((item) => (
                      <li key={item}>
                        <a
                          href={`/${item.toLowerCase()}`}
                          className="
                            text-sm text-gray-400 dark:text-gray-500 
                            hover:text-gold dark:hover:text-gold 
                            transition-colors duration-200
                          "
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* FOOTER BOTTOM - COPYRIGHT & BOTTOM LINKS */}
              <div className="
                border-t border-gold/10 dark:border-gold/5 
                pt-8
                flex flex-col md:flex-row 
                justify-between items-center gap-6
                text-center md:text-left
              ">
                <p className="
                  text-gray-500 dark:text-gray-600 text-xs sm:text-sm
                ">
                  &copy; 2025 PitchConnect. All rights reserved. | 
                  <span className="ml-2">Elevating sports team management globally.</span>
                </p>
                <div className="flex gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-600">
                  <a 
                    href="/privacy" 
                    className="
                      hover:text-gold dark:hover:text-gold 
                      transition-colors duration-200
                    "
                  >
                    Privacy
                  </a>
                  <a 
                    href="/terms" 
                    className="
                      hover:text-gold dark:hover:text-gold 
                      transition-colors duration-200
                    "
                  >
                    Terms
                  </a>
                  <a 
                    href="/cookies" 
                    className="
                      hover:text-gold dark:hover:text-gold 
                      transition-colors duration-200
                    "
                  >
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
