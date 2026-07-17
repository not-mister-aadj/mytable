import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { events } = await import("@/db/schema");
  const { getDb, isDbConfigured } = await import("@/db/index");
  const { generateEventSlug } = await import("@/lib/event-slug");
  const {
    recordEventSlugRedirect,
    resolveUniqueEventSlug,
  } = await import("@/lib/event-slug.server");
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const postgres = (await import("postgres")).default;

  if (!isDbConfigured()) {
    throw new Error("DATABASE_URL missing");
  }

  const url = process.env.DATABASE_URL!;
  const client = postgres(url, { prepare: false });
  const migration = readFileSync(
    join(process.cwd(), "drizzle", "0009_event_slug_redirects.sql"),
    "utf8",
  );
  await client.unsafe(migration);
  await client.end();
  console.log("OK: event_slug_redirects table ready");

  const db = getDb();
  const rows = await db.select().from(events);
  let updated = 0;

  for (const event of rows) {
    const nextSlug = await resolveUniqueEventSlug(
      db,
      generateEventSlug({
        nameNl: event.nameNl,
        city: event.city,
        startsAt: event.startsAt,
      }),
      event.id,
    );

    if (nextSlug === event.slug) continue;

    await db
      .update(events)
      .set({ slug: nextSlug, updatedAt: new Date() })
      .where(eq(events.id, event.id));

    await recordEventSlugRedirect(db, {
      fromSlug: event.slug,
      toSlug: nextSlug,
      eventId: event.id,
    });

    updated += 1;
    console.log(`  ${event.slug} → ${nextSlug}`);
  }

  console.log(`OK: updated ${updated} event slug(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
