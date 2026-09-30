// Waitlist answers shown and filtered on in the admin customer list. Client
// safe on purpose (no db imports): the list view uses the labels and the
// data function uses the picker.

export type CustomerWaitlistAnswers = {
  ageRange: string | null;
  gender: string | null;
  /** Table language from the waitlist questionnaire (dutch, english, both). */
  waitlistLanguage: string | null;
  ticketBudget: string | null;
};

export const WAITLIST_LANGUAGE_LABELS: Record<string, string> = {
  dutch: "Nederlands",
  english: "Engels",
  both: "Beide",
};

function firstString(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const first = value[0];
  return typeof first === "string" && first ? first : null;
}

function isNonEmpty(
  preferences: Record<string, unknown> | null | undefined,
): preferences is Record<string, unknown> {
  return (
    Boolean(preferences) &&
    typeof preferences === "object" &&
    Object.keys(preferences as object).length > 0
  );
}

/**
 * Picks the answers from the latest non-empty preferences. Pass the
 * preferences newest first (one entry per waitlist signup row).
 */
export function pickCustomerWaitlistAnswers(
  preferencesNewestFirst: (Record<string, unknown> | null | undefined)[],
): CustomerWaitlistAnswers {
  const prefs = preferencesNewestFirst.find(isNonEmpty);
  if (!prefs) {
    return {
      ageRange: null,
      gender: null,
      waitlistLanguage: null,
      ticketBudget: null,
    };
  }
  const priceRanges =
    prefs.priceRanges && typeof prefs.priceRanges === "object"
      ? (prefs.priceRanges as Record<string, unknown>)
      : {};
  return {
    ageRange: firstString(prefs.ageRange),
    gender: firstString(prefs.gender),
    waitlistLanguage: firstString(prefs.language),
    ticketBudget: firstString(priceRanges.ticket),
  };
}
