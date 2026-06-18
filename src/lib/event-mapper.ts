import type { Event, Venue } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { getExperienceSlug } from "@/data/experience-slugs";
import { deriveDisplayStatus, formatDateTime } from "@/lib/event-display";
import { parseEventExtras, resolveFemaleOnly } from "@/lib/event-extras";
import { mergeTypeContentIntoItem } from "@/lib/experience-type-content";
import type { ExperienceTypeContent } from "@/lib/experience-type-content.types";
import { getTypeContent } from "@/lib/experience-type-content";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import {
  displayNamesFromEvent,
  resolveHeroImageSettings,
  resolvePageSections,
  typeSlugFromEvent,
} from "@/lib/resolve-experience-content";
import { getExperienceTypeDefinition } from "@/lib/experience-type-definitions";
import {
  coerceImageSettings,
  DEFAULT_EVENT_IMAGE,
  isUsableImageUrl,
} from "@/lib/image-settings";
import { fetchVenuesByIds } from "@/lib/venues";
import { resolveEventImagesFromVenues } from "@/lib/venue-images";
import type { EnrichedExperience } from "./experience-detail";

export function mapDbEventToExperienceItem(
  row: Event,
  locale: Locale,
  venues: Venue[] = [],
): ExperienceItem {
  const extras = parseEventExtras(row.extras);
  const resolvedImages =
    venues.length > 0
      ? resolveEventImagesFromVenues(extras, venues)
      : resolveEventImagesFromVenues(extras, []);
  const typeSlug = typeSlugFromEvent(row.experienceType);
  const names = displayNamesFromEvent(row, extras, locale, typeSlug);
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

  const heroSettings =
    resolvedImages.heroImage ??
    resolveHeroImageSettings(extras, row.imageUrl);
  const cardSettings =
    resolvedImages.cardImage ??
    extras.cardImage ??
    coerceImageSettings(extras.cardImageUrl, "agenda-card");
  const gallerySettings = resolvedImages.galleryImageSettings;

  const heroUrl =
    heroSettings?.url ??
    (isUsableImageUrl(row.imageUrl) ? row.imageUrl : DEFAULT_EVENT_IMAGE);

  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    city: row.city,
    experienceName: names.experienceName,
    cardTitle: names.cardTitle,
    cardText: names.cardText,
    cardImage: cardSettings?.url,
    cardImageSettings: cardSettings,
    heroImageSettings: heroSettings,
    category: names.category,
    experienceType: typeSlug,
    pageSections: resolvePageSections(typeSlug, locale, extras),
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: Math.round(row.priceCents / 100),
    status: deriveDisplayStatus(
      row.capacity,
      row.spotsSold,
      row.publishedAt ? new Date(row.publishedAt) : null,
      startsAt,
    ),
    mood: (typeDef?.mood ?? row.mood) as ExperienceItem["mood"],
    image: heroUrl,
    femaleOnly: resolveFemaleOnly(row.femaleOnly, extras.atmosphereTags),
    tagline: names.tagline,
    capacity: row.capacity,
    spotsSold: row.spotsSold,
    eventDbId: row.id,
    atmosphereTags: extras.atmosphereTags,
    customDescription: customDescription || undefined,
    customFaq: customFaq?.length ? customFaq : undefined,
    galleryImages: gallerySettings?.map((g) => g.url),
    galleryImageSettings: gallerySettings,
  };
}

export function enrichDbEventWithContent(
  row: Event,
  locale: Locale,
  typeContent: ExperienceTypeContent,
  venues: Venue[] = [],
): EnrichedExperience {
  const item = mapDbEventToExperienceItem(row, locale, venues);
  const merged = mergeTypeContentIntoItem(item, typeContent, locale);
  return {
    ...merged,
    slug: merged.slug ?? getExperienceSlug(merged.id),
    experienceType: item.experienceType,
    pageSections: item.pageSections,
    cardTitle: item.cardTitle,
    cardText: item.cardText,
    cardImage: item.cardImage,
    cardImageSettings: item.cardImageSettings,
    heroImageSettings: item.heroImageSettings,
    galleryImageSettings: item.galleryImageSettings,
  };
}

export async function enrichDbEvent(
  row: Event,
  locale: Locale,
): Promise<EnrichedExperience> {
  const typeSlug = row.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
  const typeContent = await getTypeContent(typeSlug);
  const extras = parseEventExtras(row.extras);
  const venues =
    extras.venueIds && extras.venueIds.length > 0
      ? await fetchVenuesByIds(extras.venueIds)
      : [];
  return enrichDbEventWithContent(row, locale, typeContent, venues);
}
