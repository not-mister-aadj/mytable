export type MetaTrackingContext = {
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

export function parseMetaTrackingContext(
  input: unknown,
): MetaTrackingContext {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  return {
    fbp: typeof raw.fbp === "string" ? raw.fbp : undefined,
    fbc: typeof raw.fbc === "string" ? raw.fbc : undefined,
    eventSourceUrl:
      typeof raw.eventSourceUrl === "string" ? raw.eventSourceUrl : undefined,
  };
}
