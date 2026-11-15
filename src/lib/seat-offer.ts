import { SignJWT, jwtVerify } from "jose";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, events, seatReleases } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import { buttonMail, sendSundayMail, shortDate } from "@/lib/admin/sunday-mails";
import { isJouwTafelType } from "@/lib/event-concepts";
import { amsterdamDistrict, DISTRICT_LABELS, isAmsterdam } from "@/lib/jouw-tafel/districts";
import { resolveSeatPriceCents } from "@/lib/jouw-tafel/logic";
import { ageFitsGroup, languageFitsGroup, offerDiscountPct, offerMoment, offerPriceCents, offerStillOpen } from "@/lib/seat-offer-logic";
import { getTokenSecrets } from "@/lib/sunday-table-intro";

/**
 * A seat that came free after "Kun je toch niet?" (late-cancel.ts). The
 * Sunday stays full on the site. The seat is offered by mail to the people on
 * that Sunday's waitlist who fit the group with the gap (age, and the table's
 * language); the first to pay has it and joins that group. Nobody fits, or
 * the start is too near: the seat stays shut. Rules in seat-offer-logic.ts.
 */

const PURPOSE = "seat-offer";
const FROM = "MyTable <hallo@tafels.mytable.club>";
/** While someone is on Stripe's page, the seat is theirs for this long. */
const HOLD_MS = 35 * 60 * 1000;

type Release = typeof seatReleases.$inferSelect;
type EventRow = typeof events.$inferSelect;

// ---------------------------------------------------------------- the link

export async function signSeatOfferToken(releaseId: string, email: string, startsAt: Date): Promise<string> {
  return new SignJWT({ releaseId, email: email.trim().toLowerCase(), purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(startsAt.getTime() / 1000))
    .sign(getTokenSecrets()[0]!);
}

async function verifySeatOfferToken(token: string): Promise<{ releaseId: string; email: string } | null> {
  for (const secret of getTokenSecrets()) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.purpose !== PURPOSE) return null;
      return typeof payload.releaseId === "string" && typeof payload.email === "string"
        ? { releaseId: payload.releaseId, email: payload.email }
        : null;
    } catch {
      // Not this key: try the next one.
    }
  }
  return null;
}

export function seatOfferPath(locale: "nl" | "en", token: string): string {
  return `${locale === "en" ? "/en" : ""}/plek/${token}`;
}

// ------------------------------------------------------- what the page shows

export type SeatOffer = {
  releaseId: string;
  email: string;
  event: EventRow;
  /** "open": can be booked. "yours": they booked it. "taken": someone else has it (or is paying). "closed": too close to the start. */
  state: "open" | "yours" | "taken" | "closed";
  priceCents: number;
  fullPriceCents: number;
  discountPct: number;
  /** What we know of them, to fill in the form. */
  firstName: string;
  birthDate: string | null;
  locale: "nl" | "en";
  /** "Amsterdam Zuid · De Pijp", or the city. */
  place: string;
};

export async function loadSeatOffer(token: string, now: Date = new Date()): Promise<SeatOffer | null> {
  const claim = await verifySeatOfferToken(token);
  if (!claim) return null;
  const db = getDb();
  const [row] = await db
    .select({ release: seatReleases, event: events })
    .from(seatReleases)
    .innerJoin(events, eq(events.id, seatReleases.eventId))
    .where(eq(seatReleases.id, claim.releaseId))
    .limit(1);
  if (!row || !row.release.offeredTo.includes(claim.email)) return null;
  const { release, event } = row;
  const heldByOther = Boolean(release.heldBy && release.heldBy !== claim.email && release.heldUntil && release.heldUntil.getTime() > now.getTime());
  const [claimedBy] = release.claimedBookingId
    ? await db.select({ email: bookings.email }).from(bookings).where(eq(bookings.id, release.claimedBookingId)).limit(1)
    : [];
  const state =
    claimedBy?.email.trim().toLowerCase() === claim.email
      ? "yours"
      : release.claimedBookingId || heldByOther
        ? "taken"
        : offerStillOpen(event.startsAt, now) && event.workflowStatus === "published"
          ? "open"
          : "closed";
  const fullPriceCents = resolveSeatPriceCents({ eventPriceCents: event.priceCents, isJouwTafel: isJouwTafelType(event.experienceType) });
  const person = (await waitlistPeople(event.id, [claim.email])).get(claim.email);
  return {
    releaseId: release.id,
    email: claim.email,
    event,
    state,
    priceCents: offerPriceCents(fullPriceCents, event.startsAt, now),
    fullPriceCents,
    discountPct: offerDiscountPct(event.startsAt, now),
    firstName: person?.firstName ?? "",
    birthDate: person?.birthDate ?? null,
    locale: person?.locale ?? "nl",
    place: await placeOf(event),
  };
}

async function placeOf(event: EventRow): Promise<string> {
  if (!isAmsterdam(event.city)) return event.city;
  const [venue] = (await getDb().execute(sql`
    select v.area, v.address from event_venues ev join venues v on v.id = ev.venue_id
    where ev.event_id = ${event.id} order by ev.position limit 1`)) as unknown as Array<{ area: string | null; address: string | null }>;
  if (!venue) return event.city;
  const district = amsterdamDistrict(venue);
  const area = venue.area?.trim().replace(/^amsterdam[\s-]+/i, "") || null;
  const head = district ? `${event.city} ${DISTRICT_LABELS[district]}` : event.city;
  return area && area.toLowerCase() !== (district ? DISTRICT_LABELS[district].toLowerCase() : "") ? `${head} · ${area}` : head;
}

// ------------------------------------------------------------- the checkout

/** Keeps the seat for this person while they pay. False: someone else has it. */
export async function holdSeatOffer(releaseId: string, email: string, now: Date = new Date()): Promise<boolean> {
  const me = email.trim().toLowerCase();
  const held = await getDb()
    .update(seatReleases)
    .set({ heldBy: me, heldUntil: new Date(now.getTime() + HOLD_MS) })
    .where(
      and(
        eq(seatReleases.id, releaseId),
        isNull(seatReleases.claimedBookingId),
        sql`(${seatReleases.heldUntil} is null or ${seatReleases.heldUntil} < ${now.toISOString()}::timestamptz or ${seatReleases.heldBy} = ${me})`,
      ),
    )
    .returning({ id: seatReleases.id });
  return held.length > 0;
}

/**
 * Paid: the seat is theirs. The Sunday was full and stays full, so its
 * capacity grows by the seat (the cancelled booking keeps counting, it was
 * not refunded), and the booking joins the group with the gap. Returns true
 * when room was made (call before the seat is counted as sold).
 */
export async function claimSeatOffer(releaseId: string, bookingId: string): Promise<boolean> {
  const db = getDb();
  const [claimed] = await db
    .update(seatReleases)
    .set({ claimedBookingId: bookingId, heldBy: null, heldUntil: null })
    .where(and(eq(seatReleases.id, releaseId), sql`(${seatReleases.claimedBookingId} is null or ${seatReleases.claimedBookingId} = ${bookingId})`))
    .returning();
  if (!claimed) return false;
  await db.update(events).set({ capacity: sql`${events.capacity} + 1` }).where(eq(events.id, claimed.eventId));
  if (claimed.groupId) await db.update(bookings).set({ groupId: claimed.groupId }).where(eq(bookings.id, bookingId));
  return true;
}

// ------------------------------------------------------------ the waitlist

type Person = { email: string; locale: "nl" | "en"; firstName: string; birthDate: string | null; language: string | null };

/** The people on a Sunday's waitlist (or just `only`), with what we know of them. */
async function waitlistPeople(eventId: string, only?: string[]): Promise<Map<string, Person>> {
  const rows = (await getDb().execute(sql`
    select lower(trim(n.email)) as email, n.locale,
      coalesce(
        n.birth_date::text,
        (select u.raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'birthDate' from auth.users u where lower(u.email) = lower(trim(n.email)) limit 1),
        (select g.state->'answers'->>'birthDate' from jouw_tafel_guests g where lower(g.email) = lower(trim(n.email)) order by g.updated_at desc limit 1),
        (select max(b.birth_date)::text from bookings b where lower(trim(b.email)) = lower(trim(n.email)))
      ) as birth_date,
      coalesce(
        (select u.raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'language' from auth.users u where lower(u.email) = lower(trim(n.email)) limit 1),
        (select g.state->'answers'->>'language' from jouw_tafel_guests g where lower(g.email) = lower(trim(n.email)) order by g.updated_at desc limit 1)
      ) as language,
      coalesce(
        (select c.first_name from customers c where c.email_normalized = lower(trim(n.email)) limit 1),
        (select u.raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'name' from auth.users u where lower(u.email) = lower(trim(n.email)) limit 1)
      ) as first_name
    from event_notify_signups n
    where n.event_id = ${eventId}`)) as unknown as Array<{ email: string; locale: string; birth_date: string | null; language: string | null; first_name: string | null }>;
  const out = new Map<string, Person>();
  for (const r of rows) {
    if (only && !only.includes(r.email)) continue;
    out.set(r.email, {
      email: r.email,
      locale: r.language === "english" || (r.locale === "en" && r.language !== "dutch") ? "en" : "nl",
      firstName: r.first_name?.trim().split(/\s+/)[0] ?? "",
      birthDate: r.birth_date,
      language: r.language,
    });
  }
  return out;
}

const LANGUAGE_OF: Record<string, string> = { prefer_dutch: "dutch", prefer_english: "english", both_fine: "both" };

/** Who on the waitlist fits the group with the gap (or the whole Sunday, without groups). */
async function fittingPeople(release: Release, event: EventRow): Promise<Person[]> {
  const db = getDb();
  const still = and(
    eq(bookings.eventId, event.id),
    eq(bookings.paymentStatus, "paid"),
    eq(bookings.lifecycleStatus, "active"),
    isNull(bookings.cancelledLateAt),
    isNull(bookings.noShowAt),
  );
  const guests = await db
    .select({ email: bookings.email, birthDate: bookings.birthDate, language: bookings.tableLanguagePreference, groupId: bookings.groupId })
    .from(bookings)
    .where(still);
  const group = release.groupId ? guests.filter((g) => g.groupId === release.groupId) : guests;
  const going = new Set(guests.map((g) => g.email.trim().toLowerCase()));
  return [...(await waitlistPeople(event.id)).values()].filter(
    (p) =>
      !going.has(p.email) &&
      ageFitsGroup(p.birthDate, group.map((g) => g.birthDate), event.startsAt) &&
      languageFitsGroup(p.language, group.map((g) => LANGUAGE_OF[g.language ?? ""] ?? null)),
  );
}

// ------------------------------------------------------------- the offer

/** After a late cancellation: the seat is put up, to be offered now or at 08:00 (or never, too close to the start). */
export async function releaseSeat(input: { bookingId: string; eventId: string; groupId: string | null; startsAt: Date; now: Date }): Promise<Release> {
  const [release] = await getDb()
    .insert(seatReleases)
    .values({ eventId: input.eventId, groupId: input.groupId, fromBookingId: input.bookingId, offerAt: offerMoment(input.startsAt, input.now) })
    .returning();
  return release!;
}

export type SeatOfferResult = { releaseId: string; sent: number; fit: number };

/** Sends every offer that is due: right after a cancellation, and from the hourly cron for the ones that waited for the morning. */
export async function sendDueSeatOffers(now: Date = new Date()): Promise<SeatOfferResult[]> {
  const db = getDb();
  const due = await db
    .select({ release: seatReleases, event: events })
    .from(seatReleases)
    .innerJoin(events, eq(events.id, seatReleases.eventId))
    .where(and(isNull(seatReleases.offeredAt), isNull(seatReleases.claimedBookingId), sql`${seatReleases.offerAt} <= ${now.toISOString()}::timestamptz`));
  const results: SeatOfferResult[] = [];
  for (const { release, event } of due) {
    // One round per seat: claimed here, so a second run cannot mail again.
    const [mine] = await db
      .update(seatReleases)
      .set({ offeredAt: now })
      .where(and(eq(seatReleases.id, release.id), isNull(seatReleases.offeredAt)))
      .returning({ id: seatReleases.id });
    if (!mine) continue;
    if (!offerStillOpen(event.startsAt, now) || event.workflowStatus !== "published") {
      results.push({ releaseId: release.id, sent: 0, fit: 0 });
      continue;
    }
    const people = await fittingPeople(release, event);
    const sentTo: string[] = [];
    const place = await placeOf(event);
    for (const person of people) {
      const token = await signSeatOfferToken(release.id, person.email, event.startsAt);
      const url = `${getSiteUrl().replace(/\/$/, "")}${seatOfferPath(person.locale, token)}`;
      const mail = seatOfferMail({ locale: person.locale, firstName: person.firstName, city: event.city, place, startsAt: event.startsAt, url, now, fullPriceCents: resolveSeatPriceCents({ eventPriceCents: event.priceCents, isJouwTafel: isJouwTafelType(event.experienceType) }) });
      const id = await sendSundayMail(person.email, { ...mail, from: FROM }).catch(() => null);
      if (id) sentTo.push(person.email);
    }
    await db.update(seatReleases).set({ offeredTo: sentTo }).where(eq(seatReleases.id, release.id));
    results.push({ releaseId: release.id, sent: sentTo.length, fit: people.length });
  }
  return results;
}

const euros = (cents: number) => (cents % 100 === 0 ? `€${cents / 100}` : `€${(cents / 100).toFixed(2).replace(".", ",")}`);

/** The offer, as a mail that reads like a personal one. */
export function seatOfferMail(p: {
  locale: "nl" | "en";
  firstName: string;
  city: string;
  place: string;
  startsAt: Date;
  url: string;
  now: Date;
  fullPriceCents: number;
}): { subject: string; text: string; html: string } {
  const nl = p.locale === "nl";
  const day = new Intl.DateTimeFormat(nl ? "nl-NL" : "en-GB", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long" }).format(p.startsAt);
  const price = offerPriceCents(p.fullPriceCents, p.startsAt, p.now);
  const cheaper = price < p.fullPriceCents;
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const lines = nl
    ? [
        hi,
        "",
        `Je staat op de wachtlijst voor ${day} in ${p.city}. Er is één plek vrijgekomen, aan een tafel met mensen van rond jouw leeftijd.`,
        "",
        ...(cheaper ? [`De groepjes zijn al grotendeels gevormd, daarom is deze plek ${euros(price)} in plaats van ${euros(p.fullPriceCents)}.`, ""] : []),
        "Wie het eerst reserveert, heeft de plek:",
        p.url,
        "",
        "Tot zondag,",
        "MyTable",
      ]
    : [
        hi,
        "",
        `You're on the waitlist for ${day} in ${p.city}. One seat has come free, at a table with people around your age.`,
        "",
        ...(cheaper ? [`The groups are largely made already, so this seat is ${euros(price)} instead of ${euros(p.fullPriceCents)}.`, ""] : []),
        "The first to reserve has the seat:",
        p.url,
        "",
        "See you Sunday,",
        "MyTable",
      ];
  const mail = buttonMail(lines.join("\n"), p.url, nl ? "Reserveer je plek" : "Reserve your seat");
  return {
    subject: nl ? `Er is een plek vrij: ${shortDate(p.startsAt, "nl")} in ${p.city}` : `A seat has come free: ${shortDate(p.startsAt, "en")} in ${p.city}`,
    ...mail,
  };
}

/** For our own notice of a cancellation: what happens with the seat. */
export function releaseLine(release: Release, result: SeatOfferResult | undefined): string {
  if (!release.offerAt) return "Plek niet aangeboden: minder dan 4 uur voor de start";
  if (!result) {
    const at = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(release.offerAt);
    return `Plek wordt aangeboden: ${at}`;
  }
  return result.sent > 0 ? `Plek aangeboden aan ${result.sent} van de wachtlijst` : "Plek niet aangeboden: niemand op de wachtlijst past";
}

export type { Release as SeatRelease };
