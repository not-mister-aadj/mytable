import { mailLoginUrl } from "@/lib/auth/mail-login";
import type { ReactElement } from "react";
import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { Resend } from "resend";
import { getDb } from "@/db/index";
import { bookingFeedback, bookings, emailLog, eventGroups, eventVenues, events, feedbackReports, venues } from "@/db/schema";
import { SundayLocationEmail } from "@/emails/SundayLocationEmail";
import { SundaySaturdayEmail } from "@/emails/SundaySaturdayEmail";
import { normalizeEmail } from "@/lib/customers/normalize";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import type { MailMeta } from "@/lib/email/email-log";
import { getEmailFrom, getEmailReplyTo, getResendClient, withMailMeta } from "@/lib/email/resend";
import { signSundayTableIntroToken } from "@/lib/sunday-table-intro";
import { feedbackUrl, loadFeedbackPage } from "@/lib/feedback";
import { confirmUrl, moveUrl, tablePageUrl } from "@/lib/table-page";
import { parseVenuePicks, type VenuePick } from "@/lib/venue-picks";
import { venueTransit } from "@/lib/venue-about";
import { bookingIcsAttachment } from "@/lib/booking-calendar";
import { reservationCode } from "@/lib/booking-display";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";
import { jouwTafelSettingsPath } from "@/i18n/config";

/** The mails sent from a Sunday's page in admin: the location a week
 * before, on Saturday the group with a link to the table page, and on
 * Sunday morning our picks; the feedback mail that evening and, for who
 * didn't answer it, a reminder with the next date on Tuesday; on Wednesday
 * evening, for who a tablemate picked, that their table enjoyed them. Nine
 * days before, "Kom je zondag?": yes, or move while that is still free. */
export type SundayMailKind = "location" | "confirm" | "confirmAgain" | "saturday" | "morning" | "feedback" | "reminder" | "liked";

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
  sentConfirm: boolean;
  sentConfirmAgain: boolean;
  /** Tapped "Ja, ik kom" in "Kom je zondag?". */
  confirmed: boolean;
  /** A seat from a membership: its own rule, no "Kom je zondag?". */
  member: boolean;
  /** Their first Sunday with us. */
  firstTime: boolean;
  sentSaturday: boolean;
  sentMorning: boolean;
  sentFeedback: boolean;
  sentReminder: boolean;
  sentLiked: boolean;
  /** Tablemates who picked them to see again (never shown as a number). */
  likedBy: number;
  /** They picked someone themselves. */
  pickedSomeone: boolean;
  /** Marked "Niet gekomen": no feedback mail. */
  noShow: boolean;
  /** Answered the first feedback question, or reported something: no reminder. */
  feedbackGiven: boolean;
  /** Finished the feedback page (not just the first answer). */
  feedbackCompleted: boolean;
  reported: boolean;
};

/** A mail handed to Resend with a send time, per guest (events.extras.mailSchedule). */
export type ScheduledMail = { at: string; ids: { bookingId: string; resendId: string }[] };

export type SundayMailContext = {
  eventId: string;
  city: string;
  startsAt: Date;
  venue: {
    name: string;
    area: string | null;
    address: string;
    descriptionNl: string | null;
    descriptionEn: string | null;
    mailIntroNl: string | null;
    mailIntroEn: string | null;
  } | null;
  /** The picks of the Sunday's (first) venue. */
  picks: VenuePick[];
  /** Mails waiting at Resend for their send time. */
  schedule: Partial<Record<SundayMailKind, ScheduledMail>>;
  /** A new feedback mail went out by hand (events.extras.autoMailShiftDays): the first answers of the old one no longer count. */
  feedbackByHand: boolean;
  /** Days the follow-ups (reminder, "liked") moved after that mail by hand. */
  autoMailShiftDays: number;
  /** Automatic kinds switched off for this Sunday (events.extras.autoMailsOff). */
  autoMailsOff: string[];
  guests: Guest[];
};

/** Which sent mails count as the location mail; the Vandaag page counts with it too. */
export const LOCATION_SUBJECT_SQL = `(subject ilike '%locatie%' or subject ilike '%location%' or subject ilike '%je Sunday Social bij%' or subject ilike '%your Sunday Social at%' or subject ilike '%volgende week zondag%' or subject ilike '%next sunday at%' or subject ilike 'aanstaande zondag bij%' or subject ilike 'this sunday at%')`;
const LOCATION_SENT = sql.raw(LOCATION_SUBJECT_SQL);
const CONFIRM_SENT = sql.raw(`(subject ilike 'kom je zondag%' or subject ilike 'are you coming on sunday%')`);
const CONFIRM_AGAIN_SENT = sql.raw(`(subject ilike 'nog even: kom je zondag%' or subject ilike 'quick reminder: are you coming%')`);
const SATURDAY_SENT = sql.raw(`(subject ilike '%groep %' or subject ilike '%group %')`);
const MORNING_SENT = sql.raw(
  `(subject ilike '%aanraders%' or subject ilike '%our picks%' or (subject ilike 'vanmiddag bij%') or (subject ilike 'this afternoon at%'))`,
);
const FEEDBACK_SENT = sql.raw(
  `(subject ilike '%hoe was je middag%' or subject ilike '%how was your afternoon%' or subject ilike '%hoe was het vanmiddag%' or subject ilike '%how was this afternoon%')`,
);
const REMINDER_SENT = sql.raw(`(subject ilike 'wie wil je terugzien%' or subject ilike 'who would you like to see again%')`);
const LIKED_SENT = sql.raw(`(subject ilike 'ze vonden je gezellig%' or subject ilike 'they enjoyed your company%')`);

/** "Juni is de eerste wijn- en kaasbar van Rotterdam.": the venue
 * description's opening, up to the first comma or full stop. */
/** Venues that are closed at the start time and open just for our Sunday. */
const OPENS_FOR_US = new Set(["Concours Wine & Foodbar"]);

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
      mailIntroNl: venues.mailIntroNl,
      mailIntroEn: venues.mailIntroEn,
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
  const [locationSent, confirmSent, confirmAgainSent, earlier, saturdaySent, morningSent, feedbackSent, reminderSent, likedSent, picks, answered, completed, reported] = await Promise.all([
    sent(LOCATION_SENT, 10),
    sent(CONFIRM_SENT, 10),
    sent(CONFIRM_AGAIN_SENT, 10),
    // Who sat at a table before this Sunday: not a first-timer.
    emails.length
      ? db.execute<{ email: string }>(sql`
          select distinct lower(trim(b.email)) as email from bookings b join events e on e.id = b.event_id
          where lower(trim(b.email)) in (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})
            and b.payment_status = 'paid' and b.lifecycle_status = 'active' and b.cancelled_late_at is null and b.no_show_at is null
            and e.starts_at < ${event.startsAt.toISOString()}::timestamptz`)
      : [],
    sent(SATURDAY_SENT, 4),
    sent(MORNING_SENT, 2),
    sent(FEEDBACK_SENT, 2),
    sent(REMINDER_SENT, 0),
    sent(LIKED_SENT, 0),
    ids.length
      ? db.select({ id: bookingFeedback.bookingId, wantToSee: bookingFeedback.wantToSee }).from(bookingFeedback).where(inArray(bookingFeedback.bookingId, ids))
      : [],
    ids.length
      ? db.select({ id: bookingFeedback.bookingId }).from(bookingFeedback).where(and(inArray(bookingFeedback.bookingId, ids), isNotNull(bookingFeedback.mood)))
      : [],
    ids.length
      ? db.select({ id: bookingFeedback.bookingId }).from(bookingFeedback).where(and(inArray(bookingFeedback.bookingId, ids), isNotNull(bookingFeedback.completedAt)))
      : [],
    ids.length ? db.select({ id: feedbackReports.bookingId }).from(feedbackReports).where(inArray(feedbackReports.bookingId, ids)) : [],
  ]);
  const answeredIds = new Set(answered.map((r) => r.id));
  const completedIds = new Set(completed.map((r) => r.id));
  const reportedIds = new Set(reported.map((r) => r.id));
  const picked = new Map(picks.map((p) => [p.id, Array.isArray(p.wantToSee) ? (p.wantToSee as string[]) : []]));
  const likedBy = (id: string) => [...picked].filter(([from, to]) => from !== id && to.includes(id)).length;

  const earlierEmails = new Set([...earlier].map((r) => r.email));

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
      sentConfirm: confirmSent.has(key),
      sentConfirmAgain: confirmAgainSent.has(key),
      confirmed: Boolean(b.attendanceConfirmedAt),
      member: Boolean(b.membershipId),
      firstTime: !earlierEmails.has(key),
      sentSaturday: saturdaySent.has(key),
      sentMorning: morningSent.has(key),
      sentFeedback: feedbackSent.has(key),
      sentReminder: reminderSent.has(key),
      sentLiked: likedSent.has(key),
      likedBy: likedBy(b.id),
      pickedSomeone: (picked.get(b.id)?.length ?? 0) > 0,
      noShow: Boolean(b.noShowAt),
      feedbackGiven: answeredIds.has(b.id),
      feedbackCompleted: completedIds.has(b.id),
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
    feedbackByHand: Number(event.extras?.autoMailShiftDays) > 0,
    autoMailShiftDays: Number(event.extras?.autoMailShiftDays) || 0,
    autoMailsOff: Array.isArray(event.extras?.autoMailsOff) ? (event.extras.autoMailsOff as unknown[]).map(String) : [],
    guests,
  };
}

export function mapsUrl(venueName: string, address: string) {
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
 * the reminder only who neither answered nor reported something; "liked"
 * only who a tablemate picked. */
export function mailRecipients(ctx: SundayMailContext, kind: SundayMailKind): Guest[] {
  if (kind === "liked") return ctx.guests.filter((g) => !g.noShow && g.likedBy > 0);
  // "Kom je zondag?": not who said yes, and not a member (their own rule). The
  // second one only for who had the first and stayed silent.
  if (kind === "confirm") return ctx.guests.filter((g) => !g.confirmed && !g.member);
  if (kind === "confirmAgain") return ctx.guests.filter((g) => !g.confirmed && !g.member && g.sentConfirm);
  // After a new feedback mail by hand, only a finished form counts as done.
  if (kind === "reminder") return ctx.guests.filter((g) => !g.noShow && !(ctx.feedbackByHand ? g.feedbackCompleted : g.feedbackGiven) && !g.reported);
  return kind === "feedback" ? ctx.guests.filter((g) => !g.noShow) : ctx.guests;
}

/** Why a mail can't go out yet for this Sunday; null when it can. */
export function mailBlocker(ctx: SundayMailContext, kind: SundayMailKind): string | null {
  if (ctx.guests.length === 0) return "Nog geen gasten.";
  // "Kom je zondag?" goes nine days before, when the venue may not be known: it names the city.
  if (kind === "confirm" || kind === "confirmAgain") return null;
  if (!ctx.venue) return "Deze zondag heeft nog geen locatie met adres.";
  if (kind === "morning" && ctx.picks.length === 0) return `${ctx.venue.name} heeft nog geen aanraders. Vul ze in bij Tafelindeling.`;
  if (kind === "saturday" || kind === "morning") {
    const without = ctx.guests.filter((g) => g.groupNumber === null).length;
    if (without > 0) return `${without} ${without === 1 ? "gast heeft" : "gasten hebben"} nog geen groep. Deel ze eerst in bij Tafelindeling.`;
  }
  return null;
}

/** The Sunday is 6 days away or less (Amsterdam calendar days), so it is "this Sunday", not "next week". */
export function locationThisWeek(startsAt: Date, now = new Date()): boolean {
  const days = Math.round((Date.parse(`${amsterdamDateIso(startsAt)}T12:00:00Z`) - Date.parse(`${amsterdamDateIso(now)}T12:00:00Z`)) / 86_400_000);
  return days <= 6;
}

/** The catalog kind of each Sunday mail, for the log. */
const TEMPLATE: Record<SundayMailKind, string> = {
  confirm: "Kom je zondag?",
  confirmAgain: "Kom je zondag, herinnering",
  location: "Locatie",
  saturday: "Groep",
  morning: "Vanmiddag",
  feedback: "Review",
  reminder: "Terugzien",
  liked: "Gezellig",
};

/** A Sunday mail for one guest, with what it is and what was filled in for the log. */
export async function buildSundayMail(
  ctx: SundayMailContext,
  kind: SundayMailKind,
  guest: Guest,
  /** Location mail as the confirmation of a booking made after it went out. */
  booked = false,
): Promise<SundayMail> {
  const mail = await composeSundayMail(ctx, kind, guest, booked);
  return {
    ...mail,
    meta: {
      template: booked ? "Bevestiging" : TEMPLATE[kind],
      vars: {
        voornaam: guest.firstName || null,
        taal: guest.locale,
        stad: ctx.city,
        zondag: amsterdamDateIso(ctx.startsAt),
        bar: ctx.venue?.name ?? null,
        groep: guest.groupNumber,
        plusEen: guest.plusOneName,
      },
    },
  };
}

async function composeSundayMail(
  ctx: SundayMailContext,
  kind: SundayMailKind,
  guest: Guest,
  booked: boolean,
): Promise<SundayMail> {
  const venue = ctx.venue!;
  const locale = guest.locale;
  const nl = locale === "nl";
  const url = await introUrl(guest.bookingId, locale);
  if (kind === "location") {
    // Sent in the week of the Sunday itself (6 days or less): "Aanstaande zondag".
    const thisWeek = locationThisWeek(ctx.startsAt);
    return {
      subject: booked
        ? nl
          ? `Bevestigd: je Sunday Social bij ${venue.name} · ${shortDate(ctx.startsAt, locale)}`
          : `Confirmed: your Sunday Social at ${venue.name} · ${shortDate(ctx.startsAt, locale)}`
        : nl
          ? `${thisWeek ? "Aanstaande zondag" : "Volgende week zondag"} bij ${venue.name} · ${shortDate(ctx.startsAt, locale)}`
          : `${thisWeek ? "This Sunday" : "Next Sunday"} at ${venue.name} · ${shortDate(ctx.startsAt, locale)}`,
      element: SundayLocationEmail({
        locale,
        booked,
        firstName: guest.firstName || undefined,
        plusOneName: guest.plusOneName,
        dateLabel: dateLabel(ctx.startsAt, locale),
        time: time(ctx.startsAt),
        venueName: venue.name,
        area: venue.area,
        venueIntro: (nl ? venue.mailIntroNl : venue.mailIntroEn)?.trim() || shortIntro(nl ? venue.descriptionNl : venue.descriptionEn ?? venue.descriptionNl),
        opensForUs: OPENS_FOR_US.has(venue.name),
        city: ctx.city,
        address: venue.address,
        transit: venueTransit(venue.name, locale),
        mapsUrl: mapsUrl(venue.name, venue.address),
        introUrl: url,
        answered: !guest.needsIntro,
        thisWeek,
      }),
      // The invite from the confirmation (same UID), now with the bar's
      // address; a confirmation made after this mail carries its own.
      attachments: booked
        ? undefined
        : [
            bookingIcsAttachment({
              bookingId: guest.bookingId,
              bookingCode: reservationCode(guest.bookingId),
              eventName: "Sunday Social",
              city: ctx.city,
              startsAt: ctx.startsAt,
              attendeeEmail: guest.email,
              attendeeName: guest.firstName || undefined,
              locale,
              isSundayTable: true,
              location: `${venue.name}, ${venue.address}`,
              sequence: 1,
              eventUrl: await tablePageUrl(guest.bookingId, locale),
              organizerEmail: getEmailReplyTo(),
            }),
          ],
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
  if (kind === "liked") {
    return {
      subject: nl ? "Ze vonden je gezellig zondag" : "They enjoyed your company on Sunday",
      ...likedMail({
        locale,
        firstName: guest.firstName,
        venueName: venue.name,
        pickedSomeone: guest.pickedSomeone,
        // Signs them in: most guests never logged in and do not know they have an account.
        url: await mailLoginUrl(guest.email, `${jouwTafelSettingsPath(locale)}?tab=vrienden`, SITE),
      }),
      from: PLAIN_FROM,
    };
  }
  if (kind === "confirm" || kind === "confirmAgain") {
    const again = kind === "confirmAgain";
    const day = longDate(ctx.startsAt, locale);
    return {
      subject: again
        ? nl
          ? `Nog even: kom je ${day}?`
          : `Quick reminder: are you coming on ${day}?`
        : nl
          ? `Kom je ${day}? · ${ctx.city}`
          : `Are you coming on ${day}? · ${ctx.city}`,
      ...confirmMail({
        locale,
        firstName: guest.firstName,
        city: ctx.city,
        startsAt: ctx.startsAt,
        again,
        yesUrl: await confirmUrl(guest.bookingId, locale),
        moveUrl: await moveUrl(guest.bookingId, locale),
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
        opensForUs: OPENS_FOR_US.has(venue.name),
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
      firstTime: guest.firstTime,
      opensForUs: OPENS_FOR_US.has(venue.name),
    }),
  };
}

/** A Sunday mail: designed (element), or plain text from a person-like sender
 * (lands in the inbox rather than Promotions). */
export type MailAttachment = { filename: string; content: Buffer; contentType: string };
export type SundayMail = {
  subject: string;
  element?: ReactElement;
  text?: string;
  html?: string;
  from?: string;
  meta?: MailMeta;
  /** The location mail: an update of the calendar invite from the confirmation. */
  attachments?: MailAttachment[];
};

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
export function buttonMail(text: string, url: string, label: string, block?: string, bold: string[] = []): { text: string; html: string } {
  const [before, after = ""] = text.split(`${url}\n`);
  const line = (l: string) => {
    if (bold.includes(l)) return `<strong>${escapeHtml(l)}</strong>`;
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
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${para(before!)}${block ?? button}${para(after)}</div>`;
  return { text, html };
}

/** The four answers to "hoe was het gezelschap", as the feedback page saves them. */
const MAIL_FACES = [
  { mood: "great", emoji: "😍", nl: "Geweldig", en: "Amazing" },
  { mood: "good", emoji: "🙂", nl: "Leuk", en: "Nice" },
  { mood: "meh", emoji: "😐", nl: "Matig", en: "So-so" },
  { mood: "bad", emoji: "🙁", nl: "Niet leuk", en: "Not great" },
] as const;

/** The link behind one answer in the mail: the feedback page with that answer given. */
export const feedbackAnswerUrl = (url: string, mood: string) => `${url}?antwoord=${mood}`;

/**
 * Like buttonMail, with the four answers in the place of the button: a tap
 * in the mail is the first answer, and the page opens on the next question.
 * In the plain text each answer is its own link.
 */
export function facesMail(text: string, url: string, locale: "nl" | "en"): { text: string; html: string } {
  const faces = MAIL_FACES.map((f) => ({ label: f[locale], emoji: f.emoji, href: feedbackAnswerUrl(url, f.mood) }));
  const cells = faces
    .map(
      (f) =>
        `<td style="padding:0 6px 0 0"><a href="${escapeHtml(f.href)}" style="display:block;min-width:58px;border:1px solid #e3d6cf;border-radius:14px;padding:9px 6px 8px;text-align:center;text-decoration:none;color:#2b0d12;font-size:13px;font-weight:600;background:#ffffff"><span style="display:block;font-size:26px;line-height:1.25">${f.emoji}</span>${escapeHtml(f.label)}</a></td>`,
    )
    .join("");
  const block = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px"><tr>${cells}</tr></table>`;
  return {
    text: text.replace(`${url}\n`, `${faces.map((f) => `${f.label}: ${f.href}`).join("\n")}\n`),
    html: buttonMail(text, url, "", block).html,
  };
}

/** The 20:00 feedback mail: the first answer is a tap in the mail. */
export function feedbackMail(p: { locale: "nl" | "en"; firstName: string; venueName: string; others: number; url: string }): { text: string; html: string } {
  return facesMail(feedbackText(p), p.url, p.locale);
}

/**
 * Wednesday 19:00, for who a tablemate picked: their table enjoyed them. No
 * names, no count, no booking button. Ends with "Cheers, MyTable".
 */
export function likedMail(p: { locale: "nl" | "en"; firstName: string; venueName: string; pickedSomeone: boolean; url: string }): { text: string; html: string } {
  const nl = p.locale === "nl";
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const opening = nl
    ? `Zondag in ${p.venueName} heb je indruk gemaakt. Aan je tafel gaven ze aan dat ze je gezellig vonden en je vaker aan tafel willen hebben.`
    : `On Sunday at ${p.venueName} you made an impression. People at your table said they enjoyed your company and would love to have you at the table more often.`;
  const lines = p.pickedSomeone
    ? nl
      ? [
          "Jij liet ook al weten met wie je het gezellig had. Komt het van twee kanten, dan zorgen we dat jullie elkaar vaker tegenkomen.",
          "",
          p.url,
        ]
      : [
          "You already told us who you enjoyed the afternoon with. If it's mutual, we'll make sure you run into each other more often.",
          "",
          p.url,
        ]
    : nl
      ? [
          "Met wie had jij het gezellig? Laat het ons weten. Dan zorgen we dat je op een volgende zondag vaker bekende gezichten tegenkomt.",
          "",
          p.url,
          "",
          "Kan tot zondag 18:00.",
        ]
      : [
          "Who did you enjoy the afternoon with? Let us know. Then you'll run into more familiar faces on a next Sunday.",
          "",
          p.url,
          "",
          "You can do this until Sunday 18:00.",
        ];
  const text = [hi, "", opening, "", ...lines, "", "Cheers,", "MyTable"].join("\n");
  const label = p.pickedSomeone
    ? nl
      ? "Bekijk met wie je het gezellig had"
      : "See who you enjoyed the afternoon with"
    : nl
      ? "Laat weten met wie het gezellig was"
      : "Let us know who you enjoyed";
  return buttonMail(text, p.url, label);
}

/** "zondag 13 december" / "Sunday 13 December". */
export function longDate(d: Date, locale: "nl" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" })
    .format(d)
    .replace(",", "");
}

const MOVE_DAYS_MS = 7 * 86_400_000;

/**
 * "Kom je zondag?", nine days before, while moving is still free: yes, or
 * move. Why it matters for the table, without blame. `again` is the short
 * one a day later, for who chose nothing.
 */
export function confirmMail(p: {
  locale: "nl" | "en";
  firstName: string;
  city: string;
  startsAt: Date;
  again?: boolean;
  yesUrl: string;
  moveUrl: string;
  now?: Date;
}): { text: string; html: string } {
  const nl = p.locale === "nl";
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const day = longDate(p.startsAt, p.locale);
  const at = time(p.startsAt);
  const until = longDate(new Date(p.startsAt.getTime() - MOVE_DAYS_MS), p.locale);
  const days = Math.round((Date.parse(`${amsterdamDateIso(p.startsAt)}T12:00:00Z`) - Date.parse(`${amsterdamDateIso(p.now ?? new Date())}T12:00:00Z`)) / 86_400_000);
  const inDays = nl ? `Over ${NL_NUMBERS[days] ?? days} dagen` : `In ${EN_NUMBERS[days] ?? days} days`;
  const dayOfMonth = Number(amsterdamDateIso(p.startsAt).split("-")[2]);
  const before = p.again
    ? nl
      ? [hi, `We hebben nog niet van je gehoord. Morgen delen we de tafels in voor ${day}.`]
      : [hi, `We haven't heard from you yet. Tomorrow we make the tables for ${day}.`]
    : nl
      ? [
          hi,
          `${inDays} schuif je aan in ${p.city}: ${day} om ${at}.`,
          "We delen de tafels in op wie er komt. Jouw tafel wordt om jou heen gebouwd, met mensen van rond jouw leeftijd. Valt er iemand weg, dan merkt de hele tafel dat. Het is voor iedereen leuker als de groep compleet is.",
          "We snappen dat er soms iets tussen komt. Daarom vragen we het nu, nu je je plek nog gratis kunt verzetten naar een andere datum:",
        ]
      : [
          hi,
          `${inDays} you're joining the table in ${p.city}: ${day} at ${at}.`,
          "We make the tables around who is coming. Yours is built around you, with people around your age. When someone drops out, the whole table notices. It's nicer for everyone when the group is complete.",
          "We know things come up. That's why we ask now, while you can still move your seat to another date for free:",
        ];
  const after = p.again
    ? nl
      ? ["Na morgen kan verzetten niet meer.", "MyTable"]
      : ["After tomorrow, moving is no longer possible.", "MyTable"]
    : nl
      ? [`Verzetten kan tot ${until}. Die dag sturen we je de locatie. Daarna ligt je plek vast en rekent je tafel op je.`, `Tot de ${dayOfMonth}e,\nMyTable`]
      : [`You can move until ${until}. That day we send you the location. After that your seat is fixed and your table counts on you.`, "See you then,\nMyTable"];
  const yes = nl ? "Ja, ik kom" : "Yes, I'm coming";
  const move = nl ? "Ik wil verzetten" : "I'd like to move";
  const text = [...before, `${yes}: ${p.yesUrl}\n${move}: ${p.moveUrl}`, ...after].join("\n\n");
  const para = (lines: string[]) => lines.map((l) => `<p style="margin:0 0 16px">${escapeHtml(l).replace(/\n/g, "<br>")}</p>`).join("");
  const button = (url: string, label: string, solid: boolean) =>
    `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 8px 8px 0;border:1px solid #5a0f1b;background:${solid ? "#5a0f1b" : "#ffffff"};color:${solid ? "#ffffff" : "#5a0f1b"};text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${escapeHtml(label)}</a>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${para(before)}<p style="margin:4px 0 16px">${button(p.yesUrl, yes, true)}${button(p.moveUrl, move, false)}</p>${para(after)}</div>`;
  return { text, html };
}

/** Tuesday 08:00, for who didn't answer: who they'd like to see again, and the next date to book. */
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
      ? [hi, "", `Zondag zat je bij ${p.venueName} aan tafel. Was er iemand die je graag terugziet? Laat het ons weten, dan doen we ons best dat jullie elkaar weer tegenkomen.`, "", "Tik eerst hoe je middag was:", p.url, "", ...next, "Tot snel,", "Het MyTable-team"]
      : [hi, "", `On Sunday you were at the table at ${p.venueName}. Was there someone you'd like to see again? Let us know, and we'll do our best to make sure you meet again.`, "", "First tap how your afternoon was:", p.url, "", ...next, "See you soon,", "The MyTable team"]
  ).join("\n");
  return facesMail(text, p.url, p.locale);
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
  /** The venue is closed at this time and opens just for us. */
  opensForUs?: boolean;
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
  // Online the venue shows later hours; without this, guests think it's closed.
  const opens = p.opensForUs
    ? nl
      ? `Let op: online staan andere openingstijden, maar ${p.venueName} gaat speciaal voor ons om ${p.time} open.`
      : `Heads-up: the opening hours online say otherwise, but ${p.venueName} opens especially for us at ${p.time}.`
    : null;
  // Sets the expectation: a slow start is normal, not a failed table.
  const ice = nl
    ? "Even eerlijk: bijna iedereen vindt de eerste minuten aan tafel met onbekenden een beetje onwennig. Dat hoort erbij, en meestal is het ijs na het eerste glas gebroken."
    : "To be honest: almost everyone finds the first few minutes at a table with strangers a little awkward. That's part of it, and the ice usually breaks after the first glass.";
  const text = (nl
    ? [hi, "", `Vanmiddag is het zover. Om ${p.time} schuif je aan bij ${p.venueName}.`, ...(opens ? ["", opens] : []), "", where, "", ice, "", taste, "", "Je tafel en onze aanraders:", p.url, "", "Tot vanmiddag!", "Het MyTable-team"]
    : [hi, "", `Today's the day. At ${p.time} you take your seat at ${p.venueName}.`, ...(opens ? ["", opens] : []), "", where, "", ice, "", taste, "", "Your table and our picks:", p.url, "", "See you this afternoon!", "The MyTable team"]
  ).join("\n");
  return buttonMail(text, p.url, nl ? "Bekijk je tafel en onze aanraders" : "See your table and our picks", undefined, opens ? [opens] : []);
}

/** The 20:00 feedback mail as plain text, with the page's link where the four answers go. No count of tablemates: a cancellation or no-show after planning would make it wrong. */
export function feedbackText(p: { locale: "nl" | "en"; firstName: string; venueName: string; others: number; url: string }): string {
  const nl = p.locale === "nl";
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const opening = nl
    ? `Hoe was je middag bij ${p.venueName}? Tik wat past:`
    : `How was your afternoon at ${p.venueName}? Tap what fits:`;
  return nl
    ? [
        hi,
        "",
        opening,
        "",
        p.url,
        "",
        "Daarna vragen we met wie je het gezellig vond. Zo houden we bij een volgende zondag rekening met wie je graag terugziet. Het duurt een minuutje.",
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
        p.url,
        "",
        "After that we ask who you enjoyed. Then on a next Sunday we take into account who you'd like to see again. It takes a minute.",
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
    const { data, error } = await resend.emails.send(
      withMailMeta(
        {
          from: mail.from ?? getEmailFrom(),
          replyTo: getEmailReplyTo(),
          to,
          subject,
          text: mail.text,
          ...(mail.html ? { html: mail.html } : {}),
          ...(mail.attachments ? { attachments: mail.attachments } : {}),
          ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
        },
        mail.meta ?? {},
      ),
    );
    return error ? null : (data?.id ?? "sent");
  }
  return sendRendered(to, subject, mail.element!, scheduledAt, mail.meta, mail.attachments);
}

/** Sends now, or at `scheduledAt`; the Resend id, or null when it failed. */
export async function sendRendered(
  to: string,
  subject: string,
  element: ReactElement,
  scheduledAt?: Date,
  meta?: MailMeta,
  attachments?: MailAttachment[],
): Promise<string | null> {
  const resend = getResendClient();
  if (!resend) return null;
  const { html, text } = await renderEmailForDelivery(element);
  const { data, error } = await resend.emails.send(
    withMailMeta(
      {
        from: getEmailFrom(),
        replyTo: getEmailReplyTo(),
        to,
        subject,
        html,
        text,
        ...(attachments ? { attachments } : {}),
        ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
      },
      meta ?? {},
    ),
  );
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
export function defaultScheduleAt(startsAt: Date, kind: "confirm" | "confirmAgain" | "saturday" | "morning" | "feedback" | "reminder" | "liked"): Date {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  if (kind === "feedback") return amsterdamDateTime(y, m, d, 20, 0);
  // The feedback reminder: Tuesday 08:00. "Ze vonden je gezellig": Wednesday 19:00.
  if (kind === "reminder") return amsterdamDateTime(y, m, d + 2, 8, 0);
  if (kind === "liked") return amsterdamDateTime(y, m, d + 3, 19, 0);
  // "Kom je zondag?": nine days before (the Friday), 10:00, while moving is still free.
  if (kind === "confirm") return amsterdamDateTime(y, m, d - 9, 10, 0);
  // The short one for who chose nothing: the Saturday, a day before moving closes.
  if (kind === "confirmAgain") return amsterdamDateTime(y, m, d - 8, 10, 0);
  return kind === "saturday" ? amsterdamDateTime(y, m, d - 1, 14, 0) : amsterdamDateTime(y, m, d, 8, 30);
}
