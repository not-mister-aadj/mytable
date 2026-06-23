import type { Locale } from "@/i18n/config";
import type {
  Dictionary,
  ExperienceItem,
  ExperienceMoodContent,
  ExperiencePageSectionLabels,
} from "@/i18n/types";
import type { ExperienceTypeSlug } from "@/lib/experience-type-definitions";
import { isValidExperienceType } from "@/lib/experience-type-definitions";
import { getVenueSectionLabels } from "@/lib/experience-template-defaults";
import type { EventExtras } from "@/lib/event-extras";
import { getMoodContent } from "@/lib/experience-detail";
import {
  getGirlsOnlyDefaultCardText,
  getGirlsOnlyDefaultTagline,
} from "@/lib/girls-only-experience-content";
import { resolveFemaleOnly } from "@/lib/event-extras";
import {
  getEventFormDefaults,
} from "@/lib/experience-template-defaults";
import {
  coerceImageSettings,
  createImageSettings,
  isUsableImageUrl,
} from "@/lib/image-settings";

export function resolvePageSections(
  typeSlug: string,
  locale: Locale,
  extras: EventExtras,
): ExperiencePageSectionLabels {
  const slug = isValidExperienceType(typeSlug) ? typeSlug : "wine-tasting";
  const defaults = getVenueSectionLabels(slug, locale);
  const o = extras.sectionOverrides;
  const lang = locale === "nl" ? "nl" : "en";
  return {
    venuesTitle: defaults.title,
    venuesSubtitle:
      (lang === "nl" ? o?.venuesIntroNl : o?.venuesIntroEn) ||
      defaults.subtitle,
  };
}

export function resolveMoodForEvent(
  dict: Dictionary,
  mood: ExperienceItem["mood"],
  extras: EventExtras,
  locale: Locale,
): ExperienceMoodContent {
  const base = getMoodContent(dict, mood);
  const lang = locale === "nl" ? "nl" : "en";
  const aboutOverride =
    lang === "nl"
      ? extras.sectionOverrides?.aboutNl ?? extras.atmosphereTextNl
      : extras.sectionOverrides?.aboutEn ?? extras.atmosphereTextEn;
  const faqOverride =
    lang === "nl"
      ? extras.sectionOverrides?.faqNl ?? extras.faqNl
      : extras.sectionOverrides?.faqEn ?? extras.faqEn;

  return {
    ...base,
    description: aboutOverride || base.description,
    faq: faqOverride?.length ? faqOverride : base.faq,
  };
}

export function resolveCardText(
  typeSlug: ExperienceTypeSlug,
  extras: EventExtras,
  locale: Locale,
  femaleOnly?: boolean,
): string {
  const slug = isValidExperienceType(typeSlug) ? typeSlug : "wine-tasting";
  const custom =
    locale === "nl" ? extras.cardTextNl : extras.cardTextEn;
  if (custom?.trim()) return custom.trim();
  if (
    resolveFemaleOnly(femaleOnly, extras.atmosphereTags) &&
    slug === "wine-tasting"
  ) {
    return getGirlsOnlyDefaultCardText(locale);
  }
  const defaults = getEventFormDefaults(slug);
  return locale === "nl" ? defaults.cardTextNl : defaults.cardTextEn;
}

export function displayNamesFromEvent(
  row: {
    nameNl: string;
    nameEn: string;
    taglineNl: string | null;
    taglineEn: string | null;
    categoryNl: string;
    categoryEn: string;
    imageUrl: string;
  },
  extras: EventExtras,
  locale: Locale,
  typeSlug: ExperienceTypeSlug,
  femaleOnly?: boolean,
) {
  const lang = locale === "nl" ? "nl" : "en";
  const isFemaleOnly = resolveFemaleOnly(femaleOnly, extras.atmosphereTags);
  const heroTitle =
    lang === "nl"
      ? extras.heroTitleNl || row.nameNl
      : extras.heroTitleEn || row.nameEn;
  const cardTitle =
    lang === "nl"
      ? extras.cardTitleNl || row.nameNl
      : extras.cardTitleEn || row.nameEn;
  const cardCategory =
    lang === "nl"
      ? extras.cardCategoryNl || row.categoryNl
      : extras.cardCategoryEn || row.categoryEn;
  const cardText = resolveCardText(typeSlug, extras, locale, isFemaleOnly);
  const rowTagline = lang === "nl" ? row.taglineNl : row.taglineEn;
  const tagline =
    rowTagline?.trim() ||
    (isFemaleOnly && typeSlug === "wine-tasting"
      ? getGirlsOnlyDefaultTagline(locale)
      : undefined);

  const cardSettings =
    extras.cardImage ??
    coerceImageSettings(extras.cardImageUrl, "agenda-card");

  return {
    experienceName: heroTitle,
    cardTitle,
    cardText,
    cardImage: cardSettings?.url,
    category: cardCategory,
    tagline,
  };
}

export function typeSlugFromEvent(
  experienceType: string | null | undefined,
): ExperienceTypeSlug {
  const slug = experienceType ?? "";
  return isValidExperienceType(slug) ? slug : "wine-tasting";
}

export function resolveHeroImageSettings(
  extras: EventExtras,
  imageUrl: string,
) {
  if (extras.heroImage) return extras.heroImage;
  if (extras.cardImage) {
    return createImageSettings(extras.cardImage.url, "hero", extras.cardImage);
  }
  if (isUsableImageUrl(imageUrl)) {
    return coerceImageSettings(imageUrl, "hero");
  }
  return undefined;
}
