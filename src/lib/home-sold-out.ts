import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { events } from "@/db/schema";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";

export type SoldOutSunday = { city: string; startsAt: string };

/** The coming Sundays that are full, for the home page: soonest first. */
export async function loadSoldOutSundays(limit = 4): Promise<SoldOutSunday[]> {
  try {
    const rows = await getDb()
      .select({ city: events.city, startsAt: events.startsAt })
      .from(events)
      .where(
        and(
          eq(events.workflowStatus, "published"),
          inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE]),
          gt(events.startsAt, new Date()),
          sql`${events.spotsSold} >= ${events.capacity}`,
        ),
      )
      .orderBy(asc(events.startsAt))
      .limit(limit);
    return rows.map((r) => ({ city: r.city, startsAt: r.startsAt.toISOString() }));
  } catch {
    // The page still stands without this line.
    return [];
  }
}
