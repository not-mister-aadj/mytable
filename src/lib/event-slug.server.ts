import { eq } from "drizzle-orm";
import { eventSlugRedirects, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
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
  let suffix = 1;

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

export async function recordEventSlugRedirect(
  db: Db,
  input: { fromSlug: string; toSlug: string; eventId: string },
): Promise<void> {
  if (input.fromSlug === input.toSlug) return;

  await db
    .insert(eventSlugRedirects)
    .values({
      fromSlug: input.fromSlug,
      toSlug: input.toSlug,
      eventId: input.eventId,
    })
    .onConflictDoUpdate({
      target: eventSlugRedirects.fromSlug,
      set: {
        toSlug: input.toSlug,
        eventId: input.eventId,
      },
    });

  await db
    .update(eventSlugRedirects)
    .set({ toSlug: input.toSlug })
    .where(eq(eventSlugRedirects.toSlug, input.fromSlug));

  await db
    .delete(eventSlugRedirects)
    .where(eq(eventSlugRedirects.fromSlug, input.toSlug));
}

export async function resolveEventSlugRedirect(
  fromSlug: string,
): Promise<string | null> {
  if (!isDbConfigured()) return null;

  const db = getDb();
  const [row] = await db
    .select({ toSlug: eventSlugRedirects.toSlug })
    .from(eventSlugRedirects)
    .where(eq(eventSlugRedirects.fromSlug, fromSlug))
    .limit(1);

  return row?.toSlug ?? null;
}
