import { and, eq, gt, gte, ne, notInArray, or, sql } from "drizzle-orm";
import { events } from "@/db/schema";
import { BOOKING_CLOSE_HOURS, AGENDA_RETENTION_DAYS } from "@/lib/event-visibility";
import { JOUW_TAFEL_TYPE, SHARED_TABLE_TYPES } from "@/lib/event-concepts";

/** Sunday Social has its own agenda cards (from its locations), and a "Jouw
 * tafel" Sunday Table never shows in the agenda at all. */
function excludeSundayTable() {
  return notInArray(events.experienceType, [...SHARED_TABLE_TYPES]);
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

/** Any published event for direct /agenda/[slug] links (bookmarks, admin
 * preview), except a "Jouw tafel" Sunday Table: that one only lives in
 * /jouw-tafel. */
export function publishedEventDetailWhere() {
  return and(eq(events.workflowStatus, "published"), ne(events.experienceType, JOUW_TAFEL_TYPE));
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
