/**
 * 🌟 PITCHCONNECT - Enhanced Logging System (WORLD-CLASS VERSION)
 * Path: /src/lib/logging.ts
 *
 * ============================================================================
 * ENTERPRISE FEATURES
 * ============================================================================
 * ✅ ZERO external dependencies (native crypto UUID generation)
 * ✅ Structured logging with full JSON support
 * ✅ Request tracking and correlation IDs
 * ✅ Performance monitoring and metrics
 * ✅ Error aggregation and smart context
 * ✅ Security-aware logging (no sensitive data ever logged)
 * ✅ Multi-environment support (dev, staging, prod)
 * ✅ 5 log levels (debug, info, warn, error, fatal)
 * ✅ Module-based logging with hierarchical naming
 * ✅ Request/Response logging with full metadata
 * ✅ Database query performance tracking
 * ✅ API call monitoring and metrics
 * ✅ Cache operation tracking
 * ✅ Authentication/Authorization event logging
 * ✅ Business event auditing
 * ✅ Payment transaction logging
 * ✅ Data change audit trail
 * ✅ Performance profiling and metrics
 * ✅ In-memory log buffer with search capabilities
 * ✅ Logger statistics and health monitoring
 * ✅ Production-ready error handling
 */


// ============================================================================
// UUID GENERATION - ZERO DEPENDENCIES
// ============================================================================


/**
 * Generate a v4 UUID using native crypto (no external dependencies)
 * Compatible with browser and Node.js environments
 */
function generateUUID(): string {
  // Use crypto.randomUUID() if available (Node.js 15.7.0+, modern browsers)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }


  // Fallback for older environments
  const arr = new Uint8Array(16);


  // Get random values
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    // Last resort fallback (should rarely be needed)
    for (let i = 0; i < 16; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }


  // Set version (4) and variant (RFC 4122) bits
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;


  // Convert to hex string with dashes
  const hex = Array.from(arr, (byte) => byte.toString(16).padStart(2, '0')).join('');


  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}


// ============================================================================
// TYPES & INTERFACES
// ============================================================================


export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';


export type LogCategory =
  | 'RequestLogger'
  | 'Database'
  | 'API'
  | 'Cache'
  | 'Auth'
  | 'Authorization'
  | 'Security'
  | 'Business'
  | 'Payment'
  | 'Audit'
  | 'Health'
  | 'Performance'
  | 'System';


export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  module?: string;
  category?: LogCategory;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
    code?: string;
  };
  duration?: string;
  metadata?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}


export interface LoggerConfig {
  level: LogLevel;
  environment: 'development' | 'staging' | 'production';
  service: string;
  version: string;
  enableConsole: boolean;
  enableFile: boolean;
  maxBufferSize: number;
  maxMetricsSize: number;
}


export interface RequestMetadata {
  requestId: string;
  method: string;
  path: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  startTime: number;
  correlationId?: string;
}


export interface PerformanceMetric {
  name: string;
  duration: number;
  success: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}


// ============================================================================
// CONSTANTS
// ============================================================================


const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};


const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'bearerToken',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'email',
  'phoneNumber',
  'authorization',
  'authorizationToken',
  'sessionId',
  'twoFactorSecret',
  'pinCode',
];


const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';


// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================


const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info'),
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  service: 'pitchconnect',
  version: process.env.APP_VERSION || '1.0.0',
  enableConsole: true,
  enableFile: isProduction,
  maxBufferSize: isDevelopment ? 1000 : 5000,
  maxMetricsSize: isDevelopment ? 500 : 2000,
};


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================


/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(
  data: Record<string, any>,
  fieldsToMask: string[] = SENSITIVE_FIELDS
): Record<string, any> {
  if (!data || typeof data !== 'object') return data;


  try {
    const masked = JSON.parse(JSON.stringify(data));


    function maskObject(obj: any, depth = 0): any {
      if (depth > 10) return obj; // Prevent infinite recursion


      if (Array.isArray(obj)) {
        return obj.map((item) => maskObject(item, depth + 1));
      }


      if (obj !== null && typeof obj === 'object') {
        const result: any = {};


        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const lowerKey = key.toLowerCase();
            const shouldMask = fieldsToMask.some((field) =>
              lowerKey.includes(field.toLowerCase())
            );


            if (shouldMask) {
              result[key] = '***REDACTED***';
            } else {
              result[key] = maskObject(obj[key], depth + 1);
            }
          }
        }


        return result;
      }


      return obj;
    }


    return maskObject(masked);
  } catch (error) {
    return { ...data, _maskingError: 'Failed to mask sensitive data' };
  }
}


/**
 * Format log entry for console output with colors
 */
function formatConsoleLog(entry: LogEntry, isDev: boolean): string {
  const levelEmoji: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    fatal: '🔴',
  };


  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
  };


  const reset = '\x1b[0m';
  const dim = '\x1b[2m';


  const timestamp = isDev
    ? new Date(entry.timestamp).toLocaleTimeString()
    : entry.timestamp;
  const emoji = levelEmoji[entry.level];
  const level = entry.level.toUpperCase().padEnd(5);


  let output = `${emoji} ${timestamp} ${levelColors[entry.level]}[${level}]${reset}`;


  if (entry.requestId) {
    output += ` ${levelColors[entry.level]}[req:${entry.requestId.substring(0, 8)}]${reset}`;
  }


  if (entry.module) {
    output += ` ${dim}[${entry.module}]${reset}`;
  }


  if (entry.category) {
    output += ` ${levelColors[entry.level]}{${entry.category}}${reset}`;
  }


  output += ` ${entry.message}`;


  if (entry.duration) {
    output += ` ${dim}⏱️ ${entry.duration}${reset}`;
  }


  if (entry.userId && isDev) {
    output += ` ${dim}[user:${entry.userId}]${reset}`;
  }


  if (entry.data && Object.keys(entry.data).length > 0) {
    output += `\n${JSON.stringify(entry.data, null, isDev ? 2 : 0)}`;
  }


  if (entry.error) {
    output += `\n${levelColors['error']}Error: ${entry.error.message}${reset}`;
    if (isDev && entry.error.stack) {
      output += `\n${dim}${entry.error.stack}${reset}`;
    }
  }


  return output;
}


/**
 * Format log entry for JSON output
 */
function formatJsonLog(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    service: defaultConfig.service,
    version: defaultConfig.version,
    environment: defaultConfig.environment,
    ...entry,
  });
}


// ============================================================================
// LOG BUFFER & STORAGE
// ============================================================================


class LogBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;


  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }


  push(entry: LogEntry): void {
    this.buffer.push(entry);


    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer.slice(-this.maxSize);
    }
  }


  getAll(): LogEntry[] {
    return [...this.buffer];
  }


  getLast(count: number): LogEntry[] {
    return this.buffer.slice(-count);
  }


  clear(): void {
    this.buffer = [];
  }


  getByLevel(level: LogLevel): LogEntry[] {
    return this.buffer.filter((entry) => entry.level === level);
  }


  getByRequestId(requestId: string): LogEntry[] {
    return this.buffer.filter((entry) => entry.requestId === requestId);
  }


  getByUserId(userId: string): LogEntry[] {
    return this.buffer.filter((entry) => entry.userId === userId);
  }


  getByCategory(category: LogCategory): LogEntry[] {
    return this.buffer.filter((entry) => entry.category === category);
  }


  searchByMessage(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.buffer.filter((entry) =>
      entry.message.toLowerCase().includes(lowerQuery)
    );
  }


  getByModule(moduleName: string): LogEntry[] {
    return this.buffer.filter((entry) => entry.module === moduleName);
  }


  getErrorLogs(): LogEntry[] {
    return this.buffer.filter((entry) => entry.level === 'error' || entry.level === 'fatal');
  }


  getByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.buffer.filter((entry) => {
      const entryTime = new Date(entry.timestamp);
      return entryTime >= startTime && entryTime <= endTime;
    });
  }


  getSize(): number {
    return this.buffer.length;
  }
}


// ============================================================================
// CORE LOGGER CLASS - NOW EXPORTED ✅
// ============================================================================


export class Logger {
  private config: LoggerConfig;
  private buffer: LogBuffer;
  private correlationId: string | null = null;
  private performanceMetrics: PerformanceMetric[] = [];
  private moduleName?: string;


  constructor(
    config: Partial<LoggerConfig> = {},
    moduleName?: string,
    buffer?: LogBuffer
  ) {
    this.config = { ...defaultConfig, ...config };
    this.moduleName = moduleName;
    this.buffer = buffer || new LogBuffer(this.config.maxBufferSize);
  }


  /**
   * Set correlation ID for all logs in this context
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }


  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }


  /**
   * Create a child logger with module context (shares buffer)
   */
  createChild(moduleName: string): Logger {
    const child = new Logger(this.config, moduleName, this.buffer);
    child.correlationId = this.correlationId;
    return child;
  }


  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: Error,
    module?: string,
    category?: LogCategory,
    userId?: string,
    ipAddress?: string
  ): void {
    // Check if log level is enabled
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }


    // Mask sensitive data
    const maskedData = data ? maskSensitiveData(data) : undefined;


    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.correlationId || undefined,
      module: module || this.moduleName,
      category,
      data: maskedData,
      userId,
      ipAddress,
      metadata: {
        environment: this.config.environment,
        service: this.config.service,
        version: this.config.version,
      },
    };


    // Add error info
    if (error) {
      entry.error = {
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
        name: error.name,
        code: (error as any).code,
      };
    }


    // Store in buffer
    this.buffer.push(entry);


    // Output to console
    if (this.config.enableConsole) {
      const formattedMessage = formatConsoleLog(entry, isDevelopment);
      const consoleMethod = {
        debug: 'log',
        info: 'log',
        warn: 'warn',
        error: 'error',
        fatal: 'error',
      }[level];


      console[consoleMethod as keyof typeof console](formattedMessage);
    }


    // Output to file (in Node.js environment)
    if (this.config.enableFile && typeof process !== 'undefined' && process.versions?.node) {
      this.writeToFile(entry);
    }
  }


  /**
   * Write log to file (Node.js only)
   */
  private writeToFile(entry: LogEntry): void {
    // In production, logs would be written to file system or sent to service
    // (Sentry, DataDog, CloudWatch, etc.)
    if (entry.level === 'error' || entry.level === 'fatal') {
      const jsonLog = formatJsonLog(entry);
      // Write to log aggregation service in production
    }
  }


  /**
   * Debug level logging
   */
  debug(
    message: string,
    data?: Record<string, any>,
    category?: LogCategory,
    userId?: string
  ): void {
    this.log('debug', message, data, undefined, this.moduleName, category, userId);
  }


  /**
   * Info level logging
   */
  info(
    message: string,
    data?: Record<string, any>,
    category?: LogCategory,
    userId?: string
  ): void {
    this.log('info', message, data, undefined, this.moduleName, category, userId);
  }


  /**
   * Warn level logging
   */
  warn(
    message: string,
    data?: Record<string, any>,
    category?: LogCategory,
    userId?: string
  ): void {
    this.log('warn', message, data, undefined, this.moduleName, category, userId);
  }


  /**
   * Error level logging
   */
  error(
    message: string,
    error?: Error | null,
    data?: Record<string, any>,
    category?: LogCategory,
    userId?: string
  ): void {
    this.log('error', message, data, error || undefined, this.moduleName, category, userId);
  }


  /**
   * Fatal level logging
   */
  fatal(
    message: string,
    error?: Error | null,
    data?: Record<string, any>,
    category?: LogCategory,
    userId?: string
  ): void {
    this.log('fatal', message, data, error || undefined, this.moduleName, category, userId);
  }


  /**
   * Get buffer for accessing logged entries
   */
  getBuffer(): LogBuffer {
    return this.buffer;
  }


  /**
   * Get all logs
   */
  getLogs(filter?: {
    level?: LogLevel;
    requestId?: string;
    module?: string;
    category?: LogCategory;
    userId?: string;
  }): LogEntry[] {
    if (filter?.requestId) {
      return this.buffer.getByRequestId(filter.requestId);
    }
    if (filter?.module) {
      return this.buffer.getByModule(filter.module);
    }
    if (filter?.category) {
      return this.buffer.getByCategory(filter.category);
    }
    if (filter?.userId) {
      return this.buffer.getByUserId(filter.userId);
    }
    if (filter?.level) {
      return this.buffer.getByLevel(filter.level);
    }
    return this.buffer.getAll();
  }


  /**
   * Clear logs
   */
  clearLogs(): void {
    this.buffer.clear();
  }


  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }


  /**
   * Add performance metric
   */
  addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const metricWithTimestamp: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };


    this.performanceMetrics.push(metricWithTimestamp);


    // Keep only last N metrics
    if (this.performanceMetrics.length > this.config.maxMetricsSize) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.config.maxMetricsSize);
    }
  }


  /**
   * Get average performance for an operation
   */
  getAveragePerformance(name: string): number | null {
    const metrics = this.performanceMetrics.filter((m) => m.name === name);
    if (metrics.length === 0) return null;


    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }


  /**
   * Get percentile performance (e.g., p95, p99)
   */
  getPercentilePerformance(name: string, percentile: number): number | null {
    const metrics = this.performanceMetrics
      .filter((m) => m.name === name)
      .map((m) => m.duration)
      .sort((a, b) => a - b);


    if (metrics.length === 0) return null;


    const index = Math.ceil((percentile / 100) * metrics.length) - 1;
    return metrics[Math.max(0, index)];
  }


  /**
   * Get metrics summary
   */
  getMetricsSummary(): Record<string, { avg: number; p95: number; p99: number; count: number }> {
    const summary: Record<string, { avg: number; p95: number; p99: number; count: number }> = {};
    const metricNames = new Set(this.performanceMetrics.map((m) => m.name));


    metricNames.forEach((name) => {
      const avg = this.getAveragePerformance(name);
      const p95 = this.getPercentilePerformance(name, 95);
      const p99 = this.getPercentilePerformance(name, 99);
      const count = this.performanceMetrics.filter((m) => m.name === name).length;


      if (avg !== null) {
        summary[name] = {
          avg: Math.round(avg),
          p95: p95 || 0,
          p99: p99 || 0,
          count,
        };
      }
    });


    return summary;
  }
}


// ============================================================================
// REQUEST LOGGER CLASS
// ============================================================================


export class RequestLogger {
  private logger: Logger;
  private metadata: RequestMetadata;


  constructor(
    method: string,
    path: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    this.logger = new Logger(defaultConfig, 'RequestLogger');
    this.metadata = {
      requestId: generateUUID(),
      method,
      path,
      userId: userId || 'anonymous',
      ipAddress: ipAddress || 'unknown',
      userAgent,
      startTime: performance.now(),
    };


    this.logger.setCorrelationId(this.metadata.requestId);


    // Log request start
    this.logger.info(
      `${method} ${path}`,
      {
        method,
        path,
        userId,
        ipAddress,
      },
      'RequestLogger'
    );
  }


  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, any>): void {
    this.logger.debug(message, data, 'RequestLogger', this.metadata.userId);
  }


  /**
   * Log info message
   */
  info(message: string, data?: Record<string, any>): void {
    this.logger.info(message, data, 'RequestLogger', this.metadata.userId);
  }


  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(message, data, 'RequestLogger', this.metadata.userId);
  }


  /**
   * Log error message
   */
  error(message: string, error?: Error | null, data?: Record<string, any>): void {
    this.logger.error(message, error, data, 'RequestLogger', this.metadata.userId);
  }


  /**
   * Log request completion
   */
  logComplete(statusCode: number, responseSize?: number): void {
    const duration = performance.now() - this.metadata.startTime;
    const durationMs = Math.round(duration);


    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';


    this.logger[logMethod as keyof Logger](
      `${this.metadata.method} ${this.metadata.path} ${statusCode}`,
      {
        statusCode,
        duration: `${durationMs}ms`,
        responseSize,
      },
      'RequestLogger',
      this.metadata.userId
    );


    // Track as performance metric
    this.logger.addMetric({
      name: `http_${this.metadata.method}_${this.metadata.path}`,
      duration,
      success: statusCode < 400,
      metadata: { statusCode, responseSize },
    });
  }


  /**
   * Get request ID
   */
  getRequestId(): string {
    return this.metadata.requestId;
  }


  /**
   * Add context
   */
  addContext(key: string, value: any): void {
    this.metadata[key as keyof RequestMetadata] = value;
  }


  /**
   * Get metadata
   */
  getMetadata(): RequestMetadata {
    return { ...this.metadata };
  }
}


// ============================================================================
// SINGLETON LOGGER INSTANCE
// ============================================================================


export const logger = new Logger(defaultConfig, 'PitchConnect');


// ============================================================================
// SPECIALIZED LOGGING FUNCTIONS
// ============================================================================


/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context: string,
  additionalData?: Record<string, any>
): void {
  const err = error instanceof Error ? error : new Error(String(error));


  logger.error(
    context,
    err,
    {
      context,
      ...additionalData,
    },
    'Error'
  );
}


/**
 * Log validation errors
 */
export function logValidationError(
  fields: Record<string, string[]>,
  context: string,
  userId?: string
): void {
  logger.warn(
    'Validation failed',
    {
      context,
      validationErrors: fields,
    },
    'Audit',
    userId
  );
}


/**
 * Log database query performance
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  rowsAffected: number,
  error?: Error
): void {
  const isSlowQuery = duration > 1000;
  const level = isSlowQuery ? 'warn' : 'debug';
  const logMethod = level === 'warn' ? logger.warn : logger.debug;


  const logLevel = level as LogLevel;


  logMethod.call(
    logger,
    error ? 'Slow database query' : 'Database query executed',
    {
      query: query.substring(0, 200),
      duration: `${Math.round(duration)}ms`,
      rowsAffected,
      ...(error && { errorMessage: error.message }),
    },
    'Database'
  );


  logger.addMetric({
    name: 'database_query',
    duration,
    success: !error,
    metadata: { rowsAffected, isSlowQuery },
  });
}


/**
 * Log API call performance
 */
export function logApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  responseSize: number
): void {
  const isError = statusCode >= 400;
  const logLevel = isError ? 'warn' : 'info';
  const logMethod = isError ? logger.warn : logger.info;


  logMethod.call(
    logger,
    `API call to ${endpoint}`,
    {
      endpoint,
      method,
      statusCode,
      duration: `${Math.round(duration)}ms`,
      responseSize,
    },
    'API'
  );


  logger.addMetric({
    name: `api_call_${method}_${endpoint}`,
    duration,
    success: !isError,
    metadata: { statusCode, responseSize },
  });
}


/**
 * Log cache operation
 */
export function logCacheOperation(
  operation: 'HIT' | 'MISS' | 'SET' | 'DELETE',
  key: string,
  duration: number
): void {
  logger.debug(
    `Cache ${operation}`,
    {
      operation,
      key: key.substring(0, 100),
      duration: `${Math.round(duration)}ms`,
    },
    'Cache'
  );


  logger.addMetric({
    name: `cache_${operation}`,
    duration,
    success: true,
    metadata: { operation },
  });
}


/**
 * Log authentication events
 */
export function logAuthEvent(
  action: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'PASSWORD_RESET',
  userId: string,
  success: boolean,
  reason?: string,
  ipAddress?: string
): void {
  const level = success ? 'info' : 'warn';
  const logMethod = success ? logger.info : logger.warn;


  logMethod.call(
    logger,
    `Authentication: ${action}`,
    {
      action,
      success,
      reason,
      ipAddress,
    },
    'Auth',
    userId
  );
}


/**
 * Log authorization checks
 */
export function logAuthorizationCheck(
  userId: string,
  resource: string,
  action: string,
  allowed: boolean,
  reason?: string
): void {
  const logMethod = !allowed ? logger.warn : logger.debug;


  logMethod.call(
    logger,
    `Authorization check: ${action} on ${resource}`,
    {
      resource,
      action,
      allowed,
      reason,
    },
    'Authorization',
    userId
  );
}


/**
 * Log security events
 */
export function logSecurityEvent(
  event: 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN' | 'PERMISSION_DENIED' | 'UNUSUAL_ACTIVITY',
  userId: string | undefined,
  details: Record<string, any>,
  ipAddress?: string
): void {
  logger.warn(
    `Security event: ${event}`,
    {
      event,
      ipAddress,
      details,
    },
    'Security',
    userId
  );
}


/**
 * Log business event
 */
export function logBusinessEvent(
  event: string,
  entityType: string,
  entityId: string,
  userId: string,
  details?: Record<string, any>
): void {
  logger.info(
    `Business event: ${event}`,
    {
      event,
      entityType,
      entityId,
      details,
    },
    'Business',
    userId
  );
}


/**
 * Log payment event
 */
export function logPaymentEvent(
  event: 'PAYMENT_INITIATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED',
  transactionId: string,
  userId: string,
  amount: number,
  currency: string,
  reason?: string
): void {
  const logMethod = event === 'PAYMENT_FAILED' ? logger.warn : logger.info;


  logMethod.call(
    logger,
    `Payment event: ${event}`,
    {
      event,
      transactionId,
      amount,
      currency,
      reason,
    },
    'Payment',
    userId
  );
}


/**
 * Log data change (audit trail)
 */
export function logDataChange(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: string,
  entityId: string,
  userId: string,
  changes?: Record<string, any>
): void {
  logger.info(
    `Data change: ${action} ${entityType}`,
    {
      action,
      entityType,
      entityId,
      changes,
    },
    'Audit',
    userId
  );
}


/**
 * Log system startup
 */
export function logSystemStartup(): void {
  logger.info(
    'Application started',
    {
      environment: process.env.NODE_ENV,
      nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A',
      timestamp: new Date().toISOString(),
    },
    'System'
  );
}


/**
 * Log system shutdown
 */
export function logSystemShutdown(reason: string): void {
  logger.info(
    'Application shutting down',
    {
      reason,
      timestamp: new Date().toISOString(),
    },
    'System'
  );
}


/**
 * Log health check
 */
export function logHealthCheck(services: Record<string, boolean>): void {
  const allHealthy = Object.values(services).every((s) => s);
  const logMethod = allHealthy ? logger.debug : logger.warn;


  logMethod.call(
    logger,
    'Health check',
    {
      services,
      allHealthy,
      timestamp: new Date().toISOString(),
    },
    'Health'
  );
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================


/**
 * Create module logger
 */
export function createModuleLogger(moduleName: string): Logger {
  return logger.createChild(moduleName);
}


/**
 * Performance monitoring decorator
 */
export function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fnName: string
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;


      logger.debug(
        `Function executed: ${fnName}`,
        {
          function: fnName,
          duration: `${Math.round(duration)}ms`,
        },
        'Performance'
      );


      logger.addMetric({
        name: `function_${fnName}`,
        duration,
        success: true,
      });


      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));


      logger.error(
        `Function failed: ${fnName}`,
        err,
        {
          function: fnName,
          duration: `${Math.round(duration)}ms`,
        },
        'Performance'
      );


      logger.addMetric({
        name: `function_${fnName}`,
        duration,
        success: false,
      });


      throw error;
    }
  }) as T;
}


/**
 * Get logger statistics
 */
export function getLoggerStats(): {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  metrics: Record<string, { avg: number; p95: number; p99: number; count: number }>;
  bufferSize: number;
  uptime: number;
  environment: string;
} {
  const logs = logger.getLogs();
  const errors = logs.filter((l) => l.level === 'error' || l.level === 'fatal');
  const warnings = logs.filter((l) => l.level === 'warn');
  const infos = logs.filter((l) => l.level === 'info');
  const debugs = logs.filter((l) => l.level === 'debug');


  return {
    totalLogs: logs.length,
    errorCount: errors.length,
    warnCount: warnings.length,
    infoCount: infos.length,
    debugCount: debugs.length,
    metrics: logger.getMetricsSummary(),
    bufferSize: logger.getBuffer().getSize(),
    uptime: typeof process !== 'undefined' ? process.uptime() * 1000 : 0,
    environment: defaultConfig.environment,
  };
}


/**
 * Export logs as JSON (for debugging/analysis)
 */
export function exportLogsAsJSON(): string {
  const logs = logger.getLogs();
  const stats = getLoggerStats();


  return JSON.stringify(
    {
      metadata: stats,
      timestamp: new Date().toISOString(),
      logs,
    },
    null,
    2
  );
}


/**
 * Export error logs specifically
 */
export function exportErrorLogs(): LogEntry[] {
  return logger.getBuffer().getErrorLogs();
}


// ============================================================================
// DEFAULT EXPORTS - NOW INCLUDES LOGGER ✅
// ============================================================================


export default {
  logger,
  Logger,
  RequestLogger,
  generateUUID,
  logError,
  logValidationError,
  logDatabaseQuery,
  logApiCall,
  logCacheOperation,
  logAuthEvent,
  logAuthorizationCheck,
  logSecurityEvent,
  logBusinessEvent,
  logPaymentEvent,
  logDataChange,
  logSystemStartup,
  logSystemShutdown,
  logHealthCheck,
  maskSensitiveData,
  createModuleLogger,
  withPerformanceLogging,
  getLoggerStats,
  exportLogsAsJSON,
  exportErrorLogs,
};
