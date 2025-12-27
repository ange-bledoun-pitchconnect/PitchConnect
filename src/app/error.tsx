/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Error Page
 * Path: src/app/error.tsx
 * ============================================================================
 * 
 * Next.js error page for handling runtime errors.
 * This is a client component that catches errors in the page segment.
 * 
 * ============================================================================
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ============================================================================
// ERROR PAGE
// ============================================================================

export default function Error({ error, reset }: ErrorProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Error Page] Runtime error:', error);
    
    // In production, send to monitoring service
    if (!isDevelopment) {
      // TODO: Sentry.captureException(error);
    }
  }, [error, isDevelopment]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-2 font-display">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error while loading this page.
          Please try again or return to the homepage.
        </p>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="mb-6 rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-left">
            <div className="flex items-start gap-3">
              <Bug className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-mono text-sm text-destructive font-semibold">
                  {error.name}: {error.message}
                </p>
                {error.digest && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="btn btn-primary btn-lg gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="btn btn-lg border-2 border-border bg-card text-foreground hover:bg-muted gap-2"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        {/* Support Link */}
        <p className="mt-8 text-sm text-muted-foreground">
          If this problem persists, please{' '}
          <Link href="/contact" className="text-primary hover:underline">
            contact support
          </Link>
          .
        </p>

        {/* Error Digest */}
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error Reference:{' '}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
              {error.digest}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}