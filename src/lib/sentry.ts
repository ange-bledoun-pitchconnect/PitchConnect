// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    debug: process.env.NODE_ENV === 'development',
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: { additional: context },
  });
}
