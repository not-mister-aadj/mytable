import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { ExperienceItem } from "@/i18n/types";
import { enrichExperience, type EnrichedExperience } from "./experience-detail";

/** Canonical list: agenda is the single source of truth */
export function getAllExperiences(locale: Locale): EnrichedExperience[] {
  return getDictionary(locale).agenda.items.map(enrichExperience);
}

export function getExperienceBySlug(
  locale: Locale,
  slug: string,
): EnrichedExperience | undefined {
  return getAllExperiences(locale).find((item) => item.slug === slug);
}

export function getRelatedExperiences(
  locale: Locale,
  current: EnrichedExperience,
  limit = 3,
): EnrichedExperience[] {
  return getAllExperiences(locale)
    .filter((item) => item.slug !== current.slug)
    .filter(
      (item) =>
        item.mood === current.mood ||
        item.city === current.city ||
        item.category === current.category,
    )
    .slice(0, limit);
}

export function getAllExperienceSlugs(locale: Locale): string[] {
  return getAllExperiences(locale).map((item) => item.slug);
}
