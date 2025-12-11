interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: any;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(`[INFO] ${message}`, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  },

  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  },

  error: (message: string, context?: LogContext) => {
    console.error(`[ERROR] ${message}`, {
      timestamp: new Date().toISOString(),
      ...context,
      stack: context?.error?.stack,
    });
  },

  debug: (message: string, context?: LogContext) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] ${message}`, {
        timestamp: new Date().toISOString(),
        ...context,
      });
    }
  },
};

export function createRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
