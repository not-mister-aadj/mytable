import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { events, inviteDeclines, inviteSends } from "@/db/schema";

export type DeclineLink = {
  sendId: string;
  email: string;
  eventId: string;
  city: string;
  startsAt: Date;
  declined: boolean;
};

/** The Sunday behind /niet/{code}{n}: the n-th Sunday of that invite. */
export async function loadDeclineLink(raw: string): Promise<DeclineLink | null> {
  const match = raw.match(/^([A-Za-z0-9]{8})(\d)$/);
  if (!match) return null;
  const index = Number(match[2]);
  if (index < 1) return null;
  const db = getDb();
  const [send] = await db.select().from(inviteSends).where(eq(inviteSends.code, match[1]!)).limit(1);
  const eventId = send?.eventIds[index - 1];
  if (!send || !eventId) return null;
  const [event] = await db.select({ city: events.city, startsAt: events.startsAt }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;
  const [done] = await db
    .select({ id: inviteDeclines.id })
    .from(inviteDeclines)
    .where(and(eq(inviteDeclines.emailNormalized, send.emailNormalized), eq(inviteDeclines.eventId, eventId)))
    .limit(1);
  return { sendId: send.id, email: send.emailNormalized, eventId, city: event.city, startsAt: event.startsAt, declined: Boolean(done) };
}
