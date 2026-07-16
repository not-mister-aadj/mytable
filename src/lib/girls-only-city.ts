import type { Locale } from "@/i18n/config";
import type { GirlsOnlyCitySlug } from "@/data/girls-only-cities";
import { girlsOnlyCityPagesEn } from "@/i18n/girls-only-city-en";
import { girlsOnlyCityPagesNl } from "@/i18n/girls-only-city-nl";
import type { GirlsOnlyCityPageLabels } from "@/i18n/girls-only-city.types";
import type { ExperienceItem } from "@/i18n/types";
import {
  getGirlsOnlyWineEvents,
  getUpcomingGirlsOnlyEvents,
} from "@/lib/girls-only-landing";
import type { EnrichedExperience } from "@/lib/experience-detail";

export function getGirlsOnlyCityLabels(
  slug: GirlsOnlyCitySlug,
  locale: Locale,
): GirlsOnlyCityPageLabels {
  return locale === "en"
    ? girlsOnlyCityPagesEn[slug]
    : girlsOnlyCityPagesNl[slug];
}

export function filterGirlsOnlyEventsForCity(
  items: ExperienceItem[],
  locale: Locale,
  cityName: string,
): EnrichedExperience[] {
  const cityKey = cityName.trim().toLowerCase();
  return getGirlsOnlyWineEvents(items, locale).filter(
    (item) => item.city.trim().toLowerCase() === cityKey,
  );
}

export function getUpcomingGirlsOnlyCityEvents(
  items: ExperienceItem[],
  locale: Locale,
  cityName: string,
  limit = 6,
): EnrichedExperience[] {
  return getUpcomingGirlsOnlyEvents(
    filterGirlsOnlyEventsForCity(items, locale, cityName),
    locale,
    limit,
  );
}

export function cityHasBookableGirlsOnlyEvent(
  events: EnrichedExperience[],
): boolean {
  return events.some(
    (item) => item.status !== "soldOut" && item.status !== "closed",
  );
}
