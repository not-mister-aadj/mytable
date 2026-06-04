import type { ImageSettings } from "@/lib/image-settings";
import {
  coerceImageSettings,
  parseGalleryImages,
  parseImageSettings,
} from "@/lib/image-settings";

export const ATMOSPHERE_TAG_OPTIONS = [
  "Girls only",
  "Mixed group",
  "Relaxed",
  "Social",
  "Cozy",
  "Premium",
  "Newcomer friendly",
  "Active",
] as const;

export type AtmosphereTag = (typeof ATMOSPHERE_TAG_OPTIONS)[number];

export type EventFaqItem = { question: string; answer: string };

export type EventSectionOverrides = {
  venuesIntroNl?: string;
  venuesIntroEn?: string;
  aboutNl?: string;
  aboutEn?: string;
  faqNl?: EventFaqItem[];
  faqEn?: EventFaqItem[];
};

export type EventExtras = {
  atmosphereTags?: string[];
  atmosphereTextNl?: string;
  atmosphereTextEn?: string;
  faqNl?: EventFaqItem[];
  faqEn?: EventFaqItem[];
  /** @deprecated use galleryImageSettings */
  galleryImages?: string[];
  galleryImageSettings?: ImageSettings[];
  venueIds?: string[];
  cardTitleNl?: string;
  cardTitleEn?: string;
  cardCategoryNl?: string;
  cardCategoryEn?: string;
  cardTextNl?: string;
  cardTextEn?: string;
  /** @deprecated use cardImage */
  cardImageUrl?: string;
  cardImage?: ImageSettings;
  /** @deprecated url duplicated on events.imageUrl */
  heroImage?: ImageSettings;
  heroTitleNl?: string;
  heroTitleEn?: string;
  sectionOverrides?: EventSectionOverrides;
};

export const emptyEventExtras = (): EventExtras => ({});

export function parseEventExtras(raw: unknown): EventExtras {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const sectionRaw = o.sectionOverrides;
  let sectionOverrides: EventSectionOverrides | undefined;
  if (sectionRaw && typeof sectionRaw === "object") {
    const s = sectionRaw as Record<string, unknown>;
    sectionOverrides = {
      venuesIntroNl:
        typeof s.venuesIntroNl === "string" ? s.venuesIntroNl : undefined,
      venuesIntroEn:
        typeof s.venuesIntroEn === "string" ? s.venuesIntroEn : undefined,
      aboutNl: typeof s.aboutNl === "string" ? s.aboutNl : undefined,
      aboutEn: typeof s.aboutEn === "string" ? s.aboutEn : undefined,
      faqNl: Array.isArray(s.faqNl) ? (s.faqNl as EventFaqItem[]) : undefined,
      faqEn: Array.isArray(s.faqEn) ? (s.faqEn as EventFaqItem[]) : undefined,
    };
  }

  const cardImage =
    parseImageSettings(o.cardImage) ??
    coerceImageSettings(o.cardImageUrl, "agenda-card");

  const heroImage = parseImageSettings(o.heroImage);

  let galleryImageSettings = parseGalleryImages(o.galleryImageSettings);
  if (galleryImageSettings.length === 0 && Array.isArray(o.galleryImages)) {
    galleryImageSettings = parseGalleryImages(o.galleryImages);
  }

  return {
    atmosphereTags: Array.isArray(o.atmosphereTags)
      ? o.atmosphereTags.filter((t): t is string => typeof t === "string")
      : undefined,
    atmosphereTextNl:
      typeof o.atmosphereTextNl === "string" ? o.atmosphereTextNl : undefined,
    atmosphereTextEn:
      typeof o.atmosphereTextEn === "string" ? o.atmosphereTextEn : undefined,
    faqNl: Array.isArray(o.faqNl) ? (o.faqNl as EventFaqItem[]) : undefined,
    faqEn: Array.isArray(o.faqEn) ? (o.faqEn as EventFaqItem[]) : undefined,
    galleryImages: galleryImageSettings.map((g) => g.url),
    galleryImageSettings:
      galleryImageSettings.length > 0 ? galleryImageSettings : undefined,
    venueIds: Array.isArray(o.venueIds)
      ? o.venueIds.filter((id): id is string => typeof id === "string")
      : undefined,
    cardTitleNl:
      typeof o.cardTitleNl === "string" ? o.cardTitleNl : undefined,
    cardTitleEn:
      typeof o.cardTitleEn === "string" ? o.cardTitleEn : undefined,
    cardCategoryNl:
      typeof o.cardCategoryNl === "string" ? o.cardCategoryNl : undefined,
    cardCategoryEn:
      typeof o.cardCategoryEn === "string" ? o.cardCategoryEn : undefined,
    cardTextNl: typeof o.cardTextNl === "string" ? o.cardTextNl : undefined,
    cardTextEn: typeof o.cardTextEn === "string" ? o.cardTextEn : undefined,
    cardImageUrl:
      typeof o.cardImageUrl === "string" ? o.cardImageUrl : cardImage?.url,
    cardImage,
    heroImage,
    heroTitleNl:
      typeof o.heroTitleNl === "string" ? o.heroTitleNl : undefined,
    heroTitleEn:
      typeof o.heroTitleEn === "string" ? o.heroTitleEn : undefined,
    sectionOverrides,
  };
}

export function serializeEventExtras(extras: EventExtras): string {
  return JSON.stringify(extras);
}
