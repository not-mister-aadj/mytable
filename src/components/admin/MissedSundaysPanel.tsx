import { waiveMissedSundayAction } from "@/app/admin/(dashboard)/customers/actions";
import type { MissedSundayRow } from "@/lib/missed-sundays/server";

const day = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(iso));

/** Every Sunday they cancelled on the table page or did not come to, and
 * striking a miss. Hidden when there is nothing. */
export function MissedSundaysPanel({ customerId, rows }: { customerId: string; rows: MissedSundayRow[] }) {
  if (rows.length === 0) return null;
  const noShows = rows.filter((r) => r.kind === "no_show").length;
  const late = rows.length - noShows;
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-red-800/70">Gemiste zondagen</h2>
        <span className="text-sm font-medium text-red-800">
          Niet gekomen {noShows} · Afgezegd {late}
        </span>
      </div>
      <ul className="mt-3 divide-y divide-red-200/60 text-sm">
        {rows.map((r) => (
          <li key={r.bookingId} className="flex items-center justify-between gap-3 py-2">
            <span className={r.waived || !r.counts ? "text-wine/50" : "text-wine"}>
              <span className={r.waived ? "line-through" : ""}>
                {day(r.startsAt)} · {r.city} · {r.kind === "no_show" ? "Niet gekomen" : `Afgezegd, ${r.hoursBefore ?? 0} uur vooraf`}
              </span>
            </span>
            {r.waived ? (
              <span className="text-xs text-wine/45">Weggestreept</span>
            ) : r.counts ? (
              <form action={waiveMissedSundayAction.bind(null, customerId, r.bookingId)}>
                <button type="submit" className="text-xs font-semibold text-wine/60 hover:text-wine">
                  Wegstrepen
                </button>
              </form>
            ) : (
              <span className="text-xs text-wine/45">Telt niet mee</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
