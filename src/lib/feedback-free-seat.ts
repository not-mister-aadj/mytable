import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookingFeedback, bookings, events } from "@/db/schema";
import { onPaymentCompleted } from "@/lib/customers/hooks";
import { deliverBookingConfirmationEmail } from "@/lib/email/deliver-booking-confirmation";
import { FREE_SEAT_NOTE, loadFeedbackPage } from "@/lib/feedback";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";

export type FreeSeatResult = { ok: true; label: string } | { ok: false; error: "not_allowed" | "capacity" };

/**
 * "De volgende is op ons": one free seat (amount 0, for themselves) at a
 * date offered on the feedback page, after Matig or Niet leuk. An ordinary
 * paid booking, so the guest list, capacity and confirmation mail all work.
 */
export async function bookFreeSeatAfterFeedback(bookingId: string, eventId: string): Promise<FreeSeatResult> {
  const page = await loadFeedbackPage(bookingId);
  const db = getDb();
  const [feedback] = await db.select({ mood: bookingFeedback.mood }).from(bookingFeedback).where(eq(bookingFeedback.bookingId, bookingId)).limit(1);
  const option = page?.freeSeat?.options.find((o) => o.eventId === eventId);
  if (!page || !option || (feedback?.mood !== "meh" && feedback?.mood !== "bad")) return { ok: false, error: "not_allowed" };

  const [source] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!source) return { ok: false, error: "not_allowed" };

  const result = await db.transaction(async (tx) => {
    const [ev] = await tx
      .update(events)
      .set({ spotsSold: sql`${events.spotsSold} + 1`, updatedAt: new Date() })
      .where(sql`${events.id} = ${eventId} AND ${events.spotsSold} + 1 <= ${events.capacity}`)
      .returning();
    if (!ev) return null;
    const [booking] = await tx
      .insert(bookings)
      .values({
        eventId,
        email: source.email,
        customerId: source.customerId,
        customerName: source.customerName,
        seats: 1,
        amountCents: 0,
        currency: "EUR",
        paymentStatus: "paid",
        locale: source.locale,
        birthDate: source.birthDate,
        agePreference: source.agePreference,
        seatingPreference: source.seatingPreference,
        tableLanguagePreference: source.tableLanguagePreference,
        adminNotes: FREE_SEAT_NOTE,
      })
      .returning();
    await tx.insert(bookingEvents).values([
      { bookingId: booking!.id, type: "feedback_free_seat", payload: { fromBookingId: bookingId } },
      // Same source as the links on the feedback page.
      {
        bookingId: booking!.id,
        type: "checkout_utm",
        payload: { utm_source: "mytable", utm_medium: "feedback", utm_campaign: "feedback", utm_content: "gratis" },
      },
    ]);
    return { booking: booking!, event: ev };
  });
  if (!result) return { ok: false, error: "capacity" };

  try {
    revalidateEventPaths(result.event);
  } catch (error) {
    console.warn("[feedback] revalidate skipped", error);
  }
  await deliverBookingConfirmationEmail(result.booking, result.event, "feedback_free_seat");
  try {
    await onPaymentCompleted({ booking: result.booking, event: result.event });
  } catch (error) {
    console.error("[feedback] CRM hook failed", error);
  }
  return { ok: true, label: option.label };
}
