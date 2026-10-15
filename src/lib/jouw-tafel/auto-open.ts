import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { tablesToOpen, type AutoOpenTable } from "@/lib/jouw-tafel/auto-open-logic";
import { bookingOpensOverride } from "@/lib/jouw-tafel/logic";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";

/**
 * Keeps two bookable Sunday Socials in every city: when a city has fewer
 * (one filled up, closed or took place), the next series table opens now
 * (events.extras.bookingOpensAt, the same exception an admin sets by hand).
 * Runs from the cron; idempotent.
 */
export async function openTablesToKeepTwoPerCity(now = new Date()): Promise<{ opened: Array<{ id: string; city: string; startsAt: string }> }> {
  if (!isDbConfigured()) return { opened: [] };
  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE]),
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, now),
      ),
    );
  const tables: AutoOpenTable[] = rows.map((r) => ({
    id: r.id,
    city: r.city,
    startsAt: r.startsAt,
    capacity: r.capacity,
    spotsSold: r.spotsSold,
    handMade: r.experienceType === SUNDAY_SOCIAL_TYPE,
    comingSoon: Boolean(r.extras?.comingSoon),
    bookingOpensAt: bookingOpensOverride(r.extras),
  }));
  const ids = tablesToOpen(tables, now.getTime());
  const opened: Array<{ id: string; city: string; startsAt: string }> = [];
  for (const id of ids) {
    const [row] = await db
      .update(events)
      .set({
        extras: sql`coalesce(${events.extras}, '{}'::jsonb) || jsonb_build_object('bookingOpensAt', ${now.toISOString()}::text, 'autoOpened', true)`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    if (!row) continue;
    opened.push({ id: row.id, city: row.city, startsAt: row.startsAt.toISOString() });
    revalidateEventPaths(row);
  }
  return { opened };
}
