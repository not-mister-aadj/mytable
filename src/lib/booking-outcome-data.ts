import { eq } from "drizzle-orm";
import type { Event } from "@/db/schema";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { formatDateTime } from "@/lib/event-display";
import { reservationCode } from "@/lib/booking-display";
import { getMoodContent } from "@/lib/experience-detail";
import { enrichDbEvent } from "@/lib/event-mapper";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import {
  isCheckoutPaymentSettled,
} from "@/lib/stripe/checkout-session";
import { isUsableImageUrl } from "@/lib/image-settings";
import { imageUrlKey } from "@/lib/image-url-key";
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
  eventId?: string;
  experienceType?: string;
  bookingId?: string;
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
  const item = await enrichDbEvent(row, locale);
  const dict = getDictionary(locale);
  const mood = getMoodContent(dict, item.mood);
  const moodUrls = mood.gallery.filter(isUsableImageUrl);

  const items: BookingGalleryItem[] = [];
  const usedKeys = new Set<string>();

  function pushItem(entry: BookingGalleryItem): void {
    if (items.length >= 3) return;
    const key = imageUrlKey(entry.url);
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    items.push(entry);
  }

  const settings = item.galleryImageSettings?.filter((s) =>
    isUsableImageUrl(s.url),
  );
  if (settings?.length) {
    for (const s of settings) {
      pushItem({ url: s.url, settings: s });
    }
  } else {
    const urls = item.galleryImages?.filter(isUsableImageUrl) ?? moodUrls;
    for (const url of urls) {
      pushItem({ url });
    }
  }

  for (const url of moodUrls) {
    pushItem({ url });
  }

  const defaultFallbacks = [
    images.wineGlasses,
    images.restaurantDining,
    images.cheers,
  ];

  for (const url of defaultFallbacks) {
    pushItem({ url });
  }

  return {
    items: items.slice(0, 3),
    fallbacks: [...moodUrls, ...defaultFallbacks]
      .filter(isUsableImageUrl)
      .filter((url, index, all) =>
        all.findIndex((u) => imageUrlKey(u) === imageUrlKey(url)) === index,
      ),
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
  const item = await enrichDbEvent(row, locale);
  const gallery = await resolveEventGallery(row, locale);

  return {
    eventName: locale === "nl" ? row.nameNl : row.nameEn,
    eventSlug: row.slug,
    eventId: row.id,
    experienceType: row.experienceType ?? DEFAULT_EXPERIENCE_TYPE,
    bookingId: booking?.id,
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

  if (!isCheckoutPaymentSettled(session, row.booking.paymentStatus)) {
    return null;
  }

  return mapEventToSummary(row.event, locale, {
    amountCents: row.booking.amountCents,
    currency: row.booking.currency,
    seats: row.booking.seats,
    id: row.booking.id,
  });
}

export type BookingConfirmationStatus = {
  summary: BookingOutcomeSummary | null;
  /** iDEAL/Bancontact: customer returned but bank payment still settling */
  pending: boolean;
};

export async function getBookingConfirmationStatus(
  sessionId: string,
  locale: Locale,
): Promise<BookingConfirmationStatus> {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return { summary: null, pending: false };
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[booking confirmation] session retrieve failed", err);
    return { summary: null, pending: false };
  }

  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    return { summary: null, pending: false };
  }

  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return { summary: null, pending: false };
  }

  const settled = isCheckoutPaymentSettled(session, row.booking.paymentStatus);
  const pending =
    !settled &&
    session.status === "complete" &&
    session.payment_status === "unpaid";

  if (!settled) {
    return { summary: null, pending };
  }

  try {
    return {
      summary: await mapEventToSummary(row.event, locale, {
        amountCents: row.booking.amountCents,
        currency: row.booking.currency,
        seats: row.booking.seats,
        id: row.booking.id,
      }),
      pending: false,
    };
  } catch (err) {
    console.error("[booking confirmation] summary build failed", err);
    return { summary: null, pending: false };
  }
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
