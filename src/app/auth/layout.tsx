/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Auth Layout v8.0 (CLEAN - NO DOUBLE CARD)
 * Path: src/app/auth/layout.tsx
 * ============================================================================
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Authentication',
    template: '%s | PitchConnect',
  },
  description: 'Sign in or create an account to manage your sports team.',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div 
      className="min-h-screen w-full"
      style={{ 
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(249, 115, 22, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(59, 130, 246, 0.08) 0%, transparent 50%)'
      }}
    >
      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <header className="w-full px-4 sm:px-6 py-4 sm:py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ 
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                }}
              >
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold" style={{ color: '#111827' }}>
                  PitchConnect
                </span>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Sports Management
                </p>
              </div>
            </Link>

            {/* Back Link */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: '#6b7280' }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Main Content - NO CARD WRAPPER */}
        <main className="flex flex-1 items-start justify-center px-4 py-6 sm:py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full px-4 sm:px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                © {new Date().getFullYear()} PitchConnect. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#9ca3af' }}>
                <Link href="/legal/terms" className="hover:underline">Terms</Link>
                <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
                <a href="mailto:support@pitchconnect.com" className="hover:underline">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}