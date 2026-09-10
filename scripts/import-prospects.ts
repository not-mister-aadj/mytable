/**
 * Zet een prospect-CSV in de outreachlijst van het dashboard.
 *
 *   npx tsx scripts/import-prospects.ts tmp/prospects-rotterdam.csv Rotterdam
 *
 * Bestaande zaken (zelfde stad + naam) worden bijgewerkt met nieuwe
 * contactgegevens; status, sequence en notities blijven staan.
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";

config({ path: ".env.local" });

const csvPath = process.argv[2] ?? "tmp/prospects-rotterdam.csv";
const city = process.argv[3] ?? "Rotterdam";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL ontbreekt in .env.local");
    process.exit(1);
  }

  // Imported lazily so dotenv has filled DATABASE_URL before the db client reads it.
  const { parseProspectsCsv } = await import("../src/lib/outreach/parse-prospects-csv");
  const { importOutreachProspects } = await import(
    "../src/lib/outreach/prospects-data"
  );

  const parsed = parseProspectsCsv(readFileSync(csvPath, "utf8"), city);
  if (parsed.error) {
    console.error(parsed.error);
    process.exit(1);
  }

  const result = await importOutreachProspects(
    parsed.rows.map((row) => ({ ...row, source: "apify-google-maps" })),
  );

  const withEmail = parsed.rows.filter((row) => row.email).length;
  console.log(
    `OK: ${result.imported} zaken geïmporteerd of bijgewerkt uit ${csvPath}`,
  );
  console.log(
    `    ${withEmail} met e-mailadres, ${parsed.rows.length - withEmail} zonder (die bel je)`,
  );
  if (parsed.skipped > 0) {
    console.log(`    ${parsed.skipped} regels overgeslagen (geen naam)`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
