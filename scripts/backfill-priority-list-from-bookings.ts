import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { bookings, events } = await import("@/db/schema");
  const { getDb } = await import("@/db/index");
  const { ensurePriorityListSignup } = await import(
    "@/lib/priority-list-enrollment"
  );
  const { parseEventExtras, resolveFemaleOnly } = await import(
    "@/lib/event-extras"
  );

  const db = getDb();
  const rows = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.paymentStatus, "paid"))
    .orderBy(bookings.createdAt);

  const seen = new Set<string>();
  let created = 0;
  let upgraded = 0;
  let alreadyEnrolled = 0;
  let skipped = 0;

  for (const { booking, event } of rows) {
    const extras = parseEventExtras(event.extras);
    if (!resolveFemaleOnly(event.femaleOnly, extras.atmosphereTags)) {
      skipped += 1;
      continue;
    }

    const key = `${booking.email.toLowerCase()}::${event.city}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const result = await ensurePriorityListSignup({
        email: booking.email,
        city: event.city,
        locale: booking.locale,
        name: booking.customerName ?? undefined,
        signedUpAt: booking.createdAt,
      });

      if (result === "created") created += 1;
      else if (result === "upgraded") upgraded += 1;
      else alreadyEnrolled += 1;
    } catch (error) {
      console.error(
        `[backfill-priority-list] failed for ${booking.email} (${event.city})`,
        error,
      );
    }
  }

  console.log(
    `OK: priority list backfill — ${created} created, ${upgraded} upgraded, ${alreadyEnrolled} already enrolled, ${skipped} non-girls-only bookings skipped`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
