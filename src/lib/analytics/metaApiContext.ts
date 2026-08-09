export type MetaTrackingContext = {
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
  /** Captured at checkout so webhook Purchases keep EMQ without browser headers. */
  clientIpAddress?: string;
  clientUserAgent?: string;
};

function asNonEmptyString(value: unknown, maxLen = 2048): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

export function parseMetaTrackingContext(
  input: unknown,
): MetaTrackingContext {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  return {
    fbp: asNonEmptyString(raw.fbp, 512),
    fbc: asNonEmptyString(raw.fbc, 512),
    eventSourceUrl: asNonEmptyString(raw.eventSourceUrl, 2048),
    clientIpAddress: asNonEmptyString(raw.clientIpAddress, 64),
    clientUserAgent: asNonEmptyString(raw.clientUserAgent, 512),
  };
}

/** Persist click IDs on Stripe Checkout Session metadata for club Purchase CAPI. */
export function metaContextToStripeMetadata(
  context: MetaTrackingContext,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (context.fbp) out.mt_fbp = context.fbp.slice(0, 500);
  if (context.fbc) out.mt_fbc = context.fbc.slice(0, 500);
  return out;
}

export function metaContextFromStripeMetadata(
  metadata: Record<string, string> | null | undefined,
): MetaTrackingContext {
  if (!metadata) return {};
  return {
    fbp: asNonEmptyString(metadata.mt_fbp, 512),
    fbc: asNonEmptyString(metadata.mt_fbc, 512),
  };
}
