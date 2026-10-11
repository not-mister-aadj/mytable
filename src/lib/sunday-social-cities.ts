import type { Locale } from "@/i18n/config";
import { sundayTableLocationPath } from "@/i18n/config";
import { SUNDAY_TABLE_LP_CITIES, sundayTableLpCityFromSlug } from "@/data/sunday-table-lp-cities";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";

// Client-safe: the cities a Sunday Social can be in and the URL of its date
// page. (The database side lives in sunday-social-tables.ts.)

/** Every city a Sunday Social can be in, with its URL slug (the quiz's
 * cities). The first four also have their own city page
 * (sunday-table-lp-cities). */
export const SUNDAY_SOCIAL_CITIES: ReadonlyArray<{ slug: string; name: string }> = [
  ...SUNDAY_TABLE_LP_CITIES,
  { slug: "amsterdam", name: "Amsterdam" },
];

export function sundaySocialCityFromSlug(slug: string): { slug: string; name: string } | null {
  return SUNDAY_SOCIAL_CITIES.find((c) => c.slug === slug) ?? null;
}

export function sundaySocialSlugFromCity(city: string): string | null {
  const key = city.trim().toLowerCase();
  return SUNDAY_SOCIAL_CITIES.find((c) => c.name.toLowerCase() === key)?.slug ?? null;
}

/** True when the city has its own /sunday-social/[city] page. */
export function hasSundaySocialCityPage(slug: string): boolean {
  return sundayTableLpCityFromSlug(slug) !== null;
}

/**
 * The date page of a Sunday Social (/sunday-social/{city}/{date}): the one
 * page for an afternoon, wherever the link comes from (agenda, "Kies je
 * zondag", a mail). Null for a city without Sunday Socials.
 */
export function sundaySocialDatePath(
  locale: Locale,
  event: { city: string; startsAt: string | Date },
): string | null {
  const slug = sundaySocialSlugFromCity(event.city);
  if (!slug) return null;
  return sundayTableLocationPath(locale, slug, amsterdamDateIso(new Date(event.startsAt)));
}
