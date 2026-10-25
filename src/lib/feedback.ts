import { SignJWT, jwtVerify } from "jose";
import { and, asc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingFeedback, bookings, eventGroups, eventVenues, events, venues } from "@/db/schema";
import { jouwTafelLogInPath, jouwTafelSettingsPath, type Locale } from "@/i18n/config";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { getRunningMembershipByEmail, membershipSnapshot } from "@/lib/membership/data";
import { isActiveMember } from "@/lib/membership/logic";
import { sundaySocialDatePath } from "@/lib/sunday-social-cities";
import { getProfilePhoto } from "@/lib/profile-photo";
import { getTokenSecrets } from "@/lib/sunday-table-intro";
import { tablePageAfterPath } from "@/lib/table-page";

/**
 * "Hoe was je middag?": the page behind the 20:00 mail on the Sunday itself,
 * one signed link per booking. Four faces first; what follows depends on
 * them (a quote with photo and the membership for a great afternoon, only
 * "what can be better" for a bad one).
 */

const TOKEN_PURPOSE = "feedback";
const SITE = "https://www.mytable.club";

export const MOODS = ["great", "good", "meh", "bad"] as const;
export type Mood = (typeof MOODS)[number];
export const isMood = (v: unknown): v is Mood => MOODS.includes(v as Mood);

export async function signFeedbackToken(bookingId: string): Promise<string> {
  return new SignJWT({ bookingId, purpose: TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${60 * 24 * 60 * 60}s`)
    .sign(getTokenSecrets()[0]!);
}

export async function verifyFeedbackToken(token: string): Promise<string | null> {
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

export async function feedbackUrl(bookingId: string, locale: "nl" | "en", base = SITE): Promise<string> {
  const token = await signFeedbackToken(bookingId);
  return `${base.replace(/\/$/, "")}${locale === "en" ? "/en" : ""}/hoe-was-het/${token}`;
}

export type FeedbackState = {
  mood: Mood | null;
  venueMood: Mood | null;
  highlight: string;
  improve: string;
  quoteConsent: boolean;
  photoUrl: string | null;
  contactOk: boolean;
  wantToSee: string[];
  /** Tablemates who weren't there, as they saw it. */
  missing: string[];
};

export type FeedbackPage = {
  bookingId: string;
  locale: "nl" | "en";
  firstName: string;
  city: string;
  venueName: string | null;
  member: boolean;
  /** Their profile photo; when there is one we don't ask for it again. */
  profilePhoto: string | null;
  /** First names at their table (not themselves), for "wie wil je vaker zien". */
  tablemates: { bookingId: string; firstName: string }[];
  /** The next bookable Sunday Social in their city. */
  next: { label: string; shortLabel: string; seatsLeft: number; path: string } | null;
  /** "De volgende is op ons" after Matig or Niet leuk: the dates they can
   * book for free on the page, or the one they already booked. Null when
   * it doesn't apply (no-show, used before). */
  freeSeat: { options: FreeSeatOption[]; booked: string | null } | null;
  /** Where "no next Sunday" points. */
  cityPath: string;
  /** "Alleen lid worden": log in, then "Word lid" in the settings. */
  joinPath: string;
  saved: FeedbackState;
};

export type FreeSeatOption = { eventId: string; label: string; seatsLeft: number };

/** admin_notes on a free seat booked from the feedback page; also how we
 * know someone used it (once per person). */
export const FREE_SEAT_NOTE = "Op ons (feedback)";
const FREE_SEAT_OPTIONS = 3;

const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] ?? "";

function emptyState(): FeedbackState {
  return { mood: null, venueMood: null, highlight: "", improve: "", quoteConsent: false, photoUrl: null, contactOk: false, wantToSee: [], missing: [] };
}

export async function loadFeedbackPage(bookingId: string, now = Date.now()): Promise<FeedbackPage | null> {
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "paid")))
    .limit(1);
  if (!row) return null;
  const { booking, event } = row;
  const locale = booking.locale === "en" ? "en" : "nl";

  const group = booking.groupId
    ? (await db.select().from(eventGroups).where(eq(eventGroups.id, booking.groupId)).limit(1))[0]
    : undefined;
  const [venue] = group
    ? await db.select({ name: venues.name }).from(venues).where(eq(venues.id, group.venueId)).limit(1)
    : await db
        .select({ name: venues.name })
        .from(eventVenues)
        .innerJoin(venues, eq(venues.id, eventVenues.venueId))
        .where(eq(eventVenues.eventId, event.id))
        .orderBy(asc(eventVenues.position))
        .limit(1);

  const mates = group
    ? await db
        .select({ id: bookings.id, name: bookings.customerName })
        .from(bookings)
        .where(
          and(
            eq(bookings.groupId, group.id),
            eq(bookings.paymentStatus, "paid"),
            eq(bookings.lifecycleStatus, "active"),
            isNull(bookings.cancelledLateAt),
            isNull(bookings.noShowAt),
          ),
        )
        .orderBy(asc(bookings.createdAt))
    : [];

  const [membership, profilePhoto] = await Promise.all([
    getRunningMembershipByEmail(booking.email).catch(() => null),
    getProfilePhoto(booking.email).catch(() => null),
  ]);
  // "Sunday Social · 35+": the next one never has another age group.
  const bracket = (name: string) => /·\s*(\d{2}\s*[-+]\s*\d{0,2}\+?)\s*$/.exec(name)?.[1]?.replace(/\s/g, "") ?? null;
  const ownBracket = bracket(event.nameNl);
  const candidates = await db
    .select()
    .from(events)
    .where(
      and(
        sql`lower(${events.city}) = lower(${event.city})`,
        inArray(events.experienceType, [JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE]),
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, new Date(now)),
        sql`${events.spotsSold} < ${events.capacity}`,
      ),
    )
    .orderBy(asc(events.startsAt))
    .limit(8);
  // A date with another age group is skipped as a whole: its page shows that one.
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
  const otherDays = new Set(
    candidates.filter((e) => ownBracket && bracket(e.nameNl) && bracket(e.nameNl) !== ownBracket).map((e) => day(e.startsAt)),
  );
  const open = candidates.filter((e) => !otherDays.has(day(e.startsAt)));
  const nextEvent = open[0];
  const nextPath = nextEvent ? sundaySocialDatePath(locale as Locale, { city: nextEvent.city, startsAt: nextEvent.startsAt }) : null;

  const [saved] = await db.select().from(bookingFeedback).where(eq(bookingFeedback.bookingId, booking.id)).limit(1);
  const longLabel = (d: Date) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(d);

  // Free seat: only for who came, and only after their first Matig or Niet
  // leuk (an earlier one, or a free seat used before, rules it out).
  const [earlierBad] = await db
    .select({ id: bookingFeedback.bookingId })
    .from(bookingFeedback)
    .innerJoin(bookings, eq(bookings.id, bookingFeedback.bookingId))
    .where(
      and(
        sql`lower(${bookings.email}) = lower(${booking.email})`,
        sql`${bookingFeedback.bookingId} <> ${booking.id}`,
        inArray(bookingFeedback.mood, ["meh", "bad"]),
        sql`${bookingFeedback.createdAt} < coalesce((select created_at from booking_feedback where booking_id = ${booking.id}), now())`,
      ),
    )
    .limit(1);
  const [used] = await db
    .select({ startsAt: events.startsAt, city: events.city })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        sql`lower(${bookings.email}) = lower(${booking.email})`,
        eq(bookings.adminNotes, FREE_SEAT_NOTE),
        eq(bookings.paymentStatus, "paid"),
      ),
    )
    .limit(1);
  const ownBookings = new Set(
    (
      await db
        .select({ eventId: bookings.eventId })
        .from(bookings)
        .where(and(sql`lower(${bookings.email}) = lower(${booking.email})`, eq(bookings.paymentStatus, "paid")))
    ).map((b) => b.eventId),
  );
  const freeSeat = used
    ? used.startsAt.getTime() > now
      ? { options: [], booked: `${used.city} · ${longLabel(used.startsAt)}` }
      : null
    : booking.noShowAt || earlierBad
      ? null
      : {
          options: open
            .filter((e) => !ownBookings.has(e.id))
            .slice(0, FREE_SEAT_OPTIONS)
            .map((e) => ({ eventId: e.id, label: `${e.city} · ${longLabel(e.startsAt)}`, seatsLeft: Math.max(0, e.capacity - e.spotsSold) })),
          booked: null,
        };
  return {
    bookingId: booking.id,
    locale,
    firstName: firstName(booking.customerName),
    city: event.city,
    venueName: venue?.name ?? null,
    member: isActiveMember(membershipSnapshot(membership)),
    profilePhoto,
    tablemates: mates.filter((m) => m.id !== booking.id).map((m) => ({ bookingId: m.id, firstName: firstName(m.name) || "Gast" })),
    next:
      nextEvent && nextPath
        ? {
            label: new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Europe/Amsterdam",
            }).format(nextEvent.startsAt),
            shortLabel: new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
              day: "numeric",
              month: "short",
              timeZone: "Europe/Amsterdam",
            }).format(nextEvent.startsAt),
            seatsLeft: Math.max(0, nextEvent.capacity - nextEvent.spotsSold),
            path: nextPath,
          }
        : null,
    freeSeat,
    cityPath: tablePageAfterPath(locale as Locale, event.city),
    joinPath: `${jouwTafelLogInPath(locale as Locale)}?naar=${encodeURIComponent(jouwTafelSettingsPath(locale as Locale))}`,
    saved: saved
      ? {
          mood: isMood(saved.mood) ? saved.mood : null,
          venueMood: isMood(saved.venueMood) ? saved.venueMood : null,
          highlight: saved.highlight ?? "",
          improve: saved.improve ?? "",
          quoteConsent: saved.quoteConsent,
          photoUrl: saved.photoUrl,
          contactOk: saved.contactOk,
          wantToSee: Array.isArray(saved.wantToSee) ? saved.wantToSee : [],
          missing: Array.isArray(saved.missing) ? saved.missing : [],
        }
      : emptyState(),
  };
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Saves what is given so far (the page saves after each answer). Want-to-see
 * only for members, and only people at their own table. */
export async function saveFeedback(bookingId: string, input: Partial<FeedbackState>): Promise<void> {
  const page = await loadFeedbackPage(bookingId);
  if (!page) throw new Error("Booking not found");
  const [booking] = await getDb().select({ eventId: bookings.eventId, groupId: bookings.groupId }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const venueId = booking?.groupId
    ? (await getDb().select({ venueId: eventGroups.venueId }).from(eventGroups).where(eq(eventGroups.id, booking.groupId)).limit(1))[0]?.venueId ?? null
    : null;
  const allowed = new Set(page.tablemates.map((m) => m.bookingId));
  const values = {
    ...(input.mood !== undefined ? { mood: isMood(input.mood) ? input.mood : null } : {}),
    ...(input.venueMood !== undefined ? { venueMood: isMood(input.venueMood) ? input.venueMood : null } : {}),
    ...(input.highlight !== undefined ? { highlight: text(input.highlight, 1000) || null } : {}),
    ...(input.improve !== undefined ? { improve: text(input.improve, 1000) || null } : {}),
    ...(input.quoteConsent !== undefined ? { quoteConsent: Boolean(input.quoteConsent) } : {}),
    ...(input.contactOk !== undefined ? { contactOk: Boolean(input.contactOk) } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
    ...(input.missing !== undefined ? { missing: (input.missing ?? []).filter((id) => allowed.has(id)) } : {}),
    ...(input.wantToSee !== undefined && page.member
      ? { wantToSee: (input.wantToSee ?? []).filter((id) => allowed.has(id)) }
      : {}),
  };
  await getDb()
    .insert(bookingFeedback)
    .values({ bookingId, eventId: booking!.eventId, venueId, ...values })
    .onConflictDoUpdate({ target: bookingFeedback.bookingId, set: { ...values, updatedAt: new Date() } });
}
