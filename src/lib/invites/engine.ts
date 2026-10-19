import { randomBytes } from "node:crypto";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { inviteClicks, inviteRuns, inviteSends, inviteSubscribers } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import { getEmailFrom, getResendClient } from "@/lib/email/resend";
import {
  CHECKIN_WAIT_DAYS,
  ENGAGE_DAYS,
  INVITE_LEAD_DAYS,
  amsterdamParts,
  checkinMail,
  dailyCap,
  engagement,
  fitsBracket,
  inviteMail,
  nextAllowedAt,
  nextSlot,
  nudgeMail,
  scarcityLine,
  type CityPref,
  type Engagement,
  type InviteLocale,
  type MailEvent,
} from "@/lib/invites/logic";
import { getInviteSettings, needsApproval, saveInviteSettings, type InviteSettings } from "@/lib/invites/settings";
import {
  JOUW_TAFEL_SEAT_PRICE_CENTS,
  bracketFromEventName,
  jouwTafelBookingWindow,
  memberBookingOpensAt,
  supportedCity,
} from "@/lib/jouw-tafel/logic";
import { emailKind } from "@/lib/email/email-kind";

const DAY = 24 * 60 * 60 * 1000;

function getAdminBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://dashboard.mytable.club").replace(/\/$/, "");
}
const FROM_ADDRESS = "hallo@tafels.mytable.club";
const FROM = `Het MyTable-team <${FROM_ADDRESS}>`;
const REPLY_TO = "info@mytable.club";
/** Plans no further ahead than this. */
const PLAN_DAYS = 7;
/** An invite is not sent for a Sunday closer than this. */
const MIN_DAYS_BEFORE = 3;
/** Clicked, not booked: the follow-up comes this many days after the click. */
const NUDGE_AFTER_DAYS = 3;
const NUDGE_UNTIL_DAYS = 10;

export type InvitePerson = {
  email: string;
  name: string | null;
  locale: InviteLocale;
  signedUpAt: Date;
  /** Cities they follow (waitlist), before their preferences. */
  cities: string[];
  prefs: Record<string, CityPref>;
  token: string;
  member: boolean;
  suppressed: boolean;
  ageRange: string | null;
  birthDate: Date | null;
  /** Hand-sent invitations (email_log), for the monthly maximum. */
  manualInvites: Date[];
};

export type InviteEvent = {
  id: string;
  city: string;
  startsAt: string;
  capacity: number;
  sold: number;
  priceCents: number;
  membersFrom: Date;
  everyoneFrom: Date;
  open: boolean;
  lastSoldOut: boolean;
  bracket: "20-39" | "35+" | null;
};

type SendRow = typeof inviteSends.$inferSelect;

function code(): string {
  return randomBytes(6).toString("base64url").replace(/[-_]/g, "x").slice(0, 8);
}

function token(): string {
  return randomBytes(18).toString("base64url");
}

export function followedCities(person: Pick<InvitePerson, "cities" | "prefs">): string[] {
  return person.cities.filter((c) => (person.prefs[c] ?? "all") !== "none");
}

export function manageUrl(person: Pick<InvitePerson, "token" | "locale">): string {
  const site = getSiteUrl().replace(/\/$/, "");
  return `${site}${person.locale === "en" ? "/en" : ""}/uitnodigingen/${person.token}`;
}

function linkUrl(send: Pick<SendRow, "code">, index: number): string {
  return `${getSiteUrl().replace(/\/$/, "")}/r/${send.code}${index}`;
}

/** Everyone on the waitlist, with their cities, preferences and token. */
export async function loadPeople(options: { dryRun?: boolean } = {}): Promise<InvitePerson[]> {
  const db = getDb();
  const rows = (await db.execute(sql`
    select lower(w.email) as email, w.city, w.locale, w.created_at, w.preferences->>'name' as pname,
      w.preferences->'ageRange'->>0 as age_range
    from waitlist_signups w order by w.created_at
  `)) as unknown as Array<{ email: string; city: string; locale: string; created_at: string | Date; pname: string | null; age_range: string | null }>;
  const births = (await db.execute(sql`
    select lower(email) as email, max(birth_date) as d from bookings where birth_date is not null group by 1
    union all
    select lower(email), max((state->'answers'->>'birthDate')::date) from jouw_tafel_guests
      where state->'answers'->>'birthDate' ~ '^\\d{4}-\\d{2}-\\d{2}' group by 1
    union all
    select lower(email), max((raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'birthDate')::date) from auth.users
      where raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'birthDate' ~ '^\\d{4}-\\d{2}-\\d{2}' group by 1
  `).catch(() => [])) as unknown as Array<{ email: string; d: string | Date | null }>;
  const manual = (await db.execute(sql`
    select email_normalized as email, subject, sent_at from email_log
    where sent_at > now() - interval '60 days' and subject not like '[%'
  `)) as unknown as Array<{ email: string; subject: string; sent_at: string | Date }>;
  const names = (await db.execute(sql`
    select email_normalized as email, first_name from customers where first_name is not null
  `)) as unknown as Array<{ email: string; first_name: string }>;
  const members = (await db.execute(sql`
    select distinct lower(email) as email from memberships where status <> 'canceled'
  `)) as unknown as Array<{ email: string }>;
  const suppressed = (await db.execute(sql`
    select distinct email_normalized as email from email_log where last_event in ('bounced', 'complained', 'suppressed')
  `)) as unknown as Array<{ email: string }>;
  const subs = await db.select().from(inviteSubscribers).catch(() => [] as Array<typeof inviteSubscribers.$inferSelect>);

  const nameBy = new Map(names.map((n) => [n.email, n.first_name.trim().split(" ")[0] || null]));
  const memberSet = new Set(members.map((m) => m.email));
  const suppressedSet = new Set(suppressed.map((s) => s.email));
  const subBy = new Map(subs.map((s) => [s.emailNormalized, s]));
  const birthBy = new Map<string, Date>();
  for (const b of births) if (b.d) birthBy.set(b.email, new Date(b.d));
  const manualBy = new Map<string, Date[]>();
  for (const m of manual) {
    if (emailKind(m.subject) !== "Uitnodiging") continue;
    manualBy.set(m.email, [...(manualBy.get(m.email) ?? []), new Date(m.sent_at)]);
  }

  const people = new Map<string, InvitePerson>();
  for (const r of rows) {
    const city = supportedCity(r.city);
    if (!city) continue;
    let p = people.get(r.email);
    if (!p) {
      const sub = subBy.get(r.email);
      p = {
        email: r.email,
        name: nameBy.get(r.email) ?? (r.pname?.trim().split(" ")[0] || null),
        locale: r.locale === "en" ? "en" : "nl",
        signedUpAt: new Date(r.created_at),
        cities: [],
        prefs: (sub?.cityPrefs as Record<string, CityPref> | undefined) ?? {},
        token: sub?.token ?? "",
        member: memberSet.has(r.email),
        suppressed: suppressedSet.has(r.email),
        ageRange: null,
        birthDate: birthBy.get(r.email) ?? null,
        manualInvites: manualBy.get(r.email) ?? [],
      };
      people.set(r.email, p);
    }
    if (!p.cities.includes(city)) p.cities.push(city);
    p.locale = r.locale === "en" ? "en" : "nl";
    if (r.age_range) p.ageRange = r.age_range;
  }

  // Everyone needs a token for the link to their city settings.
  const missing = [...people.values()].filter((p) => !p.token);
  for (const p of missing) p.token = token();
  if (missing.length > 0 && !options.dryRun) {
    await db
      .insert(inviteSubscribers)
      .values(missing.map((p) => ({ emailNormalized: p.email, token: p.token })))
      .onConflictDoNothing();
  }
  return [...people.values()];
}

/** The Sundays that can be booked or will open, with their seats. */
export async function loadInviteEvents(now: Date = new Date()): Promise<InviteEvent[]> {
  const rows = (await getDb().execute(sql`
    select e.id, e.city, e.starts_at, e.capacity, e.price_cents, e.extras, e.experience_type, e.name_nl,
      (select coalesce(sum(b.seats), 0) from bookings b
        where b.event_id = e.id and b.payment_status = 'paid' and b.lifecycle_status in ('active', 'transferred'))::int as sold,
      (select p.capacity <= (select coalesce(sum(b2.seats), 0) from bookings b2
         where b2.event_id = p.id and b2.payment_status = 'paid' and b2.lifecycle_status in ('active', 'transferred'))
        from events p where p.city = e.city and p.workflow_status = 'published' and p.starts_at < now()
          and p.experience_type in ('jouw-tafel', 'sunday-table')
        order by p.starts_at desc limit 1) as last_sold_out
    from events e
    where e.workflow_status = 'published' and e.experience_type in ('jouw-tafel', 'sunday-table')
      and e.starts_at > ${new Date(now.getTime() + MIN_DAYS_BEFORE * DAY).toISOString()}::timestamptz
      and e.starts_at < ${new Date(now.getTime() + (INVITE_LEAD_DAYS + PLAN_DAYS + 3) * DAY).toISOString()}::timestamptz
  `)) as unknown as Array<{
    id: string;
    city: string;
    starts_at: string | Date;
    capacity: number;
    price_cents: number;
    extras: Record<string, unknown> | null;
    experience_type: string;
    name_nl: string;
    sold: number;
    last_sold_out: boolean | null;
  }>;
  return rows.map((r) => {
    const startsAt = new Date(r.starts_at).toISOString();
    const opensAt = typeof r.extras?.bookingOpensAt === "string" ? (r.extras.bookingOpensAt as string) : null;
    const window = jouwTafelBookingWindow(startsAt, opensAt);
    // Held back by an admin ("coming soon" while the window is open).
    const heldBack = Boolean(r.extras?.comingSoon);
    return {
      id: r.id,
      city: supportedCity(r.city) ?? r.city,
      startsAt,
      capacity: r.capacity,
      sold: Number(r.sold),
      // A series table costs what the site charges for it.
      priceCents: r.experience_type === "jouw-tafel" ? JOUW_TAFEL_SEAT_PRICE_CENTS : r.price_cents || JOUW_TAFEL_SEAT_PRICE_CENTS,
      membersFrom: memberBookingOpensAt(startsAt, opensAt),
      everyoneFrom: window.everyoneFrom,
      open: !heldBack && Number(r.sold) < r.capacity,
      lastSoldOut: Boolean(r.last_sold_out),
      bracket: bracketFromEventName(r.name_nl ?? ""),
    };
  });
}

/** From when this person may be invited for this Sunday. */
function inviteFrom(e: InviteEvent, member: boolean): Date {
  const opens = member ? e.membersFrom : e.everyoneFrom;
  return new Date(Math.max(opens.getTime(), Date.parse(e.startsAt) - INVITE_LEAD_DAYS * DAY));
}

type History = {
  sends: SendRow[];
  clicksBySend: Map<string, Array<{ eventId: string | null; at: Date }>>;
  bookings: Map<string, Array<{ eventId: string; at: Date }>>;
};

async function loadHistory(): Promise<History> {
  const db = getDb();
  const sends = await db.select().from(inviteSends).catch(() => [] as SendRow[]);
  const clicks = await db.select().from(inviteClicks).catch(() => [] as Array<typeof inviteClicks.$inferSelect>);
  const bookingRows = (await db.execute(sql`
    select lower(email) as email, event_id, created_at from bookings where payment_status = 'paid'
  `)) as unknown as Array<{ email: string; event_id: string; created_at: string | Date }>;
  const clicksBySend = new Map<string, Array<{ eventId: string | null; at: Date }>>();
  for (const c of clicks) {
    const list = clicksBySend.get(c.sendId) ?? [];
    list.push({ eventId: c.eventId, at: c.clickedAt });
    clicksBySend.set(c.sendId, list);
  }
  const bookings = new Map<string, Array<{ eventId: string; at: Date }>>();
  for (const b of bookingRows) {
    const list = bookings.get(b.email) ?? [];
    list.push({ eventId: b.event_id, at: new Date(b.created_at) });
    bookings.set(b.email, list);
  }
  return { sends, clicksBySend, bookings };
}

/** Interest of one person from their sent invites, clicks and bookings. */
export function personEngagement(email: string, history: History, now: Date): Engagement {
  const sent = history.sends
    .filter((s) => s.emailNormalized === email && s.status === "sent" && s.sentAt)
    .map((s) => {
      const at = s.sentAt!;
      const until = at.getTime() + ENGAGE_DAYS * DAY;
      const clicked = (history.clicksBySend.get(s.id) ?? []).length > 0;
      const booked = (history.bookings.get(email) ?? []).some((b) => b.at.getTime() > at.getTime() && b.at.getTime() <= until);
      return { sentAt: at, kind: s.kind, engaged: clicked || booked };
    });
  return engagement(sent, now);
}

function mailEvent(e: InviteEvent, send: Pick<SendRow, "code">, index: number, locale: InviteLocale): MailEvent {
  return {
    city: e.city,
    startsAt: e.startsAt,
    priceCents: e.priceCents,
    scarcity: scarcityLine({ capacity: e.capacity, sold: e.sold, lastSoldOut: e.lastSoldOut }, locale),
    url: linkUrl(send, index),
  };
}

/** Subject and text for a planned or due send, with the seats of now. */
export function composeSend(send: SendRow, person: InvitePerson, events: InviteEvent[]): { subject: string; body: string } | null {
  const locale: InviteLocale = send.locale === "en" ? "en" : "nl";
  const cities = followedCities(person).length > 0 ? followedCities(person) : person.cities;
  if (send.kind === "checkin") {
    return checkinMail({ name: person.name, cities, stayUrl: linkUrl(send, 0), manageUrl: manageUrl(person), locale });
  }
  const list = send.eventIds
    .map((id, i) => ({ e: events.find((x) => x.id === id), i: i + 1 }))
    .filter((x): x is { e: InviteEvent; i: number } => Boolean(x.e && x.e.open));
  if (list.length === 0) return null;
  if (send.kind === "nudge") {
    return nudgeMail({ name: person.name, cities, event: mailEvent(list[0]!.e, send, list[0]!.i, locale), manageUrl: manageUrl(person), locale });
  }
  return inviteMail({
    name: person.name,
    cities,
    events: list.map(({ e, i }) => mailEvent(e, send, i, locale)),
    member: person.member,
    manageUrl: manageUrl(person),
    locale,
  });
}

/**
 * Plans each person's next mail (at most one waiting per person), within
 * the coming PLAN_DAYS: an invite on their own weekday and time, a
 * follow-up for a click without a booking, or the "still interested?" mail.
 */
export async function planInvites(
  now: Date = new Date(),
  options: { dryRun?: boolean } = {},
): Promise<{ planned: number; expired: number; preview?: Array<typeof inviteSends.$inferInsert> }> {
  const settings = await getInviteSettings();
  if (!settings.enabled && !options.dryRun) return { planned: 0, expired: 0 };
  const db = getDb();

  // Not approved in time: dropped, the next round plans again.
  const expired = options.dryRun
    ? []
    : await db
        .update(inviteSends)
        .set({ status: "skipped", skipReason: "niet goedgekeurd" })
        .where(and(eq(inviteSends.status, "queued"), lte(inviteSends.scheduledFor, new Date(now.getTime() - 20 * 60 * 60 * 1000))))
        .returning({ id: inviteSends.id });

  const [people, events, history] = await Promise.all([loadPeople(options), loadInviteEvents(now), loadHistory()]);
  const horizon = now.getTime() + PLAN_DAYS * DAY;
  const values: Array<typeof inviteSends.$inferInsert> = [];

  for (const person of people) {
    if (person.suppressed) continue;
    const cities = followedCities(person);
    if (cities.length === 0) continue;
    const mine = history.sends.filter((s) => s.emailNormalized === person.email);
    // An uncertain mail may have gone out: nothing new until an admin settles it.
    if (mine.some((s) => s.status === "queued" || s.status === "approved" || s.status === "sending")) continue;

    const booked = new Set((history.bookings.get(person.email) ?? []).map((b) => b.eventId));
    const invitedBefore = new Set(mine.filter((s) => s.status === "sent" && s.kind === "invite").flatMap((s) => s.eventIds));
    const nudgedBefore = new Set(mine.filter((s) => s.kind === "nudge").flatMap((s) => s.eventIds));
    const base = {
      emailNormalized: person.email,
      cities,
      isMember: person.member,
      locale: person.locale,
    };

    // Clicked an invite, did not book that Sunday: one follow-up.
    const clicked = mine
      .filter((s) => s.status === "sent" && s.kind === "invite")
      .flatMap((s) => (history.clicksBySend.get(s.id) ?? []).map((c) => ({ ...c, send: s })))
      .filter((c) => c.eventId && !booked.has(c.eventId) && !nudgedBefore.has(c.eventId))
      .filter((c) => now.getTime() - c.at.getTime() < NUDGE_UNTIL_DAYS * DAY);
    const nudgeFor = clicked.map((c) => ({ c, e: events.find((e) => e.id === c.eventId && e.open) })).find((x) => x.e);
    if (nudgeFor?.e) {
      const at = nextSlot(new Date(Math.max(now.getTime(), nudgeFor.c.at.getTime() + NUDGE_AFTER_DAYS * DAY)), person.signedUpAt, `${person.email}:n`, true);
      if (at.getTime() <= horizon) {
        values.push({ ...base, code: code(), kind: "nudge", scheduledFor: at, eventIds: [nudgeFor.e.id] });
        continue;
      }
    }

    const interest = personEngagement(person.email, history, now);
    if (interest.status === "stopped") continue;
    const sentDates = [
      ...mine.filter((s) => s.status === "sent" && s.kind !== "nudge" && s.sentAt).map((s) => s.sentAt!),
      ...person.manualInvites,
    ];
    const lastCheckin = mine.filter((s) => s.kind === "checkin" && s.status === "sent").map((s) => s.sentAt!).sort((a, b) => b.getTime() - a.getTime())[0];

    if (interest.status === "checkin" && !lastCheckin) {
      const at = nextSlot(now, person.signedUpAt, `${person.email}:c`);
      if (at.getTime() <= horizon) values.push({ ...base, code: code(), kind: "checkin", scheduledFor: at, eventIds: [] });
      continue;
    }
    if (interest.status === "checkin" && lastCheckin && now.getTime() - lastCheckin.getTime() < CHECKIN_WAIT_DAYS * DAY) continue;

    const slowed = interest.status === "slow" || cities.every((c) => person.prefs[c] === "less");
    const allowed = nextAllowedAt(sentDates, cities.length, slowed);
    const candidates = events.filter(
      (e) =>
        e.open &&
        cities.includes(e.city) &&
        !booked.has(e.id) &&
        !invitedBefore.has(e.id) &&
        fitsBracket(e.bracket, person, e.startsAt),
    );
    if (candidates.length === 0) continue;
    const earliest = Math.min(...candidates.map((e) => inviteFrom(e, person.member).getTime()));
    const at = nextSlot(new Date(Math.max(now.getTime(), allowed?.getTime() ?? 0, earliest)), person.signedUpAt, person.email);
    if (at.getTime() > horizon) continue;
    const included = candidates
      .filter((e) => inviteFrom(e, person.member).getTime() <= at.getTime())
      .filter((e) => Date.parse(e.startsAt) - at.getTime() >= MIN_DAYS_BEFORE * DAY)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    if (included.length === 0) continue;
    values.push({ ...base, code: code(), kind: "invite", scheduledFor: at, eventIds: included.map((e) => e.id) });
  }

  if (values.length > 0) {
    const byEmail = new Map(people.map((p) => [p.email, p]));
    for (const v of values) {
      const composed = composeSend(v as SendRow, byEmail.get(v.emailNormalized)!, events);
      v.subject = composed?.subject ?? null;
      v.body = composed?.body ?? null;
    }
    if (options.dryRun) return { planned: values.length, expired: 0, preview: values };
    // The unique index allows one open mail per address: a second planning
    // round at the same moment cannot add another.
    const inserted = await db.insert(inviteSends).values(values).onConflictDoNothing().returning({ email: inviteSends.emailNormalized });
    const kept = new Set(inserted.map((r) => r.email));
    values.splice(0, values.length, ...values.filter((v) => kept.has(v.emailNormalized)));
  }
  if (!options.dryRun && (values.length > 0 || expired.length > 0)) {
    await logRun({
      kind: "plan",
      startedAt: now,
      planned: values.length,
      skipped: expired.length,
      details: values.map((v) => ({ email: v.emailNormalized, status: v.kind as string })),
    });
  }
  return { planned: values.length, expired: expired.length };
}

/** Amsterdam calendar day of a moment. */
function dayOf(date: Date): string {
  return amsterdamParts(date).day;
}

export type SendRoundResult = {
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{ email: string; status: string; reason?: string; subject?: string }>;
};

/** Writes one round to invite_runs (only rounds that did something). */
async function logRun(run: typeof inviteRuns.$inferInsert): Promise<void> {
  await getDb()
    .insert(inviteRuns)
    .values(run)
    .catch((error: unknown) => console.error("[invites] could not log run", error));
}

/** A failed send pauses everything and tells the team, once. */
async function pauseAfterFailure(reason: string): Promise<void> {
  const settings = await getInviteSettings();
  if (settings.paused) return;
  await saveInviteSettings({ paused: true, pausedReason: reason });
  const resend = getResendClient();
  if (!resend) return;
  const admin = getAdminBaseUrl();
  await resend.emails
    .send({
      from: getEmailFrom(),
      to: REPLY_TO,
      subject: "Uitnodigingen gepauzeerd: versturen mislukte",
      text: [
        "Het versturen van een uitnodiging mislukte, daarom zijn alle uitnodigingen gepauzeerd.",
        "",
        `Fout: ${reason}`,
        "",
        `Bekijk het en hervat in het dashboard: ${admin}/invites`,
      ].join("\n"),
    })
    .catch(() => undefined);
}

/**
 * Sends what is due, one mail at a time, never more than today's maximum.
 * In manual mode only approved mails go out. Each mail is claimed
 * first (status "sending", only from queued/approved), so two rounds can
 * never send it twice. Seats and bookings are checked again right before
 * sending. A failure pauses everything and mails the team. With dryRun
 * nothing is claimed or sent: the result says what would go out.
 */
export async function sendDueInvites(now: Date = new Date(), options: { dryRun?: boolean } = {}): Promise<SendRoundResult> {
  // Real mails only from production; locally and on previews it is always a dry run.
  const dryRun = Boolean(options.dryRun) || process.env.VERCEL_ENV !== "production";
  const empty: SendRoundResult = { sent: 0, skipped: 0, failed: 0, details: [] };
  const settings = await getInviteSettings();
  if (dryRun) return sendRound(now, settings, true);
  if (!settings.enabled || settings.paused) return empty;
  // One sending round at a time.
  if (!(await takeSendLock())) return empty;
  try {
    await settleUncertain(now);
    return await sendRound(now, settings, false);
  } finally {
    await releaseSendLock();
  }
}

const LOCK_KEY = "invites_send_lock";
const ROUND_MS = 60 * 1000;
const RECENT_MS = 3 * DAY;

/** A lease in site_settings: taken when free or older than two minutes. */
async function takeSendLock(): Promise<boolean> {
  const rows = (await getDb().execute(sql`
    insert into site_settings (key, value, updated_at) values (${LOCK_KEY}, '{}'::jsonb, now())
    on conflict (key) do update set updated_at = now()
    where site_settings.updated_at < now() - interval '2 minutes'
    returning key
  `)) as unknown as Array<{ key: string }>;
  return rows.length > 0;
}

async function releaseSendLock(): Promise<void> {
  await getDb()
    .execute(sql`update site_settings set updated_at = now() - interval '1 day' where key = ${LOCK_KEY}`)
    .catch(() => undefined);
}

/**
 * Uncertain mails (still "sending" after five minutes): when email_log shows
 * our mail to that address right after the claim, it went out. Only ever
 * settled as sent; anything else waits for an admin.
 */
async function settleUncertain(now: Date): Promise<void> {
  const db = getDb();
  const stuck = await db
    .select({ id: inviteSends.id, email: inviteSends.emailNormalized, claimedAt: inviteSends.claimedAt })
    .from(inviteSends)
    .where(and(eq(inviteSends.status, "sending"), lte(inviteSends.claimedAt, new Date(now.getTime() - 5 * 60 * 1000))));
  for (const row of stuck) {
    if (!row.claimedAt) continue;
    const [found] = (await db.execute(sql`
      select resend_id, sent_at from email_log
      where email_normalized = ${row.email}
        and from_email like ${`%${FROM_ADDRESS}%`}
        and sent_at between ${new Date(row.claimedAt.getTime() - 60 * 1000)} and ${new Date(row.claimedAt.getTime() + 10 * 60 * 1000)}
      order by sent_at limit 1
    `)) as unknown as Array<{ resend_id: string | null; sent_at: string | Date }>;
    if (!found) continue;
    await db
      .update(inviteSends)
      .set({ status: "sent", sentAt: new Date(found.sent_at), resendId: found.resend_id })
      .where(and(eq(inviteSends.id, row.id), eq(inviteSends.status, "sending")));
  }
}

/** Did this address get an invite in the last three days (ours or by hand)? */
async function mailedRecently(email: string, exceptId: string, now: Date): Promise<boolean> {
  const since = new Date(now.getTime() - RECENT_MS);
  const db = getDb();
  const ours = await db
    .select({ id: inviteSends.id })
    .from(inviteSends)
    .where(
      and(
        eq(inviteSends.emailNormalized, email),
        sql`${inviteSends.id} <> ${exceptId}`,
        sql`((${inviteSends.status} = 'sent' and ${inviteSends.sentAt} > ${since}) or (${inviteSends.status} = 'sending' and ${inviteSends.claimedAt} > ${since}))`,
      ),
    )
    .limit(1);
  if (ours.length > 0) return true;
  const logged = (await db.execute(sql`
    select subject, from_email from email_log where email_normalized = ${email} and sent_at > ${since}
  `)) as unknown as Array<{ subject: string; from_email: string | null }>;
  return logged.some((m) => emailKind(m.subject) === "Uitnodiging" || (m.from_email ?? "").includes(FROM_ADDRESS));
}

async function sendRound(now: Date, settings: InviteSettings, dryRun: boolean): Promise<SendRoundResult> {
  const options = { dryRun };
  const empty: SendRoundResult = { sent: 0, skipped: 0, failed: 0, details: [] };
  const startedMs = Date.now();
  const db = getDb();
  const approval = needsApproval(settings);
  const cap = dailyCap(settings, now);
  // A dry run shows what would go out once approved.
  const allowed: Array<"queued" | "approved"> = approval && !options.dryRun ? ["approved"] : ["queued", "approved"];

  // Runs every minute: usually nothing is due, so that is checked first.
  const dueAll = await db
    .select()
    .from(inviteSends)
    .where(and(inArray(inviteSends.status, allowed), lte(inviteSends.scheduledFor, now)))
    .orderBy(inviteSends.scheduledFor)
    .limit(cap);
  if (dueAll.length === 0) return empty;

  const today = dayOf(now);
  // Uncertain mails count as sent.
  const sentToday = (
    await db
      .select({ sentAt: inviteSends.sentAt, claimedAt: inviteSends.claimedAt })
      .from(inviteSends)
      .where(
        and(
          inArray(inviteSends.status, ["sent", "sending"]),
          sql`coalesce(${inviteSends.sentAt}, ${inviteSends.claimedAt}) >= ${new Date(now.getTime() - DAY)}`,
        ),
      )
  ).filter((s) => {
    const at = s.sentAt ?? s.claimedAt;
    return at && dayOf(at) === today;
  }).length;
  if (sentToday >= cap) return empty;
  const due = dueAll.slice(0, cap - sentToday);

  const [people, events, history] = await Promise.all([loadPeople({ dryRun: options.dryRun }), loadInviteEvents(now), loadHistory()]);
  const byEmail = new Map(people.map((p) => [p.email, p]));
  const resend = getResendClient();
  const result: SendRoundResult = { sent: 0, skipped: 0, failed: 0, details: [] };

  for (const send of due) {
    if (!options.dryRun) {
      // The lock lease is two minutes: a long round stops, the next one goes on.
      if (Date.now() - startedMs > ROUND_MS) break;
      const claimed = await db
        .update(inviteSends)
        .set({ status: "sending", claimedAt: new Date() })
        .where(and(eq(inviteSends.id, send.id), inArray(inviteSends.status, allowed)))
        .returning({ id: inviteSends.id });
      if (claimed.length === 0) continue;
    }
    const person = byEmail.get(send.emailNormalized);
    const booked = new Set((history.bookings.get(send.emailNormalized) ?? []).map((b) => b.eventId));
    const stillFollowed = person ? followedCities(person) : [];
    const skip = async (reason: string) => {
      if (!options.dryRun) {
        await db
          .update(inviteSends)
          .set({ status: "skipped", skipReason: reason })
          .where(and(eq(inviteSends.id, send.id), eq(inviteSends.status, "sending")));
      }
      result.skipped++;
      result.details.push({ email: send.emailNormalized, status: "skipped", reason });
    };
    if (!person || person.suppressed) {
      await skip(!person ? "niet meer op de lijst" : "bounce of spam");
      continue;
    }
    if (await mailedRecently(send.emailNormalized, send.id, now)) {
      await skip("al gemaild in de laatste 3 dagen");
      continue;
    }
    if (stillFollowed.length === 0) {
      await skip("volgt geen steden meer");
      continue;
    }
    const valid = send.eventIds.filter((id) => !booked.has(id) && events.some((e) => e.id === id && e.open && stillFollowed.includes(e.city)));
    if (send.kind !== "checkin" && valid.length === 0) {
      await skip("geboekt, vol of te dichtbij");
      continue;
    }
    const current = { ...send, eventIds: send.kind === "checkin" ? [] : send.eventIds.map((id) => (valid.includes(id) ? id : "")) };
    const composed = composeSend(current, person, events);
    if (!composed || !resend) {
      await skip(!resend ? "mail niet ingesteld" : "niets te sturen");
      continue;
    }
    if (options.dryRun) {
      result.sent++;
      result.details.push({ email: person.email, status: "would_send", subject: composed.subject });
      continue;
    }
    const unsubscribe = `${getSiteUrl().replace(/\/$/, "")}/api/invites/unsubscribe?t=${person.token}`;
    let error: string | null = null;
    let uncertain: string | null = null;
    let resendId: string | null = null;
    try {
      const sentMail = await resend.emails.send(
        {
          from: FROM,
          replyTo: REPLY_TO,
          to: person.email,
          subject: composed.subject,
          text: composed.body,
          headers: {
            "List-Unsubscribe": `<${unsubscribe}>, <mailto:${REPLY_TO}?subject=Afmelden%20uitnodigingen>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        },
        // Resend sends one mail per key, however often it is asked.
        { idempotencyKey: `invite-${send.id}` },
      );
      // Resend answered with an error: certainly not sent.
      if (sentMail.error) error = sentMail.error.message;
      resendId = sentMail.data?.id ?? null;
    } catch (e) {
      // No answer: it may have gone out.
      uncertain = e instanceof Error ? e.message : String(e);
    }
    if (error) {
      await db.update(inviteSends).set({ status: "failed", skipReason: error }).where(eq(inviteSends.id, send.id));
      result.failed++;
      result.details.push({ email: person.email, status: "failed", reason: error });
      await pauseAfterFailure(error);
      break;
    }
    if (uncertain) {
      // Stays "sending": never retried, settled by email_log or an admin.
      await db.update(inviteSends).set({ skipReason: uncertain }).where(eq(inviteSends.id, send.id)).catch(() => undefined);
      result.failed++;
      result.details.push({ email: person.email, status: "uncertain", reason: uncertain });
      await pauseAfterFailure(`onzeker of verstuurd: ${uncertain}`);
      break;
    }
    const saved = await db
      .update(inviteSends)
      .set({ status: "sent", sentAt: new Date(), subject: composed.subject, body: composed.body, resendId })
      .where(eq(inviteSends.id, send.id))
      .then(() => true)
      .catch(() => false);
    if (!saved) {
      // Sent, but not written down: stays "sending", so it counts as sent.
      result.sent++;
      result.details.push({ email: person.email, status: "uncertain", reason: "verstuurd, opslaan mislukt" });
      await pauseAfterFailure("verstuurd, maar opslaan mislukte");
      break;
    }
    result.sent++;
    result.details.push({ email: person.email, status: "sent", subject: composed.subject });
  }

  if (result.details.length > 0) {
    await logRun({
      kind: "send",
      dryRun: Boolean(options.dryRun),
      startedAt: now,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
      error: result.details.find((d) => d.status === "failed" || d.status === "uncertain")?.reason ?? null,
      details: result.details.map(({ email, status, reason }) => ({ email, status, ...(reason ? { reason } : {}) })),
    });
  }
  return result;
}
