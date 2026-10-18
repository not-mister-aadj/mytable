import Link from "next/link";
import { headers } from "next/headers";
import { adminPath } from "@/lib/admin-url";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { getTodayData, type TodoItem, type UpcomingSunday } from "@/lib/admin/today-data";

/** "Vandaag": what needs doing this week, the coming Sundays and the month. */
export default async function AdminTodayPage() {
  await requireAdmin();
  if (!isDbConfigured()) {
    return <p className="text-wine/70">DATABASE_URL ontbreekt. Zie .env.example.</p>;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = host.split(":")[0].toLowerCase();
  const href = (path: string) => adminPath(path, hostname);
  const eventHref = (id: string, tab?: string) => href(`/events/${id}/guests${tab ? `?tab=${tab}` : ""}`);

  const data = await getTodayData(eventHref);
  const todayLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date());

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm capitalize text-wine/55">{todayLabel}</p>
        <h1 className="mt-1 font-serif text-3xl text-burgundy">Vandaag</h1>
      </header>

      <section aria-labelledby="todo-title">
        <h2 id="todo-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
          Te doen
        </h2>
        {data.todos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border-subtle bg-beige/60 px-4 py-4 text-sm text-wine/65">
            Niets dat nu aandacht nodig heeft.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-beige/60">
            {data.todos.map((todo) => (
              <TodoRow key={todo.key} todo={todo} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sundays-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="sundays-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
            Komende zondagen
          </h2>
          <Link href={href("/events")} className="text-sm text-burgundy hover:underline">
            Alle zondagen
          </Link>
        </div>
        {data.sundays.length === 0 ? (
          <p className="mt-3 text-sm text-wine/60">Geen zondagen gepland.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.sundays.map((sunday) => (
              <SundayCard key={sunday.id} sunday={sunday} href={eventHref(sunday.id)} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section aria-labelledby="month-title">
          <h2 id="month-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
            Doel {data.month.label}
          </h2>
          <MonthTarget month={data.month} />
        </section>

        <section aria-labelledby="recent-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="recent-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
              Laatste boekingen
            </h2>
            <Link href={href("/bookings")} className="text-sm text-burgundy hover:underline">
              Alle boekingen
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-beige/60 text-sm">
            {data.recentBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate text-wine">
                  {b.name}
                  {b.seats > 1 ? <span className="text-wine/50"> +{b.seats - 1}</span> : null}
                  <span className="text-wine/50"> · {b.city} {shortDate(b.startsAt)}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-wine/45">{relative(b.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(iso));
}

function relative(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} u`;
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(iso));
}

const TONE: Record<TodoItem["tone"], { dot: string; label: string }> = {
  urgent: { dot: "bg-red-500", label: "Nu" },
  soon: { dot: "bg-amber-500", label: "Binnenkort" },
  info: { dot: "bg-wine/30", label: "Ter info" },
};

function TodoRow({ todo }: { todo: TodoItem }) {
  const tone = TONE[todo.tone];
  return (
    <li>
      <Link href={todo.href} className="flex items-start gap-3 px-4 py-3 transition hover:bg-cream/70">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-label={tone.label} />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-wine">{todo.title}</span>
          <span className="block text-sm text-wine/60">{todo.detail}</span>
        </span>
        <span aria-hidden className="mt-0.5 text-wine/30">
          →
        </span>
      </Link>
    </li>
  );
}

function SundayCard({ sunday, href }: { sunday: UpcomingSunday; href: string }) {
  const pct = sunday.capacity > 0 ? Math.min(100, Math.round((sunday.seatsSold / sunday.capacity) * 100)) : 0;
  const full = sunday.seatsSold >= sunday.capacity;
  const date = new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(sunday.startsAt));
  const when =
    sunday.daysUntil <= 0 ? "vandaag" : sunday.daysUntil === 1 ? "morgen" : `over ${sunday.daysUntil} dagen`;
  const answered = sunday.guests - sunday.questionsOpen;

  return (
    <Link
      href={href}
      className="block rounded-xl border border-border-subtle bg-beige/60 p-4 transition hover:border-burgundy/30 hover:bg-cream/70"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium text-wine">{sunday.city}</p>
        <p className="text-xs text-wine/50">{when}</p>
      </div>
      <p className="text-sm text-wine/60">
        {date}
        {sunday.venueName ? ` · ${sunday.venueName}` : ""}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-wine/10">
          <div className={`h-full rounded-full ${full ? "bg-emerald-600" : "bg-burgundy/70"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-wine/70">
          {sunday.seatsSold}/{sunday.capacity}
        </span>
      </div>
      {sunday.guests > 0 ? (
        <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-wine/55">
          <span>
            Vragen {answered}/{sunday.guests}
          </span>
          <span>Locatie {sunday.locationSent > 0 ? `${sunday.locationSent}/${sunday.guests}` : "nog niet"}</span>
        </p>
      ) : (
        <p className="mt-2.5 text-xs text-wine/45">Nog geen gasten</p>
      )}
    </Link>
  );
}

function MonthTarget({ month }: { month: { revenueCents: number; seats: number; targetCents: number | null } }) {
  const euro = (cents: number) => `€${Math.round(cents / 100).toLocaleString("nl-NL")}`;
  const pct = month.targetCents ? Math.min(100, Math.round((month.revenueCents / month.targetCents) * 100)) : null;
  const reached = month.targetCents !== null && month.revenueCents >= month.targetCents;
  return (
    <div className="mt-3 rounded-xl border border-border-subtle bg-beige/60 p-4">
      <p className="font-serif text-3xl text-burgundy">
        {euro(month.revenueCents)}
        {month.targetCents !== null ? <span className="text-lg text-wine/45"> / {euro(month.targetCents)}</span> : null}
      </p>
      <p className="mt-1 text-sm text-wine/60">
        {month.seats} {month.seats === 1 ? "plek" : "plekken"} verkocht voor zondagen deze maand
      </p>
      {pct !== null ? (
        <>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-wine/10">
            <div className={`h-full rounded-full ${reached ? "bg-emerald-600" : "bg-burgundy/70"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-wine/55">
            {reached ? "Doel gehaald" : `Nog ${euro((month.targetCents ?? 0) - month.revenueCents)} tot het doel`}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-wine/50">Geen doel voor deze maand.</p>
      )}
    </div>
  );
}
