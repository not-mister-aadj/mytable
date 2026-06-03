import type { ExperienceMoodKey } from "@/i18n/types";

/** Canonical experience types — extend when you add new formats */
export const EXPERIENCE_TYPE_DEFINITIONS = [
  {
    slug: "wine-tasting",
    nameNl: "Wijnproeverij",
    nameEn: "Wine tasting",
    mood: "tastings" as ExperienceMoodKey,
    descriptionNl:
      "Eén restaurant, één tafel. Venues gelden voor elke wijnproeverij.",
  },
] as const;

export type ExperienceTypeSlug = (typeof EXPERIENCE_TYPE_DEFINITIONS)[number]["slug"];

export const DEFAULT_EXPERIENCE_TYPE: ExperienceTypeSlug = "wine-tasting";

export function getExperienceTypeDefinition(slug: string) {
  return EXPERIENCE_TYPE_DEFINITIONS.find((t) => t.slug === slug);
}

export function isValidExperienceType(slug: string): slug is ExperienceTypeSlug {
  return EXPERIENCE_TYPE_DEFINITIONS.some((t) => t.slug === slug);
}
