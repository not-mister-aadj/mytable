import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { loadLocalEnv } from "./load-env";
import { assertDevDatabaseTarget } from "./dev-db-guard";

// Keep in sync with drizzle/ — every file here is written to be idempotent
// (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF
// EXISTS before re-adding, etc.), so re-applying an already-applied file is
// a no-op. That's what lets ensureDevSchema() below run unconditionally on
// every `npm run dev` instead of only on a completely empty database.
const MIGRATION_FILES = [
  "0000_initial.sql",
  "0001_event_extras.sql",
  "0002_confirmation_email_sent_at.sql",
  "0003_booking_lifecycle.sql",
  "0004_waitlist_signups.sql",
  "0005_customers.sql",
  "0006_waitlist_source.sql",
  "0007_waitlist_name.sql",
  "0008_consolidate_runtime_ddl.sql",
  "0009_event_slug_redirects.sql",
  "0012_site_settings.sql",
  "0013_sunday_table_signups.sql",
  "0014_club_memberships.sql",
  "0015_growth_loops.sql",
  "0016_sunday_table_location_emails.sql",
  "0017_club_plan_ids_1m_5m_12m.sql",
  "0018_membership_renewal_reminder.sql",
  "0019_sunday_table_reviews.sql",
  "0020_sunday_table_waitlist_invites.sql",
  "0021_waitlist_preferences.sql",
];

async function tableExists(sql: postgres.Sql, name: string): Promise<boolean> {
  const [row] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return Boolean(row?.exists);
}

async function applySqlFile(sql: postgres.Sql, filename: string): Promise<void> {
  const path = join(process.cwd(), "drizzle", filename);
  const contents = readFileSync(path, "utf8");
  await sql.unsafe(contents);
}

async function applyExperienceTypesPatch(sql: postgres.Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS experience_types (
      slug text PRIMARY KEY,
      name_nl text NOT NULL,
      name_en text NOT NULL,
      mood text NOT NULL DEFAULT 'tastings',
      venue_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      content jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS latitude text,
    ADD COLUMN IF NOT EXISTS longitude text,
    ADD COLUMN IF NOT EXISTS image_meta jsonb,
    ADD COLUMN IF NOT EXISTS gallery_meta jsonb
  `;

  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS experience_type text NOT NULL DEFAULT 'wine-tasting'
  `;

  await sql`
    ALTER TABLE experience_types
    ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb
  `;

  await sql`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS seating_preference text,
    ADD COLUMN IF NOT EXISTS table_language_preference text
  `;
}

export async function ensureDevSchema(): Promise<void> {
  loadLocalEnv();
  assertDevDatabaseTarget();

  const url = process.env.DATABASE_URL!;
  const db = postgres(url, { prepare: false, max: 1 });

  try {
    const isEmpty = !(await tableExists(db, "events"));
    console.log(
      isEmpty
        ? "Dev database leeg — schema aanmaken…"
        : "Dev schema controleren op ontbrekende migraties…",
    );
    for (const file of MIGRATION_FILES) {
      await applySqlFile(db, file);
    }

    await applyExperienceTypesPatch(db);
    console.log(`OK: dev schema klaar (${MIGRATION_FILES.length} migraties gecontroleerd)`);
  } finally {
    await db.end();
  }
}
