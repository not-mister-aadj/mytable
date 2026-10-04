import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";
import { isEnglishOpenForSundayTable } from "@/lib/booking-table-language";
import { JOUW_TAFEL_SEAT_PRICE_CENTS, bracketFromEventName, type QuizEvent } from "@/lib/jouw-tafel/logic";

/** One published Sunday Table for the table page, as the client gets it
 * (the funnel's own seat price, never a venue). Null when unknown. */
export async function getFunnelTable(slug: string): Promise<QuizEvent | null> {
  if (!isDbConfigured() || !/^[a-z0-9-]{1,200}$/.test(slug)) return null;
  const [row] = await getDb()
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.experienceType, "sunday-table"), eq(events.workflowStatus, "published")))
    .limit(1);
  if (!row) return null;
  const bracket = bracketFromEventName(row.nameNl);
  if (!bracket) return null;
  return {
    id: row.id,
    slug: row.slug,
    city: row.city,
    bracket,
    startsAt: row.startsAt.toISOString(),
    priceCents: JOUW_TAFEL_SEAT_PRICE_CENTS,
    capacity: row.capacity,
    spotsSold: row.spotsSold,
    comingSoon: Boolean(row.extras?.comingSoon),
    englishOpen: isEnglishOpenForSundayTable(row.id),
  };
}

/** Request time for the table pages (outside render, for the purity rule). */
export function tableNow(): number {
  return Date.now();
}
