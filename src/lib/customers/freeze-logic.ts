// An account "op slot": pure, unit tested (npx tsx --test src/lib/customers/*.test.ts).

/** The customer tag for an account on hold. Set when a payment is disputed
 * (or by an admin); only an admin lifts it. Like CAMPAIGN_UNSUBSCRIBED_TAG,
 * it lives in customers.tags, so it needs no column of its own. */
export const FROZEN_TAG = "op_slot";

export function isFrozenTag(tag: unknown): boolean {
  return typeof tag === "string" && tag.trim().toLowerCase() === FROZEN_TAG;
}

export function hasFrozenTag(tags: unknown): boolean {
  return Array.isArray(tags) && tags.some(isFrozenTag);
}

/** The tags with the account put on hold (on) or released (off). */
export function withFrozenTag(tags: readonly unknown[] | null | undefined, on: boolean): string[] {
  const others = (tags ?? []).filter((t): t is string => typeof t === "string" && !isFrozenTag(t));
  return on ? [...others, FROZEN_TAG] : others;
}

/** What someone on hold sees where they would book or buy. */
export function frozenMessage(locale: "nl" | "en"): string {
  return locale === "en"
    ? "Your account is temporarily on hold. Email us at info@mytable.club and we'll sort it out together."
    : "Je account staat tijdelijk op slot. Mail ons op info@mytable.club, dan zoeken we het samen uit.";
}

/** The error code the booking and membership APIs answer with. */
export const FROZEN_ERROR_CODE = "account_frozen";
