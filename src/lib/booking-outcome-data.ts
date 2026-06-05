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
import { isUsableImageUrl, DEFAULT_EVENT_IMAGE } from "@/lib/image-settings";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

export type BookingOutcomeSummary = {
  eventName: string;
  eventSlug: string;
  city: string;
  dateTime: string;
  imageUrl: string;
  galleryImages: string[];
  amountCents?: number;
  currency?: string;
  seats?: number;
  reservationCode?: string;
};

async function resolveEventGalleryImages(
  row: Event,
  locale: Locale,
): Promise<string[]> {
  const item = mapDbEventToExperienceItem(row, locale);
  const typeContent = await getTypeContent(
    row.experienceType ?? DEFAULT_EXPERIENCE_TYPE,
  );
  const merged = mergeTypeContentIntoItem(item, typeContent, locale);
  const fromEvent = merged.galleryImages?.filter(isUsableImageUrl) ?? [];

  const dict = getDictionary(locale);
  const moodGallery = getMoodContent(dict, item.mood).gallery.filter(
    isUsableImageUrl,
  );

  const combined: string[] = [];
  for (const url of [...fromEvent, ...moodGallery]) {
    if (combined.length >= 3) break;
    if (!combined.includes(url)) combined.push(url);
  }

  const hero = isUsableImageUrl(row.imageUrl) ? row.imageUrl : DEFAULT_EVENT_IMAGE;
  if (combined.length < 3 && !combined.includes(hero)) {
    combined.push(hero);
  }

  return combined.slice(0, 3);
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
  return {
    eventName: locale === "nl" ? row.nameNl : row.nameEn,
    eventSlug: row.slug,
    city: row.city,
    dateTime: formatDateTime(
      new Date(row.startsAt),
      row.endsAt ? new Date(row.endsAt) : null,
      locale,
    ),
    imageUrl: isUsableImageUrl(row.imageUrl) ? row.imageUrl : DEFAULT_EVENT_IMAGE,
    galleryImages: await resolveEventGalleryImages(row, locale),
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
