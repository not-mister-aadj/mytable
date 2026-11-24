/**
 * "Kun je toch niet?" on the table page: what happened, as a choice. Ill is
 * its own route: once in 3 months is let go (missed-sundays/server.ts).
 */
export const CANCEL_REASONS = ["sick", "work", "private", "plans", "other"] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export function isCancelReason(v: unknown): v is CancelReason {
  return typeof v === "string" && (CANCEL_REASONS as readonly string[]).includes(v);
}

/** For our own mail and the customer page. */
export const CANCEL_REASON_NL: Record<CancelReason, string> = {
  sick: "Ziek",
  work: "Werk kwam ertussen",
  private: "Familie of privé",
  plans: "Iets anders gepland",
  other: "Anders",
};
