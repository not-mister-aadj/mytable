import postgres from "postgres";
import { loadLocalEnv } from "./load-env";
import { assertDevDatabaseTarget } from "./dev-db-guard";

const COPY_ORDER = [
  "experience_types",
  "venues",
  "events",
  "bookings",
  "booking_events",
  "waitlist_signups",
] as const;

async function copyTable(
  prod: postgres.Sql,
  dev: postgres.Sql,
  table: (typeof COPY_ORDER)[number],
): Promise<number> {
  const rows = await prod.unsafe(`SELECT * FROM ${table}`);

  if (rows.length === 0) {
    console.log(`  ${table}: 0 rijen`);
    return 0;
  }

  for (const row of rows) {
    await dev`INSERT INTO ${dev(table)} ${dev(row as Record<string, unknown>)}`;
  }

  console.log(`  ${table}: ${rows.length} rijen`);
  return rows.length;
}

export async function syncDevFromProd(): Promise<void> {
  loadLocalEnv();
  assertDevDatabaseTarget();

  const devUrl = process.env.DATABASE_URL!;
  const prodUrl = process.env.PROD_DATABASE_URL?.trim();

  if (!prodUrl) {
    console.error(
      "PROD_DATABASE_URL ontbreekt in .env.production.local",
    );
    process.exit(1);
  }

  const prod = postgres(prodUrl, { prepare: false, max: 1 });
  const dev = postgres(devUrl, { prepare: false, max: 1 });

  console.log("Sync productie → MyTable-dev…");

  try {
    await dev.unsafe(`
      TRUNCATE TABLE
        booking_events,
        bookings,
        events,
        venues,
        experience_types,
        waitlist_signups
      RESTART IDENTITY CASCADE
    `);

    let total = 0;
    for (const table of COPY_ORDER) {
      total += await copyTable(prod, dev, table);
    }

    console.log(`OK: ${total} rijen gekopieerd naar dev`);
  } finally {
    await prod.end();
    await dev.end();
  }
}
