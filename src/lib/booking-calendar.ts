import { escapeIcsText, foldIcsLine, SUNDAY_TABLE_DURATION_HOURS, toIcsUtc } from "@/lib/sunday-table-calendar";

/**
 * A calendar invite for a paid booking, attached to the confirmation mail.
 * It is an invite (METHOD:REQUEST) with one UID per booking, so a later mail
 * with the same UID and a higher `sequence` updates the event in the guest's
 * calendar instead of adding a second one. The location mail a week before
 * (sent by hand) uses that to fill in the address.
 */
export type BookingIcsInput = {
  bookingId: string;
  bookingCode: string;
  eventName: string;
  city: string;
  startsAt: Date;
  endsAt?: Date | null;
  attendeeEmail: string;
  attendeeName?: string;
  locale?: "nl" | "en";
  /** Shared tables (Sunday Social) announce the venue a week before. */
  isSundayTable?: boolean;
  /** The venue once known, e.g. "Juni, Oostzeedijk 340A, 3063 CC Rotterdam". */
  location?: string;
  /** 0 for the confirmation, one higher for every update. */
  sequence?: number;
  eventUrl?: string;
  organizerEmail?: string;
};

export const BOOKING_ICS_CONTENT_TYPE = "text/calendar; method=REQUEST; charset=UTF-8";

export function bookingIcsUid(bookingId: string): string {
  return `booking-${bookingId}@mytable.club`;
}

function bookingIcsCopy(input: BookingIcsInput): { title: string; description: string; location: string } {
  const en = input.locale === "en";
  const known = input.location?.trim();
  const title = input.isSundayTable ? `MyTable Sunday Social · ${input.city}` : `MyTable · ${input.eventName}`;
  const location =
    known ||
    (input.isSundayTable
      ? en
        ? `A wine bar in ${input.city}, address follows 7 days before`
        : `Een wijnbar in ${input.city}, adres volgt 7 dagen van tevoren`
      : input.city);
  const lines = [
    en ? `Your booking: ${input.bookingCode}` : `Je boeking: ${input.bookingCode}`,
    !known && input.isSundayTable
      ? en
        ? "We'll email you the venue 7 days before."
        : "De locatie mailen we je 7 dagen van tevoren."
      : null,
    input.eventUrl ?? null,
  ].filter((l): l is string => Boolean(l));
  return { title, description: lines.join("\n"), location };
}

export function buildBookingIcs(input: BookingIcsInput): string {
  const { title, description, location } = bookingIcsCopy(input);
  const end = input.endsAt ?? new Date(input.startsAt.getTime() + SUNDAY_TABLE_DURATION_HOURS * 3600000);
  const organizer = input.organizerEmail ?? "info@mytable.club";
  const attendeeName = input.attendeeName?.trim().replace(/["\r\n]/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyTable//Booking//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${bookingIcsUid(input.bookingId)}`,
    `SEQUENCE:${input.sequence ?? 0}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(input.startsAt)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `ORGANIZER;CN=MyTable:mailto:${organizer}`,
    `ATTENDEE;${attendeeName ? `CN="${attendeeName}";` : ""}ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${input.attendeeEmail}`,
    ...(input.eventUrl ? [`URL:${input.eventUrl}`] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

/** The Resend attachment for a booking's invite. */
export function bookingIcsAttachment(input: BookingIcsInput): { filename: string; content: Buffer; contentType: string } {
  return {
    filename: "invite.ics",
    content: Buffer.from(buildBookingIcs(input), "utf8"),
    contentType: BOOKING_ICS_CONTENT_TYPE,
  };
}
