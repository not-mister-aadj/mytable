import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { eventNotifySignups, events } from "@/db/schema";
import { ensureAccountInBackground } from "@/lib/auth/ensure-auth-user-for-email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Adds (or silently keeps) one email on an event's mini "notify me" list. */
export async function addEventNotifySignup(input: {
  eventId: string;
  email: string;
  locale: string;
  /** YYYY-MM-DD: a seat that comes free is offered to who fits the group by age. */
  birthDate?: string | null;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  const birthDate = input.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) ? input.birthDate : null;
  const email = input.email.trim().toLowerCase();
  const [already] = await db
    .select({ id: eventNotifySignups.id })
    .from(eventNotifySignups)
    .where(and(eq(eventNotifySignups.eventId, input.eventId), eq(eventNotifySignups.email, email)))
    .limit(1);
  await db
    .insert(eventNotifySignups)
    .values({
      eventId: input.eventId,
      email: input.email.trim().toLowerCase(),
      locale: input.locale,
      birthDate,
    })
    .onConflictDoUpdate({
      target: [eventNotifySignups.eventId, eventNotifySignups.email],
      set: { birthDate: sql`coalesce(excluded.birth_date, ${eventNotifySignups.birthDate})` },
    });
  ensureAccountInBackground({ email: input.email, source: "notify", locale: input.locale });
  if (!already) await tellUsAboutWaitingMember(input.eventId, email).catch((error) => console.error("[notify] member mail failed", error));
}

/**
 * "Voorrang op de wachtlijst": a club member joined a Sunday's waitlist, so we
 * hear it at once and can add a table where possible. Only for a membership
 * that covers that Sunday.
 */
async function tellUsAboutWaitingMember(eventId: string, email: string): Promise<void> {
  // Loaded here: these modules reach back into this one.
  const [{ getRunningMembershipByEmail, membershipSnapshot }, { memberBookingDecision }, { firstNameForEmail }, { sendSundayMail }, { getEmailReplyTo }] = await Promise.all([
    import("@/lib/membership/data"),
    import("@/lib/membership/logic"),
    import("@/lib/invites/cities"),
    import("@/lib/admin/sunday-mails"),
    import("@/lib/email/resend"),
  ]);
  const [event] = await getDb().select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return;
  const covers = async (address: string) => {
    const snapshot = membershipSnapshot(await getRunningMembershipByEmail(address).catch(() => null));
    return Boolean(snapshot && memberBookingDecision(snapshot, event.startsAt).kind !== "non_member");
  };
  if (!(await covers(email))) return;
  const waiting = await getDb()
    .select({ email: eventNotifySignups.email })
    .from(eventNotifySignups)
    .where(and(eq(eventNotifySignups.eventId, eventId), isNull(eventNotifySignups.notifiedAt)));
  let members = 0;
  for (const w of waiting) if (await covers(w.email)) members += 1;
  const name = (await firstNameForEmail(email).catch(() => null)) ?? email;
  const date = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", day: "numeric", month: "short" }).format(event.startsAt);
  await sendSundayMail(getEmailReplyTo(), {
    subject: `[member wachtlijst] ${name} · ${event.city} ${date}`,
    text: [
      `${name} (${email}) is club member en staat op de wachtlijst voor ${event.city}, ${date}.`,
      "",
      `Op de wachtlijst: ${waiting.length}, waarvan ${members} member${members === 1 ? "" : "s"}.`,
      `Plekken: ${event.spotsSold} van ${event.capacity} verkocht.`,
    ].join("\n"),
  });
}

/** The birth date we already hold for this address (quiz, or a booking), or null: then the waitlist asks for it. */
export async function knownBirthDate(email: string): Promise<string | null> {
  if (!isDbConfigured()) return null;
  const me = email.trim().toLowerCase();
  const [row] = (await getDb().execute(sql`
    select coalesce(
      (select u.raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'birthDate' from auth.users u where lower(u.email) = ${me} limit 1),
      (select g.state->'answers'->>'birthDate' from jouw_tafel_guests g where lower(g.email) = ${me} and g.state->'answers'->>'birthDate' is not null order by g.updated_at desc limit 1),
      (select max(b.birth_date)::text from bookings b where lower(trim(b.email)) = ${me}),
      (select max(n.birth_date)::text from event_notify_signups n where n.email = ${me})
    ) as birth_date`)) as unknown as Array<{ birth_date: string | null }>;
  return row?.birth_date && /^\d{4}-\d{2}-\d{2}/.test(row.birth_date) ? row.birth_date.slice(0, 10) : null;
}

/** The language they chose in the quiz ("dutch" | "english" | "both"), or null: a mail follows it before the site's language. */
export async function quizLanguageOf(email: string): Promise<string | null> {
  if (!isDbConfigured()) return null;
  const me = email.trim().toLowerCase();
  const [row] = (await getDb().execute(sql`
    select coalesce(
      (select u.raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'language' from auth.users u where lower(u.email) = ${me} limit 1),
      (select g.state->'answers'->>'language' from jouw_tafel_guests g where lower(g.email) = ${me} and g.state->'answers'->>'language' is not null order by g.updated_at desc limit 1)
    ) as language`)) as unknown as Array<{ language: string | null }>;
  return row?.language ?? null;
}

/** Off the list again: tapping "Zet me op de wachtlijst" a second time. */
export async function removeEventNotifySignup(input: { eventId: string; email: string }): Promise<void> {
  if (!isDbConfigured()) return;
  await getDb()
    .delete(eventNotifySignups)
    .where(and(eq(eventNotifySignups.eventId, input.eventId), eq(eventNotifySignups.email, input.email.trim().toLowerCase())));
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
