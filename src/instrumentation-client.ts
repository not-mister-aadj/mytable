import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

/** In-app browsers (Instagram/Facebook/TikTok) inject native bridges that throw noise. */
const IN_APP_BROWSER_ERROR_PATTERNS = [
  /Java object is gone/i,
  /webkit\.messageHandlers/i,
  /Error invoking postMessage/i,
  /sendJsBlockingTimeMessage/i,
  /sendPageHideMessage/i,
  /navigation_performance_logger/i,
];

function isInAppBrowserNoise(event: Sentry.ErrorEvent): boolean {
  const values = event.exception?.values ?? [];
  for (const ex of values) {
    const message = `${ex.type ?? ""} ${ex.value ?? ""}`;
    if (IN_APP_BROWSER_ERROR_PATTERNS.some((re) => re.test(message))) {
      return true;
    }
    for (const frame of ex.stacktrace?.frames ?? []) {
      const hay = `${frame.filename ?? ""} ${frame.function ?? ""} ${frame.abs_path ?? ""}`;
      if (IN_APP_BROWSER_ERROR_PATTERNS.some((re) => re.test(hay))) {
        return true;
      }
    }
  }

  return false;
}

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV !== "development",

  // Omit dataCollection to keep SDK defaults (sendDefaultPii: false).
  // 10% in production (dev is disabled above)
  tracesSampleRate: 0.1,

  // Session Replay: 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  ignoreErrors: [
    "Error invoking postMessage: Java object is gone",
    /webkit\.messageHandlers/i,
    /Java object is gone/i,
  ],

  beforeSend(event) {
    if (isInAppBrowserNoise(event)) return null;
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
