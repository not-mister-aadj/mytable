import { and, eq, isNull, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "@/db/index";
import { bookings, customers, events } from "@/db/schema";
import { reservationCode } from "@/lib/booking-display";
import { normalizeEmail } from "@/lib/customers/normalize";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { QUIZ_METADATA_KEY } from "@/lib/jouw-tafel/quiz-logic";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** "Meet your table": the short introduction a Sunday Social guest fills in
 * right after payment, or later via the reminder email. */

export const INTRO_WINES = ["red", "white", "bubbles"] as const;
export type IntroWine = (typeof INTRO_WINES)[number];

export function isIntroWine(value: unknown): value is IntroWine {
  return INTRO_WINES.includes(value as IntroWine);
}

export const INTRO_CONVERSATION_STYLES = ["talker", "listener", "both"] as const;
export type IntroConversationStyle = (typeof INTRO_CONVERSATION_STYLES)[number];

export function isIntroConversationStyle(value: unknown): value is IntroConversationStyle {
  return INTRO_CONVERSATION_STYLES.includes(value as IntroConversationStyle);
}

export type SundayTableIntro = {
  /** Talker or listener at the table, used to balance the seating. */
  conversationStyle: IntroConversationStyle | null;
  askMeAbout: string;
  favoriteSpot: string;
  wine: IntroWine | null;
  intoNow: string;
  /** First name of the +1 on a 2-ticket booking; they always sit together. */
  plusOneName: string;
  shareConsent: boolean;
};

const MAX_ANSWER_LENGTH = 140;

function cleanAnswer(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_ANSWER_LENGTH) : "";
}

/** Normalizes untrusted input into an intro; unknown fields are dropped. */
export function parseSundayTableIntro(raw: unknown): SundayTableIntro {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    conversationStyle: isIntroConversationStyle(input.conversationStyle)
      ? input.conversationStyle
      : null,
    askMeAbout: cleanAnswer(input.askMeAbout),
    favoriteSpot: cleanAnswer(input.favoriteSpot),
    wine: isIntroWine(input.wine) ? input.wine : null,
    intoNow: cleanAnswer(input.intoNow),
    plusOneName: cleanAnswer(input.plusOneName).slice(0, 60),
    shareConsent: input.shareConsent === true,
  };
}

export function hasAnyIntroAnswer(intro: SundayTableIntro): boolean {
  return Boolean(
    intro.conversationStyle ||
      intro.askMeAbout ||
      intro.favoriteSpot ||
      intro.wine ||
      intro.intoNow ||
      intro.plusOneName,
  );
}

type IntroBooking = {
  id: string;
  seats: number;
  /** "MT-5B5230E1", the booking number guests see in their emails. */
  reservationCode: string;
  email: string;
  city: string;
  locale: string;
  customerName: string | null;
  intro: SundayTableIntro;
  answeredAt: Date | null;
  /** Not answered for this booking yet, but answered before: the form first
   * offers to keep those answers ("Zo laten" or "Aanpassen"). */
  reusable: boolean;
};

function toIntroBooking(row: {
  id: string;
  email: string;
  city: string;
  locale: string;
  customerName: string | null;
  seats: number;
  introConversationStyle: string | null;
  introPlusOneName: string | null;
  introAskMeAbout: string | null;
  introFavoriteSpot: string | null;
  introWine: string | null;
  introIntoNow: string | null;
  introShareConsent: boolean;
  introAnsweredAt: Date | null;
}): IntroBooking {
  return {
    id: row.id,
    seats: row.seats,
    reservationCode: reservationCode(row.id),
    email: row.email,
    city: row.city,
    locale: row.locale,
    customerName: row.customerName,
    intro: {
      conversationStyle: isIntroConversationStyle(row.introConversationStyle)
        ? row.introConversationStyle
        : null,
      askMeAbout: row.introAskMeAbout ?? "",
      favoriteSpot: row.introFavoriteSpot ?? "",
      wine: isIntroWine(row.introWine) ? row.introWine : null,
      intoNow: row.introIntoNow ?? "",
      plusOneName: row.introPlusOneName ?? "",
      shareConsent: row.introShareConsent,
    },
    answeredAt: row.introAnsweredAt,
    reusable: false,
  };
}

const introColumns = {
  id: bookings.id,
  email: bookings.email,
  city: events.city,
  locale: bookings.locale,
  customerName: bookings.customerName,
  seats: bookings.seats,
  introConversationStyle: bookings.introConversationStyle,
  introPlusOneName: bookings.introPlusOneName,
  introAskMeAbout: bookings.introAskMeAbout,
  introFavoriteSpot: bookings.introFavoriteSpot,
  introWine: bookings.introWine,
  introIntoNow: bookings.introIntoNow,
  introShareConsent: bookings.introShareConsent,
  introAnsweredAt: bookings.introAnsweredAt,
};

/** A paid Sunday Social booking, found by id or by Stripe checkout session. */
export async function findSundayTableIntroBooking(
  by: { bookingId: string } | { checkoutSessionId: string },
): Promise<IntroBooking | null> {
  const db = getDb();
  const [row] = await db
    .select(introColumns)
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        "bookingId" in by
          ? eq(bookings.id, by.bookingId)
          : eq(bookings.stripeCheckoutSessionId, by.checkoutSessionId),
        eq(bookings.paymentStatus, "paid"),
        eq(events.experienceType, "sunday-table"),
      ),
    )
    .limit(1);
  return row ? withCustomerIntro(toIntroBooking(row)) : null;
}

/** Parses "MT-5B5230E1", "mt 5b5230e1" or "5B5230E1" into the 8 hex
 * characters it is made of (see reservationCode), or null. */
function parseReservationCode(raw: string): string | null {
  const hex = raw.trim().toLowerCase().replace(/^mt/, "").replace(/[\s-]/g, "");
  return /^[0-9a-f]{8}$/.test(hex) ? hex : null;
}

/** For guests whose link lost its token: the booking number alone could be
 * mistyped onto someone else's booking, so it only counts together with the
 * email the booking was made with. Ambiguous codes match nothing. */
export async function findSundayTableIntroBookingByCode(
  code: string,
  email: string,
): Promise<IntroBooking | null> {
  const hex = parseReservationCode(code);
  const normalizedEmail = email.trim().toLowerCase();
  if (!hex || !normalizedEmail.includes("@")) return null;
  const db = getDb();
  const rows = await db
    .select(introColumns)
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        sql`replace(${bookings.id}::text, '-', '') like ${hex + "%"}`,
        sql`lower(${bookings.email}) = ${normalizedEmail}`,
        eq(bookings.paymentStatus, "paid"),
        eq(events.experienceType, "sunday-table"),
      ),
    )
    .limit(2);
  return rows.length === 1 ? withCustomerIntro(toIntroBooking(rows[0]!)) : null;
}

/** Saves the answers. Only fields that are filled in are written: a field
 * left empty keeps whatever was saved before, so opening the form blank and
 * saving one answer can never wipe the others. The first save with any
 * answer marks the intro as answered, which also stops the reminder email. */
export async function saveSundayTableIntro(
  bookingId: string,
  intro: SundayTableIntro,
): Promise<void> {
  const db = getDb();
  await db
    .update(bookings)
    .set({
      ...(intro.conversationStyle ? { introConversationStyle: intro.conversationStyle } : {}),
      ...(intro.askMeAbout ? { introAskMeAbout: intro.askMeAbout } : {}),
      ...(intro.favoriteSpot ? { introFavoriteSpot: intro.favoriteSpot } : {}),
      ...(intro.wine ? { introWine: intro.wine } : {}),
      ...(intro.intoNow ? { introIntoNow: intro.intoNow } : {}),
      ...(intro.plusOneName ? { introPlusOneName: intro.plusOneName } : {}),
      ...(intro.shareConsent ? { introShareConsent: true } : {}),
      ...(hasAnyIntroAnswer(intro) ? { introAnsweredAt: new Date() } : {}),
    })
    .where(eq(bookings.id, bookingId));
  await saveCustomerIntro(bookingId, intro);
}

/** One-click answer from the reminder email ("talker", "listener" or
 * "both"). Only fills an empty field, so a later click never overwrites what
 * someone chose on the page. */
export async function saveSundayTableIntroConversationStyle(
  bookingId: string,
  style: IntroConversationStyle,
): Promise<void> {
  const db = getDb();
  await db
    .update(bookings)
    .set({ introConversationStyle: style, introAnsweredAt: new Date() })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.introConversationStyle)));
  const customerId = await customerIdForBooking(bookingId);
  if (customerId) {
    await db
      .update(customers)
      .set({ introConversationStyle: style, introUpdatedAt: new Date() })
      .where(and(eq(customers.id, customerId), isNull(customers.introConversationStyle)));
  }
}

/* ---------- Answers kept on the person ---------- */

type CustomerIntro = Omit<SundayTableIntro, "plusOneName">;

/** The guest behind a booking: its customer link, or else the customer with
 * the same email. */
async function customerIdForBooking(bookingId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ customerId: bookings.customerId, email: bookings.email })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) return null;
  if (row.customerId) return row.customerId;
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(row.email)))
    .limit(1);
  return customer?.id ?? null;
}

export async function loadCustomerIntro(email: string): Promise<CustomerIntro | null> {
  const db = getDb();
  const [row] = await db
    .select({
      conversationStyle: customers.introConversationStyle,
      askMeAbout: customers.introAskMeAbout,
      favoriteSpot: customers.introFavoriteSpot,
      wine: customers.introWine,
      intoNow: customers.introIntoNow,
      shareConsent: customers.introShareConsent,
      updatedAt: customers.introUpdatedAt,
    })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(email)))
    .limit(1);
  if (!row?.updatedAt) return null;
  return {
    conversationStyle: isIntroConversationStyle(row.conversationStyle) ? row.conversationStyle : null,
    askMeAbout: row.askMeAbout ?? "",
    favoriteSpot: row.favoriteSpot ?? "",
    wine: isIntroWine(row.wine) ? row.wine : null,
    intoNow: row.intoNow ?? "",
    shareConsent: row.shareConsent,
  };
}

/** Fills a booking's empty answers with what the guest told us before. */
export function mergeIntro(booking: SundayTableIntro, saved: CustomerIntro | null): SundayTableIntro {
  if (!saved) return booking;
  return {
    conversationStyle: booking.conversationStyle ?? saved.conversationStyle,
    askMeAbout: booking.askMeAbout || saved.askMeAbout,
    favoriteSpot: booking.favoriteSpot || saved.favoriteSpot,
    wine: booking.wine ?? saved.wine,
    intoNow: booking.intoNow || saved.intoNow,
    plusOneName: booking.plusOneName,
    shareConsent: booking.shareConsent || saved.shareConsent,
  };
}

async function withCustomerIntro(booking: IntroBooking): Promise<IntroBooking> {
  const saved = await loadCustomerIntro(booking.email).catch(() => null);
  const reusable = !booking.answeredAt && Boolean(saved && hasAnyIntroAnswer({ ...saved, plusOneName: "" }));
  return { ...booking, intro: mergeIntro(booking.intro, saved), reusable };
}

/** Saves what was filled in on the person too (same rule as the booking: an
 * empty field keeps the earlier answer). */
async function saveCustomerIntro(bookingId: string, intro: SundayTableIntro): Promise<void> {
  const answers = { ...intro, plusOneName: "" };
  if (!hasAnyIntroAnswer(answers) && !intro.shareConsent) return;
  const customerId = await customerIdForBooking(bookingId);
  if (!customerId) return;
  const db = getDb();
  await db
    .update(customers)
    .set({
      ...(intro.conversationStyle ? { introConversationStyle: intro.conversationStyle } : {}),
      ...(intro.askMeAbout ? { introAskMeAbout: intro.askMeAbout } : {}),
      ...(intro.favoriteSpot ? { introFavoriteSpot: intro.favoriteSpot } : {}),
      ...(intro.wine ? { introWine: intro.wine } : {}),
      ...(intro.intoNow ? { introIntoNow: intro.intoNow } : {}),
      ...(intro.shareConsent ? { introShareConsent: true } : {}),
      introUpdatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));
  const booking = await findSundayTableIntroBooking({ bookingId }).catch(() => null);
  if (booking) await syncQuizAnswers(booking.email, intro).catch(() => undefined);
}

/** A new booking starts with the answers the guest gave before: copies them
 * into the booking's empty fields and marks it answered, so no reminder goes
 * out. Returns true when there was something to copy. */
export async function applyCustomerIntroToBooking(bookingId: string): Promise<boolean> {
  const db = getDb();
  const booking = await findSundayTableIntroBooking({ bookingId });
  if (!booking) return false;
  const saved = await loadCustomerIntro(booking.email);
  if (!saved || !hasAnyIntroAnswer({ ...saved, plusOneName: "" })) return false;
  const merged = mergeIntro(booking.intro, saved);
  await db
    .update(bookings)
    .set({
      introConversationStyle: merged.conversationStyle,
      introAskMeAbout: merged.askMeAbout || null,
      introFavoriteSpot: merged.favoriteSpot || null,
      introWine: merged.wine,
      introIntoNow: merged.intoNow || null,
      introShareConsent: merged.shareConsent,
      introAnsweredAt: sql`coalesce(${bookings.introAnsweredAt}, now())`,
    })
    .where(eq(bookings.id, bookingId));
  return true;
}

const TOKEN_PURPOSE = "sunday_table_intro";

/** Signing keys, first one signs. INTRO_TOKEN_SECRET is a key of its own that
 * is also known outside the server, so hand-sent mails can carry the same
 * one-click link; links signed with the general secret keep working. */
export function getTokenSecrets(): Uint8Array[] {
  const general =
    process.env.REVIEW_TOKEN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  const keys = [process.env.INTRO_TOKEN_SECRET?.trim(), general].filter((key): key is string => Boolean(key));
  if (keys.length === 0) throw new Error("INTRO_TOKEN_SECRET, REVIEW_TOKEN_SECRET or CRON_SECRET is required");
  return keys.map((key) => new TextEncoder().encode(key));
}

/** Link token for the reminder email, so the intro page opens without login
 * and only for this one booking. */
export async function signSundayTableIntroToken(bookingId: string): Promise<string> {
  return new SignJWT({ bookingId, purpose: TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${60 * 24 * 60 * 60}s`)
    .sign(getTokenSecrets()[0]!);
}

export async function verifySundayTableIntroToken(token: string): Promise<string | null> {
  for (const secret of getTokenSecrets()) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.purpose !== TOKEN_PURPOSE) return null;
      return typeof payload.bookingId === "string" ? payload.bookingId : null;
    } catch {
      // Not this key: try the next one.
    }
  }
  return null;
}

/** The answers someone can change on their profile ("Aan tafel"). */
export type PersonIntroPatch = Partial<Pick<SundayTableIntro, "conversationStyle" | "wine" | "askMeAbout" | "favoriteSpot" | "intoNow">>;

/**
 * Saves answers on the person (settings page, or the quiz for wine and
 * conversation) and on their Sunday tables still more than a day ahead, so
 * the seating uses them. An empty text clears that answer. With syncQuiz,
 * wine and conversation also go into the account's quiz answers, so both
 * places always show the same.
 */
export async function savePersonIntro(
  email: string,
  patch: PersonIntroPatch,
  options: { syncQuiz?: boolean; shareConsent?: boolean } = {},
): Promise<void> {
  const db = getDb();
  const key = normalizeEmail(email);
  const text = (v: string | undefined) => (v === undefined ? undefined : v.trim().slice(0, MAX_ANSWER_LENGTH) || null);
  const values = {
    ...(patch.conversationStyle !== undefined ? { introConversationStyle: patch.conversationStyle } : {}),
    ...(patch.wine !== undefined ? { introWine: patch.wine } : {}),
    ...(patch.askMeAbout !== undefined ? { introAskMeAbout: text(patch.askMeAbout) } : {}),
    ...(patch.favoriteSpot !== undefined ? { introFavoriteSpot: text(patch.favoriteSpot) } : {}),
    ...(patch.intoNow !== undefined ? { introIntoNow: text(patch.intoNow) } : {}),
  };
  if (Object.keys(values).length === 0) return;
  const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.emailNormalized, key)).limit(1);
  const customerId = existing?.id ?? (await upsertCustomerFromEmail({ email: key })).id;
  await db
    .update(customers)
    .set({ ...values, ...(options.shareConsent ? { introShareConsent: true } : {}), introUpdatedAt: new Date() })
    .where(eq(customers.id, customerId));
  await db.execute(sql`
    update bookings b set
      intro_conversation_style = ${"introConversationStyle" in values ? values.introConversationStyle ?? null : sql`b.intro_conversation_style`},
      intro_wine = ${"introWine" in values ? values.introWine ?? null : sql`b.intro_wine`},
      intro_ask_me_about = ${"introAskMeAbout" in values ? values.introAskMeAbout ?? null : sql`b.intro_ask_me_about`},
      intro_favorite_spot = ${"introFavoriteSpot" in values ? values.introFavoriteSpot ?? null : sql`b.intro_favorite_spot`},
      intro_into_now = ${"introIntoNow" in values ? values.introIntoNow ?? null : sql`b.intro_into_now`},
      intro_share_consent = ${options.shareConsent ? true : sql`b.intro_share_consent`}
    from events e
    where e.id = b.event_id and e.experience_type = 'sunday-table' and e.starts_at > now() + interval '1 day'
      and lower(b.email) = ${key} and b.payment_status = 'paid' and b.lifecycle_status = 'active'
  `);
  if (options.syncQuiz) await syncQuizAnswers(key, patch).catch(() => undefined);
}

/** Wine and conversation into the account's quiz answers (one answer for both places). */
async function syncQuizAnswers(email: string, intro: Pick<PersonIntroPatch, "conversationStyle" | "wine">): Promise<void> {
  if (!intro.conversationStyle && !intro.wine) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const [user] = (await getDb().execute(sql`
    select id, raw_user_meta_data as meta from auth.users where lower(email) = ${normalizeEmail(email)} limit 1
  `)) as unknown as Array<{ id: string; meta: Record<string, unknown> | null }>;
  if (!user) return;
  const meta = user.meta ?? {};
  const quiz = (meta[QUIZ_METADATA_KEY] ?? {}) as { answers?: Record<string, unknown> } & Record<string, unknown>;
  const answers = { ...(quiz.answers ?? {}) };
  if (intro.conversationStyle) answers.conversation = intro.conversationStyle;
  if (intro.wine) answers.wine = intro.wine;
  await createSupabaseAdminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, [QUIZ_METADATA_KEY]: { ...quiz, answers } },
  });
}
