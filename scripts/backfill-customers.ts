import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { bookings, events, waitlistSignups } = await import("@/db/schema");
  const { getDb } = await import("@/db/index");
  const { onBookingCreated, onWaitlistJoined } = await import(
    "@/lib/customers/hooks"
  );
  const { recalculateCustomerStats } = await import(
    "@/lib/customers/stats"
  );

  const db = getDb();

  const bookingRows = await db
    .select()
    .from(bookings)
    .orderBy(bookings.createdAt);

  console.log(`Backfilling ${bookingRows.length} bookings…`);

  const seenCustomers = new Set<string>();

  for (const booking of bookingRows) {
    if (booking.customerId) {
      seenCustomers.add(booking.customerId);
      continue;
    }

    const [eventRow] = await db
      .select()
      .from(events)
      .where(eq(events.id, booking.eventId))
      .limit(1);

    if (!eventRow) continue;

    const customerId = await onBookingCreated({ booking, event: eventRow });
    seenCustomers.add(customerId);
  }

  const waitlistRows = await db.select().from(waitlistSignups);
  console.log(`Backfilling ${waitlistRows.length} waitlist signups…`);

  for (const row of waitlistRows) {
    if (row.customerId) {
      seenCustomers.add(row.customerId);
      continue;
    }
    const customerId = await onWaitlistJoined({
      email: row.email,
      city: row.city,
      locale: row.locale,
      waitlistId: row.id,
    });
    seenCustomers.add(customerId);
  }

  for (const customerId of seenCustomers) {
    await recalculateCustomerStats(customerId);
  }

  console.log(`Done. Updated ${seenCustomers.size} customers.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
