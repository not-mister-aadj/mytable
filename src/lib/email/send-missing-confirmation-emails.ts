import { and, eq, isNull } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { deliverBookingConfirmationEmail } from "@/lib/email/deliver-booking-confirmation";
import { isEmailConfigured } from "@/lib/email/resend";

export type MissingConfirmationEmailResult = {
  bookingId: string;
  email: string;
  ok: boolean;
  error?: string;
};

/** Paid bookings that never got a confirmation email (e.g. Resend was down at fulfill time). */
export async function sendMissingBookingConfirmationEmails(): Promise<
  MissingConfirmationEmailResult[]
> {
  if (!isDbConfigured() || !isEmailConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(
      and(
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        isNull(bookings.confirmationEmailSentAt),
      ),
    );

  const results: MissingConfirmationEmailResult[] = [];

  for (const { booking, event } of rows) {
    try {
      const outcome = await deliverBookingConfirmationEmail(
        booking,
        event,
        "catch-up",
      );
      results.push({
        bookingId: booking.id,
        email: booking.email,
        ok: outcome.ok,
        error: outcome.ok ? undefined : outcome.error,
      });
      if (!outcome.ok) {
        console.error(
          "[email] missing confirmation send failed",
          booking.id,
          outcome.error,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[email] missing confirmation send failed", booking.id, err);
      results.push({
        bookingId: booking.id,
        email: booking.email,
        ok: false,
        error: message,
      });
    }
  }

  return results;
}
