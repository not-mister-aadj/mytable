/**
 * The reasons people can tap on the feedback page: what made it good, and
 * what could be better. Stored by key in booking_feedback.liked / disliked
 * (drizzle/0058), so labels can change without touching the data.
 */

export const LIKED_REASONS = [
  "people",
  "conversations",
  "meet_new",
  "venue",
  "wine",
  "something_new",
  "well_organised",
] as const;

export const DISLIKED_REASONS = [
  "no_click",
  "slow_conversations",
  "static",
  "venue",
  "wine",
  "too_busy",
  "price",
  "organisation",
] as const;

export type LikedReason = (typeof LIKED_REASONS)[number];
export type DislikedReason = (typeof DISLIKED_REASONS)[number];

export const LIKED_LABELS: Record<"nl" | "en", Record<LikedReason, string>> = {
  nl: {
    people: "De mensen aan tafel",
    conversations: "De gesprekken",
    meet_new: "Nieuwe mensen leren kennen",
    venue: "De locatie",
    wine: "De wijn",
    something_new: "Even iets anders op zondag",
    well_organised: "Alles was goed geregeld",
  },
  en: {
    people: "The people at the table",
    conversations: "The conversations",
    meet_new: "Meeting new people",
    venue: "The venue",
    wine: "The wine",
    something_new: "Something different on a Sunday",
    well_organised: "Everything was well arranged",
  },
};

export const DISLIKED_LABELS: Record<"nl" | "en", Record<DislikedReason, string>> = {
  nl: {
    no_click: "Het klikte niet aan tafel",
    slow_conversations: "De gesprekken kwamen moeilijk op gang",
    static: "Te weinig wisselen, het was statisch",
    venue: "De locatie",
    wine: "De wijn",
    too_busy: "Te druk of te rumoerig",
    price: "De prijs",
    organisation: "De organisatie",
  },
  en: {
    no_click: "It didn't click at the table",
    slow_conversations: "Conversations were slow to get going",
    static: "Too little moving around, it felt static",
    venue: "The venue",
    wine: "The wine",
    too_busy: "Too busy or too noisy",
    price: "The price",
    organisation: "The organisation",
  },
};

export const onlyKnown = <T extends string>(allowed: readonly T[], values: unknown): T[] =>
  Array.isArray(values) ? [...new Set(values.filter((v): v is T => allowed.includes(v as T)))] : [];

/** The same order for one person every time (no hydration mismatch), a
 * different order across people, so the first option isn't picked for
 * standing on top. */
export function orderFor<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** "Wat gaf je ongeveer uit?" on the feedback page: per person at the venue,
 * without the ticket. Ranges to tap, like a review on a map. */
export const SPEND_RANGES = ["0-20", "20-40", "40-60", "60-80", "80+"] as const;
export type SpendRange = (typeof SPEND_RANGES)[number];
export const SPEND_LABELS: Record<SpendRange, string> = {
  "0-20": "tot €20",
  "20-40": "€20-40",
  "40-60": "€40-60",
  "60-80": "€60-80",
  "80+": "€80+",
};
export const SPEND_LABELS_EN: Record<SpendRange, string> = { ...SPEND_LABELS, "0-20": "up to €20" };

export function isSpendRange(value: unknown): value is SpendRange {
  return typeof value === "string" && (SPEND_RANGES as readonly string[]).includes(value);
}
