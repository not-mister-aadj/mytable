import { listGirlsOnlyCityNames } from "@/data/girls-only-cities";
import { ONBOARDING_CITIES } from "@/lib/member-onboarding";

/**
 * Every city we already spell ourselves somewhere in the product. Free-text
 * entries are snapped onto these so "Den bosch" and "DEN HAAG!" stop counting
 * as separate cities.
 */
export function knownCityNames(): string[] {
  return [...new Set([...ONBOARDING_CITIES, ...listGirlsOnlyCityNames()])];
}

/**
 * Comparison key: lowercase, accents folded, punctuation dropped, whitespace
 * collapsed. Only ever used for matching — never stored or shown.
 */
export function cityMatchKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Dutch city names keep these lowercase unless they open the name. */
const LOWERCASE_PARTICLES = new Set([
  "aan",
  "bij",
  "de",
  "den",
  "der",
  "en",
  "het",
  "in",
  "onder",
  "op",
  "over",
  "te",
  "ten",
  "ter",
  "tot",
  "uit",
  "van",
  "'t",
]);

function titleCaseWord(word: string, index: number): string {
  if (index > 0 && LOWERCASE_PARTICLES.has(word)) return word;
  // Capitalise after the start and after a hyphen, but never after an
  // apostrophe — Dutch writes 's-Hertogenbosch with a lowercase s.
  const cased = word.replace(/(^|-)([a-z])/g, (_, sep: string, letter: string) =>
    `${sep}${letter.toUpperCase()}`,
  );
  // IJ is one letter in Dutch: IJmuiden, IJsselstein.
  return cased.replace(/(^|-)Ij/g, (_, sep: string) => `${sep}IJ`);
}

/**
 * Turn a free-text city into one canonical spelling.
 *
 * A city we already know is replaced by our own spelling. Anything else keeps
 * its words but loses stray punctuation and double spaces, and is re-cased to
 * Dutch conventions: particles stay lowercase ("Alphen aan den Rijn"), IJ stays
 * a single capital letter ("IJmuiden"), and an opening apostrophe keeps its
 * lowercase letter ("'s-Hertogenbosch").
 *
 * Casing is always applied, including to mixed-case input: "Den bosch" was the
 * exact spelling that slipped through as a separate city, so trusting whatever
 * someone typed is what caused the problem in the first place.
 */
export function normalizeWaitlistCity(input: string): string {
  const stripped = input
    .replace(/\s+/g, " ")
    // "Alphen a/d Rijn" is the same place as "Alphen aan den Rijn".
    .replace(/\ba\/d\b/gi, "aan den")
    .replace(/^[^\p{L}\p{N}'’]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "")
    .trim();

  if (!stripped) return "";

  const key = cityMatchKey(stripped);
  if (!key) return "";

  const known = knownCityNames().find((city) => cityMatchKey(city) === key);
  if (known) return known;

  return stripped
    .toLowerCase()
    .split(" ")
    .map(titleCaseWord)
    .join(" ");
}

/**
 * Separators people actually use when they cram several cities into the one
 * free-text box. Deliberately not " en ": that would split Berg en Dal.
 */
export const CITY_SEPARATOR = /[,;+]/;

/**
 * Normalise a list of free-text cities: split entries that hold several cities,
 * clean each one up, and drop the ones that collapse onto each other — someone
 * who ticks Rotterdam and also types "rotterdam!" should land on the waitlist
 * once, and someone who types "Gouda, Woerden" should land on it twice.
 */
export function normalizeWaitlistCities(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.flatMap((entry) => entry.split(CITY_SEPARATOR))) {
    const city = normalizeWaitlistCity(value);
    if (!city) continue;
    const key = cityMatchKey(city);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(city);
  }
  return result;
}
