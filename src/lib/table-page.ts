import { SignJWT, jwtVerify } from "jose";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, eventGroups, eventVenues, events, venues } from "@/db/schema";
import { sundayTableLpCityPath, sundayTableLpPath, type Locale } from "@/i18n/config";
import { hasSundaySocialCityPage, sundaySocialSlugFromCity } from "@/lib/sunday-social-cities";
import { getTokenSecrets, isIntroWine, type IntroWine } from "@/lib/sunday-table-intro";
import { venueTransit } from "@/lib/venue-about";
import { parseVenuePicks, picksVisible, type VenuePick } from "@/lib/venue-picks";

/**
 * "Jouw tafel": a page per booking, reached by a signed link from the
 * Saturday and Sunday morning mails, with the group, who sits there and our
 * picks. It only exists until the evening of the Sunday itself, so no list
 * of names lingers anywhere afterwards. You see your tablemates only once you
 * share your own answers.
 */

const TOKEN_PURPOSE = "table-page";
const SITE = "https://www.mytable.club";
/** The page ends at 18:00 on a 14:00 Sunday. */
const OPEN_AFTER_START_MS = 4 * 60 * 60 * 1000;

export async function signTablePageToken(bookingId: string): Promise<string> {
  return new SignJWT({ bookingId, purpose: TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${30 * 24 * 60 * 60}s`)
    .sign(getTokenSecrets()[0]!);
}

export async function verifyTablePageToken(token: string): Promise<string | null> {
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

export async function tablePageUrl(bookingId: string, locale: "nl" | "en", base = SITE): Promise<string> {
  const token = await signTablePageToken(bookingId);
  return `${base.replace(/\/$/, "")}${locale === "en" ? "/en" : ""}/aan-tafel/${token}`;
}

export function tablePageClosesAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() + OPEN_AFTER_START_MS);
}

/** Where an ended page sends people: the Sundays they can book next. */
export function tablePageAfterPath(locale: Locale, city: string): string {
  const slug = sundaySocialSlugFromCity(city);
  return slug && hasSundaySocialCityPage(slug) ? sundayTableLpCityPath(locale, slug) : sundayTableLpPath(locale);
}

export type TableMate = {
  bookingId: string;
  firstName: string;
  /** "komt met Petra": someone's +1. */
  withName?: string;
  /** Null until they filled in and shared their answers. */
  answers: { askMeAbout?: string; favoriteSpot?: string; intoNow?: string; wine?: IntroWine } | null;
};

export type TablePage = {
  bookingId: string;
  locale: "nl" | "en";
  city: string;
  startsAt: Date;
  closesAt: Date;
  /** Past 18:00 on the Sunday: the page sends people on. */
  closed: boolean;
  /** The Sunday is today, tomorrow or later (Amsterdam). */
  day: "today" | "tomorrow" | "later";
  venue: { name: string; address: string | null; transit: string | null } | null;
  groupNumber: number | null;
  me: { firstName: string; plusOneName: string | null; answered: boolean; shared: boolean };
  /** Including the visitor (first) and any +1s. Empty until they are seated. */
  mates: TableMate[];
  /** Null before 09:00 on the day; [] when the venue has none. */
  picks: VenuePick[] | null;
  /** What the table likes to drink, for when there are no picks. */
  wines: Record<IntroWine, number>;
};

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);

const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] ?? "";

type BookingRow = typeof bookings.$inferSelect;

function answered(b: BookingRow): boolean {
  return Boolean(
    b.introAnsweredAt ||
      [b.introAskMeAbout, b.introFavoriteSpot, b.introIntoNow].some((v) => v?.trim()) ||
      b.introWine ||
      b.introConversationStyle,
  );
}

function sharedAnswers(b: BookingRow): TableMate["answers"] {
  if (!b.introShareConsent || !answered(b)) return null;
  return {
    askMeAbout: b.introAskMeAbout?.trim() || undefined,
    favoriteSpot: b.introFavoriteSpot?.trim() || undefined,
    intoNow: b.introIntoNow?.trim() || undefined,
    wine: isIntroWine(b.introWine) ? b.introWine : undefined,
  };
}

export async function loadTablePage(bookingId: string, now = Date.now()): Promise<TablePage | null> {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active")))
    .limit(1);
  if (!row) return null;
  const { booking, event } = row;

  const group = booking.groupId
    ? (await db.select().from(eventGroups).where(eq(eventGroups.id, booking.groupId)).limit(1))[0]
    : undefined;
  // The venue of their group, else the Sunday's first venue.
  const [venue] = group
    ? await db.select().from(venues).where(eq(venues.id, group.venueId)).limit(1)
    : await db
        .select({ v: venues })
        .from(eventVenues)
        .innerJoin(venues, eq(venues.id, eventVenues.venueId))
        .where(eq(eventVenues.eventId, event.id))
        .orderBy(asc(eventVenues.position))
        .limit(1)
        .then((rows) => rows.map((r) => r.v));

  const tableRows = group
    ? await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.eventId, event.id),
            eq(bookings.groupId, group.id),
            eq(bookings.paymentStatus, "paid"),
            inArray(bookings.lifecycleStatus, ["active"]),
          ),
        )
        .orderBy(asc(bookings.createdAt))
    : [booking];

  const ordered = [booking, ...tableRows.filter((b) => b.id !== booking.id)];
  const mates: TableMate[] = [];
  const wines: Record<IntroWine, number> = { red: 0, white: 0, bubbles: 0 };
  for (const b of ordered) {
    mates.push({ bookingId: b.id, firstName: firstName(b.customerName) || "Gast", answers: sharedAnswers(b) });
    const plusOne = b.seats >= 2 ? b.introPlusOneName?.trim() : "";
    if (plusOne) mates.push({ bookingId: `${b.id}+1`, firstName: plusOne, withName: firstName(b.customerName), answers: null });
    if (isIntroWine(b.introWine)) wines[b.introWine] += 1;
  }

  const locale = booking.locale === "en" ? "en" : "nl";
  return {
    bookingId: booking.id,
    locale,
    city: event.city,
    startsAt: event.startsAt,
    closesAt: tablePageClosesAt(event.startsAt),
    closed: now >= tablePageClosesAt(event.startsAt).getTime(),
    day:
      dayKey(event.startsAt) === dayKey(new Date(now))
        ? "today"
        : dayKey(event.startsAt) === dayKey(new Date(now + 86_400_000))
          ? "tomorrow"
          : "later",
    venue: venue ? { name: venue.name, address: venue.address, transit: venueTransit(venue.name, locale) } : null,
    groupNumber: group?.number ?? null,
    me: {
      firstName: firstName(booking.customerName),
      plusOneName: booking.seats >= 2 ? booking.introPlusOneName?.trim() || null : null,
      answered: answered(booking),
      shared: answered(booking) && booking.introShareConsent,
    },
    mates: group ? mates : [],
    picks: picksVisible(event.startsAt, now) ? parseVenuePicks(venue?.picks) : null,
    wines,
  };
}

/** The visitor shares answers they gave before without sharing. */
export async function shareTablePageIntro(bookingId: string): Promise<void> {
  await getDb().update(bookings).set({ introShareConsent: true }).where(eq(bookings.id, bookingId));
}
