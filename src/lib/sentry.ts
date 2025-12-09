/**
 * Sentry Error Tracking & Monitoring Module
 * Path: /src/lib/sentry.ts
 * 
 * Core Features:
 * - Sentry error tracking and reporting
 * - Exception capture and logging
 * - Performance monitoring with breadcrumbs
 * - Release tracking and version management
 * - User context management with role-based tagging
 * - Error aggregation and analysis
 * - Breadcrumb trails for debugging
 * - Custom error categorization
 * 
 * Schema Aligned: Tracks PitchConnect errors with user roles, sports entities, payments
 * Production Ready: Full error handling, type safety, comprehensive logging
 * Enterprise Grade: Performance monitoring, breadcrumb tracking, custom contexts
 * 
 * Business Logic:
 * - Initialize Sentry for production error tracking
 * - Capture unhandled exceptions with context
 * - Track user actions leading to errors
 * - Monitor API performance and failures
 * - Group errors by type, entity, and severity
 * - Manage user context for error investigation
 * - Track sports-specific operations
 */

import * as Sentry from '@sentry/nextjs';

// ============================================================================
// TYPES
// ============================================================================

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  release?: string;
}

interface ErrorReportContext {
  userId?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface BreadcrumbData {
  message: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_TAGS = {
  MATCH: 'match_error',
  TRAINING: 'training_error',
  LEAGUE: 'league_error',
  PLAYER: 'player_error',
  TEAM: 'team_error',
  PAYMENT: 'payment_error',
  AUTH: 'auth_error',
  DATABASE: 'database_error',
  API: 'api_error',
  VALIDATION: 'validation_error',
  UNKNOWN: 'unknown_error',
} as const;

const BREADCRUMB_CATEGORIES = {
  USER_ACTION: 'user-action',
  NAVIGATION: 'navigation',
  API: 'api',
  DATABASE: 'database',
  AUTH: 'auth',
  PAYMENT: 'payment',
  SPORTS: 'sports',
  SYSTEM: 'system',
} as const;

// ============================================================================
// STATE
// ============================================================================

let isInitialized = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Must be called early in application lifecycle (root layout)
 * 
 * @throws Error if initialization fails
 */
export function initializeSentry(): void {
  if (isInitialized) {
    console.log('ℹ️ Sentry already initialized');
    return;
  }

  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      console.warn(
        '⚠️ Sentry DSN not configured. Error tracking disabled.\n' +
        'Set NEXT_PUBLIC_SENTRY_DSN environment variable'
      );
      return;
    }

    const environment = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';
    const release = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

    const config: SentryConfig = {
      dsn,
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      release,
    };

    // Initialize Sentry
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      tracesSampleRate: config.tracesSampleRate,
      
      // Error tracking
      attachStacktrace: true,
      maxBreadcrumbs: 50,
      
      // Error filtering
      denyUrls: [
        // Browser extensions
        /chrome-extension:/,
        /moz-extension:/,
      ],
      
      // Ignore certain errors
      ignoreErrors: [
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'chrome-extension://',
        'moz-extension://',
      ],
      
      // Before send hook for filtering
      beforeSend: (event, hint) => {
        // Filter out browser extension errors
        if (event.exception) {
          const error = hint.originalException as any;
          
          // Type-safe error message checking
          const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
            ? String(error.message) 
            : String(error);
          
          if (
            errorMessage?.includes('chrome-extension://') ||
            errorMessage?.includes('moz-extension://') ||
            errorMessage?.includes('top.GLOBALS')
          ) {
            return null;
          }
        }
        
        return event;
      },
    });

    isInitialized = true;
    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${environment}`);
    console.log(`   Release: ${release}`);
  } catch (error) {
    console.error('❌ Sentry initialization failed:', error);
    isInitialized = false;
  }
}

// ============================================================================
// USER CONTEXT MANAGEMENT
// ============================================================================

/**
 * Set user context for error tracking and investigation
 * Attach user information to all subsequent errors and transactions
 * 
 * @param userId - Unique user identifier
 * @param email - User email address
 * @param role - User role (PLAYER, COACH, MANAGER, etc.)
 * @param metadata - Additional user metadata (subscription tier, club, etc.)
 */
export function setErrorUserContext(
  userId: string,
  email: string,
  role?: string,
  metadata?: Record<string, any>
): void {
  if (!isInitialized) {
    console.warn('⚠️ Sentry not initialized');
    return;
  }

  try {
    const userData: any = {
      id: userId,
      email,
      username: email.split('@')[0],
    };

    if (role) {
      userData.role = role;
    }

    if (metadata) {
      Object.assign(userData, metadata);
    }

    Sentry.setUser(userData);

    // Also set as context for better error grouping
    Sentry.setContext('user', {
      id: userId,
      email,
      role: role || 'UNKNOWN',
      ...metadata,
    });

    console.log('✅ Error user context set:', userId);
  } catch (error) {
    console.error('❌ Error setting user context:', error);
  }
}

/**
 * Clear user context when user logs out
 */
export function clearErrorUserContext(): void {
  if (!isInitialized) return;

  try {
    Sentry.setUser(null);
    Sentry.setContext('user', null);
    console.log('✅ Error user context cleared');
  } catch (error) {
    console.error('❌ Error clearing user context:', error);
  }
}

/**
 * Set custom context for error grouping and filtering
 * Useful for tracking current state, feature flags, etc.
 * 
 * @param key - Context key
 * @param value - Context data
 */
export function setErrorContext(
  key: string,
  value: Record<string, any>
): void {
  if (!isInitialized) return;

  try {
    Sentry.setContext(key, value);
    console.log('✅ Error context set:', key);
  } catch (error) {
    console.error('❌ Error setting context:', error);
  }
}

// ============================================================================
// ERROR REPORTING
// ============================================================================

/**
 * Capture exception and report to Sentry
 * Includes automatic stack trace and context
 * 
 * @param error - Error object or message
 * @param context - Additional context for investigation
 * @param severity - Error severity level
 */
export function captureException(
  error: Error | string,
  context?: Record<string, any>,
  severity: 'fatal' | 'error' | 'warning' = 'error'
): void {
  if (!isInitialized) {
    console.error('Error:', error);
    return;
  }

  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    Sentry.captureException(errorObj, {
      level: severity,
      tags: {
        error_type: 'exception',
      },
      extra: context,
    });

    console.error('❌ Exception captured:', error);
  } catch (err) {
    console.error('❌ Failed to capture exception:', err);
  }
}

/**
 * Capture message (non-error events)
 * Use for warnings, info, and debug messages
 * 
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): void {
  if (!isInitialized) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  try {
    // Sentry.captureMessage takes message and level only
    Sentry.captureMessage(message, level);

    // If additional context needed, add as breadcrumb
    if (context) {
      addBreadcrumb(message, BREADCRUMB_CATEGORIES.SYSTEM, level, context);
    }

    console.log(`✅ Message captured [${level}]:`, message);
  } catch (error) {
    console.error('❌ Failed to capture message:', error);
  }
}

// ============================================================================
// DOMAIN-SPECIFIC ERROR REPORTING
// ============================================================================

/**
 * Report API error
 * Tracks HTTP errors with method, status, and response
 */
export function reportApiError(
  method: string,
  url: string,
  status: number,
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`${method} ${url} - ${status}: ${message}`),
    {
      method,
      url,
      status_code: status,
      error_message: message,
      error_type: ERROR_TAGS.API,
      ...context,
    },
    'error'
  );
}

/**
 * Report authentication error
 */
export function reportAuthError(
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Authentication failed: ${message}`),
    {
      error_type: ERROR_TAGS.AUTH,
      ...context,
    },
    'error'
  );
}

/**
 * Report database error
 */
export function reportDatabaseError(
  message: string,
  operation?: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Database error: ${message}`),
    {
      error_type: ERROR_TAGS.DATABASE,
      operation,
      ...context,
    },
    'error'
  );
}

/**
 * Report validation error with field-level details
 */
export function reportValidationError(
  message: string,
  fields?: Record<string, string[]>,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Validation failed: ${message}`),
    {
      error_type: ERROR_TAGS.VALIDATION,
      validation_errors: fields,
      ...context,
    },
    'warning'
  );
}

// ============================================================================
// SPORTS DOMAIN ERROR REPORTING
// ============================================================================

/**
 * Report match-related error
 * Includes match ID and match-specific context
 */
export function reportMatchError(
  matchId: string,
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Match error: ${message}`),
    {
      error_type: ERROR_TAGS.MATCH,
      match_id: matchId,
      domain: 'sports',
      entity_type: 'match',
      ...context,
    },
    'error'
  );
}

/**
 * Report training session error
 */
export function reportTrainingError(
  sessionId: string,
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Training error: ${message}`),
    {
      error_type: ERROR_TAGS.TRAINING,
      session_id: sessionId,
      domain: 'sports',
      entity_type: 'training',
      ...context,
    },
    'error'
  );
}

/**
 * Report league-related error
 */
export function reportLeagueError(
  leagueId: string,
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`League error: ${message}`),
    {
      error_type: ERROR_TAGS.LEAGUE,
      league_id: leagueId,
      domain: 'sports',
      entity_type: 'league',
      ...context,
    },
    'error'
  );
}

/**
 * Report player-related error
 */
export function reportPlayerError(
  playerId: string,
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Player error: ${message}`),
    {
      error_type: ERROR_TAGS.PLAYER,
      player_id: playerId,
      domain: 'sports',
      entity_type: 'player',
      ...context,
    },
    'error'
  );
}

/**
 * Report team-related error
 */
export function reportTeamError(
  teamId: string,
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Team error: ${message}`),
    {
      error_type: ERROR_TAGS.TEAM,
      team_id: teamId,
      domain: 'sports',
      entity_type: 'team',
      ...context,
    },
    'error'
  );
}

/**
 * Report payment/subscription error
 */
export function reportPaymentError(
  message: string,
  context?: Record<string, any>
): void {
  captureException(
    new Error(`Payment error: ${message}`),
    {
      error_type: ERROR_TAGS.PAYMENT,
      domain: 'business',
      entity_type: 'payment',
      ...context,
    },
    'error'
  );
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Measure async operation performance
 * Tracks operation execution time via breadcrumbs
 * 
 * @param name - Operation name
 * @param operation - Operation type (db, http, api, etc.)
 * @param fn - Async function to measure
 * @returns Function result
 */
export async function measureOperation<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    // Add breadcrumb for successful operation
    addBreadcrumb(
      `${name} completed`,
      BREADCRUMB_CATEGORIES.SYSTEM,
      'info',
      {
        operation,
        duration_ms: Math.round(duration),
        status: 'success',
      }
    );

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    // Add breadcrumb for failed operation
    addBreadcrumb(
      `${name} failed`,
      BREADCRUMB_CATEGORIES.SYSTEM,
      'error',
      {
        operation,
        duration_ms: Math.round(duration),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }
    );

    captureException(error as Error, {
      operation,
      operation_name: name,
      duration_ms: Math.round(duration),
    });

    throw error;
  }
}

/**
 * Measure synchronous operation performance
 * 
 * @param name - Operation name
 * @param operation - Operation type
 * @param fn - Function to measure
 * @returns Function result
 */
export function measureSync<T>(
  name: string,
  operation: string,
  fn: () => T
): T {
  const startTime = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - startTime;

    // Add breadcrumb for successful operation
    addBreadcrumb(
      `${name} completed`,
      BREADCRUMB_CATEGORIES.SYSTEM,
      'info',
      {
        operation,
        duration_ms: Math.round(duration),
        status: 'success',
      }
    );

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    // Add breadcrumb for failed operation
    addBreadcrumb(
      `${name} failed`,
      BREADCRUMB_CATEGORIES.SYSTEM,
      'error',
      {
        operation,
        duration_ms: Math.round(duration),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      }
    );

    captureException(error as Error, {
      operation,
      operation_name: name,
      duration_ms: Math.round(duration),
    });

    throw error;
  }
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

/**
 * Add breadcrumb for error investigation
 * Breadcrumbs create a trail of events leading to error
 * Essential for understanding user actions
 * 
 * @param message - Breadcrumb message
 * @param category - Event category
 * @param level - Severity level
 * @param data - Additional event data
 */
export function addBreadcrumb(
  message: string,
  category: string = BREADCRUMB_CATEGORIES.USER_ACTION,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, any>
): void {
  if (!isInitialized) return;

  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });

    console.log('✅ Breadcrumb added:', message);
  } catch (error) {
    console.error('❌ Failed to add breadcrumb:', error);
  }
}

/**
 * Add API breadcrumb
 */
export function addApiBreadcrumb(
  method: string,
  url: string,
  status?: number
): void {
  addBreadcrumb(
    `${method} ${url}`,
    BREADCRUMB_CATEGORIES.API,
    status && status >= 400 ? 'warning' : 'info',
    { method, url, status }
  );
}

/**
 * Add navigation breadcrumb
 */
export function addNavigationBreadcrumb(pathname: string): void {
  addBreadcrumb(
    `Navigated to ${pathname}`,
    BREADCRUMB_CATEGORIES.NAVIGATION,
    'info',
    { pathname }
  );
}

/**
 * Add user action breadcrumb
 */
export function addActionBreadcrumb(
  action: string,
  data?: Record<string, any>
): void {
  addBreadcrumb(
    `User action: ${action}`,
    BREADCRUMB_CATEGORIES.USER_ACTION,
    'info',
    data
  );
}

/**
 * Add database operation breadcrumb
 */
export function addDatabaseBreadcrumb(
  operation: string,
  table: string,
  duration?: number
): void {
  addBreadcrumb(
    `Database ${operation} on ${table}`,
    BREADCRUMB_CATEGORIES.DATABASE,
    'info',
    { operation, table, duration_ms: duration }
  );
}

// ============================================================================
// TAGS & CONTEXT
// ============================================================================

/**
 * Set tag for error grouping and filtering
 * Tags help organize and categorize errors in Sentry dashboard
 * 
 * @param key - Tag key
 * @param value - Tag value
 */
export function setErrorTag(key: string, value: string): void {
  if (!isInitialized) return;

  try {
    Sentry.setTag(key, value);
    console.log('✅ Tag set:', key, value);
  } catch (error) {
    console.error('❌ Failed to set tag:', error);
  }
}

/**
 * Set multiple tags at once
 */
export function setErrorTags(tags: Record<string, string>): void {
  if (!isInitialized) return;

  try {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });

    console.log('✅ Tags set:', Object.keys(tags));
  } catch (error) {
    console.error('❌ Failed to set tags:', error);
  }
}

// ============================================================================
// DEBUG & STATUS
// ============================================================================

/**
 * Get Sentry initialization status
 */
export function getSentryStatus(): {
  initialized: boolean;
  dsn: boolean;
  environment: string;
  release: string;
} {
  return {
    initialized: isInitialized,
    dsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'unknown',
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };
}

/**
 * Log Sentry status to console
 */
export function logSentryStatus(): void {
  console.table(getSentryStatus());
}

/**
 * Get Sentry SDK instance (for advanced usage)
 */
export function getSentrySDK(): typeof Sentry {
  return Sentry;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { SentryConfig, ErrorReportContext, BreadcrumbData };

export { Sentry };
