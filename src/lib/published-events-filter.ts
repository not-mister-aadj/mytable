import { and, eq, gt, gte, ne, or, sql } from "drizzle-orm";
import { events } from "@/db/schema";
import { BOOKING_CLOSE_HOURS, AGENDA_RETENTION_DAYS } from "@/lib/event-visibility";

/**
 * Sunday Table already gets its own card (built from sunday_table_locations,
 * pointing at its dedicated reveal page) on the agenda and landing grids —
 * so its own `events` row, used only for ticketing, is excluded here to
 * avoid showing the same table twice.
 */
function excludeSundayTable() {
  return ne(events.experienceType, "sunday-table");
}

/** Published events open for booking and shown on the landing page. */
export function publishedLandingEventsWhere(now = new Date()) {
  const bookingCloseCutoff = new Date(
    now.getTime() + BOOKING_CLOSE_HOURS * 60 * 60 * 1000,
  );

  return and(
    eq(events.workflowStatus, "published"),
    excludeSundayTable(),
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

/** Published events on the agenda page (incl. closed, up to AGENDA_RETENTION_DAYS after start). */
export function publishedAgendaEventsWhere(now = new Date()) {
  const agendaCutoff = new Date(
    now.getTime() - AGENDA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  return and(
    eq(events.workflowStatus, "published"),
    excludeSundayTable(),
    gt(events.startsAt, agendaCutoff),
  );
}

/** @deprecated Use publishedLandingEventsWhere or publishedAgendaEventsWhere */
export function publishedUpcomingEventsWhere(now = new Date()) {
  return publishedLandingEventsWhere(now);
}
