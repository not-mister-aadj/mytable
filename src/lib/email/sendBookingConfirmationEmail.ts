import { eq, and, isNull } from "drizzle-orm";
import {
  BookingConfirmationEmail,
  type BookingConfirmationEmailProps,
} from "@/emails/BookingConfirmationEmail";
import { bookings, events, venues } from "@/db/schema";
import { getDb } from "@/db/index";
import { onEmailSent } from "@/lib/customers/hooks";
import type { Booking, Event } from "@/db/schema";
import {
  buildBookingConfirmationEmailProps,
} from "@/lib/email/build-email-props";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  bookingConfirmationSubject,
  bookingEmailHeaders,
} from "@/lib/email/subjects";
import {
  getBookingConfirmationBcc,
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
  type EmailSendResult,
} from "@/lib/email/resend";

function validateProps(props: BookingConfirmationEmailProps): void {
  const required: (keyof BookingConfirmationEmailProps)[] = [
    "customerEmail",
    "eventName",
    "city",
    "date",
    "time",
    "seats",
    "totalPaid",
    "bookingCode",
    "eventUrl",
  ];

  for (const key of required) {
    const value = props[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Booking confirmation email: missing required field "${key}"`);
    }
  }
}

export async function sendBookingConfirmationEmail(
  props: BookingConfirmationEmailProps,
): Promise<EmailSendResult> {
  validateProps(props);

  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY missing, skip booking confirmation");
    return { ok: false, error: "Email not configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "Email not configured" };
  }

  const { html, text } = await renderEmailForDelivery(
    BookingConfirmationEmail(props),
  );

  const bcc = getBookingConfirmationBcc().filter(
    (address) => address.toLowerCase() !== props.customerEmail.toLowerCase(),
  );

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: props.customerEmail,
    bcc: bcc.length > 0 ? bcc : undefined,
    subject: bookingConfirmationSubject(props.bookingCode, props.eventName),
    headers: bookingEmailHeaders(props.bookingCode),
    html,
    text,
  });

  if (error) {
    console.error("[email] booking confirmation failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? "unknown" };
}

export async function sendBookingConfirmationForPaidBooking(
  booking: Booking,
  event: Event,
  options?: { force?: boolean },
): Promise<EmailSendResult> {
  if (booking.paymentStatus !== "paid") {
    return { ok: false, error: "Booking is not paid" };
  }

  if (booking.confirmationEmailSentAt && !options?.force) {
    return { ok: true, id: "already-sent" };
  }

  const db = getDb();
  let venue = null;
  if (event.venueId) {
    const [row] = await db
      .select()
      .from(venues)
      .where(eq(venues.id, event.venueId))
      .limit(1);
    venue = row ?? null;
  }

  const props = buildBookingConfirmationEmailProps(booking, event, venue);
  const result = await sendBookingConfirmationEmail(props);

  if (result.ok && result.id !== "already-sent" && !options?.force) {
    await db
      .update(bookings)
      .set({ confirmationEmailSentAt: new Date() })
      .where(
        and(
          eq(bookings.id, booking.id),
          isNull(bookings.confirmationEmailSentAt),
        ),
      );
  }

  if (result.ok && options?.force) {
    await db
      .update(bookings)
      .set({ confirmationEmailSentAt: new Date() })
      .where(eq(bookings.id, booking.id));
  }

  if (result.ok && booking.customerId) {
    await onEmailSent({
      customerId: booking.customerId,
      subject: "Boekingsbevestiging",
      bookingId: booking.id,
    });
  }

  return result;
}

export async function sendBookingConfirmationByBookingId(
  bookingId: string,
  options?: { force?: boolean },
): Promise<EmailSendResult> {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Booking not found" };
  }

  return sendBookingConfirmationForPaidBooking(
    row.booking,
    row.event,
    options,
  );
}
