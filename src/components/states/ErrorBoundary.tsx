/**
 * 🌟 PITCHCONNECT - Enhanced Error Boundary (PRODUCTION GRADE)
 * Path: /src/components/states/ErrorBoundary.tsx
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 * ✅ Catches all React rendering errors
 * ✅ Prevents full app crashes
 * ✅ Beautiful error UI with recovery options
 * ✅ Error logging to monitoring service
 * ✅ Development vs Production modes
 * ✅ Detailed error stack in development
 * ✅ User-friendly error messages in production
 * ✅ Recovery/retry mechanism
 * ✅ ErrorPage fallback
 * ✅ TypeScript support
 *
 * ============================================================================
 * WHAT THIS PREVENTS
 * ============================================================================
 * ❌ White blank screen on JS error
 * ❌ Lost user sessions on error
 * ❌ No way to recover from errors
 * ❌ Exposed sensitive stack traces
 * ✅ Now: User sees helpful error UI + can recover
 *
 * ============================================================================
 */

'use client';

import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays error UI
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Log error to monitoring service (Sentry, etc.)
    if (typeof window !== 'undefined' && window.__SENTRY__) {
      window.__SENTRY__.captureException(error);
    }

    // Update error count
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            reset={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-charcoal-900">
          <div className="w-full max-w-md space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {process.env.NODE_ENV === 'development'
                  ? 'Something went wrong'
                  : 'Oops! An error occurred'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {process.env.NODE_ENV === 'development'
                  ? 'An error occurred in the application. Check console for details.'
                  : 'We apologize for the inconvenience. Please try again.'}
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="font-mono text-sm text-red-800 dark:text-red-300">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs text-red-700 dark:text-red-400">
                    <summary className="cursor-pointer font-semibold">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words bg-red-100 p-2 dark:bg-red-900/30">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={this.resetError}
                variant="primary"
                size="lg"
                fullWidth
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Link href="/" className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Error Context */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                Error Count: {this.state.errorCount} | Environment:{' '}
                {process.env.NODE_ENV}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
