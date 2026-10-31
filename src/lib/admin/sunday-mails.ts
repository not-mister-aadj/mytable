import type { ReactElement } from "react";
import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { Resend } from "resend";
import { getDb } from "@/db/index";
import { bookingFeedback, bookings, emailLog, eventGroups, eventVenues, events, feedbackReports, venues } from "@/db/schema";
import { SundayLocationEmail } from "@/emails/SundayLocationEmail";
import { SundaySaturdayEmail } from "@/emails/SundaySaturdayEmail";
import { normalizeEmail } from "@/lib/customers/normalize";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import { getEmailFrom, getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { signSundayTableIntroToken } from "@/lib/sunday-table-intro";
import { feedbackUrl, loadFeedbackPage } from "@/lib/feedback";
import { tablePageUrl } from "@/lib/table-page";
import { parseVenuePicks, type VenuePick } from "@/lib/venue-picks";
import { venueTransit } from "@/lib/venue-about";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/** The mails sent from a Sunday's page in admin: the location a week
 * before, on Saturday the group with a link to the table page, and on
 * Sunday morning our picks; the feedback mail that evening and, for who
 * didn't answer it, a reminder with the next date on Wednesday. */
export type SundayMailKind = "location" | "saturday" | "morning" | "feedback" | "reminder";

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
  sentReminder: boolean;
  /** Marked "Niet gekomen": no feedback mail. */
  noShow: boolean;
  /** Answered the first feedback question, or reported something: no reminder. */
  feedbackGiven: boolean;
  reported: boolean;
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

/** Which sent mails count as the location mail; the Vandaag page counts with it too. */
export const LOCATION_SUBJECT_SQL = `(subject ilike '%locatie%' or subject ilike '%location%' or subject ilike '%je Sunday Social bij%' or subject ilike '%your Sunday Social at%' or subject ilike '%volgende week zondag%' or subject ilike '%next sunday at%')`;
const LOCATION_SENT = sql.raw(LOCATION_SUBJECT_SQL);
const SATURDAY_SENT = sql.raw(`(subject ilike '%groep %' or subject ilike '%group %')`);
const MORNING_SENT = sql.raw(
  `(subject ilike '%aanraders%' or subject ilike '%our picks%' or (subject ilike 'vanmiddag bij%') or (subject ilike 'this afternoon at%'))`,
);
const FEEDBACK_SENT = sql.raw(
  `(subject ilike '%hoe was je middag%' or subject ilike '%how was your afternoon%' or subject ilike '%hoe was het vanmiddag%' or subject ilike '%how was this afternoon%')`,
);
const REMINDER_SENT = sql.raw(`(subject ilike 'wie wil je terugzien%' or subject ilike 'who would you like to see again%')`);

/** "Juni is de eerste wijn- en kaasbar van Rotterdam.": the venue
 * description's opening, up to the first comma or full stop. */
function shortIntro(text: string | null | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;
  const m = t.match(/^.+?[.!?](\s|$)/);
  const sentence = (m ? m[0] : t).trim();
  const clause = sentence.split(/,\s/)[0]!.replace(/[.!?]$/, "");
  return `${clause}.`;
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
    .where(
      and(
        eq(bookings.eventId, eventId),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        // Cancelled on the table page: no more Sunday mails.
        isNull(bookings.cancelledLateAt),
      ),
    )
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
  const ids = rows.map((r) => r.id);
  const [locationSent, saturdaySent, morningSent, feedbackSent, reminderSent, answered, reported] = await Promise.all([
    sent(LOCATION_SENT, 10),
    sent(SATURDAY_SENT, 4),
    sent(MORNING_SENT, 2),
    sent(FEEDBACK_SENT, 2),
    sent(REMINDER_SENT, 0),
    ids.length
      ? db.select({ id: bookingFeedback.bookingId }).from(bookingFeedback).where(and(inArray(bookingFeedback.bookingId, ids), isNotNull(bookingFeedback.mood)))
      : [],
    ids.length ? db.select({ id: feedbackReports.bookingId }).from(feedbackReports).where(inArray(feedbackReports.bookingId, ids)) : [],
  ]);
  const answeredIds = new Set(answered.map((r) => r.id));
  const reportedIds = new Set(reported.map((r) => r.id));

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
      sentReminder: reminderSent.has(key),
      noShow: Boolean(b.noShowAt),
      feedbackGiven: answeredIds.has(b.id),
      reported: reportedIds.has(b.id),
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

/**
 * A booking made after the Sunday's location mail went out gets that mail as
 * its confirmation (with "Je plek staat"), instead of the general one that
 * says the location follows. Null when the location mail hasn't gone yet.
 */
export async function locationMailAsConfirmation(eventId: string, bookingId: string): Promise<SundayMail | null> {
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx?.venue) return null;
  const guest = ctx.guests.find((g) => g.bookingId === bookingId);
  if (!guest || !ctx.guests.some((g) => g.sentLocation && g.bookingId !== bookingId)) return null;
  return buildSundayMail(ctx, "location", guest, true);
}

/** Who gets this mail: everyone, except a no-show for the feedback mail;
 * the reminder only who neither answered nor reported something. */
export function mailRecipients(ctx: SundayMailContext, kind: SundayMailKind): Guest[] {
  if (kind === "reminder") return ctx.guests.filter((g) => !g.noShow && !g.feedbackGiven && !g.reported);
  return kind === "feedback" ? ctx.guests.filter((g) => !g.noShow) : ctx.guests;
}

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
  /** Location mail as the confirmation of a booking made after it went out. */
  booked = false,
): Promise<SundayMail> {
  const venue = ctx.venue!;
  const locale = guest.locale;
  const nl = locale === "nl";
  const url = await introUrl(guest.bookingId, locale);
  if (kind === "location") {
    return {
      subject: booked
        ? nl
          ? `Bevestigd: je Sunday Social bij ${venue.name} · ${shortDate(ctx.startsAt, locale)}`
          : `Confirmed: your Sunday Social at ${venue.name} · ${shortDate(ctx.startsAt, locale)}`
        : nl
          ? `Volgende week zondag bij ${venue.name} · ${shortDate(ctx.startsAt, locale)}`
          : `Next Sunday at ${venue.name} · ${shortDate(ctx.startsAt, locale)}`,
      element: SundayLocationEmail({
        locale,
        booked,
        firstName: guest.firstName || undefined,
        plusOneName: guest.plusOneName,
        dateLabel: dateLabel(ctx.startsAt, locale),
        time: time(ctx.startsAt),
        venueName: venue.name,
        area: venue.area,
        venueIntro: shortIntro(nl ? venue.descriptionNl : venue.descriptionEn ?? venue.descriptionNl),
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
      ? ctx.guests.filter((g) => g.groupId === guest.groupId && g.bookingId !== guest.bookingId && !g.noShow).reduce((n, g) => n + g.seats, 0)
      : 0;
    return {
      subject: nl ? `Hoe was het vanmiddag bij ${venue.name}? · ${shortDate(ctx.startsAt, locale)}` : `How was this afternoon at ${venue.name}? · ${shortDate(ctx.startsAt, locale)}`,
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
  if (kind === "reminder") {
    const page = await loadFeedbackPage(guest.bookingId);
    const next = page?.next;
    // Already booked that date: just the question.
    const booked = next
      ? (await getDb().select({ id: bookings.id }).from(bookings).where(and(eq(bookings.eventId, next.eventId), sql`lower(${bookings.email}) = ${normalizeEmail(guest.email)}`, eq(bookings.paymentStatus, "paid"))).limit(1)).length > 0
      : false;
    return {
      subject: nl ? `Wie wil je terugzien? · ${shortDate(ctx.startsAt, locale)}` : `Who would you like to see again? · ${shortDate(ctx.startsAt, locale)}`,
      ...reminderMail({
        locale,
        firstName: guest.firstName,
        venueName: venue.name,
        url: await feedbackUrl(guest.bookingId, locale),
        next: next && !booked ? { city: next.city, label: next.label, url: `${SITE}${next.path}` } : null,
      }),
      from: PLAIN_FROM,
    };
  }
  const tableUrl = await tablePageUrl(guest.bookingId, locale);
  if (kind === "morning") {
    return {
      subject: nl ? `Vanmiddag bij ${venue.name} · ${shortDate(ctx.startsAt, locale)}` : `This afternoon at ${venue.name} · ${shortDate(ctx.startsAt, locale)}`,
      ...morningMail({
        locale,
        firstName: guest.firstName,
        time: time(ctx.startsAt),
        venueName: venue.name,
        address: venue.address,
        mapsUrl: mapsUrl(venue.name, venue.address),
        transit: venueTransit(venue.name, locale),
        groupNumber: guest.groupNumber,
        picks: ctx.picks.map((pick) => pick.name),
        url: tableUrl,
      }),
      from: PLAIN_FROM,
    };
  }
  return {
    subject: nl
      ? `Morgen bij ${venue.name}: je zit in groep ${guest.groupNumber} · ${shortDate(ctx.startsAt, locale)}`
      : `Tomorrow at ${venue.name}: you're in group ${guest.groupNumber} · ${shortDate(ctx.startsAt, locale)}`,
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

/** "zo 25 okt" / "Sun 25 Oct": in every subject, so each edition is its own thread. */
export function shortDate(d: Date, locale: "nl" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  })
    .format(d)
    .replace(/\./g, "")
    .replace(",", "");
}

/**
 * A mail that reads like a personal one (no logo, no layout): the plain text,
 * and an HTML version where the line with `url` becomes one simple button and
 * "Label: https://…" lines become links. Lands in the inbox, not Promotions.
 */
export function buttonMail(text: string, url: string, label: string): { text: string; html: string } {
  const [before, after = ""] = text.split(`${url}\n`);
  const line = (l: string) => {
    const m = /^(.+?): (https?:\/\/\S+)$/.exec(l);
    return m ? `<a href="${escapeHtml(m[2]!)}" style="color:#5a0f1b">${escapeHtml(m[1]!)}</a>` : escapeHtml(l);
  };
  const para = (block: string) =>
    block
      .trim()
      .split("\n\n")
      .filter(Boolean)
      .map((b) => `<p style="margin:0 0 16px">${b.split("\n").map(line).join("<br>")}</p>`)
      .join("");
  const button = `<p style="margin:4px 0 24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#5a0f1b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${escapeHtml(label)}</a></p>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${para(before!)}${button}${para(after)}</div>`;
  return { text, html };
}

/** The 20:00 feedback mail, with one button. */
export function feedbackMail(p: { locale: "nl" | "en"; firstName: string; venueName: string; others: number; url: string }): { text: string; html: string } {
  return buttonMail(feedbackText(p), p.url, p.locale === "nl" ? "Vertel hoe het was" : "Tell us how it was");
}

/** Wednesday 08:00, for who didn't answer: who they'd like to see again, and the next date to book. */
export function reminderMail(p: {
  locale: "nl" | "en";
  firstName: string;
  venueName: string;
  url: string;
  next: { city: string; label: string; url: string } | null;
}): { text: string; html: string } {
  const nl = p.locale === "nl";
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const next = p.next
    ? nl
      ? [`Zin om meteen weer te komen? De volgende in ${p.next.city} is ${p.next.label}.`, `Reserveer je plek: ${p.next.url}`, ""]
      : [`Feel like coming again? The next one in ${p.next.city} is on ${p.next.label}.`, `Book your seat: ${p.next.url}`, ""]
    : [];
  const text = (
    nl
      ? [hi, "", `Zondag zat je bij ${p.venueName} aan tafel. Was er iemand die je graag terugziet? Laat het ons weten, dan doen we ons best dat jullie elkaar weer tegenkomen.`, "", p.url, "", ...next, "Tot snel,", "Het MyTable-team"]
      : [hi, "", `On Sunday you were at the table at ${p.venueName}. Was there someone you'd like to see again? Let us know, and we'll do our best to make sure you meet again.`, "", p.url, "", ...next, "See you soon,", "The MyTable team"]
  ).join("\n");
  return buttonMail(text, p.url, nl ? "Kies wie je weer wilt zien" : "Choose who you'd like to see again");
}

/** Sunday 08:30: when, where, the group, and a taste of our picks; one button to the table page. */
export function morningMail(p: {
  locale: "nl" | "en";
  firstName: string;
  time: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  transit: string | null;
  groupNumber: number | null;
  picks: string[];
  url: string;
}): { text: string; html: string } {
  const nl = p.locale === "nl";
  const hi = nl ? `Goedemorgen${p.firstName ? ` ${p.firstName}` : ""},` : `Good morning${p.firstName ? ` ${p.firstName}` : ""},`;
  const first = p.picks[0];
  const last = p.picks.length > 1 ? p.picks[p.picks.length - 1] : null;
  const taste = first && last
    ? nl
      ? `We hebben bij ${p.venueName} geproefd en ${NL_NUMBERS[p.picks.length] ?? p.picks.length} aanraders gekozen, van de ${first} tot de ${last}. Op je tafelpagina lees je waarom we ze kozen en wat je erbij bestelt.`
      : `We tasted at ${p.venueName} and chose ${EN_NUMBERS[p.picks.length] ?? p.picks.length} picks, from the ${first} to the ${last}. On your table page you'll read why we chose them and what to order with them.`
    : nl
      ? "Op je tafelpagina zie je wie er bij je aan tafel zitten."
      : "On your table page you'll see who's at your table.";
  const where = [
    nl ? `Adres: ${p.address}` : `Address: ${p.address}`,
    `Route: ${p.mapsUrl}`,
    ...(p.transit ? [p.transit + "."] : []),
    ...(p.groupNumber !== null
      ? [nl ? `Zeg bij binnenkomst dat je bij MyTable hoort, groep ${p.groupNumber}.` : `When you arrive, say you're with MyTable, group ${p.groupNumber}.`]
      : []),
  ].join("\n");
  // Sets the expectation: a slow start is normal, not a failed table.
  const ice = nl
    ? "Even eerlijk: bijna iedereen vindt de eerste minuten aan tafel met onbekenden een beetje onwennig. Dat hoort erbij, en meestal is het ijs na het eerste glas gebroken."
    : "To be honest: almost everyone finds the first few minutes at a table with strangers a little awkward. That's part of it, and the ice usually breaks after the first glass.";
  const text = (nl
    ? [hi, "", `Vanmiddag is het zover. Om ${p.time} schuif je aan bij ${p.venueName}.`, "", where, "", ice, "", taste, "", "Je tafel en onze aanraders:", p.url, "", "Tot vanmiddag!", "Het MyTable-team"]
    : [hi, "", `Today's the day. At ${p.time} you take your seat at ${p.venueName}.`, "", where, "", ice, "", taste, "", "Your table and our picks:", p.url, "", "See you this afternoon!", "The MyTable team"]
  ).join("\n");
  return buttonMail(text, p.url, nl ? "Bekijk je tafel en onze aanraders" : "See your table and our picks");
}

/** The 20:00 feedback mail as plain text. No count of tablemates: a cancellation or no-show after planning would make it wrong. */
export function feedbackText(p: { locale: "nl" | "en"; firstName: string; venueName: string; others: number; url: string }): string {
  const nl = p.locale === "nl";
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const opening = nl
    ? `Hoe was je middag bij ${p.venueName}?`
    : `How was your afternoon at ${p.venueName}?`;
  return nl
    ? [
        hi,
        "",
        opening,
        "",
        "De eerste keren aan tafel met nieuwe mensen kunnen wat onwennig zijn. Daarom horen we graag met wie je het gezellig vond. Zo kunnen we bij een volgende zondag rekening houden met wie je graag terugziet en wat bij jou past. Stap voor stap bouw je zo aan je eigen wijnclub, met steeds meer bekende gezichten.",
        "",
        "Het duurt maar een minuutje:",
        p.url,
        "",
        "Was er iets of iemand waardoor je je niet prettig voelde?",
        `Laat het ons weten: ${p.url}/melden`,
        "",
        "Tot een volgende zondag,",
        "Het MyTable-team",
      ].join("\n")
    : [
        hi,
        "",
        opening,
        "",
        "The first few times at a table with new people can feel a little awkward. That's why we'd love to hear who you enjoyed. Then on a next Sunday we can take into account who you'd like to see again and what suits you. Step by step, you build your own wine club, with more and more familiar faces.",
        "",
        "It only takes a minute:",
        p.url,
        "",
        "Was there anything or anyone that made you feel uncomfortable?",
        `Let us know: ${p.url}/melden`,
        "",
        "Until another Sunday,",
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

export async function saveSchedule(eventId: string, kind: "saturday" | "morning" | "feedback", value: ScheduledMail | null) {
  await getDb()
    .update(events)
    .set({
      extras: value
        ? sql`coalesce(${events.extras}, '{}'::jsonb) || jsonb_build_object('mailSchedule',
            coalesce(${events.extras} -> 'mailSchedule', '{}'::jsonb) || jsonb_build_object(${kind}::text, ${JSON.stringify(value)}::jsonb))`
        : sql`coalesce(${events.extras}, '{}'::jsonb) #- ${`{mailSchedule,${kind}}`}::text[]`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
}

/** Resend can only take a planned mail back with a full-access key. */
function cancellingResend(): Resend | null {
  const key = process.env.RESEND_FULL_ACCESS_API_KEY?.trim() || process.env.RESEND_READ_API_KEY?.trim();
  return key ? new Resend(key) : null;
}

type PlannedKind = "saturday" | "morning" | "feedback";

/**
 * Takes one guest's planned Sunday mails back from Resend (after a
 * cancellation or a no-show). Returns the kinds still planned for them:
 * without a full-access key, or when Resend refused.
 */
export async function dropPlannedMailsFor(
  eventId: string,
  bookingId: string,
  kinds: PlannedKind[] = ["saturday", "morning", "feedback"],
): Promise<PlannedKind[]> {
  const [event] = await getDb().select({ extras: events.extras }).from(events).where(eq(events.id, eventId)).limit(1);
  const schedule = parseSchedule(event?.extras?.mailSchedule);
  const resend = cancellingResend();
  const left: PlannedKind[] = [];
  for (const kind of kinds) {
    const planned = schedule[kind];
    const mine = planned?.ids.find((i) => i.bookingId === bookingId);
    if (!planned || !mine || Date.parse(planned.at) <= Date.now()) continue;
    const cancelled = resend ? !(await resend.emails.cancel(mine.resendId)).error : false;
    if (!cancelled) {
      left.push(kind);
      continue;
    }
    await getDb().delete(emailLog).where(eq(emailLog.resendId, mine.resendId));
    const ids = planned.ids.filter((i) => i.resendId !== mine.resendId);
    await saveSchedule(eventId, kind, ids.length ? { ...planned, ids } : null);
  }
  return left;
}

/** The kinds still planned at Resend for one guest. */
export function plannedFor(raw: unknown, bookingId: string, now = Date.now()): PlannedKind[] {
  const schedule = parseSchedule(raw);
  return (["saturday", "morning", "feedback"] as const).filter((kind) => {
    const planned = schedule[kind];
    return planned && Date.parse(planned.at) > now && planned.ids.some((i) => i.bookingId === bookingId);
  });
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
export function defaultScheduleAt(startsAt: Date, kind: "saturday" | "morning" | "feedback" | "reminder"): Date {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  if (kind === "feedback") return amsterdamDateTime(y, m, d, 20, 0);
  // The feedback reminder: Wednesday 08:00.
  if (kind === "reminder") return amsterdamDateTime(y, m, d + 3, 8, 0);
  return kind === "saturday" ? amsterdamDateTime(y, m, d - 1, 14, 0) : amsterdamDateTime(y, m, d, 8, 30);
}
