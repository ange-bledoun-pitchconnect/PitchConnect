'use client';

/**
 * Datadog RUM Integration Module
 * Path: /src/lib/datadog.ts
 * 
 * Core Features:
 * - Datadog Real User Monitoring (RUM) initialization
 * - User action tracking
 * - Performance monitoring
 * - Session replay recording
 * - Error tracking
 * - Resource tracking
 * - User context management
 * - Custom event logging
 * 
 * Schema Aligned: Tracks PitchConnect user interactions
 * Production Ready: Full error handling and type safety
 * 
 * Business Logic:
 * - Initialize RUM on app startup
 * - Track user actions and interactions
 * - Monitor API performance
 * - Record session replays
 * - Manage user context for support
 * - Track application errors
 */

import { datadogRum } from '@datadog/browser-rum';

// ============================================================================
// TYPES
// ============================================================================

interface DatadogConfig {
  applicationId: string;
  clientToken: string;
  site: 'datadoghq.com' | 'datadoghq.eu';
  service: string;
  env: string;
  version?: string;
}

interface UserActionContext {
  userId?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface ErrorContext {
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

// ============================================================================
// STATE
// ============================================================================

let isInitialized = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize Datadog RUM (Real User Monitoring)
 * Must be called before any user interactions are tracked
 * 
 * @throws Error if Datadog credentials are not provided
 */
export function initDatadog(): void {
  if (isInitialized) {
    console.log('ℹ️ Datadog RUM already initialized');
    return;
  }

  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    console.log('ℹ️ Skipping Datadog initialization (server-side)');
    return;
  }

  try {
    const appId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
    const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
    const site = (process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com') as 'datadoghq.com' | 'datadoghq.eu';
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

    if (!appId || !clientToken) {
      console.warn(
        '⚠️ Datadog credentials not configured. Monitoring disabled.\n' +
        'Set NEXT_PUBLIC_DD_APPLICATION_ID and NEXT_PUBLIC_DD_CLIENT_TOKEN'
      );
      return;
    }

    const config: DatadogConfig = {
      applicationId: appId,
      clientToken,
      site,
      service: 'pitchconnect',
      env,
      version,
    };

    // Initialize RUM
    datadogRum.init({
      applicationId: config.applicationId,
      clientToken: config.clientToken,
      site: config.site,
      service: config.service,
      env: config.env,
      version: config.version,

      // Session Configuration
      sessionSampleRate: 100, // 100% session tracking
      sessionReplaySampleRate: env === 'production' ? 20 : 100, // 20% replay in prod, 100% in dev

      // Interaction Tracking
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,

      // Privacy & Security
      defaultPrivacyLevel: 'mask-user-input' as any,

      // Performance
      traceSampleRate: 100,
      allowedTracingUrls: [
        /https?:\/\/api\.pitchconnect\.io/,
        /https?:\/\/api\.staging\.pitchconnect\.io/,
        /https?:\/\/localhost:3000/,
      ],

      // Error & Exception Tracking
      silentMultipleInit: true,
    });

    // Start session replay recording
    datadogRum.startSessionReplayRecording();

    isInitialized = true;
    console.log('✅ Datadog RUM initialized successfully');
  } catch (error) {
    console.error('❌ Datadog initialization failed:', error);
    isInitialized = false;
  }
}

/**
 * Initialize all Datadog services
 * Convenience function for initialization
 */
export function initializeDatadog(): void {
  initDatadog();
}

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * Set user context for monitoring and support
 * Attach user information to all subsequent events and sessions
 * 
 * @param userId - Unique user identifier
 * @param email - User email
 * @param role - User role (PLAYER, COACH, MANAGER, etc.)
 * @param metadata - Additional user metadata
 */
export function setDatadogUserContext(
  userId: string,
  email: string,
  role?: string,
  metadata?: Record<string, any>
): void {
  if (!isInitialized) {
    console.warn('⚠️ Datadog RUM not initialized');
    return;
  }

  try {
    const user: any = {
      id: userId,
      email,
      username: email.split('@')[0],
    };

    if (role) {
      user.role = role;
    }

    if (metadata) {
      Object.assign(user, metadata);
    }

    datadogRum.setUser(user);
    console.log('✅ User context set:', userId);
  } catch (error) {
    console.error('❌ Error setting user context:', error);
  }
}

/**
 * Clear user context
 * Call when user logs out
 */
export function clearDatadogUserContext(): void {
  if (!isInitialized) return;

  try {
    datadogRum.clearUser();
    console.log('✅ User context cleared');
  } catch (error) {
    console.error('❌ Error clearing user context:', error);
  }
}

// ============================================================================
// ACTION TRACKING
// ============================================================================

/**
 * Track user action
 * Use for custom user interactions and events
 * 
 * @param action - Action name (e.g., 'create_team', 'view_player_stats')
 * @param context - Additional context for the action
 */
export function trackUserAction(
  action: string,
  context?: UserActionContext
): void {
  if (!isInitialized) {
    console.warn('⚠️ Datadog RUM not initialized');
    return;
  }

  try {
    datadogRum.addAction(action, context);
    console.log('✅ Action tracked:', action);
  } catch (error) {
    console.error('❌ Error tracking action:', error);
  }
}

/**
 * Track button click
 * 
 * @param buttonName - Button identifier
 * @param context - Additional context
 */
export function trackButtonClick(
  buttonName: string,
  context?: Record<string, any>
): void {
  trackUserAction(`button_click_${buttonName}`, context);
}

/**
 * Track form submission
 * 
 * @param formName - Form identifier
 * @param context - Form context (non-sensitive data only)
 */
export function trackFormSubmission(
  formName: string,
  context?: Record<string, any>
): void {
  trackUserAction(`form_submit_${formName}`, context);
}

/**
 * Track page view
 * 
 * @param pageName - Page name or route
 * @param context - Page context
 */
export function trackPageView(
  pageName: string,
  context?: Record<string, any>
): void {
  if (!isInitialized) return;

  try {
    datadogRum.startView({
      name: pageName,
      ...context,
    });
    console.log('✅ Page view tracked:', pageName);
  } catch (error) {
    console.error('❌ Error tracking page view:', error);
  }
}

/**
 * Track API call
 * 
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - API endpoint URL
 * @param duration - Duration in milliseconds
 * @param status - HTTP status code
 */
export function trackApiCall(
  method: string,
  url: string,
  duration: number,
  status: number
): void {
  if (!isInitialized) return;

  try {
    trackUserAction(`api_${method.toLowerCase()}`, {
      method,
      url,
      duration,
      status,
    });
    console.log(
      `✅ API call tracked: ${method} ${url} (${duration}ms, ${status})`
    );
  } catch (error) {
    console.error('❌ Error tracking API call:', error);
  }
}

/**
 * Track feature flag check
 * 
 * @param featureName - Feature flag name
 * @param enabled - Whether feature is enabled
 */
export function trackFeatureFlag(
  featureName: string,
  enabled: boolean
): void {
  trackUserAction('feature_flag_checked', {
    feature: featureName,
    enabled,
  });
}

/**
 * Track match event
 * 
 * @param matchId - Match ID
 * @param eventType - Type of event (GOAL, SUBSTITUTION, etc.)
 * @param context - Event context
 */
export function trackMatchEvent(
  matchId: string,
  eventType: string,
  context?: Record<string, any>
): void {
  trackUserAction('match_event', {
    matchId,
    eventType,
    ...context,
  });
}

/**
 * Track training session activity
 * 
 * @param sessionId - Training session ID
 * @param action - Action taken (START, END, ATTENDANCE, etc.)
 * @param context - Session context
 */
export function trackTrainingSession(
  sessionId: string,
  action: string,
  context?: Record<string, any>
): void {
  trackUserAction('training_session', {
    sessionId,
    action,
    ...context,
  });
}

/**
 * Track league activity
 * 
 * @param leagueId - League ID
 * @param action - Action taken
 * @param context - League context
 */
export function trackLeagueActivity(
  leagueId: string,
  action: string,
  context?: Record<string, any>
): void {
  trackUserAction('league_activity', {
    leagueId,
    action,
    ...context,
  });
}

/**
 * Track player stats update
 * 
 * @param playerId - Player ID
 * @param stats - Updated stats
 */
export function trackPlayerStatsUpdate(
  playerId: string,
  stats?: Record<string, any>
): void {
  trackUserAction('player_stats_update', {
    playerId,
    ...stats,
  });
}

/**
 * Track team activity
 * 
 * @param teamId - Team ID
 * @param action - Action taken
 * @param context - Team context
 */
export function trackTeamActivity(
  teamId: string,
  action: string,
  context?: Record<string, any>
): void {
  trackUserAction('team_activity', {
    teamId,
    action,
    ...context,
  });
}

/**
 * Track payment/subscription event
 * 
 * @param event - Payment event type
 * @param details - Payment details (non-sensitive)
 */
export function trackPaymentEvent(
  event: string,
  details?: Record<string, any>
): void {
  trackUserAction(`payment_${event}`, details);
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Report error to Datadog
 * 
 * @param error - Error object or message
 * @param context - Error context
 */
export function reportError(
  error: Error | string,
  context?: Record<string, any>
): void {
  if (!isInitialized) {
    console.error('Error:', error);
    return;
  }

  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    datadogRum.addError(errorObj, context);
    console.error('❌ Error reported to Datadog:', error);
  } catch (err) {
    console.error('❌ Error reporting failed:', err);
  }
}

/**
 * Track custom error
 * 
 * @param message - Error message
 * @param severity - Error severity (low, medium, high, critical)
 * @param context - Error context
 */
export function trackError(
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  context?: Record<string, any>
): void {
  if (!isInitialized) return;

  try {
    trackUserAction(`error_${severity}`, {
      message,
      severity,
      ...context,
    });
  } catch (error) {
    console.error('❌ Error tracking failed:', error);
  }
}

/**
 * Track API error
 * 
 * @param url - API URL
 * @param status - HTTP status code
 * @param message - Error message
 */
export function trackApiError(
  url: string,
  status: number,
  message?: string
): void {
  trackError(`API Error: ${status} ${url}`, 'high', {
    url,
    status,
    message,
  });
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Add custom timing
 * 
 * @param name - Metric name
 * @param duration - Duration in milliseconds
 */
export function addTiming(name: string, duration: number): void {
  if (!isInitialized) return;

  try {
    datadogRum.addTiming(name, duration);
    console.log(`✅ Timing added: ${name} (${duration}ms)`);
  } catch (error) {
    console.error('❌ Error adding timing:', error);
  }
}

/**
 * Measure and track function execution time
 * 
 * @param name - Metric name
 * @param fn - Async function to measure
 * @returns Function result
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    addTiming(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    addTiming(`${name}_error`, duration);
    throw error;
  }
}

/**
 * Measure sync function execution time
 * 
 * @param name - Metric name
 * @param fn - Sync function to measure
 * @returns Function result
 */
export function measurePerformanceSync<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - startTime;
    addTiming(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    addTiming(`${name}_error`, duration);
    throw error;
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Start new session
 * Useful when user logs in or navigates between role dashboards
 */
export function startNewSession(): void {
  if (!isInitialized) return;

  try {
    datadogRum.startSessionReplayRecording();
    console.log('✅ New session started');
  } catch (error) {
    console.error('❌ Error starting new session:', error);
  }
}

/**
 * Stop session replay recording
 */
export function stopSessionReplay(): void {
  if (!isInitialized) return;

  try {
    datadogRum.stopSessionReplayRecording();
    console.log('✅ Session replay stopped');
  } catch (error) {
    console.error('❌ Error stopping session replay:', error);
  }
}

// ============================================================================
// DEBUGGING
// ============================================================================

/**
 * Get Datadog initialization status
 */
export function getDatadogStatus(): {
  rumInitialized: boolean;
  hasUser: boolean;
  environment: string;
} {
  return {
    rumInitialized: isInitialized,
    hasUser: !!datadogRum.getUser?.(),
    environment: process.env.NODE_ENV || 'unknown',
  };
}

/**
 * Log Datadog status to console
 */
export function logDatadogStatus(): void {
  console.table(getDatadogStatus());
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { DatadogConfig, UserActionContext, ErrorContext };
