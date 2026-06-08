/**
 * Move the "test" event one week later (production DB).
 * Usage: npx tsx scripts/move-test-event-week.ts
 */
import { config } from "dotenv";

config({ path: ".env.production.local" });

async function main() {
  const url = process.env.PROD_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("PROD_DATABASE_URL not set in .env.production.local");
    process.exit(1);
  }
  process.env.DATABASE_URL = url;

  const { eq, ilike, or } = await import("drizzle-orm");
  const { events } = await import("../src/db/schema");
  const { getDb } = await import("../src/db/index");
  const { generateEventSlug } = await import("../src/lib/event-slug");
  const { resolveUniqueEventSlug } = await import("../src/lib/event-slug.server");

  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(
      or(
        ilike(events.nameNl, "test"),
        ilike(events.slug, "%test%"),
      ),
    );

  if (rows.length === 0) {
    console.error("No test event found.");
    process.exit(1);
  }

  const event =
    rows.find((r) => r.nameNl.toLowerCase() === "test") ?? rows[0];

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const newStartsAt = new Date(event.startsAt.getTime() + weekMs);
  const newEndsAt = event.endsAt
    ? new Date(event.endsAt.getTime() + weekMs)
    : null;

  const baseSlug = generateEventSlug({
    nameNl: event.nameNl,
    city: event.city,
    startsAt: newStartsAt,
  });
  const slug = await resolveUniqueEventSlug(db, baseSlug, event.id);

  const [updated] = await db
    .update(events)
    .set({
      startsAt: newStartsAt,
      endsAt: newEndsAt,
      slug,
      updatedAt: new Date(),
    })
    .where(eq(events.id, event.id))
    .returning();

  console.log("Updated event:");
  console.log({
    id: updated.id,
    nameNl: updated.nameNl,
    oldSlug: event.slug,
    slug: updated.slug,
    startsAt: updated.startsAt.toISOString(),
    endsAt: updated.endsAt?.toISOString() ?? null,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
