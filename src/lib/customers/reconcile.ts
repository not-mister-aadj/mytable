import { eq } from "drizzle-orm";
import { bookings, waitlistSignups } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { recalculateCustomerStats } from "@/lib/customers/stats";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";

/** Ensure every booking/waitlist row points at the canonical customer for its email. */
export async function reconcileAllCustomers(): Promise<void> {
  if (!isDbConfigured()) return;

  const db = getDb();
  const touched = new Set<string>();

  const bookingRows = await db.select().from(bookings);
  for (const booking of bookingRows) {
    const { id: customerId } = await upsertCustomerFromEmail({
      email: booking.email,
      customerName: booking.customerName,
      language: booking.locale,
    });

    if (booking.customerId !== customerId) {
      await db
        .update(bookings)
        .set({ customerId })
        .where(eq(bookings.id, booking.id));
    }

    touched.add(customerId);
  }

  const waitlistRows = await db.select().from(waitlistSignups);
  for (const row of waitlistRows) {
    const { id: customerId } = await upsertCustomerFromEmail({
      email: row.email,
      language: row.locale,
      preferredCity: row.city,
    });

    if (row.customerId !== customerId) {
      await db
        .update(waitlistSignups)
        .set({ customerId })
        .where(eq(waitlistSignups.id, row.id));
    }

    touched.add(customerId);
  }

  for (const customerId of touched) {
    await recalculateCustomerStats(customerId);
  }
}
