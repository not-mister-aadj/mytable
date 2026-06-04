import { and, eq, gte, or, sql } from "drizzle-orm";
import { events } from "@/db/schema";

/** Published events that have not ended yet */
export function publishedUpcomingEventsWhere(now = new Date()) {
  return and(
    eq(events.workflowStatus, "published"),
    or(
      gte(events.startsAt, now),
      and(sql`${events.endsAt} IS NOT NULL`, gte(events.endsAt, now)),
    ),
  );
}
