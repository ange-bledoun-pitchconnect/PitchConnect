/**
 * 🌟 PITCHCONNECT - Auth Layout
 * Path: src/app/auth/layout.tsx
 *
 * ============================================================================
 * AUTHENTICATION LAYOUT - CLEAN CENTERED DESIGN
 * ============================================================================
 * ✅ Clean, centered form layout (all screen sizes)
 * ✅ Sticky header with logo (mobile & desktop)
 * ✅ Professional gradient background
 * ✅ Dark/light mode support
 * ✅ Responsive design (mobile-first)
 * ✅ Accessibility optimized
 *
 * LAYOUT:
 * - Header: Logo + Back to Home link (sticky on mobile)
 * - Content: Centered form container (max-width 400px)
 * - Footer: Legal links
 * - Background: Subtle gradient
 */

import { Metadata } from 'next';
import Link from 'next/link';

// Force dynamic rendering to prevent static generation errors with auth cookies
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Authentication | PitchConnect',
  description: 'Sign in or create an account to manage your sports team.',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* 
        ============================================================================
        HEADER - STICKY ON MOBILE
        ============================================================================
        Displays logo and back to home link
        - Mobile: Sticky at top (z-50)
        - Desktop: Regular positioning
      */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80 lg:static lg:border-none lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-slate-900 font-bold text-sm">
              P
            </div>
            <span className="hidden sm:inline">PitchConnect</span>
          </Link>

          {/* Back to Home Link */}
          <nav>
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              ← Back Home
            </Link>
          </nav>
        </div>
      </header>

      {/* 
        ============================================================================
        MAIN CONTENT - CENTERED FORM
        ============================================================================
        Full-height layout with centered form container
      */}
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:py-12">
        {/* Centered Form Container */}
        <div className="w-full max-w-[420px]">
          {/* 
            Form wrapper with subtle styling
            - White background (light mode) / Dark background (dark mode)
            - Rounded corners for modern look
            - Subtle shadow for depth
            - Padding for spacing
          */}
          <div className="rounded-xl border border-slate-200/50 bg-white/95 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/95 dark:shadow-none sm:p-8">
            {/* 
              Render child components here
              This will be the actual login/signup forms
            */}
            {children}
          </div>

          {/* 
            ============================================================================
            LEGAL LINKS - FOOTER
            ============================================================================
          */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="leading-relaxed">
              By signing in, you agree to our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* 
            ============================================================================
            HELP TEXT - OPTIONAL
            ============================================================================
            Shows help information for users having issues
          */}
          <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-500">
            <p>
              Having issues?{' '}
              <a
                href="mailto:support@pitchconnect.com"
                className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* 
        ============================================================================
        BACKGROUND DECORATION - SUBTLE ANIMATED ELEMENTS (OPTIONAL)
        ============================================================================
        You can uncomment these for subtle visual effects
      */}
      {/* 
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-200/20 dark:bg-blue-900/10 blur-3xl" />
      </div>
      */}
    </div>
  );
}
