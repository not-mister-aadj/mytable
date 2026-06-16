import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { loadLocalEnv } from "./load-env";
import { assertDevDatabaseTarget } from "./dev-db-guard";

const MIGRATION_FILES = [
  "0000_initial.sql",
  "0001_event_extras.sql",
  "0002_confirmation_email_sent_at.sql",
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
}

export async function ensureDevSchema(): Promise<void> {
  loadLocalEnv();
  assertDevDatabaseTarget();

  const url = process.env.DATABASE_URL!;
  const db = postgres(url, { prepare: false, max: 1 });

  try {
    if (!(await tableExists(db, "events"))) {
      console.log("Dev database leeg — schema aanmaken…");
      for (const file of MIGRATION_FILES) {
        console.log(`  ${file}`);
        await applySqlFile(db, file);
      }
    }

    await applyExperienceTypesPatch(db);
    console.log("OK: dev schema klaar");
  } finally {
    await db.end();
  }
}
