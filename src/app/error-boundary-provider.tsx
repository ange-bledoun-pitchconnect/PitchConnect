/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Error Boundary Provider
 * Path: src/app/error-boundary-provider.tsx
 * ============================================================================
 * 
 * Client-side error boundary wrapper with:
 * - Graceful error handling
 * - User-friendly error UI
 * - Error reporting capability
 * - Recovery options
 * 
 * ============================================================================
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY PROVIDER
// ============================================================================

/**
 * Error Boundary Provider
 * 
 * Wraps the application and catches JavaScript errors anywhere in the
 * child component tree, logs them, and displays a fallback UI.
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

/**
 * Error Boundary Class Component
 * 
 * Must be a class component because error boundaries require:
 * - static getDerivedStateFromError()
 * - componentDidCatch()
 * 
 * These lifecycle methods are not available in function components.
 */
class ErrorBoundary extends Component<ErrorBoundaryProviderProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProviderProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is thrown
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log to console in development
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  /**
   * Log error to external service (e.g., Sentry, LogRocket)
   */
  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Implement error logging service
    // Example with Sentry:
    // Sentry.captureException(error, { extra: { errorInfo } });
    
    // For now, just log to console
    console.error('[ErrorBoundary] Production error logged:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Reset error state and retry
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Navigate to home page
   */
  handleGoHome = (): void => {
    this.handleRetry();
    window.location.href = '/';
  };

  /**
   * Reload the page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR FALLBACK UI
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onGoHome: () => void;
  onReload: () => void;
}

/**
 * Error Fallback UI
 * 
 * Displayed when an error is caught by the error boundary.
 * Provides helpful information and recovery options.
 */
function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  onReload,
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Error Message (Development Only) */}
            {isDevelopment && error && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                <div className="flex items-start gap-3">
                  <Bug className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-destructive font-semibold">
                      {error.name}: {error.message}
                    </p>
                    {error.stack && (
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Component Stack (Development Only) */}
            {isDevelopment && errorInfo?.componentStack && (
              <details className="rounded-lg bg-muted p-4">
                <summary className="cursor-pointer text-sm font-medium text-foreground">
                  Component Stack
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={onRetry}
                className="btn btn-primary btn-md w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              
              <button
                onClick={onReload}
                className="btn btn-md w-full border-2 border-border bg-card text-foreground hover:bg-muted gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
              
              <button
                onClick={onGoHome}
                className="btn btn-ghost btn-md w-full gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <p className="text-xs text-muted-foreground text-center">
              If this problem persists, please{' '}
              <a
                href="/contact"
                className="text-primary hover:underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        </div>

        {/* Error ID (for support) */}
        {error && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Error ID:{' '}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
              {generateErrorId()}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a unique error ID for support reference
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ErrorBoundary };
export default ErrorBoundaryProvider;