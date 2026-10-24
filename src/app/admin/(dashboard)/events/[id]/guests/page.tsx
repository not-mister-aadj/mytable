import { and, asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EventGuestsView } from "@/components/admin/EventGuestsView";
import { JouwTafelBoard } from "@/components/admin/JouwTafelBoard";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { SundayMailsPanel } from "@/components/admin/SundayMailsPanel";
import { bookingFeedback, bookings, customers, eventGroups, eventVenues, events, venues } from "@/db/schema";
import { getDb } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, getSiteUrl, resolveHostname } from "@/lib/admin-url";
import { defaultScheduleAt, loadSundayMailContext, mailBlocker, type ScheduledMail } from "@/lib/admin/sunday-mails";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { formatEventAdminListDate } from "@/lib/event-datetime-local";
import { getEventTicketsData } from "@/lib/event-tickets-data";
import { loadEventBoard } from "@/lib/jouw-tafel/groups-server";
import { tablePageUrl } from "@/lib/table-page";
import { setCapacityAction } from "./settings-actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

const TABS = [
  { id: "gasten", label: "Gasten" },
  { id: "tafelindeling", label: "Tafelindeling" },
  { id: "mails", label: "Mails" },
  { id: "feedback", label: "Feedback" },
  { id: "instellingen", label: "Instellingen" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** One Sunday: its guests, how they sit, the mails they get, its settings. */
export default async function EventGuestsPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const isSunday = event.experienceType === SUNDAY_SOCIAL_TYPE || event.experienceType === JOUW_TAFEL_TYPE;
  const visibleTabs = isSunday ? TABS : TABS.filter((t) => t.id === "gasten" || t.id === "instellingen");
  const requested = (await searchParams).tab;
  const tab: TabId = visibleTabs.some((t) => t.id === requested) ? (requested as TabId) : "gasten";
  const tabHref = (t: TabId) => adminPath(`/events/${id}/guests${t === "gasten" ? "" : `?tab=${t}`}`, hostname);

  const pct = event.capacity > 0 ? Math.min(100, Math.round((event.spotsSold / event.capacity) * 100)) : 0;
  const publicUrl = `${getSiteUrl()}/nl/agenda/${event.slug}`;

  return (
    <div className="space-y-6">
      <header>
        <Link href={adminPath("/events", hostname)} className="text-sm text-wine/55 transition hover:text-burgundy">
          ← Alle zondagen
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl text-burgundy">
              {event.city} · {formatEventAdminListDate(new Date(event.startsAt), "nl", { weekday: "short" })}
            </h1>
            <p className="mt-1 text-sm text-wine/60">{event.nameNl}</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-wine/60">Bezetting</span>
              <span className="tabular-nums text-wine">
                {event.spotsSold}/{event.capacity}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-wine/10">
              <div
                className={`h-full rounded-full ${event.spotsSold >= event.capacity ? "bg-emerald-600" : "bg-burgundy/70"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <nav aria-label="Onderdelen van deze zondag" className="mt-5 flex gap-1 overflow-x-auto border-b border-border-subtle">
          {visibleTabs.map((t) => (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              aria-current={t.id === tab ? "page" : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
                t.id === tab ? "border-burgundy text-burgundy" : "border-transparent text-wine/60 hover:text-burgundy"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {tab === "gasten" ? <GuestsTab eventId={id} event={event} /> : null}
      {tab === "tafelindeling" ? <SeatingTab eventId={id} hostname={hostname} publicUrl={publicUrl} /> : null}
      {tab === "mails" ? <MailsTab eventId={id} /> : null}
      {tab === "feedback" ? <FeedbackTab eventId={id} /> : null}
      {tab === "instellingen" ? (
        <SettingsTab
          eventId={id}
          capacity={event.capacity}
          spotsSold={event.spotsSold}
          editHref={adminPath(`/events/${id}/edit`, hostname)}
          publicUrl={publicUrl}
        />
      ) : null}
    </div>
  );
}

async function GuestsTab({ eventId, event }: { eventId: string; event: typeof events.$inferSelect }) {
  const ticketsData = await getEventTicketsData(eventId);
  return (
    <EventGuestsView
      event={{
        id: event.id,
        nameNl: event.nameNl,
        city: event.city,
        startsAt: event.startsAt,
        spotsSold: event.spotsSold,
        capacity: event.capacity,
        slug: event.slug,
      }}
      tickets={ticketsData.tickets}
      transferTargets={ticketsData.transferTargets}
    />
  );
}

async function SeatingTab({ eventId, hostname, publicUrl }: { eventId: string; hostname: string; publicUrl: string }) {
  const board = await loadEventBoard(eventId);
  if (!board) return <p className="text-sm text-wine/60">Deze zondag heeft geen tafelindeling.</p>;
  const tablePages = Object.fromEntries(
    await Promise.all(board.guests.map(async (g) => [g.bookingId, await tablePageUrl(g.bookingId, "nl", getSiteUrl())] as const)),
  );
  return (
    <JouwTafelBoard
      board={board}
      tablePages={tablePages}
      embedded
      calendarHref={adminPath(`/jouw-tafel/kalender?maand=${board.event.startsAt.slice(0, 7)}`, hostname)}
      tablePageHref={publicUrl}
    />
  );
}

async function MailsTab({ eventId }: { eventId: string }) {
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx) return null;
  return (
    <SundayMailsPanel
      eventId={eventId}
      blockers={{
        location: mailBlocker(ctx, "location"),
        saturday: mailBlocker(ctx, "saturday"),
        morning: mailBlocker(ctx, "morning"),
        feedback: mailBlocker(ctx, "feedback"),
      }}
      plans={{ saturday: planOf(ctx.schedule.saturday), morning: planOf(ctx.schedule.morning), feedback: planOf(ctx.schedule.feedback) }}
      defaultTimes={{
        saturday: localInput(defaultScheduleAt(ctx.startsAt, "saturday")),
        morning: localInput(defaultScheduleAt(ctx.startsAt, "morning")),
        feedback: localInput(defaultScheduleAt(ctx.startsAt, "feedback")),
      }}
      guests={ctx.guests.map((g) => ({
        bookingId: g.bookingId,
        name: g.firstName || g.email,
        groupNumber: g.groupNumber,
        needsIntro: g.needsIntro,
        sentLocation: g.sentLocation,
        sentSaturday: g.sentSaturday,
        sentMorning: g.sentMorning,
        sentFeedback: g.sentFeedback,
      }))}
    />
  );
}

async function FeedbackTab({ eventId }: { eventId: string }) {
  const db = getDb();
  const [rows, guests, venue] = await Promise.all([
    db
      .select({ f: bookingFeedback, name: bookings.customerName, email: bookings.email, group: eventGroups.number, profilePhoto: customers.photoUrl })
      .from(bookingFeedback)
      .innerJoin(bookings, eq(bookings.id, bookingFeedback.bookingId))
      .leftJoin(eventGroups, eq(eventGroups.id, bookings.groupId))
      .leftJoin(customers, sql`${customers.emailNormalized} = lower(trim(${bookings.email}))`)
      .where(eq(bookingFeedback.eventId, eventId)),
    db
      .select({ id: bookings.id, name: bookings.customerName })
      .from(bookings)
      .where(and(eq(bookings.eventId, eventId), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active"))),
    db
      .select({ name: venues.name })
      .from(eventVenues)
      .innerJoin(venues, eq(venues.id, eventVenues.venueId))
      .where(eq(eventVenues.eventId, eventId))
      .orderBy(asc(eventVenues.position))
      .limit(1),
  ]);
  const nameOf = new Map(guests.map((g) => [g.id, g.name?.trim().split(/\s+/)[0] ?? "Gast"]));
  return (
    <FeedbackPanel
      eventId={eventId}
      venueName={venue[0]?.name ?? null}
      guests={guests.length}
      rows={rows
        .filter((r) => r.f.mood)
        .map((r) => ({
          id: r.f.id,
          name: r.name?.trim() || r.email,
          group: r.group ?? null,
          mood: r.f.mood,
          venueMood: r.f.venueMood,
          highlight: r.f.highlight,
          improve: r.f.improve,
          quoteConsent: r.f.quoteConsent,
          photoUrl: r.profilePhoto ?? r.f.photoUrl,
          contactOk: r.f.contactOk,
          email: r.email,
          wantToSee: (r.f.wantToSee ?? []).map((id) => nameOf.get(id) ?? "?"),
          used: Boolean(r.f.usedAt),
        }))}
    />
  );
}

/** "2026-10-24T16:00" in Amsterdam, for a datetime-local field. */
function localInput(d: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return parts.replace(" ", "T");
}

/** A planned send still to come; once its time has passed it counts as sent. */
function planOf(plan: ScheduledMail | undefined) {
  if (!plan || Date.parse(plan.at) <= Date.now()) return null;
  const label = new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(plan.at));
  return { label, count: plan.ids.length, bookingIds: plan.ids.map((i) => i.bookingId) };
}

function SettingsTab({
  eventId,
  capacity,
  spotsSold,
  editHref,
  publicUrl,
}: {
  eventId: string;
  capacity: number;
  spotsSold: number;
  editHref: string;
  publicUrl: string;
}) {
  const save = setCapacityAction.bind(null, eventId);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form action={save} className="rounded-xl border border-border-subtle bg-beige/60 p-5">
        <label htmlFor="capacity" className="font-medium text-wine">
          Aantal plekken
        </label>
        <p className="mt-1 text-sm text-wine/60">
          {spotsSold} verkocht. Tafels vullen per 5, dus 10 extra plekken zijn twee tafels.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={Math.max(1, spotsSold)}
            max={200}
            defaultValue={capacity}
            className="w-24 rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine"
          />
          <button type="submit" className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream hover:bg-burgundy/90">
            Opslaan
          </button>
        </div>
      </form>
      <div className="rounded-xl border border-border-subtle bg-beige/60 p-5">
        <p className="font-medium text-wine">Meer</p>
        <ul className="mt-2 space-y-2 text-sm">
          <li>
            <Link href={editHref} prefetch={false} className="text-burgundy hover:underline">
              Tafel bewerken (tekst, foto&apos;s, locatie, publicatie)
            </Link>
          </li>
          <li>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
              Publieke pagina
            </a>
          </li>
          <li>
            <a href={`/api/admin/events/${eventId}/guests/export`} className="text-burgundy hover:underline">
              Gastenlijst als Excel
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
