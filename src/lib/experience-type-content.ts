import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import type { RouteMapPoint } from "@/data/experience-route-map";
import { getRouteMapPoints } from "@/data/experience-route-map";
import type { ExperienceVenue } from "@/i18n/types";
import { cache } from "react";
import { getExperienceType } from "@/lib/experience-types";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import {
  parseTypeContent,
  type ExperienceTypeContent,
} from "@/lib/experience-type-content.types";

export type { ExperienceTypeContent, TypeRoutePoint } from "@/lib/experience-type-content.types";
export { parseTypeContent } from "@/lib/experience-type-content.types";

export const getTypeContent = cache(
  async (typeSlug: string): Promise<ExperienceTypeContent> => {
    const row = await getExperienceType(typeSlug);
    return parseTypeContent(row?.content ?? {});
  },
);

export function routePointsFromTypeContent(
  content: ExperienceTypeContent,
  city: string,
  venues: ExperienceVenue[],
  legacyExperienceId: string,
  venueCoords?: { label: string; lat: number; lng: number }[],
): RouteMapPoint[] {
  if (venueCoords?.length) {
    return venueCoords.map((p) => ({
      label: p.label,
      lat: p.lat,
      lng: p.lng,
    }));
  }
  if (content.routePoints?.length) {
    return content.routePoints.map((p) => ({
      label: p.label,
      lat: p.lat,
      lng: p.lng,
    }));
  }
  const names = venues.map((v) => v.name);
  if (names.length === 0) return [];
  return getRouteMapPoints(legacyExperienceId, city, names);
}

export function mergeTypeContentIntoItem(
  item: ExperienceItem,
  content: ExperienceTypeContent,
  locale: Locale,
): ExperienceItem {
  const lang = locale === "nl" ? "nl" : "en";
  const customDescription =
    lang === "nl" ? content.atmosphereTextNl : content.atmosphereTextEn;
  const customFaq = lang === "nl" ? content.faqNl : content.faqEn;

  return {
    ...item,
    atmosphereTags:
      item.atmosphereTags?.length
        ? item.atmosphereTags
        : content.defaultAtmosphereTags,
    customDescription: customDescription || item.customDescription,
    customFaq: customFaq?.length ? customFaq : item.customFaq,
    galleryImages: item.galleryImages?.length
      ? item.galleryImages
      : content.galleryImages,
  };
}

export async function resolveEventRoutePoints(
  typeSlug: string,
  city: string,
  venues: ExperienceVenue[],
  legacyExperienceId: string,
  venueCoords?: { label: string; lat: number; lng: number }[],
): Promise<RouteMapPoint[]> {
  const content = await getTypeContent(typeSlug ?? DEFAULT_EXPERIENCE_TYPE);
  return routePointsFromTypeContent(
    content,
    city,
    venues,
    legacyExperienceId,
    venueCoords,
  );
}
