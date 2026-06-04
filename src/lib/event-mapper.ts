import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { deriveDisplayStatus, formatDateTime } from "@/lib/event-display";
import type { Event } from "@/db/schema";
import { getExperienceSlug } from "@/data/experience-slugs";
import type { EnrichedExperience } from "./experience-detail";
import { parseEventExtras } from "@/lib/event-extras";
import {
  getTypeContent,
  mergeTypeContentIntoItem,
} from "@/lib/experience-type-content";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import {
  displayNamesFromEvent,
  resolvePageSections,
  typeSlugFromEvent,
} from "@/lib/resolve-experience-content";
import { getExperienceTypeDefinition } from "@/lib/experience-type-definitions";

export function mapDbEventToExperienceItem(
  row: Event,
  locale: Locale,
): ExperienceItem {
  const extras = parseEventExtras(row.extras);
  const typeSlug = typeSlugFromEvent(row.experienceType);
  const names = displayNamesFromEvent(row, extras, locale);
  const lang = locale === "nl" ? "nl" : "en";
  const customDescription =
    lang === "nl"
      ? extras.sectionOverrides?.aboutNl ?? extras.atmosphereTextNl
      : extras.sectionOverrides?.aboutEn ?? extras.atmosphereTextEn;
  const customFaq =
    lang === "nl"
      ? extras.sectionOverrides?.faqNl ?? extras.faqNl
      : extras.sectionOverrides?.faqEn ?? extras.faqEn;
  const typeDef = getExperienceTypeDefinition(typeSlug);
  const startsAt = new Date(row.startsAt);
  const endsAt = row.endsAt ? new Date(row.endsAt) : null;

  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    city: row.city,
    experienceName: names.experienceName,
    cardTitle: names.cardTitle,
    cardText: names.cardText,
    cardImage: names.cardImage,
    category: names.category,
    experienceType: typeSlug,
    pageSections: resolvePageSections(typeSlug, locale, extras),
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: Math.round(row.priceCents / 100),
    status: deriveDisplayStatus(
      row.capacity,
      row.spotsSold,
      row.publishedAt ? new Date(row.publishedAt) : null,
    ),
    mood: (typeDef?.mood ?? row.mood) as ExperienceItem["mood"],
    image: row.imageUrl,
    femaleOnly: row.femaleOnly,
    tagline: names.tagline,
    capacity: row.capacity,
    spotsSold: row.spotsSold,
    eventDbId: row.id,
    atmosphereTags: extras.atmosphereTags,
    customDescription: customDescription || undefined,
    customFaq: customFaq?.length ? customFaq : undefined,
    galleryImages: extras.galleryImages?.length
      ? extras.galleryImages
      : undefined,
  };
}

export async function enrichDbEvent(
  row: Event,
  locale: Locale,
): Promise<EnrichedExperience> {
  const item = mapDbEventToExperienceItem(row, locale);
  const typeSlug = row.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
  const typeContent = await getTypeContent(typeSlug);
  const merged = mergeTypeContentIntoItem(item, typeContent, locale);
  return {
    ...merged,
    slug: merged.slug ?? getExperienceSlug(merged.id),
    experienceType: item.experienceType,
    pageSections: item.pageSections,
    cardTitle: item.cardTitle,
    cardText: item.cardText,
    cardImage: item.cardImage,
  };
}
