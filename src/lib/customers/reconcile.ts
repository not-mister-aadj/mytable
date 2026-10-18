import { eq, isNull, ne, or, sql } from "drizzle-orm";
import { bookings, customers, waitlistSignups } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { recalculateCustomerStats } from "@/lib/customers/stats";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";

/**
 * Ensure every booking/waitlist row points at the canonical customer for its email.
 * Only rows without a customer, or linked to a customer with another email, are
 * touched; the booking and signup hooks keep everything else up to date.
 */
export async function reconcileAllCustomers(): Promise<void> {
  if (!isDbConfigured()) return;

  const db = getDb();
  const touched = new Set<string>();

  const bookingRows = await db
    .select({
      id: bookings.id,
      email: bookings.email,
      customerName: bookings.customerName,
      locale: bookings.locale,
      customerId: bookings.customerId,
    })
    .from(bookings)
    .leftJoin(customers, eq(customers.id, bookings.customerId))
    .where(
      or(
        isNull(customers.id),
        ne(customers.emailNormalized, sql`lower(trim(${bookings.email}))`),
      ),
    );
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
      if (booking.customerId) touched.add(booking.customerId);
    }

    touched.add(customerId);
  }

  const waitlistRows = await db
    .select({
      id: waitlistSignups.id,
      email: waitlistSignups.email,
      locale: waitlistSignups.locale,
      city: waitlistSignups.city,
      customerId: waitlistSignups.customerId,
    })
    .from(waitlistSignups)
    .leftJoin(customers, eq(customers.id, waitlistSignups.customerId))
    .where(
      or(
        isNull(customers.id),
        ne(customers.emailNormalized, sql`lower(trim(${waitlistSignups.email}))`),
      ),
    );
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
      if (row.customerId) touched.add(row.customerId);
    }

    touched.add(customerId);
  }

  for (const customerId of touched) {
    await recalculateCustomerStats(customerId);
  }
}
