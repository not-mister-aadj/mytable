import { desc, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { events, inviteClicks, inviteRuns, inviteSends } from "@/db/schema";
import { followedCities, loadPeople, personEngagement } from "@/lib/invites/engine";
import { amsterdamParts, dailyCap, ENGAGE_DAYS } from "@/lib/invites/logic";
import { getInviteSettings, needsApproval, type InviteSettings } from "@/lib/invites/settings";

const DAY = 24 * 60 * 60 * 1000;

export type InviteRow = {
  id: string;
  kind: string;
  status: string;
  scheduledFor: string;
  sentAt: string | null;
  email: string;
  name: string | null;
  cities: string[];
  events: string[];
  subject: string | null;
  body: string | null;
  skipReason: string | null;
  clicked: boolean;
  booked: boolean;
  locale: string;
  postponed: boolean;
  claimedAt: string | null;
};

export type InviteRunRow = {
  id: string;
  kind: string;
  dryRun: boolean;
  startedAt: string;
  planned: number;
  sent: number;
  skipped: number;
  failed: number;
  error: string | null;
  details: Array<{ email: string; status: string; reason?: string }>;
};

export type InviteEventRow = { label: string; startsAt: string; invited: number; clicked: number; booked: number };
export type InvitePersonRow = {
  email: string;
  name: string | null;
  cities: string[];
  status: string;
  ignored: number;
  lastClick: string | null;
  lastBooking: string | null;
  next: string | null;
};

export type InvitesDashboard = {
  settings: InviteSettings;
  now: string;
  approval: boolean;
  cap: number;
  sentToday: number;
  plannedToday: number;
  waitingApprovalToday: number;
  queue: InviteRow[];
  /** Claimed over five minutes ago and not settled: may have gone out. */
  uncertain: InviteRow[];
  sent: InviteRow[];
  runs: InviteRunRow[];
  /** Due now and allowed to go out (approved, or queued when no approval). */
  dueNow: number;
  /** Due now if it were automatic (queued or approved). */
  dueIfAuto: number;
  perEvent: InviteEventRow[];
  people: InvitePersonRow[];
  health: { sent7: number; bounced7: number; spam7: number };
};

const dayOf = (d: Date) => amsterdamParts(d).day;

function eventLabel(e: { city: string; startsAt: Date }): string {
  const date = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short" }).format(e.startsAt);
  return `${e.city} ${date}`;
}

export async function getInvitesDashboard(): Promise<InvitesDashboard> {
  const db = getDb();
  const now = new Date();
  const settings = await getInviteSettings();
  const sends = await db.select().from(inviteSends).orderBy(desc(inviteSends.scheduledFor));
  const clicks = await db.select().from(inviteClicks);
  const bookings = (await db.execute(sql`
    select lower(email) as email, event_id, created_at from bookings where payment_status = 'paid'
  `)) as unknown as Array<{ email: string; event_id: string; created_at: string | Date }>;
  const eventIds = [...new Set(sends.flatMap((s) => s.eventIds).filter(Boolean))];
  const eventRows = eventIds.length
    ? await db.select({ id: events.id, city: events.city, startsAt: events.startsAt }).from(events).where(inArray(events.id, eventIds))
    : [];
  const eventBy = new Map(eventRows.map((e) => [e.id, e]));
  const people = await loadPeople();
  const personBy = new Map(people.map((p) => [p.email, p]));
  const clicksBySend = new Map<string, Array<{ eventId: string | null; at: Date }>>();
  for (const c of clicks) clicksBySend.set(c.sendId, [...(clicksBySend.get(c.sendId) ?? []), { eventId: c.eventId, at: c.clickedAt }]);
  const bookingsBy = new Map<string, Array<{ eventId: string; at: Date }>>();
  for (const b of bookings) bookingsBy.set(b.email, [...(bookingsBy.get(b.email) ?? []), { eventId: b.event_id, at: new Date(b.created_at) }]);

  const toRow = (s: (typeof sends)[number]): InviteRow => {
    const at = s.sentAt;
    const booked = Boolean(
      at && (bookingsBy.get(s.emailNormalized) ?? []).some((b) => b.at > at && b.at.getTime() <= at.getTime() + ENGAGE_DAYS * DAY),
    );
    return {
      id: s.id,
      kind: s.kind,
      status: s.status,
      scheduledFor: s.scheduledFor.toISOString(),
      sentAt: at?.toISOString() ?? null,
      email: s.emailNormalized,
      name: personBy.get(s.emailNormalized)?.name ?? null,
      cities: s.cities,
      events: s.eventIds.map((id) => eventBy.get(id)).filter(Boolean).map((e) => eventLabel(e!)),
      subject: s.subject,
      body: s.body,
      skipReason: s.skipReason,
      clicked: (clicksBySend.get(s.id) ?? []).length > 0,
      booked,
      locale: s.locale,
      postponed: Boolean(s.postponedAt),
      claimedAt: s.claimedAt?.toISOString() ?? null,
    };
  };

  const today = dayOf(now);
  const queue = sends
    .filter((s) => s.status === "queued" || s.status === "approved")
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
    .map(toRow);
  // Replaced by a newer plan ("opnieuw gepland"): never a mail, so not listed.
  const sent = sends
    .filter((s) => s.status === "sent" || s.status === "failed" || (s.status === "skipped" && s.skipReason !== "opnieuw gepland"))
    .slice(0, 300)
    .map(toRow);

  const perEvent: InviteEventRow[] = eventRows
    .map((e) => {
      const invitedSends = sends.filter((s) => s.status === "sent" && s.eventIds.includes(e.id));
      const invitedEmails = new Set(invitedSends.map((s) => s.emailNormalized));
      const clicked = new Set(
        invitedSends.filter((s) => (clicksBySend.get(s.id) ?? []).some((c) => c.eventId === e.id)).map((s) => s.emailNormalized),
      );
      const booked = [...invitedEmails].filter((email) => {
        const firstSent = Math.min(...invitedSends.filter((s) => s.emailNormalized === email).map((s) => s.sentAt!.getTime()));
        return (bookingsBy.get(email) ?? []).some((b) => b.eventId === e.id && b.at.getTime() > firstSent);
      }).length;
      return { label: eventLabel(e), startsAt: e.startsAt.toISOString(), invited: invitedEmails.size, clicked: clicked.size, booked };
    })
    .filter((r) => r.invited > 0)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const history = { sends, clicksBySend, bookings: bookingsBy };
  const peopleRows: InvitePersonRow[] = people
    .filter((p) => p.cities.length > 0)
    .map((p) => {
      const mine = sends.filter((s) => s.emailNormalized === p.email);
      const interest = personEngagement(p.email, history, now);
      const followed = followedCities(p);
      const lastClick = mine
        .flatMap((s) => clicksBySend.get(s.id) ?? [])
        .map((c) => c.at)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      const lastBooking = (bookingsBy.get(p.email) ?? []).map((b) => b.at).sort((a, b) => b.getTime() - a.getTime())[0];
      const next = mine.filter((s) => s.status === "queued" || s.status === "approved").map((s) => s.scheduledFor)[0];
      const status = p.suppressed
        ? "Bounce/spam"
        : followed.length === 0
          ? "Afgemeld"
          : { active: "Actief", slow: "Afwachtend", checkin: "Slapend", stopped: "Gestopt" }[interest.status];
      return {
        email: p.email,
        name: p.name,
        cities: followed,
        status,
        ignored: interest.ignored,
        lastClick: lastClick?.toISOString() ?? null,
        lastBooking: lastBooking?.toISOString() ?? null,
        next: next?.toISOString() ?? null,
      };
    })
    .sort((a, b) => (a.next ?? "9").localeCompare(b.next ?? "9") || a.email.localeCompare(b.email));

  const weekAgo = now.getTime() - 7 * DAY;
  const recent = sends.filter((s) => s.status === "sent" && s.sentAt && s.sentAt.getTime() > weekAgo);
  const recentIds = recent.map((s) => s.resendId).filter((x): x is string => Boolean(x));
  const problems = recentIds.length
    ? ((await db.execute(sql`
        select last_event from email_log where resend_id in ${sql.raw(`(${recentIds.map((id) => `'${id.replace(/'/g, "")}'`).join(",")})`)}
      `)) as unknown as Array<{ last_event: string | null }>)
    : [];

  const runs = await db
    .select()
    .from(inviteRuns)
    .orderBy(desc(inviteRuns.startedAt))
    .limit(60)
    .catch(() => [] as Array<typeof inviteRuns.$inferSelect>);
  const approval = needsApproval(settings);
  const dueNow = sends.filter(
    (s) => (s.status === "approved" || (!approval && s.status === "queued")) && s.scheduledFor.getTime() <= now.getTime(),
  ).length;

  return {
    settings,
    now: now.toISOString(),
    runs: runs.map((r) => ({
      id: r.id,
      kind: r.kind,
      dryRun: r.dryRun,
      startedAt: r.startedAt.toISOString(),
      planned: r.planned,
      sent: r.sent,
      skipped: r.skipped,
      failed: r.failed,
      error: r.error,
      details: r.details ?? [],
    })),
    dueNow,
    dueIfAuto: queue.filter((s) => Date.parse(s.scheduledFor) <= now.getTime()).length,
    approval,
    cap: dailyCap(settings, now),
    sentToday: sends.filter((s) => s.status === "sent" && s.sentAt && dayOf(s.sentAt) === today).length,
    plannedToday: queue.filter((s) => dayOf(new Date(s.scheduledFor)) === today).length,
    waitingApprovalToday: sends.filter((s) => s.status === "queued" && dayOf(s.scheduledFor) === today).length,
    queue,
    uncertain: sends
      .filter((s) => s.status === "sending" && s.claimedAt && now.getTime() - s.claimedAt.getTime() > 5 * 60 * 1000)
      .map(toRow),
    sent,
    perEvent,
    people: peopleRows,
    health: {
      sent7: recent.length,
      bounced7: problems.filter((p) => p.last_event === "bounced").length,
      spam7: problems.filter((p) => p.last_event === "complained").length,
    },
  };
}
