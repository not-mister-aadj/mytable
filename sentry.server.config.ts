import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV !== "development",

  tracesSampleRate: 0.1,

  // Off: capturing local variables pauses the server process in the debugger
  // on every thrown error, and on the admin guests page that pause never ended
  // (the function hung mid-query until Vercel killed it after 300 seconds).
  includeLocalVariables: false,

  enableLogs: true,

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // HEAD requests come from link checkers (mail scanners such as Outlook
  // Safe Links, link previews), not from visitors. A slow database moment
  // during such a check is not worth an alert.
  beforeSend(event) {
    if (event.request?.method?.toUpperCase() === "HEAD") return null;
    return event;
  },
});
