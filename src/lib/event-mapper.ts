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

export function mapDbEventToExperienceItem(
  row: Event,
  locale: Locale,
): ExperienceItem {
  const lang = locale === "nl" ? "nl" : "en";
  const startsAt = new Date(row.startsAt);
  const endsAt = row.endsAt ? new Date(row.endsAt) : null;
  const extras = parseEventExtras(row.extras);
  const customDescription =
    lang === "nl" ? extras.atmosphereTextNl : extras.atmosphereTextEn;
  const customFaq = lang === "nl" ? extras.faqNl : extras.faqEn;
  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    city: row.city,
    experienceName: lang === "nl" ? row.nameNl : row.nameEn,
    category: lang === "nl" ? row.categoryNl : row.categoryEn,
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: Math.round(row.priceCents / 100),
    status: deriveDisplayStatus(
      row.capacity,
      row.spotsSold,
      row.publishedAt ? new Date(row.publishedAt) : null,
    ),
    mood: (row.mood as ExperienceItem["mood"]) || "tastings",
    image: row.imageUrl,
    femaleOnly: row.femaleOnly,
    tagline: lang === "nl" ? (row.taglineNl ?? undefined) : (row.taglineEn ?? undefined),
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
  };
}
