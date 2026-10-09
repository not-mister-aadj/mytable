import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { EARLY_ACCESS_HOURS } from "@/lib/membership/logic";
import { MEMBERSHIP_OPEN } from "@/lib/membership/plans";

/**
 * When a Sunday Table opens for booking (published, or out of "binnenkort"),
 * members get it first: members_only_until becomes now + 48 hours. Only when
 * it is not set yet (an admin's own choice wins), and never for a table that
 * already sells seats (it was open before, it stays open).
 */
export async function applyMembersOnlyDefault(eventId: string): Promise<void> {
  // Nobody books earlier while the membership is not offered.
  if (!isDbConfigured() || !MEMBERSHIP_OPEN) return;
  await getDb().execute(sql`
    UPDATE events e
    SET members_only_until = now() + make_interval(hours => ${EARLY_ACCESS_HOURS}), updated_at = now()
    WHERE e.id = ${eventId}
      AND e.members_only_until IS NULL
      AND e.experience_type = 'jouw-tafel'
      AND e.workflow_status = 'published'
      AND coalesce((e.extras ->> 'comingSoon')::boolean, false) = false
      AND e.starts_at > now()
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.event_id = e.id AND b.payment_status = 'paid'
      )
  `);
}
