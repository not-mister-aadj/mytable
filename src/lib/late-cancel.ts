import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events } from "@/db/schema";
import { dropPlannedMailsFor } from "@/lib/admin/sunday-mails";

export type LateCancelResult = { ok: true } | { ok: false; error: "not_found" | "started" };

/**
 * "Kun je toch niet?" on the table page, until the Sunday starts. No
 * refund (terms, art. 6) and the seat stays taken; the guest leaves their
 * group's list and gets no more Sunday mails. Not a no-show.
 */
export async function cancelLate(bookingId: string, now = new Date()): Promise<LateCancelResult> {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active")))
    .limit(1);
  if (!row) return { ok: false, error: "not_found" };
  if (row.booking.cancelledLateAt) return { ok: true };
  if (row.event.startsAt.getTime() <= now.getTime()) return { ok: false, error: "started" };

  const [marked] = await db
    .update(bookings)
    .set({ cancelledLateAt: now })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.cancelledLateAt)))
    .returning({ id: bookings.id });
  if (!marked) return { ok: true };
  const left = await dropPlannedMailsFor(row.event.id, bookingId).catch(() => ["saturday", "morning", "feedback"]);
  await db.insert(bookingEvents).values({ bookingId, type: "cancelled_late", payload: { plannedMailsLeft: left } });
  return { ok: true };
}

/** Our own note on a cancellation (admin). */
export async function saveCancelNote(bookingId: string, note: string): Promise<void> {
  await getDb()
    .update(bookings)
    .set({ cancelNote: note.trim().slice(0, 2000) || null })
    .where(eq(bookings.id, bookingId));
}
