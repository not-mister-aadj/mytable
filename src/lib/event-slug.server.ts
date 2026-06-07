import { eq } from "drizzle-orm";
import { events } from "@/db/schema";
import type { getDb } from "@/db/index";
import { MAX_SLUG_LENGTH } from "@/lib/event-slug";

type Db = ReturnType<typeof getDb>;

export async function resolveUniqueEventSlug(
  db: Db,
  baseSlug: string,
  excludeEventId?: string,
): Promise<string> {
  const trimmed = baseSlug.trim().slice(0, MAX_SLUG_LENGTH);
  if (!trimmed) {
    throw new Error("Kan geen slug genereren — vul tafelnaam, stad en startdatum in.");
  }

  let candidate = trimmed;
  let suffix = 2;

  while (suffix < 10_000) {
    const [row] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, candidate))
      .limit(1);

    if (!row || (excludeEventId && row.id === excludeEventId)) {
      return candidate;
    }

    const suffixPart = `-${suffix}`;
    candidate = `${trimmed.slice(0, MAX_SLUG_LENGTH - suffixPart.length)}${suffixPart}`;
    suffix += 1;
  }

  throw new Error("Kon geen unieke slug vinden. Pas tafelnaam of datum aan.");
}
