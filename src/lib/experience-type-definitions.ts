import type { ExperienceMoodKey } from "@/i18n/types";

/** Canonical experience types — extend when you add new formats */
export const EXPERIENCE_TYPE_DEFINITIONS = [
  {
    slug: "wine-tasting",
    nameNl: "Wijnproeverij",
    nameEn: "Wine tasting",
    mood: "tastings" as ExperienceMoodKey,
    descriptionNl:
      "Vier wijnen en bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel.",
    descriptionEn:
      "Four wines and bite pairings, chosen by the wine bar. A fun afternoon at one table.",
  },
  {
    slug: "wine-walk",
    nameNl: "Wijnwalk",
    nameEn: "Wine walk",
    mood: "wineWalk" as ExperienceMoodKey,
    descriptionNl:
      "De stad ontdekken door meerdere locaties te proberen, elk met wijn en spijs.",
    descriptionEn:
      "Discover the city by trying several venues, each with wine and food.",
  },
  {
    slug: "chefs-special",
    nameNl: "Chef's Table",
    nameEn: "Chef's Table",
    mood: "chefsSpecial" as ExperienceMoodKey,
    descriptionNl:
      "Zondagavond family style: meerdere voorgerechten, hoofdgerechten en dessert, zodat je het beste van het restaurant proeft met je tafel.",
    descriptionEn:
      "Sunday evening family style: multiple starters, mains and dessert, so you taste the best of the restaurant with your table.",
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
