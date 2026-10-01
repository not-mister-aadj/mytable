// "Jouw tafel" ad quiz: pure, client-safe logic. Picks the result table from
// the quiz answers and turns the live aggregates into copy that stays true.
// No db imports here; the server side lives in ./data.ts.

import { cityMatchKey } from "@/lib/waitlist-city";

export type QuizAgeRange = "18_24" | "25_34" | "35_44" | "45_plus";
export type QuizWhy =
  | "discover_places"
  | "just_fun"
  | "discover_wines"
  | "treat"
  | "new_city";
export type QuizCompany = "solo" | "together";
export type QuizLanguage = "dutch" | "english" | "both";
export type QuizBracket = "20-39" | "35+";

export const QUIZ_AGE_RANGES: QuizAgeRange[] = ["18_24", "25_34", "35_44", "45_plus"];
export const QUIZ_WHYS: QuizWhy[] = [
  "discover_places",
  "just_fun",
  "discover_wines",
  "treat",
  "new_city",
];
export const QUIZ_CITIES = ["Rotterdam", "Den Haag", "Utrecht", "Amsterdam"] as const;

/** Every screen, in order. `step_index` in PostHog is the position in this
 * list, so a step keeps the same index whether or not optional screens
 * (stop-alleen) were shown. */
export const QUIZ_STEP_IDS = [
  "intro",
  "stad",
  "leeftijd",
  "stop-stad",
  "zoekt",
  "stop-zoekt",
  "gezelschap",
  "stop-alleen",
  "taal",
  "gegevens",
  "zoeken",
  "resultaat",
] as const;
export type QuizStepId = (typeof QUIZ_STEP_IDS)[number];

export function isQuizStepId(value: string | null | undefined): value is QuizStepId {
  return Boolean(value) && (QUIZ_STEP_IDS as readonly string[]).includes(value!);
}

export function quizStepIndex(step: QuizStepId): number {
  return QUIZ_STEP_IDS.indexOf(step);
}

/** One published, upcoming Sunday Table, as the client gets it. */
export type QuizEvent = {
  id: string;
  slug: string;
  city: string;
  bracket: QuizBracket;
  startsAt: string;
  endsAt: string | null;
  priceCents: number;
  capacity: number;
  spotsSold: number;
  comingSoon: boolean;
  /** Venue from sunday_table_locations, null while it is "Locatie volgt". */
  venueName: string | null;
  /** Date page path parts, null when the date page would not exist. */
  citySlug: string | null;
  dateIso: string;
  englishOpen: boolean;
};

/** Live aggregates only: never a name, email or single row. */
export type QuizStats = {
  /** Distinct waitlist emails per city, keyed by cityMatchKey. */
  cityCounts: Record<string, number>;
  /** People on the list who answered "why", and how many picked each. */
  why: { base: number; counts: Record<QuizWhy, number> };
  /** Seats on paid, active Sunday Table bookings, and how many of those were
   * booked as a single seat. */
  seats: { total: number; single: number };
};

export type QuizData = { events: QuizEvent[]; stats: QuizStats };

/** Small, explicit "within about 30 minutes" map. Read both ways. */
const NEARBY: Record<string, string[]> = {
  Rotterdam: [
    "Den Haag",
    "Delft",
    "Schiedam",
    "Dordrecht",
    "Capelle aan den IJssel",
    "Vlaardingen",
    "Gouda",
    "Zoetermeer",
  ],
  "Den Haag": ["Rotterdam", "Delft", "Leiden", "Zoetermeer"],
  Utrecht: ["Amersfoort", "Hilversum", "Nieuwegein", "Zeist"],
  Amsterdam: ["Haarlem", "Amstelveen", "Zaandam"],
};

/** Cities within reach of `city`, nearest hub first. Case-insensitive. */
export function nearbyCities(city: string): string[] {
  const key = cityMatchKey(city);
  const out: string[] = [];
  for (const [hub, list] of Object.entries(NEARBY)) {
    if (cityMatchKey(hub) === key) out.push(...list);
    else if (list.some((c) => cityMatchKey(c) === key)) out.push(hub);
  }
  return [...new Set(out)].filter((c) => cityMatchKey(c) !== key);
}

export function sameCity(a: string, b: string): boolean {
  return cityMatchKey(a) === cityMatchKey(b);
}

export function bracketForAge(age: QuizAgeRange): QuizBracket {
  return age === "18_24" || age === "25_34" ? "20-39" : "35+";
}

/** "Sunday Table · 35+" -> "35+". Same rule as agendaAgeBracket. */
export function bracketFromEventName(name: string): QuizBracket | null {
  const parts = name.split("·").map((part) => part.trim());
  const last = parts.length > 1 ? parts[parts.length - 1] : null;
  return last === "20-39" || last === "35+" ? last : null;
}

export function seatsFor(company: QuizCompany): 1 | 2 {
  return company === "together" ? 2 : 1;
}

export function spotsLeft(event: QuizEvent): number {
  return Math.max(0, event.capacity - event.spotsSold);
}

function isOnSale(event: QuizEvent, seats: number, now: number): boolean {
  return (
    !event.comingSoon &&
    spotsLeft(event) >= seats &&
    new Date(event.startsAt).getTime() > now
  );
}

function isComingSoon(event: QuizEvent, now: number): boolean {
  return event.comingSoon && new Date(event.startsAt).getTime() > now;
}

function soonest(events: QuizEvent[]): QuizEvent | null {
  return (
    [...events].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )[0] ?? null
  );
}

export type QuizResult =
  | { variant: "A"; event: QuizEvent }
  | { variant: "B"; event: QuizEvent; nearby: QuizEvent | null }
  | { variant: "C+"; event: QuizEvent }
  | { variant: "C" };

/**
 * A: a table on sale in their own city. B: one coming soon there (with a
 * nearby table on sale as a side option). C+: none at home, but one on sale
 * close by. C: nothing yet. Only tables for their own age bracket count, so
 * nobody of 35 or older is ever offered a 20-39 table.
 */
export function pickQuizResult(
  events: QuizEvent[],
  input: { city: string; age: QuizAgeRange; company: QuizCompany },
  now: number = Date.now(),
): QuizResult {
  const bracket = bracketForAge(input.age);
  const seats = seatsFor(input.company);
  const matching = events.filter((e) => e.bracket === bracket);
  const home = matching.filter((e) => sameCity(e.city, input.city));
  const nearbyKeys = new Set(nearbyCities(input.city).map(cityMatchKey));
  const near = matching.filter((e) => nearbyKeys.has(cityMatchKey(e.city)));

  const homeOnSale = soonest(home.filter((e) => isOnSale(e, seats, now)));
  if (homeOnSale) return { variant: "A", event: homeOnSale };

  const nearOnSale = soonest(near.filter((e) => isOnSale(e, seats, now)));
  const homeSoon = soonest(home.filter((e) => isComingSoon(e, now)));
  if (homeSoon) return { variant: "B", event: homeSoon, nearby: nearOnSale };

  if (nearOnSale) return { variant: "C+", event: nearOnSale };
  return { variant: "C" };
}

/** Below this many people, a number would say more about chance than about
 * the list, so the copy drops it. */
export const MIN_STAT_BASE = 20;

/** 116 -> 110. Null under MIN_STAT_BASE. */
export function cityCountFloor(count: number): number | null {
  if (count < MIN_STAT_BASE) return null;
  return Math.floor(count / 10) * 10;
}

export function cityWaitlistCount(stats: QuizStats, city: string): number {
  return stats.cityCounts[cityMatchKey(city)] ?? 0;
}

/**
 * "X in 10" for a share, worded so it stays true: 61% is "6", 59% is
 * "nearly 6" (from 7 points past a ten up). Null when there is too little
 * data, or the share is under one in ten.
 */
export function outOfTen(
  part: number,
  base: number,
): { tens: number; nearly: boolean } | null {
  if (base < MIN_STAT_BASE || part <= 0) return null;
  const pct = (part / base) * 100;
  const tens = Math.floor(pct / 10);
  if (pct - tens * 10 >= 7 && tens < 9) return { tens: tens + 1, nearly: true };
  if (tens < 1) return null;
  return { tens, nearly: false };
}

/** Of the reasons they ticked, the one most people on the list share. */
export function mirroredWhy(stats: QuizStats, chosen: QuizWhy[]): QuizWhy | null {
  if (chosen.length === 0) return null;
  return [...chosen].sort(
    (a, b) => (stats.why.counts[b] ?? 0) - (stats.why.counts[a] ?? 0),
  )[0]!;
}

export type SoloStop =
  | { kind: "skip" }
  | { kind: "numeric"; tens: number }
  | { kind: "almostEveryone" }
  | { kind: "most" };

/**
 * The "you're not the only one coming alone" stop, from real bookings. A
 * number from 20 seats up; below that "almost everyone" only while at least
 * 75% came alone, "most people" while over half did, and no stop at all
 * otherwise (or with no bookings yet).
 */
export function soloStop(stats: QuizStats): SoloStop {
  const { total, single } = stats.seats;
  if (total <= 0) return { kind: "skip" };
  const share = single / total;
  if (share <= 0.5) return { kind: "skip" };
  if (total >= MIN_STAT_BASE) {
    return { kind: "numeric", tens: Math.floor(share * 10) };
  }
  return share >= 0.75 ? { kind: "almostEveryone" } : { kind: "most" };
}

/** Table language preference for /api/checkout. */
export function checkoutLanguage(
  language: QuizLanguage,
): "prefer_dutch" | "prefer_english" | "both_fine" {
  if (language === "dutch") return "prefer_dutch";
  if (language === "english") return "prefer_english";
  return "both_fine";
}

/** "Bar Juni Rotterdam" in Rotterdam -> "Bar Juni", so the line can read
 * "Bar Juni, Rotterdam" without the city twice. */
export function venueWithoutCity(venue: string, city: string): string {
  const trimmed = venue.trim();
  const suffix = ` ${city}`;
  return trimmed.toLowerCase().endsWith(suffix.toLowerCase())
    ? trimmed.slice(0, -suffix.length).trim()
    : trimmed;
}
