/**
 * Top 20 largest municipalities in the Netherlands by population
 * (CBS, approx. 1 Jan 2025 order).
 * Used for waitlist / priority city pickers.
 */
export const TOP_NL_CITY_NAMES = [
  "Amsterdam",
  "Rotterdam",
  "Den Haag",
  "Utrecht",
  "Eindhoven",
  "Groningen",
  "Tilburg",
  "Almere",
  "Nijmegen",
  "Breda",
  "Arnhem",
  "Apeldoorn",
  "Enschede",
  "Haarlemmermeer",
  "Haarlem",
  "Amersfoort",
  "Zaanstad",
  "Den Bosch",
  "Zwolle",
  "Zoetermeer",
] as const;

export type TopNlCityName = (typeof TOP_NL_CITY_NAMES)[number];

export function listTopNlCityNames(): string[] {
  return [...TOP_NL_CITY_NAMES];
}
