import { eq } from "drizzle-orm";
import type { Event } from "@/db/schema";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { formatDateTime } from "@/lib/event-display";
import { reservationCode } from "@/lib/booking-display";
import { getMoodContent } from "@/lib/experience-detail";
import { mapDbEventToExperienceItem } from "@/lib/event-mapper";
import {
  getTypeContent,
  mergeTypeContentIntoItem,
} from "@/lib/experience-type-content";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { isUsableImageUrl } from "@/lib/image-settings";
import type { ImageSettings } from "@/lib/image-settings";
import { images } from "@/data/images";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

export type BookingGalleryItem = {
  url: string;
  settings?: ImageSettings;
};

export type BookingOutcomeSummary = {
  eventName: string;
  eventSlug: string;
  city: string;
  dateTime: string;
  imageUrl: string;
  heroImageSettings?: ImageSettings;
  galleryItems: BookingGalleryItem[];
  galleryFallbacks: string[];
  amountCents?: number;
  currency?: string;
  seats?: number;
  reservationCode?: string;
};

async function resolveEventGallery(
  row: Event,
  locale: Locale,
): Promise<{ items: BookingGalleryItem[]; fallbacks: string[] }> {
  const item = mapDbEventToExperienceItem(row, locale);
  const typeContent = await getTypeContent(
    row.experienceType ?? DEFAULT_EXPERIENCE_TYPE,
  );
  const merged = mergeTypeContentIntoItem(item, typeContent, locale);
  const dict = getDictionary(locale);
  const mood = getMoodContent(dict, item.mood);
  const moodUrls = mood.gallery.filter(isUsableImageUrl);

  const items: BookingGalleryItem[] = [];

  const settings = item.galleryImageSettings?.filter((s) =>
    isUsableImageUrl(s.url),
  );
  if (settings?.length) {
    for (const s of settings) {
      if (items.length >= 3) break;
      if (items.some((x) => x.url === s.url)) continue;
      items.push({ url: s.url, settings: s });
    }
  } else {
    const urls =
      merged.galleryImages?.filter(isUsableImageUrl) ?? moodUrls;
    for (const url of urls) {
      if (items.length >= 3) break;
      if (items.some((x) => x.url === url)) continue;
      items.push({ url });
    }
  }

  for (const url of moodUrls) {
    if (items.length >= 3) break;
    if (items.some((x) => x.url === url)) continue;
    items.push({ url });
  }

  const defaultFallbacks = [
    images.wineGlasses,
    images.restaurantDining,
    images.cheers,
  ];

  for (const url of defaultFallbacks) {
    if (items.length >= 3) break;
    if (items.some((x) => x.url === url)) continue;
    items.push({ url });
  }

  return {
    items: items.slice(0, 3),
    fallbacks: [...moodUrls, ...defaultFallbacks].filter(isUsableImageUrl),
  };
}

async function mapEventToSummary(
  row: Event,
  locale: Locale,
  booking?: {
    amountCents: number;
    currency: string;
    seats: number;
    id: string;
  },
): Promise<BookingOutcomeSummary> {
  const item = mapDbEventToExperienceItem(row, locale);
  const gallery = await resolveEventGallery(row, locale);

  return {
    eventName: locale === "nl" ? row.nameNl : row.nameEn,
    eventSlug: row.slug,
    city: row.city,
    dateTime: formatDateTime(
      new Date(row.startsAt),
      row.endsAt ? new Date(row.endsAt) : null,
      locale,
    ),
    imageUrl: item.image,
    heroImageSettings: item.heroImageSettings,
    galleryItems: gallery.items,
    galleryFallbacks: gallery.fallbacks,
    amountCents: booking?.amountCents,
    currency: booking?.currency,
    seats: booking?.seats,
    reservationCode: booking ? reservationCode(booking.id) : undefined,
  };
}

export async function getBookingSummaryFromSession(
  sessionId: string,
  locale: Locale,
): Promise<BookingOutcomeSummary | null> {
  if (!isDbConfigured() || !isStripeConfigured()) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return null;

  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) return null;

  return mapEventToSummary(row.event, locale, {
    amountCents: row.booking.amountCents,
    currency: row.booking.currency,
    seats: row.booking.seats,
    id: row.booking.id,
  });
}

export async function getEventSummaryBySlug(
  slug: string,
  locale: Locale,
): Promise<BookingOutcomeSummary | null> {
  if (!isDbConfigured()) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!row) return null;

  return mapEventToSummary(row, locale);
}
