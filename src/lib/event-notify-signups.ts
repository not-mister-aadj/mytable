import { and, eq, isNull } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { eventNotifySignups } from "@/db/schema";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Adds (or silently keeps) one email on an event's mini "notify me" list. */
export async function addEventNotifySignup(input: {
  eventId: string;
  email: string;
  locale: string;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db
    .insert(eventNotifySignups)
    .values({
      eventId: input.eventId,
      email: input.email.trim().toLowerCase(),
      locale: input.locale,
    })
    .onConflictDoNothing();
}

export async function getUnnotifiedEventSignups(eventId: string) {
  if (!isDbConfigured()) return [];
  const db = getDb();
  return db
    .select()
    .from(eventNotifySignups)
    .where(
      and(
        eq(eventNotifySignups.eventId, eventId),
        isNull(eventNotifySignups.notifiedAt),
      ),
    );
}

export async function markEventSignupNotified(id: string): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db
    .update(eventNotifySignups)
    .set({ notifiedAt: new Date() })
    .where(eq(eventNotifySignups.id, id));
}
