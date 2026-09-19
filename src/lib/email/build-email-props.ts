import type { Booking, Event, Venue } from "@/db/schema";
import type { BookingConfirmationEmailProps } from "@/emails/BookingConfirmationEmail";
import type { BookingMovedEmailProps } from "@/emails/BookingMovedEmail";
import { getSiteUrl } from "@/lib/admin-url";
import { formatMoney, reservationCode } from "@/lib/booking-display";
import { experiencePath, sundayTableLocationPath, type Locale } from "@/i18n/config";
import { formatEmailDate, formatEmailTime } from "@/lib/email/format-email-dates";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { getSundayTableLocation } from "@/lib/sunday-table-locations";
import { sundayTableLpSlugFromCity } from "@/data/sunday-table-lp-cities";

function eventDisplayName(event: Event, locale: Locale): string {
  return locale === "en" ? event.nameEn : event.nameNl;
}

function buildEventUrl(event: Event, locale: Locale): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${experiencePath(locale, event.slug)}`;
}

/**
 * Sunday Table's ticketing `events` row has no `venueId`. The venue lives in
 * the older `sunday_table_locations` table, and the row's own URL points at
 * the generic experience page instead of its real reveal page. Resolve both
 * from there so the confirmation email shows the actual venue and links
 * somewhere useful.
 */
async function buildSundayTableEmailContext(
  event: Event,
  locale: Locale,
): Promise<{ eventUrl: string; venueName?: string; startLocation?: string } | null> {
  const citySlug = sundayTableLpSlugFromCity(event.city);
  if (!citySlug) return null;
  const tableDate = amsterdamDateIso(new Date(event.startsAt));
  const location = await getSundayTableLocation({
    city: event.city,
    tableDate,
    tableType: "mixed",
  });
  if (!location) return null;

  const base = getSiteUrl().replace(/\/$/, "");
  return {
    eventUrl: `${base}${sundayTableLocationPath(locale, citySlug, tableDate)}`,
    venueName: location.venueName,
    startLocation: location.address,
  };
}

async function bookingEmailLocale(booking: Booking): Promise<Locale> {
  return resolveEmailLocale({
    email: booking.email,
    fallbackLocale: booking.locale,
  });
}

export async function buildBookingConfirmationEmailProps(
  booking: Booking,
  event: Event,
  venue?: Venue | null,
): Promise<BookingConfirmationEmailProps> {
  const locale = await bookingEmailLocale(booking);
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;
  const isSundayTable = event.experienceType === "sunday-table";

  const sundayTableContext = isSundayTable
    ? await buildSundayTableEmailContext(event, locale)
    : null;

  return {
    locale,
    customerName: booking.customerName ?? undefined,
    customerEmail: booking.email,
    eventName: eventDisplayName(event, locale),
    city: event.city,
    date: formatEmailDate(startsAt, locale),
    time: formatEmailTime(startsAt, endsAt, locale),
    seats: booking.seats,
    totalPaid: formatMoney(booking.amountCents, booking.currency, locale),
    bookingCode: reservationCode(booking.id),
    eventUrl: sundayTableContext?.eventUrl ?? buildEventUrl(event, locale),
    venueName: sundayTableContext?.venueName ?? venue?.name,
    startLocation: sundayTableContext?.startLocation ?? venue?.address ?? undefined,
    dietaryNotes: booking.dietaryNotes ?? undefined,
    isSundayTable,
  };
}

export async function buildBookingMovedEmailProps(
  booking: Booking,
  oldEvent: Event,
  newEvent: Event,
): Promise<BookingMovedEmailProps> {
  const locale = await bookingEmailLocale(booking);
  const oldStarts = new Date(oldEvent.startsAt);
  const oldEnds = oldEvent.endsAt ? new Date(oldEvent.endsAt) : null;
  const newStarts = new Date(newEvent.startsAt);
  const newEnds = newEvent.endsAt ? new Date(newEvent.endsAt) : null;

  return {
    locale,
    customerName: booking.customerName ?? undefined,
    customerEmail: booking.email,
    oldEventName: eventDisplayName(oldEvent, locale),
    oldCity: oldEvent.city,
    oldDate: formatEmailDate(oldStarts, locale),
    oldTime: formatEmailTime(oldStarts, oldEnds, locale),
    newEventName: eventDisplayName(newEvent, locale),
    newCity: newEvent.city,
    newDate: formatEmailDate(newStarts, locale),
    newTime: formatEmailTime(newStarts, newEnds, locale),
    seats: booking.seats,
    bookingCode: reservationCode(booking.id),
    eventUrl: buildEventUrl(newEvent, locale),
  };
}
