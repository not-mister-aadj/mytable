import type { User } from "@supabase/supabase-js";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, isDbConfigured } from "@/db/index";
import { jouwTafelGuests } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { QUIZ_LEAD_SENT_KEY, QUIZ_METADATA_KEY, hasAnyAnswer, sanitizeQuizState, type QuizState } from "@/lib/jouw-tafel/quiz-logic";

/**
 * "Jouw tafel" before an account. Someone gives only an email, does the
 * quiz and sees "Kies je zondag"; the account (email code) comes when they
 * reserve. Until then the quiz lives in jouw_tafel_guests, and the row id
 * sits in an httpOnly cookie: only this browser (or the welcome mail's
 * link) opens those answers, never someone who just types the address.
 */
export const GUEST_COOKIE = "mt_jt_guest";
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JouwTafelGuest = {
  id: string;
  email: string;
  locale: Locale;
  state: QuizState;
  leadSentAt: Date | null;
};

/** Who is doing the quiz: an account, a guest (email only), or nobody. */
export type QuizPerson =
  | { kind: "user"; user: User & { email: string } }
  | { kind: "guest"; guest: JouwTafelGuest };

export function isGuestId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export const guestCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: GUEST_COOKIE_MAX_AGE,
};

function toGuest(row: typeof jouwTafelGuests.$inferSelect): JouwTafelGuest {
  return {
    id: row.id,
    email: row.email,
    locale: row.locale === "en" ? "en" : "nl",
    state: sanitizeQuizState(row.state),
    leadSentAt: row.leadSentAt,
  };
}

/** The open guest row for an id (not yet moved into an account). */
export async function getGuestById(id: string): Promise<JouwTafelGuest | null> {
  if (!isDbConfigured() || !isGuestId(id)) return null;
  const [row] = await getDb()
    .select()
    .from(jouwTafelGuests)
    .where(and(eq(jouwTafelGuests.id, id), isNull(jouwTafelGuests.userId)))
    .limit(1);
  return row ? toGuest(row) : null;
}

/** The guest behind this browser's cookie, if any. */
export async function getCookieGuest(): Promise<JouwTafelGuest | null> {
  const id = (await cookies()).get(GUEST_COOKIE)?.value;
  return id ? getGuestById(id).catch(() => null) : null;
}

/** A new guest row for this email (the caller sets the cookie). */
export async function createGuest(input: { email: string; locale: Locale }): Promise<JouwTafelGuest> {
  const [row] = await getDb()
    .insert(jouwTafelGuests)
    .values({ email: input.email.trim().toLowerCase(), locale: input.locale })
    .returning();
  return toGuest(row);
}

/** `leadSent`: Meta's Lead went out for them. `fromWaitlist`: they came
 * through the waitlist, which already sent its own Lead and welcome mail,
 * so neither goes out again for this row. */
export async function saveGuestState(
  id: string,
  state: QuizState,
  options: { leadSent?: boolean; fromWaitlist?: boolean } = {},
): Promise<void> {
  const now = new Date();
  await getDb()
    .update(jouwTafelGuests)
    .set({
      state: state as unknown as Record<string, unknown>,
      updatedAt: now,
      ...(options.leadSent || options.fromWaitlist ? { leadSentAt: now } : {}),
      ...(options.fromWaitlist ? { welcomeSentAt: now } : {}),
    })
    .where(eq(jouwTafelGuests.id, id));
}

/** True when this address already belongs to an account (they log in). */
export async function emailHasAccount(email: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const rows = (await getDb().execute(sql`
    select 1 as x from auth.users where lower(email) = ${email.trim().toLowerCase()} limit 1
  `)) as unknown as Array<{ x: number }>;
  return rows.length > 0;
}

/**
 * Right after someone confirms their email (the account exists): moves the
 * guest quiz into the account, so the quiz never asks again. Takes the
 * cookie's row, else the newest open row for that (now proven) address.
 * An account that already has answers keeps its own. Returns the user with
 * the answers in place.
 */
export async function adoptGuestQuiz<T extends User>(user: T): Promise<T> {
  if (!user.email || !isDbConfigured()) return user;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (hasAnyAnswer(sanitizeQuizState(meta[QUIZ_METADATA_KEY]).answers)) return user;

  const email = user.email.trim().toLowerCase();
  const cookieGuest = await getCookieGuest();
  let guest = cookieGuest && cookieGuest.email === email ? cookieGuest : null;
  if (!guest) {
    const [row] = await getDb()
      .select()
      .from(jouwTafelGuests)
      .where(and(eq(jouwTafelGuests.email, email), isNull(jouwTafelGuests.userId)))
      .orderBy(desc(jouwTafelGuests.updatedAt))
      .limit(1);
    guest = row ? toGuest(row) : null;
  }
  if (!guest || !hasAnyAnswer(guest.state.answers)) return user;

  const nextMeta = {
    ...meta,
    [QUIZ_METADATA_KEY]: guest.state,
    ...(guest.leadSentAt && !meta[QUIZ_LEAD_SENT_KEY] ? { [QUIZ_LEAD_SENT_KEY]: guest.leadSentAt.toISOString() } : {}),
  };
  const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(user.id, { user_metadata: nextMeta });
  if (error) {
    console.error("[jouw-tafel guest] moving answers into the account failed:", error.message);
    return user;
  }
  await getDb().update(jouwTafelGuests).set({ userId: user.id, updatedAt: new Date() }).where(eq(jouwTafelGuests.id, guest.id));
  return { ...user, user_metadata: nextMeta };
}

/** The account (with any guest answers moved in), else the cookie's guest. */
export async function getQuizPerson(): Promise<QuizPerson | null> {
  const user = await getMemberUser();
  if (user?.email) {
    const adopted = await adoptGuestQuiz(user).catch((error: unknown) => {
      console.error("[jouw-tafel guest] adopt failed:", error);
      return user;
    });
    return { kind: "user", user: { ...adopted, email: user.email } };
  }
  const guest = await getCookieGuest();
  return guest ? { kind: "guest", guest } : null;
}
