/**
 * ============================================================================
 * 📊 PITCHCONNECT - Enterprise Logging with Datadog v7.10.1
 * Path: src/lib/api/middleware/logger.ts
 * ============================================================================
 * 
 * Production-ready logging with Datadog APM integration
 * Structured logging for observability
 * Request tracing and correlation IDs
 * 
 * ============================================================================
 */

// =============================================================================
// TYPES
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  sessionId?: string;
  
  // Request details
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  
  // User context
  userEmail?: string;
  userRoles?: string[];
  accountTier?: string;
  
  // Resource context
  resourceType?: string;
  resourceId?: string;
  clubId?: string;
  teamId?: string;
  
  // Error context
  error?: Error;
  errorCode?: string;
  errorStack?: string;
  
  // Custom fields
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  environment: string;
  version: string;
  context: LogContext;
  dd?: {
    trace_id?: string;
    span_id?: string;
  };
}

export interface DatadogConfig {
  apiKey?: string;
  appKey?: string;
  service: string;
  env: string;
  version: string;
  enabled: boolean;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SERVICE_NAME = 'pitchconnect-api';
const SERVICE_VERSION = '7.10.1';

const config: DatadogConfig = {
  apiKey: process.env.DD_API_KEY,
  appKey: process.env.DD_APP_KEY,
  service: process.env.DD_SERVICE || SERVICE_NAME,
  env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
  version: process.env.DD_VERSION || SERVICE_VERSION,
  enabled: process.env.DD_LOGS_ENABLED === 'true' || process.env.NODE_ENV === 'production',
};

// Log level priority
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

// Minimum log level from environment
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// =============================================================================
// SENSITIVE DATA MASKING
// =============================================================================

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'cvv',
];

/**
 * Mask sensitive data in objects
 */
function maskSensitiveData(obj: any, depth: number = 0): any {
  if (depth > 10) return obj;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Mask potential tokens/secrets in strings
    if (obj.length > 20 && /^[a-zA-Z0-9+/=_-]+$/.test(obj)) {
      return `${obj.substring(0, 8)}...MASKED`;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const masked: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()));
        
        if (isSensitive) {
          masked[key] = '***REDACTED***';
        } else {
          masked[key] = maskSensitiveData(obj[key], depth + 1);
        }
      }
    }
    return masked;
  }
  
  return obj;
}

// =============================================================================
// LOG FORMATTING
// =============================================================================

/**
 * Create structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: config.service,
    environment: config.env,
    version: config.version,
    context: maskSensitiveData(context),
  };
  
  // Add Datadog trace correlation if available
  if (typeof global !== 'undefined' && (global as any).dd_trace) {
    const tracer = (global as any).dd_trace;
    const span = tracer.scope().active();
    if (span) {
      entry.dd = {
        trace_id: span.context().toTraceId(),
        span_id: span.context().toSpanId(),
      };
    }
  }
  
  return entry;
}

/**
 * Format log for console output
 */
function formatConsoleLog(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m',   // Cyan
    info: '\x1b[32m',    // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    critical: '\x1b[35m', // Magenta
  };
  
  const reset = '\x1b[0m';
  const color = levelColors[entry.level];
  const levelStr = entry.level.toUpperCase().padEnd(8);
  
  let output = `${color}[${levelStr}]${reset} ${entry.timestamp} | ${entry.message}`;
  
  // Add request ID if present
  if (entry.context.requestId) {
    output += ` | reqId: ${entry.context.requestId}`;
  }
  
  // Add user ID if present
  if (entry.context.userId) {
    output += ` | userId: ${entry.context.userId}`;
  }
  
  // Add duration if present
  if (entry.context.duration !== undefined) {
    output += ` | ${entry.context.duration}ms`;
  }
  
  return output;
}

// =============================================================================
// DATADOG TRANSPORT
// =============================================================================

/**
 * Send log to Datadog
 */
async function sendToDatadog(entry: LogEntry): Promise<void> {
  if (!config.enabled || !config.apiKey) return;
  
  try {
    const response = await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': config.apiKey,
      },
      body: JSON.stringify([{
        ddsource: 'nodejs',
        ddtags: `env:${config.env},version:${config.version},service:${config.service}`,
        hostname: process.env.HOSTNAME || 'unknown',
        message: entry.message,
        status: entry.level,
        ...entry,
      }]),
    });
    
    if (!response.ok) {
      console.error('[Logger] Failed to send to Datadog:', response.status);
    }
  } catch (error) {
    // Silently fail - don't break app if logging fails
    console.error('[Logger] Datadog error:', error);
  }
}

// =============================================================================
// LOGGER IMPLEMENTATION
// =============================================================================

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Core log function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;
  
  const entry = createLogEntry(level, message, context);
  
  // Console output
  const consoleOutput = formatConsoleLog(entry);
  
  switch (level) {
    case 'debug':
      console.debug(consoleOutput, context ? entry.context : '');
      break;
    case 'info':
      console.info(consoleOutput, context ? entry.context : '');
      break;
    case 'warn':
      console.warn(consoleOutput, context ? entry.context : '');
      break;
    case 'error':
    case 'critical':
      console.error(consoleOutput, context ? entry.context : '');
      break;
  }
  
  // Send to Datadog asynchronously
  if (config.enabled) {
    sendToDatadog(entry).catch(() => {});
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

export const logger = {
  /**
   * Debug level log (development only)
   */
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },
  
  /**
   * Info level log
   */
  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },
  
  /**
   * Warning level log
   */
  warn(message: string, context?: LogContext): void {
    log('warn', message, context);
  },
  
  /**
   * Error level log
   */
  error(message: string, context?: LogContext): void {
    // Extract error stack if Error object provided
    if (context?.error instanceof Error) {
      context = {
        ...context,
        errorStack: context.error.stack,
        errorCode: (context.error as any).code,
      };
    }
    log('error', message, context);
  },
  
  /**
   * Critical level log (system-breaking issues)
   */
  critical(message: string, context?: LogContext): void {
    log('critical', message, context);
  },
  
  /**
   * Log API request
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : 
                            statusCode >= 400 ? 'warn' : 'info';
    
    log(level, `${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  },
  
  /**
   * Log authentication event
   */
  auth(
    event: 'login' | 'logout' | 'register' | 'password_reset' | '2fa_enabled' | '2fa_disabled',
    success: boolean,
    context?: Partial<LogContext>
  ): void {
    const level: LogLevel = success ? 'info' : 'warn';
    log(level, `Auth: ${event} ${success ? 'success' : 'failed'}`, {
      ...context,
      authEvent: event,
      authSuccess: success,
    });
  },
  
  /**
   * Log database operation
   */
  db(
    operation: string,
    table: string,
    duration: number,
    context?: Partial<LogContext>
  ): void {
    const level: LogLevel = duration > 1000 ? 'warn' : 'debug';
    log(level, `DB: ${operation} ${table}`, {
      ...context,
      dbOperation: operation,
      dbTable: table,
      duration,
    });
  },
  
  /**
   * Log external service call
   */
  external(
    service: string,
    operation: string,
    success: boolean,
    duration: number,
    context?: Partial<LogContext>
  ): void {
    const level: LogLevel = success ? 'info' : 'error';
    log(level, `External: ${service} ${operation}`, {
      ...context,
      externalService: service,
      externalOperation: operation,
      externalSuccess: success,
      duration,
    });
  },
  
  /**
   * Log business event
   */
  event(
    eventType: string,
    eventData: Record<string, any>,
    context?: Partial<LogContext>
  ): void {
    log('info', `Event: ${eventType}`, {
      ...context,
      eventType,
      eventData: maskSensitiveData(eventData),
    });
  },
  
  /**
   * Log performance metric
   */
  metric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    log('debug', `Metric: ${name}`, {
      metricName: name,
      metricValue: value,
      metricUnit: unit,
      metricTags: tags,
    });
  },
};

// =============================================================================
// REQUEST ID GENERATION
// =============================================================================

/**
 * Generate unique request ID
 */
export function createRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Extract request ID from headers or generate new one
 */
export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || 
         request.headers.get('x-correlation-id') || 
         createRequestId();
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  logger,
  createRequestId,
  getRequestId,
  maskSensitiveData,
  type LogLevel,
  type LogContext,
  type LogEntry,
};
