/**
 * 🌟 PITCHCONNECT - Auth Layout
 * Path: src/app/auth/layout.tsx
 *
 * ============================================================================
 * AUTHENTICATION LAYOUT
 * ============================================================================
 * ✅ Split-screen design (Branding Left / Form Right)
 * ✅ Responsive mobile view
 * ✅ "Force Dynamic" to prevent static generation issues
 * ✅ Integrated branding and navigation
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

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
        LEFT COLUMN: BRANDING & MARKETING (Desktop Only)
        ============================================================================
      */}
      <div className="relative hidden h-full flex-col bg-slate-900 p-10 text-white dark:border-r lg:flex">
        {/* Background Pattern/Overlay */}
        <div className="absolute inset-0 bg-zinc-900" />
        
        {/* Gradient Overlay for visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content Container */}
        <div className="relative z-20 flex h-full flex-col justify-between">
          {/* Logo Area */}
          <Link href="/" className="flex items-center gap-2 text-lg font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-black font-bold">
              P
            </div>
            PitchConnect
          </Link>

          {/* Testimonial / Value Prop Area */}
          <div className="space-y-6">
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed text-gray-200">
                &ldquo;PitchConnect has completely transformed how we manage our academy. 
                From player tracking to match analysis, everything is in one place.&rdquo;
              </p>
              <footer className="text-sm text-gray-400">
                — Jamie H., Academy Director
              </footer>
            </blockquote>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                ⚽ Team Management
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                📊 Advanced Analytics
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                🎥 Video Analysis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ============================================================================
        RIGHT COLUMN: AUTHENTICATION FORM
        ============================================================================
      */}
      <div className="relative flex h-full flex-col items-center justify-center p-6 lg:p-10 bg-gray-50 dark:bg-zinc-950">
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-black font-bold">
              P
            </div>
            <span className="text-slate-900 dark:text-white">PitchConnect</span>
          </Link>
        </div>

        {/* Action Button (Top Right) */}
        <div className="absolute top-6 right-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[400px] space-y-6">
          {children}
        </div>
        
        {/* Footer Links */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-300">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
