import { inArray } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { girlsOnlySocialGalleryImages } from "@/data/girls-only-media";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { parseEventExtras } from "@/lib/event-extras";
import type { ImageSettings } from "@/lib/image-settings";
import { imageUrlKey } from "@/lib/image-url-key";
import { getVenueGallerySettings } from "@/lib/venue-images";
import { fetchVenuesByIds } from "@/lib/venues";

export type GirlsOnlyGalleryItem = {
  src: string;
  alt: string;
  settings?: ImageSettings;
};

const IMPRESSION_ALT = {
  nl: "Wijn en gerechten aan tafel tijdens een MyTable girls-only avond",
  en: "Wine and food at the table during a MyTable girls-only evening",
} as const;

function impressionAlt(locale: Locale): string {
  return locale === "en" ? IMPRESSION_ALT.en : IMPRESSION_ALT.nl;
}

function dedupeImageSettings(items: ImageSettings[]): ImageSettings[] {
  const seen = new Set<string>();
  const out: ImageSettings[] = [];
  for (const item of items) {
    if (!item.url) continue;
    const key = imageUrlKey(item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function collectEventImpressions(items: EnrichedExperience[]): ImageSettings[] {
  const all: ImageSettings[] = [];
  for (const item of items) {
    for (const settings of item.galleryImageSettings ?? []) {
      if (settings.url) all.push(settings);
    }
  }
  return dedupeImageSettings(all);
}

async function collectVenueImpressions(
  girlsOnlyEvents: EnrichedExperience[],
): Promise<ImageSettings[]> {
  if (!isDbConfigured()) return [];

  const eventDbIds = girlsOnlyEvents
    .map((item) => item.eventDbId)
    .filter((id): id is string => Boolean(id));
  if (eventDbIds.length === 0) return [];

  const db = getDb();
  const rows = await db
    .select({ extras: events.extras })
    .from(events)
    .where(inArray(events.id, eventDbIds));

  const venueIds = [
    ...new Set(
      rows.flatMap((row) => parseEventExtras(row.extras).venueIds ?? []),
    ),
  ];
  if (venueIds.length === 0) return [];

  const venues = await fetchVenuesByIds(venueIds);
  const gallery = venues.flatMap((venue) => getVenueGallerySettings(venue));
  return dedupeImageSettings(gallery);
}

function interleaveGallery(
  social: GirlsOnlyGalleryItem[],
  impressions: GirlsOnlyGalleryItem[],
  maxItems: number,
): GirlsOnlyGalleryItem[] {
  const out: GirlsOnlyGalleryItem[] = [];
  let socialIndex = 0;
  let impressionIndex = 0;

  while (
    out.length < maxItems &&
    (socialIndex < social.length || impressionIndex < impressions.length)
  ) {
    for (
      let n = 0;
      n < 2 && socialIndex < social.length && out.length < maxItems;
      n += 1
    ) {
      out.push(social[socialIndex]!);
      socialIndex += 1;
    }
    if (impressionIndex < impressions.length && out.length < maxItems) {
      out.push(impressions[impressionIndex]!);
      impressionIndex += 1;
    }
  }

  return out;
}

export async function buildGirlsOnlyGalleryImages(
  locale: Locale,
  girlsOnlyEvents: EnrichedExperience[],
  maxItems = 12,
): Promise<GirlsOnlyGalleryItem[]> {
  const lang = locale === "en" ? "en" : "nl";
  const social: GirlsOnlyGalleryItem[] = girlsOnlySocialGalleryImages.map(
    (image) => ({
      src: image.src,
      alt: image.alt[lang],
    }),
  );

  let impressionSettings = collectEventImpressions(girlsOnlyEvents);
  if (impressionSettings.length < 4) {
    const fromVenues = await collectVenueImpressions(girlsOnlyEvents);
    impressionSettings = dedupeImageSettings([
      ...impressionSettings,
      ...fromVenues,
    ]);
  }

  const impressions: GirlsOnlyGalleryItem[] = impressionSettings
    .slice(0, 6)
    .map((settings) => ({
      src: settings.url,
      alt: impressionAlt(locale),
      settings,
    }));

  if (impressions.length === 0) {
    return social.slice(0, maxItems);
  }

  return interleaveGallery(social, impressions, maxItems);
}
