import type { ExperienceItem } from "@/i18n/types";
import { formatDateTime, deriveDisplayStatus } from "@/lib/event-mapper";
import type { EventExtras } from "@/lib/event-extras";

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
  femaleOnly: boolean;
  workflowStatus?: "draft" | "published" | "cancelled";
  extras: EventExtras;
  previewLocale?: "nl" | "en";
};

export function buildPreviewExperience(data: PreviewEventData): ExperienceItem {
  const locale = data.previewLocale ?? "nl";
  const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  const capacity = data.capacity || 14;
  const spotsSold = data.spotsSold ?? 0;

  return {
    id: "preview",
    slug: "preview",
    city: data.city || "Stad",
    experienceName: locale === "nl" ? data.nameNl : data.nameEn || data.nameNl,
    category: data.categoryNl || "PROEVERIJ",
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: data.priceEuros || 0,
    status: deriveDisplayStatus(capacity, spotsSold, null),
    mood: "tastings",
    image: data.imageUrl || "/images/wine-bar.jpg",
    femaleOnly: data.femaleOnly,
    capacity,
    spotsSold,
    tagline: locale === "nl" ? data.taglineNl : data.taglineEn || data.taglineNl,
    atmosphereTags: data.extras.atmosphereTags,
    customDescription:
      locale === "nl"
        ? data.extras.atmosphereTextNl
        : data.extras.atmosphereTextEn,
    galleryImages: data.extras.galleryImages,
  };
}
