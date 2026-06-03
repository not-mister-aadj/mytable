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

export type EventExtras = {
  atmosphereTags?: string[];
  atmosphereTextNl?: string;
  atmosphereTextEn?: string;
  faqNl?: EventFaqItem[];
  faqEn?: EventFaqItem[];
  galleryImages?: string[];
};

export const emptyEventExtras = (): EventExtras => ({});

export function parseEventExtras(raw: unknown): EventExtras {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
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
    galleryImages: Array.isArray(o.galleryImages)
      ? o.galleryImages.filter((u): u is string => typeof u === "string")
      : undefined,
  };
}

export function serializeEventExtras(extras: EventExtras): string {
  return JSON.stringify(extras);
}
