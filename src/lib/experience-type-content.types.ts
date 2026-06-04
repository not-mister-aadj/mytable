import type { EventFaqItem } from "@/lib/event-extras";
import { sanitizeAtmosphereTags } from "@/lib/event-extras";

export type TypeRoutePoint = { label: string; lat: number; lng: number };

export type ExperienceTypeContent = {
  atmosphereTextNl?: string;
  atmosphereTextEn?: string;
  faqNl?: EventFaqItem[];
  faqEn?: EventFaqItem[];
  galleryImages?: string[];
  routePoints?: TypeRoutePoint[];
  defaultAtmosphereTags?: string[];
};

export function parseTypeContent(raw: unknown): ExperienceTypeContent {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    atmosphereTextNl:
      typeof o.atmosphereTextNl === "string" ? o.atmosphereTextNl : undefined,
    atmosphereTextEn:
      typeof o.atmosphereTextEn === "string" ? o.atmosphereTextEn : undefined,
    faqNl: Array.isArray(o.faqNl) ? (o.faqNl as EventFaqItem[]) : undefined,
    faqEn: Array.isArray(o.faqEn) ? (o.faqEn as EventFaqItem[]) : undefined,
    galleryImages: Array.isArray(o.galleryImages)
      ? o.galleryImages.filter((u): u is string => typeof u === "string")
      : undefined,
    routePoints: Array.isArray(o.routePoints)
      ? o.routePoints
          .filter(
            (p): p is TypeRoutePoint =>
              typeof p === "object" &&
              p !== null &&
              typeof (p as TypeRoutePoint).label === "string" &&
              typeof (p as TypeRoutePoint).lat === "number" &&
              typeof (p as TypeRoutePoint).lng === "number",
          )
      : undefined,
    defaultAtmosphereTags: Array.isArray(o.defaultAtmosphereTags)
      ? sanitizeAtmosphereTags(
          o.defaultAtmosphereTags.filter((t): t is string => typeof t === "string"),
        )
      : undefined,
  };
}
