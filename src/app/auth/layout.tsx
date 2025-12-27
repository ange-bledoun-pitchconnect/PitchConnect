/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Auth Layout v5.0 (FULLY FIXED)
 * Path: src/app/auth/layout.tsx
 * ============================================================================
 * 
 * FIXES:
 * - Logo icon now has visible gradient background
 * - Works perfectly in light and dark modes
 * - Clean enterprise styling
 * 
 * ============================================================================
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Shield, Lock, Zap, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Authentication',
    template: '%s | PitchConnect',
  },
  description: 'Sign in or create an account to manage your sports team with PitchConnect.',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <header className="w-full px-4 sm:px-6 py-4 sm:py-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            {/* Logo - FIXED: Gradient background always visible */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">PitchConnect</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sports Management Platform</p>
              </div>
            </Link>

            {/* Back Link */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xl">
              {children}
            </div>

            {/* Trust Signals */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap className="h-4 w-4 text-orange-500" />
                <span>99.9% Uptime</span>
              </div>
            </div>

            {/* Social Proof */}
            <p className="mt-4 text-center text-sm text-gray-500">
              Trusted by <span className="font-semibold text-gray-700 dark:text-gray-300">5,000+</span> teams worldwide
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-4 sm:px-6 py-4 sm:py-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} PitchConnect. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <Link href="/legal/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Terms
                </Link>
                <Link href="/legal/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Privacy
                </Link>
                <a href="mailto:support@pitchconnect.com" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}