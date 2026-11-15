import { liftBookingBlockAction, waiveMissedSundayAction } from "@/app/admin/(dashboard)/customers/actions";
import type { MissedSundayRow } from "@/lib/missed-sundays/server";

const day = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(iso));

/** Late cancels and no-shows since the policy, a block, and the two admin
 * actions: lift the block, strike a miss. Hidden when there is nothing. */
export function MissedSundaysPanel({ customerId, rows, blockedUntil }: { customerId: string; rows: MissedSundayRow[]; blockedUntil: string | null }) {
  if (rows.length === 0 && !blockedUntil) return null;
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-red-800/70">Gemiste zondagen</h2>
        {blockedUntil ? (
          <form action={liftBookingBlockAction.bind(null, customerId)} className="flex items-center gap-3">
            <span className="text-sm font-medium text-red-800">Niet boeken tot {day(blockedUntil)}</span>
            <button type="submit" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-wine ring-1 ring-wine/15 hover:ring-wine/30">
              Opheffen
            </button>
          </form>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <ul className="mt-3 divide-y divide-red-200/60 text-sm">
          {rows.map((r) => (
            <li key={r.bookingId} className="flex items-center justify-between gap-3 py-2">
              <span className={r.waived ? "text-wine/40 line-through" : "text-wine"}>
                {day(r.startsAt)} · {r.city} · {r.kind === "no_show" ? "Niet gekomen" : "Laat afgezegd"}
              </span>
              {r.waived ? (
                <span className="text-xs text-wine/45">Weggestreept</span>
              ) : (
                <form action={waiveMissedSundayAction.bind(null, customerId, r.bookingId)}>
                  <button type="submit" className="text-xs font-semibold text-wine/60 hover:text-wine">
                    Wegstrepen
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
