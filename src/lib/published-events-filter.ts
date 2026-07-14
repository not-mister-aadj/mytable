import { and, eq, gt, gte, or, sql } from "drizzle-orm";
import { events } from "@/db/schema";
import { BOOKING_CLOSE_HOURS, AGENDA_RETENTION_DAYS } from "@/lib/event-visibility";

/** Published events open for booking and shown on the landing page. */
export function publishedLandingEventsWhere(now = new Date()) {
  const bookingCloseCutoff = new Date(
    now.getTime() + BOOKING_CLOSE_HOURS * 60 * 60 * 1000,
  );

  return and(
    eq(events.workflowStatus, "published"),
    gt(events.startsAt, bookingCloseCutoff),
    or(
      gte(events.startsAt, now),
      and(sql`${events.endsAt} IS NOT NULL`, gte(events.endsAt, now)),
    ),
  );
}

/** Any published event — used for direct /agenda/[slug] links (bookmarks, admin preview). */
export function publishedEventDetailWhere() {
  return eq(events.workflowStatus, "published");
}

/** Published events on the agenda page (incl. closed, up to 7 days after start). */
export function publishedAgendaEventsWhere(now = new Date()) {
  const agendaCutoff = new Date(
    now.getTime() - AGENDA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  return and(
    eq(events.workflowStatus, "published"),
    gt(events.startsAt, agendaCutoff),
  );
}

/** @deprecated Use publishedLandingEventsWhere or publishedAgendaEventsWhere */
export function publishedUpcomingEventsWhere(now = new Date()) {
  return publishedLandingEventsWhere(now);
}
