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
import { feedbackUrl } from "@/lib/feedback";
import { tablePageUrl } from "@/lib/table-page";
import { parseVenuePicks, type VenuePick } from "@/lib/venue-picks";
import { venueTransit } from "@/lib/venue-about";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/** The mails sent from a Sunday's page in admin: the location a week
 * before, on Saturday the group with a link to the table page, and on
 * Sunday morning our picks. */
export type SundayMailKind = "location" | "saturday" | "morning" | "feedback";

const SITE = "https://www.mytable.club";

type Guest = {
  bookingId: string;
  email: string;
  firstName: string;
  locale: "nl" | "en";
  plusOneName: string | null;
  seats: number;
  groupId: string | null;
  groupNumber: number | null;
  /** The open questions are still empty. */
  needsIntro: boolean;
  sentLocation: boolean;
  sentSaturday: boolean;
  sentMorning: boolean;
  sentFeedback: boolean;
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
const FEEDBACK_SENT = sql.raw(`(subject ilike '%hoe was je middag%' or subject ilike '%how was your afternoon%')`);

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
  const [locationSent, saturdaySent, morningSent, feedbackSent] = await Promise.all([
    sent(LOCATION_SENT, 10),
    sent(SATURDAY_SENT, 4),
    sent(MORNING_SENT, 2),
    sent(FEEDBACK_SENT, 2),
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
      seats: b.seats,
      groupId: b.groupId,
      groupNumber: b.groupId ? (numberById.get(b.groupId) ?? null) : null,
      needsIntro: !open,
      sentLocation: locationSent.has(key),
      sentSaturday: saturdaySent.has(key),
      sentMorning: morningSent.has(key),
      sentFeedback: feedbackSent.has(key),
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
): Promise<SundayMail> {
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
  if (kind === "feedback") {
    // The people at their table they didn't know: the group minus their own booking (and +1).
    const others = guest.groupId
      ? ctx.guests.filter((g) => g.groupId === guest.groupId && g.bookingId !== guest.bookingId).reduce((n, g) => n + g.seats, 0)
      : 0;
    return {
      subject: nl ? "Hoe was het vanmiddag?" : "How was this afternoon?",
      ...feedbackMail({
        locale,
        firstName: guest.firstName,
        venueName: venue.name,
        others,
        url: await feedbackUrl(guest.bookingId, locale),
      }),
      from: PLAIN_FROM,
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

/** A Sunday mail: designed (element), or plain text from a person-like sender
 * (lands in the inbox rather than Promotions). */
export type SundayMail = { subject: string; element?: ReactElement; text?: string; html?: string; from?: string };

const PLAIN_FROM = "MyTable <hallo@tafels.mytable.club>";

const NL_NUMBERS = ["nul", "één", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien"];
const EN_NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The 20:00 feedback mail: reads like a personal mail (no logo, no layout),
 * with one simple button, and the same as plain text. */
export function feedbackMail(p: { locale: "nl" | "en"; firstName: string; venueName: string; others: number; url: string }): { text: string; html: string } {
  const text = feedbackText(p);
  const nl = p.locale === "nl";
  const [before, after] = text.split(`${p.url}\n`);
  const para = (block: string) =>
    block
      .trim()
      .split("\n\n")
      .map((b) => `<p style="margin:0 0 16px">${escapeHtml(b).replace(/\n/g, "<br>")}</p>`)
      .join("");
  const button = `<p style="margin:4px 0 24px"><a href="${escapeHtml(p.url)}" style="display:inline-block;background:#5a0f1b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${nl ? "Vertel hoe het was" : "Tell us how it was"}</a></p>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${para(before!)}${button}${para(after!)}</div>`;
  return { text, html };
}

/** The 20:00 feedback mail as plain text, with the real number of new people at their table. */
export function feedbackText(p: { locale: "nl" | "en"; firstName: string; venueName: string; others: number; url: string }): string {
  const nl = p.locale === "nl";
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const word = (nl ? NL_NUMBERS : EN_NUMBERS)[p.others] ?? String(p.others);
  const opening =
    p.others >= 2
      ? nl
        ? `Je zat vanmiddag bij ${p.venueName} met ${word} mensen die je nog niet kende. Hoe was dat?`
        : `This afternoon at ${p.venueName} you sat with ${word} people you hadn't met before. How was it?`
      : nl
        ? `Je zat vanmiddag aan tafel bij ${p.venueName}. Hoe was het?`
        : `This afternoon you were at the table at ${p.venueName}. How was it?`;
  return nl
    ? [
        hi,
        "",
        opening,
        "",
        "We lezen elk antwoord, en we gebruiken ze om de volgende tafels nog beter in te delen. Klikte het met iemand aan tafel? Vertel het ons, dan zetten we jullie een volgende keer misschien weer samen.",
        "",
        "Eén tik is genoeg:",
        p.url,
        "",
        "Tot een volgende keer,",
        "Het MyTable-team",
      ].join("\n")
    : [
        hi,
        "",
        opening,
        "",
        "We read every answer, and we use them to put the next tables together even better. Did you click with someone at your table? Tell us, and we might seat you together again another time.",
        "",
        "One tap is enough:",
        p.url,
        "",
        "See you next time,",
        "The MyTable team",
      ].join("\n");
}

/** Sends a Sunday mail now, or at `scheduledAt`; the Resend id, or null. */
export async function sendSundayMail(to: string, mail: SundayMail, scheduledAt?: Date, subject = mail.subject): Promise<string | null> {
  if (mail.text) {
    const resend = getResendClient();
    if (!resend) return null;
    const { data, error } = await resend.emails.send({
      from: mail.from ?? getEmailFrom(),
      replyTo: getEmailReplyTo(),
      to,
      subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
      ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
    });
    return error ? null : (data?.id ?? "sent");
  }
  return sendRendered(to, subject, mail.element!, scheduledAt);
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
  for (const kind of ["saturday", "morning", "feedback"] as const) {
    const item = (raw as Record<string, unknown>)[kind] as ScheduledMail | undefined;
    if (item && typeof item.at === "string" && Array.isArray(item.ids)) out[kind] = item;
  }
  return out;
}

/** The suggested send time: Saturday 14:00 (24 hours before) for the group mail, Sunday 20:00 for the feedback, Sunday 08:30
 * for the picks (Amsterdam). */
export function defaultScheduleAt(startsAt: Date, kind: "saturday" | "morning" | "feedback"): Date {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  if (kind === "feedback") return amsterdamDateTime(y, m, d, 20, 0);
  return kind === "saturday" ? amsterdamDateTime(y, m, d - 1, 14, 0) : amsterdamDateTime(y, m, d, 8, 30);
}
