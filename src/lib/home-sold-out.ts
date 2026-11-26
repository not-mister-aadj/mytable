import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { events } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { sundaySocialDatePath } from "@/lib/sunday-social-cities";

/** A coming Sunday on the home page: full, or with seats and a link to book. */
export type SoldOutSunday = { city: string; startsAt: string; spotsLeft: number; href: string | null };

/** At most this many Sundays with seats, above the full ones. */
const OPEN_MAX = 2;

/**
 * The coming Sundays for the home page: the ones that still have seats first
 * (with a link to their date page), then the full ones; soonest first in each.
 */
export async function loadSoldOutSundays(locale: Locale = "nl", limit = 4): Promise<SoldOutSunday[]> {
  try {
    const rows = await getDb()
      .select({ city: events.city, startsAt: events.startsAt, capacity: events.capacity, spotsSold: events.spotsSold })
      .from(events)
      .where(
        and(
          eq(events.workflowStatus, "published"),
          inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE]),
          gt(events.startsAt, new Date()),
          // Not yet open for booking ("binnenkort"): left out.
          sql`coalesce((${events.extras}->>'comingSoon')::boolean, false) = false`,
        ),
      )
      .orderBy(asc(events.startsAt))
      .limit(40);
    const sundays = rows.map((r) => {
      const spotsLeft = Math.max(0, r.capacity - r.spotsSold);
      return {
        city: r.city,
        startsAt: r.startsAt.toISOString(),
        spotsLeft,
        href: spotsLeft > 0 ? sundaySocialDatePath(locale, { city: r.city, startsAt: r.startsAt }) : null,
      };
    });
    const open = sundays.filter((s) => s.spotsLeft > 0 && s.href).slice(0, OPEN_MAX);
    const full = sundays.filter((s) => s.spotsLeft === 0);
    return [...open, ...full].slice(0, limit);
  } catch {
    // The page still stands without this line.
    return [];
  }
}
