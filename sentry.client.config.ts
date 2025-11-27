// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

export function initSentryClient() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaySessionSampleRate: 0.1,
    replayOnErrorSampleRate: 1.0,
  });
}
