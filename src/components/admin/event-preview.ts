import type { ExperienceItem, ExperienceMoodKey } from "@/i18n/types";
import { formatDateTime, deriveDisplayStatus } from "@/lib/event-display";
import {
  resolveFemaleOnly,
  type EventExtras,
} from "@/lib/event-extras";
import type { ExperienceTypeSlug } from "@/lib/experience-type-definitions";
import { getExperienceTypeDefinition } from "@/lib/experience-type-definitions";
import { getVenueSectionLabels } from "@/lib/experience-template-defaults";
import { experiencePageNl } from "@/i18n/experience-page-nl";
import { experiencePageEn } from "@/i18n/experience-page-en";
import {
  coerceImageSettings,
  DEFAULT_EVENT_IMAGE,
  isUsableImageUrl,
} from "@/lib/image-settings";
import { resolveHeroImageSettings } from "@/lib/resolve-experience-content";

export type PreviewEventData = {
  nameNl: string;
  nameEn: string;
  taglineNl: string;
  taglineEn: string;
  city: string;
  startsAt: string;
  endsAt: string;
  priceEuros: number;
  capacity: number;
  spotsSold?: number;
  imageUrl: string;
  categoryNl: string;
  categoryEn?: string;
  femaleOnly: boolean;
  experienceType: ExperienceTypeSlug;
  workflowStatus?: "draft" | "published" | "cancelled";
  extras: EventExtras;
  previewLocale?: "nl" | "en";
  /** Saved event — enables iframe preview with real viewport width */
  eventId?: string;
  /** Changes after save to refresh iframe */
  previewRevision?: number;
};

export function buildCardPreviewExperience(
  data: PreviewEventData,
): ExperienceItem {
  const locale = data.previewLocale ?? "nl";
  const extras = data.extras;
  const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  const capacity = data.capacity || 14;
  const spotsSold = data.spotsSold ?? 0;
  const typeDef = getExperienceTypeDefinition(data.experienceType);

  const cardTitle =
    locale === "nl"
      ? extras.cardTitleNl || data.nameNl
      : extras.cardTitleEn || data.nameEn || data.nameNl;
  const category =
    locale === "nl"
      ? extras.cardCategoryNl || data.categoryNl
      : extras.cardCategoryEn || data.categoryNl;
  const cardText =
    locale === "nl" ? extras.cardTextNl : extras.cardTextEn;

  const cardSettings =
    extras.cardImage ??
    coerceImageSettings(extras.cardImageUrl, "agenda-card");
  const cardUrl = cardSettings?.url;
  const isFemaleOnly = resolveFemaleOnly(
    data.femaleOnly,
    extras.atmosphereTags,
  );

  return {
    id: "preview",
    slug: "preview",
    city: data.city || "Stad",
    experienceName: cardTitle || "Tafel",
    cardTitle,
    cardText,
    category: category || "PROEVERIJ",
    experienceType: data.experienceType,
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: data.priceEuros || 0,
    status: deriveDisplayStatus(capacity, spotsSold, null),
    mood: (typeDef?.mood ?? "tastings") as ExperienceMoodKey,
    image: cardUrl ?? "",
    cardImage: cardUrl,
    cardImageSettings: cardSettings,
    femaleOnly: isFemaleOnly,
    capacity,
    spotsSold,
    tagline: locale === "nl" ? data.taglineNl : data.taglineEn || data.taglineNl,
    atmosphereTags: extras.atmosphereTags,
  };
}

export function buildDetailPreviewExperience(
  data: PreviewEventData,
): ExperienceItem {
  const locale = data.previewLocale ?? "nl";
  const extras = data.extras;
  const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  const capacity = data.capacity || 14;
  const spotsSold = data.spotsSold ?? 0;
  const typeDef = getExperienceTypeDefinition(data.experienceType);
  const moodKey = (typeDef?.mood ?? "tastings") as ExperienceMoodKey;
  const page = locale === "nl" ? experiencePageNl : experiencePageEn;
  const mood = page.moods[moodKey];
  const sections = getVenueSectionLabels(data.experienceType, locale);
  const aboutOverride =
    locale === "nl"
      ? extras.sectionOverrides?.aboutNl ?? extras.atmosphereTextNl
      : extras.sectionOverrides?.aboutEn ?? extras.atmosphereTextEn;

  const heroTitle =
    locale === "nl"
      ? extras.heroTitleNl || data.nameNl
      : extras.heroTitleEn || data.nameEn || data.nameNl;

  const heroSettings = resolveHeroImageSettings(extras, data.imageUrl);
  const heroUrl =
    heroSettings?.url ??
    (isUsableImageUrl(data.imageUrl) ? data.imageUrl : DEFAULT_EVENT_IMAGE);
  const isFemaleOnly = resolveFemaleOnly(
    data.femaleOnly,
    extras.atmosphereTags,
  );

  return {
    id: "preview",
    slug: "preview",
    city: data.city || "Stad",
    experienceName: heroTitle || "Tafel",
    category:
      locale === "nl"
        ? extras.cardCategoryNl || data.categoryNl
        : extras.cardCategoryEn || data.categoryNl,
    experienceType: data.experienceType,
    pageSections: {
      venuesTitle: sections.title,
      venuesSubtitle:
        (locale === "nl"
          ? extras.sectionOverrides?.venuesIntroNl
          : extras.sectionOverrides?.venuesIntroEn) || sections.subtitle,
    },
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: data.priceEuros || 0,
    status: deriveDisplayStatus(capacity, spotsSold, null),
    mood: moodKey,
    image: heroUrl,
    heroImageSettings: heroSettings,
    cardImageSettings: extras.cardImage,
    femaleOnly: isFemaleOnly,
    capacity,
    spotsSold,
    tagline: locale === "nl" ? data.taglineNl : data.taglineEn || data.taglineNl,
    atmosphereTags: extras.atmosphereTags,
    customDescription: aboutOverride || mood.description,
    customFaq: extras.sectionOverrides?.faqNl?.length
      ? locale === "nl"
        ? extras.sectionOverrides.faqNl
        : extras.sectionOverrides.faqEn
      : extras.faqNl,
    galleryImages: extras.galleryImageSettings?.map((g) => g.url),
    galleryImageSettings: extras.galleryImageSettings,
  };
}

/** @deprecated use buildCardPreviewExperience */
export function buildPreviewExperience(data: PreviewEventData): ExperienceItem {
  return buildCardPreviewExperience(data);
}
