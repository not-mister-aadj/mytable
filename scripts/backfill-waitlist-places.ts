/**
 * Dry run: shows how the city values in waitlist_signups would be spelled
 * with the fixed place list (src/lib/jouw-tafel/nl-places.json). Only the
 * spelling changes ("den haag" -> "Den Haag", "s-hertogenbosch" -> "Den
 * Bosch"); a place is never turned into one of our cities ("Delft" stays
 * Delft).
 *
 *   npx tsx scripts/backfill-waitlist-places.ts
 *
 * It only reads. Writing is deliberately not built in: renaming can merge
 * two rows of one person into the same (email, city), which the unique
 * index refuses, so that needs the merge rules of
 * scripts/dedupe-waitlist-cities.ts. Never point this at production without
 * the founder's go.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }
  const { getDb } = await import("../src/db/index");
  const { waitlistSignups } = await import("../src/db/schema");
  const { sql } = await import("drizzle-orm");
  const { supportedCity } = await import("../src/lib/jouw-tafel/logic");
  const { placeLabel } = await import("../src/lib/jouw-tafel/places-server");

  const host = new URL(process.env.DATABASE_URL).username.split(".")[1] ?? "unknown";
  console.log(`Database project: ${host} (dry run, nothing is written)\n`);

  const rows = await getDb()
    .select({ city: waitlistSignups.city, n: sql<number>`count(*)::int` })
    .from(waitlistSignups)
    .groupBy(waitlistSignups.city)
    .orderBy(waitlistSignups.city);

  const changes: string[] = [];
  const unknown: string[] = [];
  let same = 0;
  for (const { city, n } of rows) {
    const next = supportedCity(city) ?? placeLabel(city);
    if (!next) unknown.push(`  ${JSON.stringify(city)} (${n})`);
    else if (next !== city) changes.push(`  ${JSON.stringify(city)} -> ${JSON.stringify(next)} (${n})`);
    else same += 1;
  }
  console.log(`Already spelled as on the list: ${same} values`);
  console.log(`\nWould change (${changes.length}):`);
  console.log(changes.join("\n") || "  none");
  console.log(`\nNot on the list, left as is (${unknown.length}):`);
  console.log(unknown.join("\n") || "  none");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
