import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  
  // Performance Monitoring: Sample 5% of transactions in production to drastically reduce main-thread tracing overhead
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.0,

  // Session Replay: Disable recording normal user sessions to eliminate heavy MutationObserver DOM serialization
  replaysSessionSampleRate: 0.0,

  // Only capture session replays on actual uncaught errors
  replaysOnErrorSampleRate: 0.1,

  debug: false,
});
