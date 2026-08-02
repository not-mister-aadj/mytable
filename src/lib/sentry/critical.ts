import * as Sentry from "@sentry/nextjs";

export type CriticalFlow = "auth" | "payment";

type CriticalContext = {
  flow: CriticalFlow;
  /** Short machine name, e.g. stripe_webhook, member_login */
  step: string;
  /** Safe extra tags (no PII / secrets / card data) */
  tags?: Record<string, string | number | boolean | undefined | null>;
  extra?: Record<string, unknown>;
  level?: Sentry.SeverityLevel;
};

function applyScope(scope: Sentry.Scope, ctx: CriticalContext): void {
  scope.setTag("critical_flow", ctx.flow);
  scope.setTag("critical_step", ctx.step);
  // fatal → more likely to surface as high-priority in Sentry alerts
  scope.setLevel(ctx.level ?? "fatal");
  scope.setFingerprint(["critical", ctx.flow, ctx.step]);
  if (ctx.tags) {
    for (const [key, value] of Object.entries(ctx.tags)) {
      if (value === undefined || value === null) continue;
      scope.setTag(key, String(value));
    }
  }
  if (ctx.extra) {
    scope.setExtras(ctx.extra);
  }
}

/** Report a thrown/caught failure on login or payment paths. */
export function captureCriticalError(
  error: unknown,
  ctx: CriticalContext,
): string {
  return Sentry.withScope((scope) => {
    applyScope(scope, ctx);
    return Sentry.captureException(error);
  });
}

/** Report a business failure that is not a thrown Error (e.g. fulfill result). */
export function captureCriticalMessage(
  message: string,
  ctx: CriticalContext,
): string {
  const level = ctx.level ?? "fatal";
  return Sentry.withScope((scope) => {
    applyScope(scope, { ...ctx, level });
    return Sentry.captureMessage(message, level);
  });
}

/** Wrap a critical async path so failures are tagged and rethrown (or returned). */
export async function withCriticalSpan<T>(
  name: string,
  ctx: Omit<CriticalContext, "step"> & { step?: string },
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: ctx.flow === "payment" ? "payment" : "auth",
      attributes: {
        critical_flow: ctx.flow,
        critical_step: ctx.step ?? name,
      },
    },
    async () => {
      try {
        return await fn();
      } catch (error) {
        captureCriticalError(error, {
          flow: ctx.flow,
          step: ctx.step ?? name,
          tags: ctx.tags,
          extra: ctx.extra,
        });
        throw error;
      }
    },
  );
}
