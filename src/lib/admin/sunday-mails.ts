import type { ReactElement } from "react";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, eventGroups, eventVenues, events, venues } from "@/db/schema";
import { SundayLocationEmail } from "@/emails/SundayLocationEmail";
import { SundayMorningEmail } from "@/emails/SundayMorningEmail";
import { SundaySaturdayEmail } from "@/emails/SundaySaturdayEmail";
import { normalizeEmail } from "@/lib/customers/normalize";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import { getEmailFrom, getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { signSundayTableIntroToken } from "@/lib/sunday-table-intro";
import { tablePageUrl } from "@/lib/table-page";
import { parseVenuePicks, type VenuePick } from "@/lib/venue-picks";
import { venueTransit } from "@/lib/venue-about";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/** The mails sent from a Sunday's page in admin: the location a week
 * before, on Saturday the group with a link to the table page, and on
 * Sunday morning our picks. */
export type SundayMailKind = "location" | "saturday" | "morning";

const SITE = "https://www.mytable.club";

type Guest = {
  bookingId: string;
  email: string;
  firstName: string;
  locale: "nl" | "en";
  plusOneName: string | null;
  groupId: string | null;
  groupNumber: number | null;
  /** The open questions are still empty. */
  needsIntro: boolean;
  sentLocation: boolean;
  sentSaturday: boolean;
  sentMorning: boolean;
};

/** A mail handed to Resend with a send time, per guest (events.extras.mailSchedule). */
export type ScheduledMail = { at: string; ids: { bookingId: string; resendId: string }[] };

export type SundayMailContext = {
  eventId: string;
  city: string;
  startsAt: Date;
  venue: { name: string; area: string | null; address: string; descriptionNl: string | null; descriptionEn: string | null } | null;
  /** The picks of the Sunday's (first) venue. */
  picks: VenuePick[];
  /** Mails waiting at Resend for their send time. */
  schedule: Partial<Record<SundayMailKind, ScheduledMail>>;
  guests: Guest[];
};

const LOCATION_SENT = sql.raw(
  `(subject ilike '%locatie%' or subject ilike '%location%' or subject ilike '%je Sunday Social bij%' or subject ilike '%your Sunday Social at%')`,
);
const SATURDAY_SENT = sql.raw(`(subject ilike '%groep %' or subject ilike '%group %')`);
const MORNING_SENT = sql.raw(`(subject ilike '%aanraders%' or subject ilike '%our picks%')`);

function firstSentence(text: string | null | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;
  const m = t.match(/^.+?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
}

export async function loadSundayMailContext(eventId: string): Promise<SundayMailContext | null> {
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;
  const [venue] = await db
    .select({
      name: venues.name,
      area: venues.area,
      address: venues.address,
      descriptionNl: venues.descriptionNl,
      descriptionEn: venues.descriptionEn,
      picks: venues.picks,
    })
    .from(eventVenues)
    .innerJoin(venues, eq(venues.id, eventVenues.venueId))
    .where(eq(eventVenues.eventId, eventId))
    .orderBy(asc(eventVenues.position))
    .limit(1);

  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.eventId, eventId), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active")))
    .orderBy(asc(bookings.createdAt));
  const groupIds = [...new Set(rows.map((r) => r.groupId).filter((id): id is string => Boolean(id)))];
  const groups = groupIds.length
    ? await db.select({ id: eventGroups.id, number: eventGroups.number }).from(eventGroups).where(inArray(eventGroups.id, groupIds))
    : [];
  const numberById = new Map(groups.map((g) => [g.id, g.number]));

  const emails = rows.map((r) => normalizeEmail(r.email));
  const since = (days: number) => new Date(event.startsAt.getTime() - days * 86_400_000);
  const sent = async (pattern: ReturnType<typeof sql.raw>, days: number) =>
    emails.length
      ? new Set(
          (
            await db.execute<{ email_normalized: string }>(sql`
              select distinct email_normalized from email_log
              where email_normalized in (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})
                and sent_at > ${since(days).toISOString()}::timestamptz and ${pattern}`)
          ).map((r) => r.email_normalized),
        )
      : new Set<string>();
  const [locationSent, saturdaySent, morningSent] = await Promise.all([
    sent(LOCATION_SENT, 10),
    sent(SATURDAY_SENT, 4),
    sent(MORNING_SENT, 2),
  ]);

  const guests: Guest[] = rows.map((b) => {
    const open = [b.introAskMeAbout, b.introFavoriteSpot, b.introIntoNow].some((v) => v?.trim());
    const key = normalizeEmail(b.email);
    return {
      bookingId: b.id,
      email: b.email.trim(),
      firstName: b.customerName?.trim().split(/\s+/)[0] || "",
      locale: b.locale === "en" ? "en" : "nl",
      plusOneName: b.seats >= 2 ? b.introPlusOneName?.trim() || null : null,
      groupId: b.groupId,
      groupNumber: b.groupId ? (numberById.get(b.groupId) ?? null) : null,
      needsIntro: !open,
      sentLocation: locationSent.has(key),
      sentSaturday: saturdaySent.has(key),
      sentMorning: morningSent.has(key),
    };
  });

  return {
    eventId,
    city: event.city,
    startsAt: event.startsAt,
    venue: venue && venue.address ? { ...venue, address: venue.address } : null,
    picks: parseVenuePicks(venue?.picks),
    schedule: parseSchedule(event.extras?.mailSchedule),
    guests,
  };
}

function mapsUrl(venueName: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName}, ${address}`)}`;
}

async function introUrl(bookingId: string, locale: "nl" | "en") {
  const token = await signSundayTableIntroToken(bookingId);
  return `${SITE}${locale === "en" ? "/en/boeking/intro" : "/boeking/intro"}?token=${encodeURIComponent(token)}`;
}

const time = (d: Date) =>
  new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(d);
const dateLabel = (d: Date, locale: "nl" | "en") =>
  new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(d);

/** Why a mail can't go out yet for this Sunday; null when it can. */
export function mailBlocker(ctx: SundayMailContext, kind: SundayMailKind): string | null {
  if (!ctx.venue) return "Deze zondag heeft nog geen locatie met adres.";
  if (ctx.guests.length === 0) return "Nog geen gasten.";
  if (kind === "morning" && ctx.picks.length === 0) return `${ctx.venue.name} heeft nog geen aanraders. Vul ze in bij Tafelindeling.`;
  if (kind === "saturday" || kind === "morning") {
    const without = ctx.guests.filter((g) => g.groupNumber === null).length;
    if (without > 0) return `${without} ${without === 1 ? "gast heeft" : "gasten hebben"} nog geen groep. Deel ze eerst in bij Tafelindeling.`;
  }
  return null;
}

export async function buildSundayMail(
  ctx: SundayMailContext,
  kind: SundayMailKind,
  guest: Guest,
): Promise<{ subject: string; element: ReactElement }> {
  const venue = ctx.venue!;
  const locale = guest.locale;
  const nl = locale === "nl";
  const url = await introUrl(guest.bookingId, locale);
  if (kind === "location") {
    return {
      subject: nl ? `Volgende week zondag: je Sunday Social bij ${venue.name}` : `Next Sunday: your Sunday Social at ${venue.name}`,
      element: SundayLocationEmail({
        locale,
        firstName: guest.firstName || undefined,
        plusOneName: guest.plusOneName,
        dateLabel: dateLabel(ctx.startsAt, locale),
        time: time(ctx.startsAt),
        venueName: venue.name,
        area: venue.area,
        venueIntro: firstSentence(nl ? venue.descriptionNl : venue.descriptionEn ?? venue.descriptionNl),
        city: ctx.city,
        address: venue.address,
        transit: venueTransit(venue.name, locale),
        mapsUrl: mapsUrl(venue.name, venue.address),
        introUrl: url,
        answered: !guest.needsIntro,
      }),
    };
  }
  const tableUrl = await tablePageUrl(guest.bookingId, locale);
  if (kind === "morning") {
    return {
      subject: nl ? `Vandaag bij ${venue.name}: onze aanraders` : `Today at ${venue.name}: our picks`,
      element: SundayMorningEmail({
        locale,
        firstName: guest.firstName || undefined,
        groupNumber: guest.groupNumber ?? 0,
        venueName: venue.name,
        time: time(ctx.startsAt),
        pickNames: ctx.picks.map((pick) => pick.name),
        tableUrl,
      }),
    };
  }
  return {
    subject: nl ? `Morgen bij ${venue.name}: je zit in groep ${guest.groupNumber}` : `Tomorrow at ${venue.name}: you're in group ${guest.groupNumber}`,
    element: SundaySaturdayEmail({
      locale,
      firstName: guest.firstName || undefined,
      plusOneName: guest.plusOneName,
      groupNumber: guest.groupNumber ?? 0,
      venueName: venue.name,
      address: venue.address,
      mapsUrl: mapsUrl(venue.name, venue.address),
      time: time(ctx.startsAt),
      tableUrl,
    }),
  };
}

/** Sends now, or at `scheduledAt`; the Resend id, or null when it failed. */
export async function sendRendered(to: string, subject: string, element: ReactElement, scheduledAt?: Date): Promise<string | null> {
  const resend = getResendClient();
  if (!resend) return null;
  const { html, text } = await renderEmailForDelivery(element);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to,
    subject,
    html,
    text,
    ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
  });
  return error ? null : (data?.id ?? "sent");
}

function parseSchedule(raw: unknown): SundayMailContext["schedule"] {
  if (!raw || typeof raw !== "object") return {};
  const out: SundayMailContext["schedule"] = {};
  for (const kind of ["saturday", "morning"] as const) {
    const item = (raw as Record<string, unknown>)[kind] as ScheduledMail | undefined;
    if (item && typeof item.at === "string" && Array.isArray(item.ids)) out[kind] = item;
  }
  return out;
}

/** The suggested send time: Saturday 14:00 (24 hours before) for the group mail, Sunday 08:30
 * for the picks (Amsterdam). */
export function defaultScheduleAt(startsAt: Date, kind: "saturday" | "morning"): Date {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  return kind === "saturday" ? amsterdamDateTime(y, m, d - 1, 14, 0) : amsterdamDateTime(y, m, d, 8, 30);
}
