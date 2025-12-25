import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

/**
 * Logger Configuration
 * Uses Pino for high-performance logging
 * Integrates with Sentry for error tracking
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Pino Logger Configuration
 */
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Logger Interface
 */
export const logger = {
  /**
   * Debug level logging
   */
  debug: (message: string, meta?: Record<string, unknown>) => {
    pinoLogger.debug(meta, message);
  },

  /**
   * Info level logging
   */
  info: (message: string, meta?: Record<string, unknown>) => {
    pinoLogger.info(meta, message);
  },

  /**
   * Warning level logging
   */
  warn: (message: string, meta?: Record<string, unknown>) => {
    pinoLogger.warn(meta, message);
  },

  /**
   * Error level logging
   * Also sends to Sentry if configured
   */
  error: (message: string, meta?: Record<string, unknown>) => {
    pinoLogger.error(meta, message);

    // Send to Sentry in production
    if (!isDevelopment && process.env.SENTRY_DSN) {
      Sentry.captureException(new Error(message), {
        tags: {
          type: 'application_error',
        },
        extra: meta,
      });
    }
  },

  /**
   * Critical level logging
   * Always sends to Sentry
   */
  critical: (message: string, meta?: Record<string, unknown>) => {
    pinoLogger.error(meta, `[CRITICAL] ${message}`);

    // Always send critical errors to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(new Error(`[CRITICAL] ${message}`), {
        tags: {
          type: 'critical_error',
          severity: 'critical',
        },
        extra: meta,
      });
    }
  },
};

/**
 * HTTP Request Logging Middleware
 */
export function httpLogger(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  meta?: Record<string, unknown>
): void {
  const level = statusCode >= 400 ? 'warn' : 'info';
  const message = `${method} ${path} ${statusCode} ${duration}ms`;

  if (level === 'warn') {
    logger.warn(message, meta);
  } else {
    logger.info(message, meta);
  }
}

/**
 * Performance Logging Helper
 */
export function logPerformance(
  operation: string,
  duration: number,
  meta?: Record<string, unknown>
): void {
  const level = duration > 1000 ? 'warn' : 'debug';

  if (level === 'warn') {
    logger.warn(`${operation} took ${duration}ms`, meta);
  } else {
    logger.debug(`${operation} took ${duration}ms`, meta);
  }
}

/**
 * Error Logging Helper
 */
export function logError(
  context: string,
  error: Error | unknown,
  meta?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`${context}: ${errorMessage}`, {
    ...meta,
    errorStack,
  });
}
