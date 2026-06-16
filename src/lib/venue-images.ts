import type { Venue } from "@/db/schema";
import type { EventExtras } from "@/lib/event-extras";
import { imageUrlKey } from "@/lib/image-url-key";
import type { ImageSettings } from "@/lib/image-settings";
import {
  coerceImageSettings,
  createImageSettings,
  parseGalleryImages,
  parseImageSettings,
} from "@/lib/image-settings";

/** Reference to an image stored on a venue (not copied to the event). */
export type VenueImageRef = {
  venueId: string;
  kind: "hero" | "gallery";
  /** Index in venue galleryMeta when kind is "gallery". */
  galleryIndex?: number;
};

export type VenueImageCatalogItem = {
  ref: VenueImageRef;
  settings: ImageSettings;
  venueName: string;
  label: string;
};

export function stripVenueImageRefs<T extends {
  venueCardRef?: VenueImageRef;
  venueHeroRef?: VenueImageRef;
  venueGalleryRefs?: VenueImageRef[];
}>(extras: T, venueId: string): T {
  const next = { ...extras };
  if (next.venueCardRef?.venueId === venueId) {
    delete next.venueCardRef;
  }
  if (next.venueHeroRef?.venueId === venueId) {
    delete next.venueHeroRef;
  }
  if (next.venueGalleryRefs?.length) {
    const filtered = next.venueGalleryRefs.filter((r) => r.venueId !== venueId);
    if (filtered.length > 0) {
      next.venueGalleryRefs = filtered;
    } else {
      delete next.venueGalleryRefs;
    }
  }
  return next;
}

export function eventExtrasReferenceVenue(
  extras: {
    venueIds?: string[];
    venueCardRef?: VenueImageRef;
    venueHeroRef?: VenueImageRef;
    venueGalleryRefs?: VenueImageRef[];
  },
  venueId: string,
): boolean {
  if (extras.venueIds?.includes(venueId)) return true;
  if (extras.venueCardRef?.venueId === venueId) return true;
  if (extras.venueHeroRef?.venueId === venueId) return true;
  return (extras.venueGalleryRefs ?? []).some((r) => r.venueId === venueId);
}

export function venueImageRefKey(ref: VenueImageRef): string {
  if (ref.kind === "hero") return `${ref.venueId}:hero`;
  return `${ref.venueId}:gallery:${ref.galleryIndex ?? 0}`;
}

export function parseVenueImageRef(raw: unknown): VenueImageRef | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.venueId !== "string" || !o.venueId) return undefined;
  if (o.kind !== "hero" && o.kind !== "gallery") return undefined;
  const ref: VenueImageRef = { venueId: o.venueId, kind: o.kind };
  if (o.kind === "gallery" && typeof o.galleryIndex === "number") {
    ref.galleryIndex = o.galleryIndex;
  }
  return ref;
}

export function parseVenueImageRefs(raw: unknown): VenueImageRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseVenueImageRef)
    .filter((r): r is VenueImageRef => r !== undefined);
}

export function getVenueHeroSettings(venue: Venue): ImageSettings | undefined {
  const fromMeta = parseImageSettings(venue.imageMeta);
  if (fromMeta?.url) return fromMeta;
  return coerceImageSettings(venue.imageUrl, "venue");
}

export function getVenueGallerySettings(venue: Venue): ImageSettings[] {
  return parseGalleryImages(venue.galleryMeta);
}

export function resolveVenueImageRef(
  ref: VenueImageRef,
  venue: Venue | undefined,
): ImageSettings | undefined {
  if (!venue) return undefined;
  if (ref.kind === "hero") {
    return getVenueHeroSettings(venue);
  }
  const gallery = getVenueGallerySettings(venue);
  const index = ref.galleryIndex ?? 0;
  return gallery[index];
}

export function buildVenueImageCatalog(
  venues: Venue[],
  venueIds: string[],
): VenueImageCatalogItem[] {
  const byId = new Map(venues.map((v) => [v.id, v]));
  const items: VenueImageCatalogItem[] = [];

  for (const venueId of venueIds) {
    const venue = byId.get(venueId);
    if (!venue) continue;

    const hero = getVenueHeroSettings(venue);
    if (hero?.url) {
      items.push({
        ref: { venueId, kind: "hero" },
        settings: hero,
        venueName: venue.name,
        label: "Hero",
      });
    }

    const gallery = getVenueGallerySettings(venue);
    gallery.forEach((settings, index) => {
      if (!settings.url) return;
      items.push({
        ref: { venueId, kind: "gallery", galleryIndex: index },
        settings,
        venueName: venue.name,
        label: `Galerij ${index + 1}`,
      });
    });
  }

  return items;
}

export type ResolvedEventImages = {
  cardImage?: ImageSettings;
  heroImage?: ImageSettings;
  galleryImageSettings?: ImageSettings[];
};

/** Resolve event image refs against venue library; falls back to legacy extras fields. */
export function resolveEventImagesFromVenues(
  extras: {
    venueCardRef?: VenueImageRef;
    venueHeroRef?: VenueImageRef;
    venueGalleryRefs?: VenueImageRef[];
    cardImage?: ImageSettings;
    cardImageUrl?: string;
    heroImage?: ImageSettings;
    galleryImageSettings?: ImageSettings[];
  },
  venues: Venue[],
): ResolvedEventImages {
  const byId = new Map(venues.map((v) => [v.id, v]));

  const resolveRef = (ref?: VenueImageRef) =>
    ref ? resolveVenueImageRef(ref, byId.get(ref.venueId)) : undefined;

  const cardFromRef = resolveRef(extras.venueCardRef);
  const heroFromRef = resolveRef(extras.venueHeroRef);
  const galleryFromRefs = (extras.venueGalleryRefs ?? [])
    .map((ref) => resolveRef(ref))
    .filter((s): s is ImageSettings => Boolean(s?.url));

  const cardImage =
    cardFromRef ??
    extras.cardImage ??
    coerceImageSettings(extras.cardImageUrl, "agenda-card");

  const heroImage =
    heroFromRef ??
    extras.heroImage ??
    (cardFromRef
      ? createImageSettings(cardFromRef.url, "hero", cardFromRef)
      : undefined);

  const galleryImageSettings =
    galleryFromRefs.length > 0
      ? galleryFromRefs
      : extras.galleryImageSettings;

  return {
    cardImage: cardImage?.url ? cardImage : undefined,
    heroImage: heroImage?.url ? heroImage : undefined,
    galleryImageSettings:
      galleryImageSettings && galleryImageSettings.length > 0
        ? galleryImageSettings
        : undefined,
  };
}

function galleryIndexByUrl(gallery: ImageSettings[]): Map<string, number> {
  const map = new Map<string, number>();
  gallery.forEach((item, index) => {
    if (item.url) map.set(imageUrlKey(item.url), index);
  });
  return map;
}

function remapVenueRefAfterGalleryChange(
  ref: VenueImageRef,
  venueId: string,
  oldGallery: ImageSettings[],
  newGallery: ImageSettings[],
): VenueImageRef | undefined {
  if (ref.venueId !== venueId) return ref;
  if (ref.kind === "hero") return ref;

  const index = ref.galleryIndex ?? 0;
  const oldUrl = oldGallery[index]?.url;
  if (!oldUrl) return undefined;

  const newIndex = galleryIndexByUrl(newGallery).get(imageUrlKey(oldUrl));
  if (newIndex === undefined) return undefined;

  return { venueId, kind: "gallery", galleryIndex: newIndex };
}

/** Keep event venue image refs valid after venue gallery images are removed or reordered. */
export function reconcileVenueImageRefsInExtras(
  extras: EventExtras,
  venueId: string,
  oldGallery: ImageSettings[],
  newGallery: ImageSettings[],
): EventExtras {
  const next: EventExtras = { ...extras };

  if (next.venueCardRef) {
    const remapped = remapVenueRefAfterGalleryChange(
      next.venueCardRef,
      venueId,
      oldGallery,
      newGallery,
    );
    if (remapped) next.venueCardRef = remapped;
    else delete next.venueCardRef;
  }

  if (next.venueHeroRef) {
    const remapped = remapVenueRefAfterGalleryChange(
      next.venueHeroRef,
      venueId,
      oldGallery,
      newGallery,
    );
    if (remapped) next.venueHeroRef = remapped;
    else delete next.venueHeroRef;
  }

  if (next.venueGalleryRefs?.length) {
    const remapped = next.venueGalleryRefs
      .map((ref) =>
        remapVenueRefAfterGalleryChange(ref, venueId, oldGallery, newGallery),
      )
      .filter((ref): ref is VenueImageRef => ref !== undefined);
    if (remapped.length > 0) next.venueGalleryRefs = remapped;
    else delete next.venueGalleryRefs;
  }

  return next;
}
