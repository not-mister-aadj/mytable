import { captureCriticalError } from "@/lib/sentry/critical";

/** Logs and reports a membership error without leaking it to the client. */
export function captureClientSafeError(error: unknown, step: string, tags?: Record<string, string>): void {
  console.error(`[membership] ${step}`, error);
  captureCriticalError(error, { flow: "payment", step, tags });
}
