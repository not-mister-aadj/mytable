import { and, eq, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "@/db/index";
import { bookings, events } from "@/db/schema";

/** "Meet your table": the short introduction a Sunday Table guest fills in
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
    shareConsent: input.shareConsent === true,
  };
}

export function hasAnyIntroAnswer(intro: SundayTableIntro): boolean {
  return Boolean(
    intro.conversationStyle ||
      intro.askMeAbout ||
      intro.favoriteSpot ||
      intro.wine ||
      intro.intoNow,
  );
}

type IntroBooking = {
  id: string;
  email: string;
  city: string;
  locale: string;
  customerName: string | null;
  intro: SundayTableIntro;
  answeredAt: Date | null;
};

function toIntroBooking(row: {
  id: string;
  email: string;
  city: string;
  locale: string;
  customerName: string | null;
  introConversationStyle: string | null;
  introAskMeAbout: string | null;
  introFavoriteSpot: string | null;
  introWine: string | null;
  introIntoNow: string | null;
  introShareConsent: boolean;
  introAnsweredAt: Date | null;
}): IntroBooking {
  return {
    id: row.id,
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
      shareConsent: row.introShareConsent,
    },
    answeredAt: row.introAnsweredAt,
  };
}

const introColumns = {
  id: bookings.id,
  email: bookings.email,
  city: events.city,
  locale: bookings.locale,
  customerName: bookings.customerName,
  introConversationStyle: bookings.introConversationStyle,
  introAskMeAbout: bookings.introAskMeAbout,
  introFavoriteSpot: bookings.introFavoriteSpot,
  introWine: bookings.introWine,
  introIntoNow: bookings.introIntoNow,
  introShareConsent: bookings.introShareConsent,
  introAnsweredAt: bookings.introAnsweredAt,
};

/** A paid Sunday Table booking, found by id or by Stripe checkout session. */
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
  return row ? toIntroBooking(row) : null;
}

/** Saves the answers. The first save with any answer marks the intro as
 * answered, which also stops the reminder email from going out. */
export async function saveSundayTableIntro(
  bookingId: string,
  intro: SundayTableIntro,
): Promise<void> {
  const db = getDb();
  await db
    .update(bookings)
    .set({
      introConversationStyle: intro.conversationStyle,
      introAskMeAbout: intro.askMeAbout || null,
      introFavoriteSpot: intro.favoriteSpot || null,
      introWine: intro.wine,
      introIntoNow: intro.intoNow || null,
      introShareConsent: intro.shareConsent,
      ...(hasAnyIntroAnswer(intro) ? { introAnsweredAt: new Date() } : {}),
    })
    .where(eq(bookings.id, bookingId));
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
}

const TOKEN_PURPOSE = "sunday_table_intro";

function getTokenSecret(): Uint8Array {
  const raw =
    process.env.REVIEW_TOKEN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!raw) throw new Error("REVIEW_TOKEN_SECRET or CRON_SECRET is required");
  return new TextEncoder().encode(raw);
}

/** Link token for the reminder email, so the intro page opens without login
 * and only for this one booking. */
export async function signSundayTableIntroToken(bookingId: string): Promise<string> {
  return new SignJWT({ bookingId, purpose: TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${60 * 24 * 60 * 60}s`)
    .sign(getTokenSecret());
}

export async function verifySundayTableIntroToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getTokenSecret());
    if (payload.purpose !== TOKEN_PURPOSE) return null;
    return typeof payload.bookingId === "string" ? payload.bookingId : null;
  } catch {
    return null;
  }
}
