/**
 * ============================================================================
 * 🏆 PITCHCONNECT - UNIFIED LOGGING MODULE v8.0.0
 * ============================================================================
 * Path: src/lib/logging/index.ts
 *
 * STANDARDIZED IMPORT PATH:
 * All modules should import from: `import { logger } from '@/lib/logging'`
 *
 * FEATURES:
 * ✅ Production-ready structured logging
 * ✅ Log levels: debug, info, warn, error, fatal
 * ✅ Context-aware logging with metadata
 * ✅ Request ID tracking
 * ✅ Performance timing utilities
 * ✅ Error serialization
 * ✅ Environment-aware output (JSON in prod, pretty in dev)
 * ✅ Child loggers for module-specific logging
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  /** Request ID for tracing */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Organisation ID */
  organisationId?: string;
  /** Team ID */
  teamId?: string;
  /** Module/service name */
  module?: string;
  /** HTTP method */
  method?: string;
  /** URL path */
  path?: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Additional metadata */
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  debug(context: LogContext, message: string): void;
  info(message: string, context?: LogContext): void;
  info(context: LogContext, message: string): void;
  warn(message: string, context?: LogContext): void;
  warn(context: LogContext, message: string): void;
  error(message: string, context?: LogContext): void;
  error(context: LogContext, message: string): void;
  fatal(message: string, context?: LogContext): void;
  fatal(context: LogContext, message: string): void;
  child(context: LogContext): Logger;
  time(label: string): void;
  timeEnd(label: string): number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENV === 'production';
const MIN_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (IS_PRODUCTION ? 'info' : 'debug');

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Serialize an error for logging
 */
function serializeError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (IS_PRODUCTION) {
    // JSON format for production (for log aggregators)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const level = entry.level.toUpperCase().padEnd(5);
  const levelColor = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
  }[entry.level];
  const reset = '\x1b[0m';

  let output = `${levelColor}[${timestamp}] ${level}${reset} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextStr = JSON.stringify(entry.context, null, 2)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    output += `\n${contextStr}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack) {
      output += `\n  ${entry.error.stack.split('\n').slice(1).join('\n  ')}`;
    }
  }

  return output;
}

/**
 * Output log entry
 */
function outputLog(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);

  switch (entry.level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
    case 'fatal':
      console.error(formatted);
      break;
  }
}

// ============================================================================
// LOGGER IMPLEMENTATION
// ============================================================================

class LoggerImpl implements Logger {
  private baseContext: LogContext;
  private timers: Map<string, number> = new Map();

  constructor(context: LogContext = {}) {
    this.baseContext = context;
  }

  private log(level: LogLevel, messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
    if (!shouldLog(level)) return;

    let message: string;
    let context: LogContext;

    // Support both (message, context) and (context, message) signatures
    if (typeof messageOrContext === 'string') {
      message = messageOrContext;
      context = { ...this.baseContext, ...(contextOrMessage as LogContext) };
    } else {
      message = contextOrMessage as string;
      context = { ...this.baseContext, ...messageOrContext };
    }

    // Extract error if present in context
    const error = context.error;
    delete context.error;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: Object.keys(context).length > 0 ? context : undefined,
      error: serializeError(error),
    };

    outputLog(entry);
  }

  debug(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
    this.log('debug', messageOrContext, contextOrMessage);
  }

  info(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
    this.log('info', messageOrContext, contextOrMessage);
  }

  warn(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
    this.log('warn', messageOrContext, contextOrMessage);
  }

  error(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
    this.log('error', messageOrContext, contextOrMessage);
  }

  fatal(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
    this.log('fatal', messageOrContext, contextOrMessage);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new LoggerImpl({ ...this.baseContext, ...context });
  }

  /**
   * Start a timer for performance measurement
   */
  time(label: string): void {
    this.timers.set(label, performance.now());
  }

  /**
   * End a timer and return the duration
   */
  timeEnd(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      this.warn(`Timer "${label}" does not exist`);
      return 0;
    }

    const duration = performance.now() - start;
    this.timers.delete(label);
    this.debug(`${label}: ${duration.toFixed(2)}ms`, { duration });
    return duration;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const logger: Logger = new LoggerImpl();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a module-specific logger
 *
 * @param module - Module name
 * @returns Logger instance with module context
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}

/**
 * Create a request-scoped logger
 *
 * @param requestId - Request ID
 * @param userId - Optional user ID
 * @returns Logger instance with request context
 */
export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.child({ requestId, userId });
}

/**
 * Wrap an async function with timing and error logging
 *
 * @param name - Operation name
 * @param fn - Async function to wrap
 * @param moduleLogger - Logger instance to use
 * @returns Wrapped function
 */
export function withLogging<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  moduleLogger: Logger = logger
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      moduleLogger.debug(`${name} started`);
      const result = await fn(...args);
      const duration = performance.now() - start;
      moduleLogger.info(`${name} completed`, { duration });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      moduleLogger.error(`${name} failed`, { duration, error });
      throw error;
    }
  }) as T;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default logger;