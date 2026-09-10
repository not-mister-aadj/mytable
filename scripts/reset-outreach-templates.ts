/**
 * Zet de outreach-templates in de database terug naar de tekst in
 * src/lib/outreach/templates-data.ts.
 *
 *   npx tsx scripts/reset-outreach-templates.ts
 *
 * LET OP: dit overschrijft wijzigingen die je in het dashboard hebt gemaakt
 * aan templates met dezelfde sleutel. Templates met een andere sleutel blijven
 * ongemoeid. Draai dit alleen als de tekst in de code de bron van waarheid is.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL ontbreekt in .env.local");
    process.exit(1);
  }

  // Lazily imported so dotenv heeft DATABASE_URL al gezet.
  const { getDb } = await import("../src/db/index");
  const { outreachTemplates } = await import("../src/db/schema");
  const { DEFAULT_OUTREACH_TEMPLATES } = await import(
    "../src/lib/outreach/templates-data"
  );

  const db = getDb();
  for (const template of DEFAULT_OUTREACH_TEMPLATES) {
    await db
      .insert(outreachTemplates)
      .values({
        key: template.key,
        name: template.name,
        kind: template.kind,
        step: template.step,
        delayDays: template.delayDays,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      })
      .onConflictDoUpdate({
        target: outreachTemplates.key,
        set: {
          name: template.name,
          kind: template.kind,
          step: template.step,
          delayDays: template.delayDays,
          subject: template.subject,
          body: template.body,
          updatedAt: new Date(),
        },
      });
    console.log(`OK: ${template.key} — ${template.subject}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
