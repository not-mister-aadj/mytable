import Link from "next/link";
import { FormatTabs } from "@/components/admin/FormatTabs";
import { monthKey, shiftMonth, type CalendarState } from "@/lib/jouw-tafel/groups-logic";
import type { CalendarMonth } from "@/lib/jouw-tafel/groups-server";

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** Three states only: the background says it all. */
const STATE_CLASS: Record<CalendarState, string> = {
  not_yet: "bg-wine/[0.05] text-wine/55 border-transparent",
  bookable: "bg-white text-wine border-border-subtle",
  full: "bg-wine text-cream border-wine",
};

const pill =
  "inline-flex min-h-8 items-center rounded-full border border-border-subtle px-3 text-xs font-semibold text-wine/70 transition hover:border-burgundy/40 hover:text-burgundy";

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Z" />
    </svg>
  );
}

/** The month view of the "Jouw tafel" admin: one block per table in its day. */
export function JouwTafelCalendar({
  data,
  current,
  thisMonth,
  today,
  city,
  hostname,
  path,
}: {
  data: CalendarMonth;
  current: { year: number; month: number };
  thisMonth: { year: number; month: number };
  today: string;
  city: string | null;
  hostname?: string;
  /** Builds an admin href (adminPath for the current host). */
  path: (p: string) => string;
}) {
  const items = city ? data.items.filter((i) => i.city === city) : data.items;
  const href = (m: { year: number; month: number }, c: string | null = city) =>
    path(`/jouw-tafel/kalender?maand=${monthKey(m.year, m.month)}${c ? `&stad=${encodeURIComponent(c)}` : ""}`);
  const title = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(current.year, current.month - 1, 1)),
  );
  const inMonth = (date: string) => date.startsWith(monthKey(current.year, current.month));
  const pauseOn = (date: string) => data.pauses.find((p) => date >= p.startsOn && date <= p.endsOn) ?? null;
  const columns = "grid grid-cols-[repeat(6,minmax(0,1fr))_minmax(0,1.6fr)]";

  return (
    <div className="space-y-5">
      <FormatTabs active="jouw-tafel-kalender" hostname={hostname} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl capitalize text-burgundy">{title}</h1>
        <div className="flex items-center gap-1.5">
          <Link href={href(shiftMonth(current.year, current.month, -1))} className={pill} aria-label="Vorige maand">
            ‹
          </Link>
          <Link href={href(thisMonth)} className={pill}>
            Vandaag
          </Link>
          <Link href={href(shiftMonth(current.year, current.month, 1))} className={pill} aria-label="Volgende maand">
            ›
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={href(current, null)} className={`${pill} ${city ? "" : "border-burgundy/40 text-burgundy"}`}>
          Alle steden
        </Link>
        {data.cities.map((c) => (
          <Link key={c} href={href(current, c)} className={`${pill} ${city === c ? "border-burgundy/40 text-burgundy" : ""}`}>
            {c}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] overflow-hidden rounded-2xl border border-border-subtle/80">
          <div className={`${columns} bg-cream/80 text-xs font-semibold uppercase tracking-[0.08em] text-wine/50`}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-3 py-2">
                {d}
              </div>
            ))}
          </div>
          {data.weeks.map((week) => (
            <div key={week[0]} className={`${columns} border-t border-border-subtle/70`}>
              {week.map((date) => {
                const pause = pauseOn(date);
                const dayItems = items.filter((i) => i.date === date);
                return (
                  <div
                    key={date}
                    className={`min-h-28 border-l border-border-subtle/50 p-2 first:border-l-0 ${
                      pause ? "bg-[repeating-linear-gradient(135deg,rgba(43,13,18,0.05)_0_6px,transparent_6px_12px)]" : "bg-beige/40"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        date === today
                          ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-burgundy text-cream"
                          : inMonth(date)
                            ? "text-wine/70"
                            : "text-wine/30"
                      }`}
                    >
                      {Number(date.slice(8, 10))}
                    </p>
                    {pause && date === pause.startsOn && pause.label ? (
                      <p className="mt-1 text-[11px] text-wine/45">{pause.label}</p>
                    ) : null}
                    <ul className="mt-1.5 space-y-1">
                      {dayItems.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={path(`/jouw-tafel/${item.id}`)}
                            className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs transition hover:opacity-85 ${STATE_CLASS[item.state]}`}
                            title={item.venueCount ? `${item.venueCount} zaak/zaken gekoppeld` : "Nog geen zaak"}
                          >
                            <span className="truncate font-semibold">{item.city}</span>
                            <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                              {item.spotsSold}/{item.capacity}
                              <span className="inline-flex items-center gap-0.5">
                                <PinIcon filled={item.venueCount > 0} />
                                {item.venueCount > 0 ? item.venueCount : null}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-wine/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-wine/[0.08]" /> Nog niet te boeken
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border-subtle bg-white" /> Boekbaar
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-wine" /> Vol
        </span>
        <span className="inline-flex items-center gap-1">
          <PinIcon filled /> aantal zaken
        </span>
        <span className="inline-flex items-center gap-1">
          <PinIcon filled={false} /> nog geen zaak
        </span>
      </p>
    </div>
  );
}
