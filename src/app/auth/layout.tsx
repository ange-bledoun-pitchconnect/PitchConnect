/**
 * 🌟 PITCHCONNECT - Auth Layout
 * Path: src/app/auth/layout.tsx
 *
 * ============================================================================
 * AUTHENTICATION LAYOUT - FULL-PAGE SPLIT SCREEN
 * ============================================================================
 * ✅ True split-screen layout (50/50 desktop, stacked mobile)
 * ✅ Uses FULL page width (no centering/squashing)
 * ✅ Premium SaaS design
 * ✅ Left: Branding + Testimonials + Features
 * ✅ Right: Full-width authentication form
 * ✅ Dark/light mode support
 * ✅ Responsive design (mobile-first)
 *
 * LAYOUT:
 * Desktop: 2-column grid (50% | 50%)
 * Mobile: Single column, stacked
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
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* 
        ============================================================================
        LEFT COLUMN: BRANDING & MARKETING (Desktop Only, Full on Mobile)
        ============================================================================
        Dark professional design with testimonials and features
      */}
      <div className="relative flex h-full flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 text-white dark:bg-gradient-to-br dark:from-black dark:via-slate-900 dark:to-slate-950 lg:p-12 lg:min-h-screen">
        {/* 
          Background decorative elements
        */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 top-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        {/* Content stays on top of decorative background */}
        <div className="relative z-10 space-y-8">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-900 font-bold">
              P
            </div>
            PitchConnect
          </Link>

          {/* Main Testimonial / Value Proposition */}
          <div className="space-y-4 pt-4">
            <blockquote className="space-y-3">
              <p className="text-xl font-medium leading-relaxed text-gray-100">
                &ldquo;PitchConnect transformed how we manage our academy. We've reduced admin time by 70% 
                and our coaches now have real-time analytics at their fingertips.&rdquo;
              </p>
              <footer className="flex items-center gap-3 pt-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-900">
                  JH
                </div>
                <div>
                  <p className="font-semibold text-white">Jamie Harrison</p>
                  <p className="text-sm text-gray-400">Academy Director, London FC</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>

        {/* 
          Bottom Section: Key Features & Stats
        */}
        <div className="relative z-10 space-y-6">
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
              ⚽ Player Tracking
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
              📊 Analytics
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
              🎥 Video Analysis
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
              🚀 Real-time Updates
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-2xl font-bold text-amber-500">5000+</p>
              <p className="text-sm text-gray-400">Teams Using</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">150+</p>
              <p className="text-sm text-gray-400">Countries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">99.9%</p>
              <p className="text-sm text-gray-400">Uptime SLA</p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ============================================================================
        RIGHT COLUMN: AUTHENTICATION FORM
        ============================================================================
        Light professional design with full-width form
      */}
      <div className="relative flex h-full w-full flex-col bg-white dark:bg-slate-900 lg:min-h-screen">
        {/* 
          Header with Back to Home
        */}
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            {/* Mobile Logo (Hidden on Desktop) */}
            <Link href="/" className="inline-flex lg:hidden items-center gap-2 font-bold text-slate-900 dark:text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-900 font-bold text-sm">
                P
              </div>
              <span>PitchConnect</span>
            </Link>

            {/* Back to Home - All Screen Sizes */}
            <Link
              href="/"
              className="ml-auto text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors flex items-center gap-1"
            >
              ← Back Home
            </Link>
          </div>
        </header>

        {/* 
          Main Form Area - Full Height
        */}
        <main className="flex flex-1 flex-col items-center justify-center px-8 py-12 lg:px-12 lg:py-16">
          {/* Form Container - FULL WIDTH (not constrained) */}
          <div className="w-full max-w-md space-y-6">
            {/* 
              Render child components (login/signup forms)
              Form will use available space, not squeezed to center
            */}
            {children}
          </div>
        </main>

        {/* 
          Footer - Legal Links
        */}
        <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="mb-2">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            Support:{' '}
            <a href="mailto:support@pitchconnect.com" className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              support@pitchconnect.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
