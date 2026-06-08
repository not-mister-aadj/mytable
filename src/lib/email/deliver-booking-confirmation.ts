import { bookingEvents } from "@/db/schema";
import type { Booking, Event } from "@/db/schema";
import { getDb } from "@/db/index";
import { sendBookingConfirmationForPaidBooking } from "@/lib/email/sendBookingConfirmationEmail";
import type { EmailSendResult } from "@/lib/email/resend";

async function logConfirmationEmailEvent(
  bookingId: string,
  context: string,
  result: EmailSendResult,
): Promise<void> {
  if (result.ok && result.id === "already-sent") return;

  const db = getDb();
  await db.insert(bookingEvents).values({
    bookingId,
    type: result.ok ? "confirmation_email_sent" : "confirmation_email_failed",
    payload: result.ok
      ? { context, resendId: result.id }
      : { context, error: result.error },
  });
}

/** Send booking confirmation and log outcome on the booking timeline. */
export async function deliverBookingConfirmationEmail(
  booking: Booking,
  event: Event,
  context: string,
  options?: { force?: boolean },
): Promise<EmailSendResult> {
  try {
    const result = await sendBookingConfirmationForPaidBooking(
      booking,
      event,
      options,
    );
    await logConfirmationEmailEvent(booking.id, context, result);
    if (!result.ok) {
      console.error(`[email] ${context} confirmation failed`, result.error);
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] ${context} confirmation failed`, err);
    const result = { ok: false as const, error: message };
    await logConfirmationEmailEvent(booking.id, context, result);
    return result;
  }
}
