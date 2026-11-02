import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings } from "@/db/schema";

/**
 * "Ja, ik kom" in the Wednesday mail ("Kom je zondag?"): stored on the
 * booking, so that mail stops for them and admin sees who said yes.
 */
export async function confirmAttendance(bookingId: string, now = new Date()): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: bookings.id, confirmed: bookings.attendanceConfirmedAt })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active")))
    .limit(1);
  if (!row) return false;
  if (row.confirmed) return true;
  const [marked] = await db
    .update(bookings)
    .set({ attendanceConfirmedAt: now })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.attendanceConfirmedAt)))
    .returning({ id: bookings.id });
  if (marked) await db.insert(bookingEvents).values({ bookingId, type: "attendance_confirmed", payload: {} });
  return true;
}
