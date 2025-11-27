// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

export function initSentryServer() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    beforeSend(event) {
      // Filter out 404 errors
      if (event.response?.status_code === 404) {
        return null;
      }
      return event;
    },
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Ignore test files
      /\.test\./,
    ],
  });
}
