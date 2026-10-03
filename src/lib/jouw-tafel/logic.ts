// "Jouw tafel" landing page: pure, client-safe logic. Cities, the visitor's
// city from IP geo, and the upcoming table list. No db imports here; the
// server side lives in ./data.ts.

import { cityMatchKey } from "@/lib/waitlist-city";

export type QuizBracket = "20-39" | "35+";

/** The eight largest cities of the Netherlands. Smaller towns around them are
 * covered through NEARBY (Haarlem -> Amsterdam, Arnhem -> Nijmegen, ...). */
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
};

/** Small, explicit "within about 30 minutes" map. Read both ways. */
const NEARBY: Record<QuizCity, string[]> = {
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
  "Den Haag": ["Rotterdam", "Delft", "Leiden", "Zoetermeer", "Rijswijk", "Wassenaar"],
  Utrecht: ["Amersfoort", "Hilversum", "Nieuwegein", "Zeist", "Houten"],
  Amsterdam: ["Haarlem", "Amstelveen", "Zaandam", "Almere", "Hoofddorp", "Diemen"],
  Eindhoven: ["Den Bosch", "'s-Hertogenbosch", "Helmond", "Veldhoven"],
  Groningen: ["Assen", "Haren"],
  Breda: ["Tilburg", "Oosterhout", "Etten-Leur", "Roosendaal"],
  Nijmegen: ["Arnhem", "Wijchen", "Elst", "Den Bosch", "'s-Hertogenbosch"],
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
 * e.g. "The%20Hague"). One of our cities, or the nearest of them for a
 * town in the nearby map ("Delft" -> "Rotterdam"). Null when the header is
 * missing, from outside the Netherlands, or too far from any table.
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
  const direct = supportedCity(decoded);
  if (direct) return direct;
  for (const hub of nearbyCities(decoded)) {
    const city = supportedCity(hub);
    if (city) return city;
  }
  return null;
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
