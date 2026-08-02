import type { Booking, Event, Venue } from "@/db/schema";
import type { BookingConfirmationEmailProps } from "@/emails/BookingConfirmationEmail";
import type { BookingMovedEmailProps } from "@/emails/BookingMovedEmail";
import { getSiteUrl } from "@/lib/admin-url";
import { formatMoney, reservationCode } from "@/lib/booking-display";
import { experiencePath, type Locale } from "@/i18n/config";
import { formatEmailDate, formatEmailTime } from "@/lib/email/format-email-dates";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";

function eventDisplayName(event: Event, locale: Locale): string {
  return locale === "en" ? event.nameEn : event.nameNl;
}

function buildEventUrl(event: Event, locale: Locale): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${experiencePath(locale, event.slug)}`;
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
    eventUrl: buildEventUrl(event, locale),
    venueName: venue?.name,
    startLocation: venue?.address ?? undefined,
    dietaryNotes: booking.dietaryNotes ?? undefined,
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
