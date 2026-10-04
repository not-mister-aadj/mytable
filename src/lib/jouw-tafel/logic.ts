// "Jouw tafel" landing page: pure, client-safe logic. Cities, the visitor's
// city from IP geo, and the upcoming table list. No db imports here; the
// server side lives in ./data.ts.

import { cityMatchKey } from "@/lib/waitlist-city";

export type QuizBracket = "20-39" | "35+";

/** A sign-up count is only shown from this many people (landing proof line,
 * the quiz's city count). Below it there is no number at all. */
export const SIGNUP_COUNT_MIN = 100;

/** The eight largest cities of the Netherlands. Any other place is its own
 * place (a waitlist), never counted as one of these. */
export const QUIZ_CITIES = [
  "Rotterdam",
  "Den Haag",
  "Utrecht",
  "Amsterdam",
  "Eindhoven",
  "Groningen",
  "Breda",
  "Nijmegen",
] as const;
export type QuizCity = (typeof QUIZ_CITIES)[number];

/** One published, upcoming Sunday Table, as the client gets it. Never a
 * venue: the wine bar is booked once the tables are known. */
export type QuizEvent = {
  id: string;
  slug: string;
  city: string;
  bracket: QuizBracket;
  startsAt: string;
  priceCents: number;
  capacity: number;
  spotsSold: number;
  comingSoon: boolean;
  englishOpen: boolean;
  /** Members book first: everyone else from this moment (ISO), or null. */
  membersOnlyUntil?: string | null;
};

/** Centres of our cities (the woonplaats centroid from PDOK, see
 * nl-places.json; Den Haag is 's-Gravenhage). */
export const QUIZ_CITY_COORDS: Record<QuizCity, { lat: number; lon: number }> = {
  Rotterdam: { lat: 51.922, lon: 4.487 },
  "Den Haag": { lat: 52.072, lon: 4.293 },
  Utrecht: { lat: 52.089, lon: 5.095 },
  Amsterdam: { lat: 52.373, lon: 4.905 },
  Eindhoven: { lat: 51.45, lon: 5.459 },
  Groningen: { lat: 53.222, lon: 6.563 },
  Breda: { lat: 51.58, lon: 4.756 },
  Nijmegen: { lat: 51.835, lon: 5.833 },
};

/**
 * The price of one seat at a Sunday Table booked through the "Jouw tafel"
 * funnel (/jouw-tafel, the quiz and "Kies je zondag"): €15. It differs on
 * purpose from events.price_cents, which the rest of the site keeps using
 * (the /agenda cards, the older Sunday Table pages and their booking flow).
 * Founder's decision; booking the same table via /agenda at the event price
 * is accepted. The server only charges this when the checkout request says
 * it comes from the funnel (see resolveSeatPriceCents).
 */
export const JOUW_TAFEL_SEAT_PRICE_CENTS = 1500;

/** The checkout `source` the funnel sends with a reservation. */
export const JOUW_TAFEL_CHECKOUT_SOURCE = "jouw-tafel";

/**
 * The per-seat price /api/checkout charges: the funnel price for a Sunday
 * Table booked from the funnel, otherwise exactly the event's own price.
 * Decided on the server from the source; never a client-sent amount.
 */
export function resolveSeatPriceCents(input: {
  source: unknown;
  eventPriceCents: number;
  isSundayTable: boolean;
}): number {
  if (input.isSundayTable && input.source === JOUW_TAFEL_CHECKOUT_SOURCE) return JOUW_TAFEL_SEAT_PRICE_CENTS;
  return input.eventPriceCents;
}

/** Our cities within this many km of each other count as nearby. */
export const NEARBY_KM = 30;

/** Great-circle distance in km. */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Our other cities within NEARBY_KM of one of our cities, nearest first
 * (Rotterdam <-> Den Haag). Empty for anything that is not ours. */
export function nearbyCities(city: string): QuizCity[] {
  const own = supportedCity(city);
  if (!own) return [];
  const from = QUIZ_CITY_COORDS[own];
  return QUIZ_CITIES.filter((c) => c !== own)
    .map((c) => ({ c, km: haversineKm(from, QUIZ_CITY_COORDS[c]) }))
    .filter((x) => x.km <= NEARBY_KM)
    .sort((a, b) => a.km - b.km)
    .map((x) => x.c);
}

export function sameCity(a: string, b: string): boolean {
  return cityMatchKey(a) === cityMatchKey(b);
}

/** Other spellings of our cities, as Vercel or a visitor may send them. */
const CITY_ALIASES: Record<string, QuizCity> = {
  "the hague": "Den Haag",
  "s gravenhage": "Den Haag",
  gravenhage: "Den Haag",
  scheveningen: "Den Haag",
};

/** One of our cities for any spelling of it, else null. */
export function supportedCity(city: string): QuizCity | null {
  const key = cityMatchKey(city);
  if (!key) return null;
  const direct = QUIZ_CITIES.find((c) => cityMatchKey(c) === key);
  if (direct) return direct;
  return CITY_ALIASES[key] ?? null;
}

/**
 * The visitor's city from Vercel's `x-vercel-ip-city` header (URI-encoded,
 * e.g. "The%20Hague"), only when it is one of our cities (any spelling).
 * Null when the header is missing, from outside the Netherlands, or any
 * other place (a town near one of our cities too: no preselect).
 */
export function cityFromGeo(
  rawCity: string | null | undefined,
  country?: string | null,
): QuizCity | null {
  if (!rawCity) return null;
  if (country && country.toUpperCase() !== "NL") return null;
  let decoded = rawCity;
  try {
    decoded = decodeURIComponent(rawCity);
  } catch {
    // Malformed encoding: use the raw value.
  }
  return supportedCity(decoded);
}

/** "Den Haag" reads "The Hague" on the English page. */
export function displayCity(city: string, locale: "nl" | "en"): string {
  return locale === "en" && sameCity(city, "Den Haag") ? "The Hague" : city;
}

/** "Sunday Table · 35+" -> "35+". Same rule as agendaAgeBracket. */
export function bracketFromEventName(name: string): QuizBracket | null {
  const parts = name.split("·").map((part) => part.trim());
  const last = parts.length > 1 ? parts[parts.length - 1] : null;
  return last === "20-39" || last === "35+" ? last : null;
}

export function spotsLeft(event: QuizEvent): number {
  return Math.max(0, event.capacity - event.spotsSold);
}

function isUpcoming(event: QuizEvent, now: number): boolean {
  return new Date(event.startsAt).getTime() > now;
}

function byDate(a: QuizEvent, b: QuizEvent): number {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

/** Every upcoming table in one city, soonest first. A full table drops off
 * the list (there is nothing left to sign up for). */
export function cityTables(events: QuizEvent[], city: string, now: number = Date.now()): QuizEvent[] {
  return events
    .filter(
      (e) =>
        sameCity(e.city, city) &&
        isUpcoming(e, now) &&
        (e.comingSoon || spotsLeft(e) > 0),
    )
    .sort(byDate);
}

/**
 * Cities for the tabs: the visitor's own city first, then the others in our
 * usual order. The tab that opens is their city, or else the first city
 * that has a table.
 */
export function cityTabs(
  events: QuizEvent[],
  geoCity: QuizCity | null,
  now: number = Date.now(),
): { cities: QuizCity[]; initial: QuizCity } {
  // Only cities with tables (plus the visitor's own city, even when empty),
  // so eight cities never turn into a row of empty tabs.
  const withTables = QUIZ_CITIES.filter((c) => cityTables(events, c, now).length > 0);
  const others = withTables.filter((c) => c !== geoCity);
  const cities: QuizCity[] = geoCity
    ? [geoCity, ...others]
    : withTables.length > 0
      ? withTables
      : [QUIZ_CITIES[0]];
  const initial =
    geoCity ?? cities.find((c) => cityTables(events, c, now).length > 0) ?? cities[0]!;
  return { cities, initial };
}

/** Price of a seat at the soonest upcoming table, in cents. Null with no
 * tables, so the page never shows a price that is not in the database. */
export function seatPriceCents(events: QuizEvent[], now: number = Date.now()): number | null {
  return events.filter((e) => isUpcoming(e, now)).sort(byDate)[0]?.priceCents ?? null;
}
