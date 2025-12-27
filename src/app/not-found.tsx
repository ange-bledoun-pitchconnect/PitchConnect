/**
 * ============================================================================
 * 🏆 PITCHCONNECT - 404 Not Found Page
 * Path: src/app/not-found.tsx
 * ============================================================================
 * 
 * Custom 404 error page with:
 * - Branded design matching PitchConnect theme
 * - Helpful navigation options
 * - Search functionality
 * - Recent pages suggestion
 * - Animated illustration
 * 
 * ============================================================================
 */

import Link from 'next/link';
import { Trophy, Home, ArrowLeft, Search, HelpCircle, Mail } from 'lucide-react';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for could not be found.',
};

// ============================================================================
// NOT FOUND PAGE
// ============================================================================

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="container-wide py-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold transition-transform duration-200 group-hover:scale-110">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground font-display">
            PitchConnect
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-[10rem] sm:text-[14rem] font-extrabold text-muted/20 leading-none select-none font-display">
              404
            </h1>
            {/* Floating Ball Animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Soccer Ball SVG */}
                <svg
                  className="w-24 h-24 sm:w-32 sm:h-32 animate-bounce-sm"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Ball base */}
                  <circle cx="50" cy="50" r="45" fill="white" stroke="currentColor" strokeWidth="2" className="text-charcoal-300 dark:text-charcoal-600" />
                  {/* Pentagon patterns */}
                  <path
                    d="M50 15L65 30L60 50L40 50L35 30L50 15Z"
                    fill="currentColor"
                    className="text-charcoal-800 dark:text-charcoal-200"
                  />
                  <path
                    d="M75 45L85 60L75 80L55 75L60 55L75 45Z"
                    fill="currentColor"
                    className="text-charcoal-800 dark:text-charcoal-200"
                  />
                  <path
                    d="M25 45L40 55L45 75L25 80L15 60L25 45Z"
                    fill="currentColor"
                    className="text-charcoal-800 dark:text-charcoal-200"
                  />
                  <path
                    d="M35 85L50 95L65 85L60 75L40 75L35 85Z"
                    fill="currentColor"
                    className="text-charcoal-800 dark:text-charcoal-200"
                  />
                </svg>
                {/* Shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-charcoal-900/10 dark:bg-white/10 rounded-full blur-sm animate-pulse" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 font-display">
            Oops! This page went offside
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back in the game.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/"
              className="btn btn-primary btn-lg gap-2"
            >
              <Home className="h-5 w-5" />
              Go to Homepage
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn btn-lg border-2 border-border bg-card text-foreground hover:bg-muted gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Or try one of these helpful links:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Help Center
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container-wide py-6 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} PitchConnect. All rights reserved.
        </p>
      </footer>
    </div>
  );
}