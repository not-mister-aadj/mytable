import type { ReactElement } from "react";
import { eq, and, isNull } from "drizzle-orm";
import {
  BookingConfirmationEmail,
  type BookingConfirmationEmailProps,
} from "@/emails/BookingConfirmationEmail";
import { bookings, events, venues } from "@/db/schema";
import { bookingIcsAttachment, type BookingIcsInput } from "@/lib/booking-calendar";
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

/** `calendar` attaches an invite for the guest's calendar; `instead` sends
 * another mail (a Sunday's location mail) as the confirmation. */
export async function sendBookingConfirmationEmail(
  props: BookingConfirmationEmailProps,
  calendar?: Omit<BookingIcsInput, "organizerEmail">,
  instead?: { subject: string; element: ReactElement },
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
    instead?.element ?? BookingConfirmationEmail(props),
  );

  const bcc = getBookingConfirmationBcc().filter(
    (address) => address.toLowerCase() !== props.customerEmail.toLowerCase(),
  );

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: props.customerEmail,
    bcc: bcc.length > 0 ? bcc : undefined,
    subject:
      instead?.subject ??
      bookingConfirmationSubject(
        props.bookingCode,
        props.eventName,
        props.locale === "en" ? "en" : "nl",
      ),
    headers: bookingEmailHeaders(props.bookingCode),
    html,
    text,
    attachments: calendar ? [bookingIcsAttachment({ ...calendar, organizerEmail: getEmailReplyTo() })] : undefined,
  });

  if (error) {
    console.error("[email] booking confirmation failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? "unknown" };
}

/**
 * The confirmation for a paid booking, once. The send is claimed first
 * (confirmation_email_sent_at set where it was empty), so the webhook and the
 * return page arriving together send one mail, not two. A failed send gives
 * the claim back.
 */
export async function sendBookingConfirmationForPaidBooking(
  booking: Booking,
  event: Event,
  options?: { force?: boolean },
): Promise<EmailSendResult> {
  if (booking.paymentStatus !== "paid") {
    return { ok: false, error: "Booking is not paid" };
  }
  if (options?.force) return sendConfirmationNow(booking, event, options);
  const db = getDb();
  const [claimed] = await db
    .update(bookings)
    .set({ confirmationEmailSentAt: new Date() })
    .where(and(eq(bookings.id, booking.id), isNull(bookings.confirmationEmailSentAt)))
    .returning({ id: bookings.id });
  if (!claimed) return { ok: true, id: "already-sent" };
  const result = await sendConfirmationNow({ ...booking, confirmationEmailSentAt: null }, event, options).catch(
    (error: unknown): EmailSendResult => ({ ok: false, error: error instanceof Error ? error.message : String(error) }),
  );
  if (!result.ok) {
    await db.update(bookings).set({ confirmationEmailSentAt: null }).where(eq(bookings.id, booking.id));
  }
  return result;
}

async function sendConfirmationNow(
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

  const props = await buildBookingConfirmationEmailProps(booking, event, venue);
  // A seat taken through "Er is een plek vrij": one mail that says it all
  // (where, when, the group, the table page), instead of the usual one.
  if (props.isSundayTable) {
    const seatMail = await import("@/lib/seat-offer")
      .then((m) => m.seatOfferConfirmation(event.id, booking.id))
      .catch((error) => {
        console.error("[email] seat offer confirmation failed", error);
        return null;
      });
    if (seatMail) {
      const { sendSundayMail } = await import("@/lib/admin/sunday-mails");
      const id = await sendSundayMail(booking.email, seatMail).catch(() => null);
      if (id) {
        // Our own copy, as with every confirmation.
        const [copyTo] = getBookingConfirmationBcc();
        if (copyTo) await sendSundayMail(copyTo, seatMail, undefined, `[kopie] ${seatMail.subject}`).catch(() => null);
        await db.update(bookings).set({ confirmationEmailSentAt: new Date() }).where(eq(bookings.id, booking.id));
        if (booking.customerId) await onEmailSent({ customerId: booking.customerId, subject: "Boekingsbevestiging", bookingId: booking.id });
        return { ok: true, id };
      }
    }
  }
  // A Sunday Social whose location mail already went out: that mail is the confirmation.
  const location = props.isSundayTable
    ? await import("@/lib/admin/sunday-mails")
        .then((m) => m.locationMailAsConfirmation(event.id, booking.id))
        .catch((error) => {
          console.error("[email] location mail as confirmation failed", error);
          return null;
        })
    : null;
  const result = await sendBookingConfirmationEmail(props, {
    bookingId: booking.id,
    bookingCode: props.bookingCode,
    eventName: props.eventName,
    city: event.city,
    startsAt: new Date(event.startsAt),
    // A shared table has no set end; the calendar blocks the usual three hours.
    endsAt: props.isSundayTable || !event.endsAt ? null : new Date(event.endsAt),
    attendeeEmail: props.customerEmail,
    attendeeName: props.customerName,
    locale: props.locale,
    isSundayTable: props.isSundayTable,
    location: [props.venueName, props.startLocation].filter((v) => v?.trim()).join(", ") || undefined,
    eventUrl: props.eventUrl,
  }, location?.element ? { subject: location.subject, element: location.element } : undefined);

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
