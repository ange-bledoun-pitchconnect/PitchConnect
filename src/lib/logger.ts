/**
 * Structured logging utility
 * Production-ready logger with environment-aware output
 */

export const logger = {
  info: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    } else {
      // In production, you might want to send to a logging service
      console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() }));
    }
  },

  warn: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    } else {
      console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() }));
    }
  },

  error: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    } else {
      console.error(JSON.stringify({ level: 'error', message, ...data, timestamp: new Date().toISOString() }));
    }
  },
};
