import { isDbConfigured } from "@/db/index";
import { getDbMigrationClient, runDbMigrationOnce } from "@/lib/db-migration-client";

async function applyExperienceTypesSchema(): Promise<void> {
  const sql = getDbMigrationClient();
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
    ALTER TABLE experience_types
    ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb
  `;
}

/** Idempotent — safe before experience_types reads/writes. */
export async function ensureExperienceTypesSchema(): Promise<void> {
  if (!isDbConfigured()) return;
  await runDbMigrationOnce("experience-types-schema", applyExperienceTypesSchema);
}
