import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS experience_types (
      slug text PRIMARY KEY,
      name_nl text NOT NULL,
      name_en text NOT NULL,
      mood text NOT NULL DEFAULT 'tastings',
      venue_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    INSERT INTO experience_types (slug, name_nl, name_en, mood, venue_ids)
    VALUES
      ('wine-tasting', 'Wijnproeverij', 'Wine tasting', 'tastings', '[]'::jsonb),
      ('wine-walk', 'Wijnwalk', 'Wine walk', 'wineWalk', '[]'::jsonb),
      ('chefs-special', 'Chef''s Special', 'Chef''s Special', 'chefsSpecial', '[]'::jsonb)
    ON CONFLICT (slug) DO NOTHING
  `;

  await sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS latitude text,
    ADD COLUMN IF NOT EXISTS longitude text
  `;

  await sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS image_meta jsonb
  `;

  await sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS gallery_meta jsonb
  `;

  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS experience_type text NOT NULL DEFAULT 'wine-tasting'
  `;

  await sql`
    UPDATE events SET experience_type = 'wine-tasting'
    WHERE experience_type IS NULL OR experience_type = ''
  `;

  await sql`
    ALTER TABLE experience_types
    ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb
  `;

  console.log("OK: experience_types + events.experience_type ready");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
