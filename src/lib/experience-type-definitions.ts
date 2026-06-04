import type { ExperienceMoodKey } from "@/i18n/types";

/** Canonical experience types — extend when you add new formats */
export const EXPERIENCE_TYPE_DEFINITIONS = [
  {
    slug: "wine-tasting",
    nameNl: "Wijnproeverij",
    nameEn: "Wine tasting",
    mood: "tastings" as ExperienceMoodKey,
    descriptionNl:
      "Eén restaurant, één tafel. Wijnproeverij met chef's specials en gezellig gezelschap.",
    descriptionEn:
      "One restaurant, one table. Wine tasting with chef's specials and good company.",
  },
  {
    slug: "wine-walk",
    nameNl: "Wijnwalk",
    nameEn: "Wine walk",
    mood: "wineWalk" as ExperienceMoodKey,
    descriptionNl:
      "Ontspannen wandeling langs restaurants en wijnbars met wijn, bites en nieuwe mensen.",
    descriptionEn:
      "A relaxed walk past restaurants and wine bars with wine, bites, and new people.",
  },
  {
    slug: "chefs-special",
    nameNl: "Chef's Special",
    nameEn: "Chef's Special",
    mood: "chefsSpecial" as ExperienceMoodKey,
    descriptionNl:
      "Avond aan tafel met een speciaal menu of meerdere gangen, samengesteld door de chef.",
    descriptionEn:
      "An evening at the table with a special menu or multiple courses from the chef.",
  },
] as const;

export type ExperienceTypeSlug =
  (typeof EXPERIENCE_TYPE_DEFINITIONS)[number]["slug"];

export const DEFAULT_EXPERIENCE_TYPE: ExperienceTypeSlug = "wine-tasting";

export function getExperienceTypeDefinition(slug: string) {
  return EXPERIENCE_TYPE_DEFINITIONS.find((t) => t.slug === slug);
}

export function isValidExperienceType(
  slug: string,
): slug is ExperienceTypeSlug {
  return EXPERIENCE_TYPE_DEFINITIONS.some((t) => t.slug === slug);
}
