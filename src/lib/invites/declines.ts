import { and, asc, eq, gt, inArray, or } from "drizzle-orm";
import { getDb } from "@/db/index";
import { events, inviteDeclines } from "@/db/schema";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";

/** One "kan niet": this person can't come to this Sunday. */
export type Decline = { eventId: string; at: Date; sendId: string | null };

/** After a "kan niet" the next invite (for another Sunday) may come this soon. */
export const DECLINE_NEXT_DAYS = 14;

const key = (email: string) => email.trim().toLowerCase();

/** Every "kan niet", per address. */
export async function loadDeclines(): Promise<Map<string, Decline[]>> {
  const rows = await getDb()
    .select()
    .from(inviteDeclines)
    .catch(() => [] as Array<typeof inviteDeclines.$inferSelect>);
  const out = new Map<string, Decline[]>();
  for (const r of rows) {
    const list = out.get(r.emailNormalized) ?? [];
    list.push({ eventId: r.eventId, at: r.createdAt, sendId: r.sendId });
    out.set(r.emailNormalized, list);
  }
  return out;
}

/** The Sundays this address said it can't come to. */
export async function declinedEventIds(email: string): Promise<Set<string>> {
  const rows = await getDb()
    .select({ eventId: inviteDeclines.eventId })
    .from(inviteDeclines)
    .where(eq(inviteDeclines.emailNormalized, key(email)))
    .catch(() => [] as Array<{ eventId: string }>);
  return new Set(rows.map((r) => r.eventId));
}

/** Marks "kan niet"; a second mark for the same Sunday keeps the first. */
export async function declineEvent(input: { email: string; eventId: string; source: "mail" | "admin"; sendId?: string | null }): Promise<void> {
  await getDb()
    .insert(inviteDeclines)
    .values({ emailNormalized: key(input.email), eventId: input.eventId, source: input.source, sendId: input.sendId ?? null })
    .onConflictDoNothing();
}

/** Takes a "kan niet" back. */
export async function undeclineEvent(email: string, eventId: string): Promise<void> {
  await getDb()
    .delete(inviteDeclines)
    .where(and(eq(inviteDeclines.emailNormalized, key(email)), eq(inviteDeclines.eventId, eventId)));
}

/**
 * Whether a sent mail got a "kan niet" as its reaction: through its own link,
 * or marked by us (no link) within `windowMs` after it went out.
 */
export function declinedAfter(declines: Decline[], send: { id: string; sentAt: Date }, windowMs: number): boolean {
  return declines.some(
    (d) =>
      d.sendId === send.id ||
      (d.sendId === null && d.at.getTime() >= send.sentAt.getTime() && d.at.getTime() <= send.sentAt.getTime() + windowMs),
  );
}

/** The earliest moment for the next invite after their latest "kan niet", or null. */
export function nextAfterDecline(declines: Decline[]): Date | null {
  if (declines.length === 0) return null;
  const latest = Math.max(...declines.map((d) => d.at.getTime()));
  return new Date(latest + DECLINE_NEXT_DAYS * 24 * 60 * 60 * 1000);
}

/** For the admin: the coming Sundays in their cities (and any they marked), with "kan niet" per Sunday. */
export async function upcomingDeclines(
  email: string,
  cities: string[],
): Promise<Array<{ eventId: string; city: string; startsAt: Date; declined: { source: "mail" | "admin"; at: Date } | null }>> {
  const db = getDb();
  const mine = await db
    .select()
    .from(inviteDeclines)
    .where(eq(inviteDeclines.emailNormalized, key(email)))
    .catch(() => [] as Array<typeof inviteDeclines.$inferSelect>);
  const marked = new Map(mine.map((d) => [d.eventId, d]));
  const now = new Date();
  const rows = await db
    .select({ id: events.id, city: events.city, startsAt: events.startsAt })
    .from(events)
    .where(
      and(
        inArray(events.experienceType, [SUNDAY_SOCIAL_TYPE, JOUW_TAFEL_TYPE]),
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, now),
        or(
          cities.length > 0 ? inArray(events.city, cities) : undefined,
          marked.size > 0 ? inArray(events.id, [...marked.keys()]) : undefined,
        ),
      ),
    )
    .orderBy(asc(events.startsAt));
  if (cities.length === 0 && marked.size === 0) return [];
  return rows.map((r) => {
    const d = marked.get(r.id);
    return { eventId: r.id, city: r.city, startsAt: r.startsAt, declined: d ? { source: d.source, at: d.createdAt } : null };
  });
}
