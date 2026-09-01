import {
  GIRLS_ONLY_CITY_SLUGS,
  GIRLS_ONLY_CITIES,
  girlsOnlyCityDisplayRegion,
  isGirlsOnlyCitySlug,
  type GirlsOnlyCitySlug,
} from "@/data/girls-only-cities";
import type { Locale } from "@/i18n/config";

/**
 * City targeting for the single-experience format pages (wine tasting, wine
 * walk, chef's special). Deliberately reuses the same 11-city list already
 * proven out on girls-only (Amsterdam, Rotterdam, Den Haag, Utrecht,
 * Eindhoven, Groningen, Almere, Tilburg, Breda, Nijmegen, Arnhem) rather than
 * maintaining a third parallel list. These are SEO/waitlist-capture targets,
 * not a claim that MyTable currently runs the format in every city listed.
 */
export type FormatLpCitySlug = GirlsOnlyCitySlug;

export const FORMAT_LP_CITY_SLUGS = GIRLS_ONLY_CITY_SLUGS;

export type FormatLpCity = {
  slug: FormatLpCitySlug;
  cityName: string;
  heroImage: string;
};

export function isFormatLpCitySlug(value: string): value is FormatLpCitySlug {
  return isGirlsOnlyCitySlug(value);
}

export function formatLpCityFromSlug(slug: string): FormatLpCity | null {
  if (!isFormatLpCitySlug(slug)) return null;
  const city = GIRLS_ONLY_CITIES[slug];
  return { slug: city.slug, cityName: city.cityName, heroImage: city.heroImage };
}

export function formatLpCityRegion(slug: FormatLpCitySlug, locale: Locale): string {
  return girlsOnlyCityDisplayRegion(GIRLS_ONLY_CITIES[slug], locale);
}

export function listFormatLpCities(): FormatLpCity[] {
  return FORMAT_LP_CITY_SLUGS.map((slug) => formatLpCityFromSlug(slug)!);
}
