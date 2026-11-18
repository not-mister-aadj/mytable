import Link from "next/link";
import type { BoardData, Kpi, Share } from "@/lib/admin/board-data";
import { SnapshotButton } from "./SnapshotButton";

/** The Board: five questions, each with its own numbers and chart.
 * Growth, where guests come from, whether they come back, whether the
 * Sundays fill up, and who the guest is. */

const euro = (cents: number | null, digits = 0) =>
  cents === null ? "–" : `€${(cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
const monthName = (key: string, withYear = true) =>
  new Intl.DateTimeFormat("nl-NL", { month: "long", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(
    new Date(`${key}-15T12:00:00Z`),
  );
const monthShort = (key: string) =>
  new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "UTC" }).format(new Date(`${key}-15T12:00:00Z`)).replace(".", "");
const dayShort = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`)).replace(".", "");
const dateShort = (value: string) =>
  new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(value)).replace(/\./g, "");

type Direction = "up" | "down";

function Delta({ kpi, good, format, label: compare = "vs vorige maand" }: { kpi: Kpi; good: Direction; format: "count" | "money" | "pct" | "euro" | "x"; label?: string }) {
  if (kpi.value === null || kpi.previous === null) return null;
  const diff = kpi.value - kpi.previous;
  if (Math.abs(diff) < 1e-9) return <span className="text-xs text-wine/45">gelijk</span>;
  const better = good === "up" ? diff > 0 : diff < 0;
  const label =
    format === "pct"
      ? `${diff > 0 ? "+" : "−"}${Math.abs(Math.round(diff * 100))} pp`
      : format === "euro"
        ? `${diff > 0 ? "+" : "−"}${euro(Math.abs(diff))}`
        : format === "x"
          ? `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}×`
          : kpi.previous > 0
            ? `${diff > 0 ? "+" : "−"}${Math.abs(Math.round((diff / kpi.previous) * 100))}%`
            : format === "money"
              ? `+${euro(diff)}`
              : `+${Math.round(diff)}`;
  return (
    <span className={`text-xs font-semibold ${better ? "text-emerald-700" : "text-red-700"}`}>
      {diff > 0 ? "▲" : "▼"} {label} <span className="font-normal text-wine/45">{compare}</span>
    </span>
  );
}

const card = "rounded-xl border border-border-subtle bg-beige/60 break-inside-avoid";
const th = "px-4 py-2.5 font-medium";
const headRow = "border-b border-border-subtle text-xs uppercase tracking-[0.06em] text-wine/50";

function Stat({ label, value, tone, children }: { label: string; value: string; tone?: "bad"; children?: React.ReactNode }) {
  return (
    <div className={`${card} flex min-w-0 flex-col gap-1 p-4`}>
      <p className="text-xs font-medium text-wine/55">{label}</p>
      <p className={`font-serif text-3xl leading-tight tabular-nums ${tone === "bad" ? "text-red-700" : "text-burgundy"}`}>{value}</p>
      {children}
    </div>
  );
}

function Question({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border-subtle pt-8 print:pt-4">
      <h2 className="flex items-baseline gap-3 font-serif text-2xl text-burgundy">
        <span className="text-sm tabular-nums text-wine/40">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Panel({ title, aside, children, className = "" }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${card} p-4 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-wine">{title}</p>
        {aside ? <p className="text-xs text-wine/55">{aside}</p> : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** One row per item: a label, a bar from 0 to 100%, and the count behind it. */
function RateRows({ rows }: { rows: { label: string; rate: number | null; detail: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate capitalize text-wine">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-wine/10">
            <span className="block h-full rounded-full bg-burgundy" style={{ width: `${Math.round((r.rate ?? 0) * 100)}%` }} />
          </span>
          <span className="tabular-nums text-wine">
            {pct(r.rate)} <span className="text-wine/45">· {r.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ShareBar({ title, shares }: { title: string; shares: Share[] }) {
  const total = shares.reduce((s, x) => s + x.count, 0);
  const tones = ["bg-burgundy", "bg-burgundy/70", "bg-burgundy/45", "bg-burgundy/25", "bg-wine/10"];
  return (
    <div className={`${card} p-4`}>
      <p className="text-sm font-medium text-wine">{title}</p>
      <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {shares.map((s, i) =>
          s.count > 0 ? <div key={s.label} className={tones[i % tones.length]} style={{ width: `${(s.count / Math.max(1, total)) * 100}%` }} /> : null,
        )}
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {shares.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-wine/75">
              <span className={`h-2 w-2 rounded-full ${tones[i % tones.length]}`} />
              {s.label}
            </span>
            <span className="tabular-nums text-wine">
              {s.count} <span className="text-wine/45">· {total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BoardView({
  data,
  monthHref,
  eventHref,
}: {
  data: BoardData;
  monthHref: (month: string) => string;
  eventHref: (id: string) => string;
}) {
  const k = data.kpis;
  const maxRevenue = Math.max(1, ...data.months.map((m) => Math.max(m.revenueCents, m.targetCents ?? 0)));
  const hasMembershipRevenue = data.months.some((m) => m.membershipCents > 0);
  const funnelTop = data.funnel.posthog?.[0]?.count ?? 0;
  const contribution = data.unit.contributionCents;
  const maxWeekSeats = Math.max(1, ...data.weeks.map((w) => w.seats));
  const maxDaySeats = Math.max(1, ...data.days.map((d) => d.seats));
  const maxDaySpend = Math.max(1, ...data.days.map((d) => d.spendCents ?? 0));
  const today = data.days[data.days.length - 1]?.day ?? "";
  const spendStale = data.adSpendThrough !== null && data.days.some((d) => d.spendCents === null && d.day < today);
  const r = data.retention;
  const comeBack = r.attended > 0 ? r.cameBack / r.attended : null;
  const newest = [...data.cohorts].reverse();

  return (
    <div className="space-y-10 print:space-y-6">
      <style>{`@media print {
        aside, header.fixed, .no-print { display: none !important; }
        .lg\\:pl-60 { padding-left: 0 !important; }
        main { padding-top: 0 !important; max-width: none !important; }
        body { background: #fff !important; }
      }`}</style>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">Board</p>
          <h1 className="mt-1 font-serif text-4xl capitalize text-burgundy">{monthName(data.month)}</h1>
        </div>
        <div className="no-print flex items-center gap-2">
          <Link href={monthHref(data.previousMonth)} className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine hover:border-burgundy/30">
            ← {monthName(data.previousMonth, false)}
          </Link>
          {!data.isCurrentMonth ? (
            <Link href={monthHref("")} className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine hover:border-burgundy/30">
              Deze maand
            </Link>
          ) : null}
          <SnapshotButton />
        </div>
      </header>

      <Question n={1} title="Groeien we?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={`Omzet ${monthName(data.month, false)}`} value={euro(k.revenueCents.value)}>
            <p className="text-xs text-wine/70">
              Tickets {euro(k.ticketRevenueCents.value)} · Leden {euro(k.membershipRevenueCents.value)}
            </p>
            {k.targetCents !== null ? (
              <>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-wine/10">
                  <div
                    className={`h-full rounded-full ${(k.revenueCents.value ?? 0) >= k.targetCents ? "bg-emerald-600" : "bg-burgundy"}`}
                    style={{ width: `${Math.min(100, ((k.revenueCents.value ?? 0) / k.targetCents) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-wine/55">Doel {euro(k.targetCents)}</p>
              </>
            ) : null}
            <Delta kpi={k.revenueCents} good="up" format="money" />
          </Stat>
          <Stat label="Plekken geboekt, 7 dagen" value={String(data.last7.seats.value ?? 0)}>
            <p className="text-xs text-wine/70">{euro(data.last7.revenueCents.value)}</p>
            <Delta kpi={data.last7.seats} good="up" format="count" label="vs 7 dagen ervoor" />
          </Stat>
          <Stat label={`Plekken ${monthName(data.month, false)}`} value={String(k.seats.value ?? 0)}>
            {k.projectedSeats !== null ? <p className="text-xs text-wine/70">Verwacht {k.projectedSeats}</p> : null}
            <Delta kpi={k.seats} good="up" format="count" />
          </Stat>
          <Stat label="Leden" value={String(data.members.paying)}>
            <p className="text-xs text-wine/70">
              {data.members.complimentary} gratis · +{k.members.new} · −{k.members.churned} · MRR {euro(k.mrrCents.value)}
            </p>
          </Stat>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Plekken geboekt per week">
            <div className="flex h-40 items-end gap-1.5">
              {data.weeks.map((w, i) => (
                <div key={w.week} className="flex h-full flex-1 flex-col justify-end" title={`Week van ${dayShort(w.week)}: ${w.seats} plekken, ${euro(w.revenueCents)}`}>
                  <span className="mb-1 text-center text-[11px] tabular-nums text-wine/70">{w.seats > 0 ? w.seats : ""}</span>
                  <div
                    className={`rounded-t ${i === data.weeks.length - 1 ? "border border-dashed border-burgundy/50 bg-burgundy/15" : "bg-burgundy"}`}
                    style={{ height: `${(w.seats / maxWeekSeats) * 85}%`, minHeight: w.seats > 0 ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 text-center text-[11px] text-wine/50">
              {data.weeks.map((w) => (
                <span key={w.week} className="flex-1 truncate">
                  {dayShort(w.week)}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Omzet per maand">
            <div className="flex h-40 items-end gap-2">
              {data.months.map((m) => (
                <div key={m.month} className="relative flex h-full flex-1 flex-col justify-end">
                  {m.targetCents !== null ? (
                    <div className="absolute inset-x-0 border-t-2 border-dashed border-wine/40" style={{ bottom: `${(m.targetCents / maxRevenue) * 100}%` }} />
                  ) : null}
                  <div
                    className="flex flex-col justify-end gap-0.5"
                    style={{ height: `${(m.revenueCents / maxRevenue) * 100}%`, minHeight: m.revenueCents > 0 ? 2 : 0 }}
                    title={`${monthName(m.month)}: ${euro(m.revenueCents)} (tickets ${euro(m.ticketCents)}, leden ${euro(m.membershipCents)}), ${m.seats} plekken${m.targetCents !== null ? `, doel ${euro(m.targetCents)}` : ""}`}
                  >
                    {m.membershipCents > 0 ? (
                      <div className="rounded-t bg-amber-500" style={{ height: `${(m.membershipCents / m.revenueCents) * 100}%`, minHeight: 2 }} />
                    ) : null}
                    <div
                      className={`${m.membershipCents > 0 ? "" : "rounded-t"} ${m.future ? "border border-dashed border-burgundy/50 bg-burgundy/15" : "bg-burgundy"}`}
                      style={{ height: `${m.revenueCents > 0 ? (m.ticketCents / m.revenueCents) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 text-center text-[11px] text-wine/50">
              {data.months.map((m) => (
                <span key={m.month} className={`flex-1 ${m.month === data.month ? "font-semibold text-wine" : ""}`}>
                  {monthShort(m.month)}
                  <span className="block tabular-nums text-wine/70">{m.revenueCents > 0 ? euro(m.revenueCents) : ""}</span>
                </span>
              ))}
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-wine/55">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-burgundy" /> Tickets
              </span>
              {hasMembershipRevenue ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Leden
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-burgundy/50 bg-burgundy/15" /> Al verkocht
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-wine/40" /> Doel
              </span>
            </p>
          </Panel>
        </div>
      </Question>

      <Question n={2} title="Waar komen gasten vandaan, en wat kost dat?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Advertentiekosten per plek, 7 dagen"
            value={euro(data.last7.costPerSeatCents, 2)}
            tone={data.last7.costPerSeatCents !== null && data.last7.costPerSeatCents > data.unit.avgPriceCents ? "bad" : undefined}
          >
            <p className="text-xs text-wine/70">Plek {euro(data.unit.avgPriceCents, 2)}</p>
          </Stat>
          <Stat
            label={`Per plek, ${monthName(data.month, false)}`}
            value={euro(k.costPerTicketCents.value, 2)}
            tone={contribution !== null && contribution < 0 ? "bad" : undefined}
          >
            <p className="text-xs text-wine/70">Over {euro(contribution, 2)}</p>
            {data.hasAdSpend ? <Delta kpi={k.costPerTicketCents} good="down" format="euro" /> : null}
          </Stat>
          <Stat label="ROAS" value={k.roas.value === null ? "–" : `${k.roas.value.toFixed(2)}×`}>
            {data.hasAdSpend ? <Delta kpi={k.roas} good="up" format="x" /> : null}
          </Stat>
          <Stat label="Waarde per gast" value={euro(data.unit.ltvCents, 2)}>
            <p className="text-xs text-wine/70">
              Kosten per nieuwe gast {euro(data.unit.cacCents, 2)} · {data.unit.ticketsPerGuest.toFixed(2)} plekken per gast
            </p>
          </Stat>
        </div>

        <Panel
          title="Per dag, 8 weken"
          aside={
            spendStale && data.adSpendThrough ? (
              <span className="font-semibold text-red-700">Advertentiekosten t/m {dayShort(data.adSpendThrough)}</span>
            ) : null
          }
        >
          <p className="text-xs text-wine/55">Plekken geboekt</p>
          <div className="mt-1 flex h-24 items-end gap-px">
            {data.days.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${dayShort(d.day)}: ${d.seats} plekken`}>
                <div className="rounded-t-sm bg-burgundy" style={{ height: `${(d.seats / maxDaySeats) * 100}%`, minHeight: d.seats > 0 ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-wine/55">Advertenties</p>
          <div className="mt-1 flex h-16 items-end gap-px">
            {data.days.map((d) => (
              <div
                key={d.day}
                className={`flex h-full flex-1 flex-col justify-end ${d.spendCents === null ? "bg-wine/5" : ""}`}
                title={`${dayShort(d.day)}: ${d.spendCents === null ? "niet ingelezen" : euro(d.spendCents, 2)}`}
              >
                <div
                  className="rounded-t-sm bg-amber-500"
                  style={{ height: `${((d.spendCents ?? 0) / maxDaySpend) * 100}%`, minHeight: (d.spendCents ?? 0) > 0 ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-wine/50">
            {data.days.filter((_, i) => i % 7 === 0).map((d) => (
              <span key={d.day}>{dayShort(d.day)}</span>
            ))}
            <span>{dayShort(today)}</span>
          </div>
        </Panel>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className={headRow}>
                  <th className={th}>Kanaal, {monthName(data.month, false)}</th>
                  <th className={`${th} text-right`}>Plekken</th>
                  <th className={`${th} text-right`}>Omzet</th>
                  <th className={`${th} text-right`}>Uitgegeven</th>
                  <th className={`${th} text-right`}>Per plek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.channels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-wine/55">
                      –
                    </td>
                  </tr>
                ) : (
                  data.channels.map((c) => (
                    <tr key={c.channel}>
                      <td className="px-4 py-2.5 text-wine">{c.channel}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{c.seats}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{euro(c.revenueCents)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-wine/70">{c.spendCents === null ? "–" : euro(c.spendCents)}</td>
                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          c.spendCents !== null && c.seats > 0 && c.spendCents / c.seats > data.unit.avgPriceCents ? "font-semibold text-red-700" : "text-wine"
                        }`}
                      >
                        {c.spendCents === null ? "–" : c.seats > 0 ? euro(c.spendCents / c.seats, 2) : "0 plekken"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Panel title="Van bezoek tot boeking, 30 dagen">
            {data.funnel.posthog ? (
              <ol className="space-y-3">
                {data.funnel.posthog.map((step, i, all) => {
                  const prevCount = i > 0 ? all[i - 1]!.count : null;
                  return (
                    <li key={step.label}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-wine">{step.label}</span>
                        <span className="tabular-nums text-wine">
                          {step.count.toLocaleString("nl-NL")}
                          {prevCount ? <span className="ml-2 text-xs text-wine/45">{Math.round((step.count / prevCount) * 100)}%</span> : null}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-wine/10">
                        <div className="h-full rounded-full bg-burgundy" style={{ width: `${funnelTop > 0 ? Math.max(1, (step.count / funnelTop) * 100) : 0}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-wine/60">–</p>
            )}
            <p className="mt-4 border-t border-border-subtle pt-3 text-sm text-wine/70">
              Wachtlijst: {data.funnel.waitlistNew} nieuw, {data.funnel.waitlistBooked} geboekt (
              {data.funnel.waitlistNew > 0 ? Math.round((data.funnel.waitlistBooked / data.funnel.waitlistNew) * 100) : 0}%) · {k.waitlistTotal.toLocaleString("nl-NL")} op de lijst
            </p>
          </Panel>
        </div>
      </Question>

      <Question n={3} title="Komen ze terug?">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Stat label="Boekt na de eerste zondag opnieuw" value={pct(comeBack)}>
            <p className="text-xs text-wine/70">
              {r.cameBack} van {r.attended} gasten die aan tafel zaten
            </p>
            <p className="text-xs text-wine/55">{r.winBackTotal} zonder nieuwe boeking, met een open zondag in hun stad</p>
          </Stat>
          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Per stad">
              <RateRows rows={r.cities.map((c) => ({ label: c.city, rate: c.guests > 0 ? c.back / c.guests : null, detail: `${c.back}/${c.guests}` }))} />
            </Panel>
            <Panel title="Per maand van de eerste zondag">
              <RateRows rows={newest.map((c) => ({ label: monthName(c.month, false), rate: c.guests > 0 ? c.backEver / c.guests : null, detail: `${c.backEver}/${c.guests}` }))} />
            </Panel>
          </div>
        </div>

        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={headRow}>
                <th className={th}>Eerste zondag</th>
                <th className={`${th} text-right`}>Gasten</th>
                <th className={`${th} text-right`}>Binnen 30 dagen</th>
                <th className={`${th} text-right`}>60 dagen</th>
                <th className={`${th} text-right`}>90 dagen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {newest.map((c) => (
                <tr key={c.month}>
                  <td className="px-4 py-2.5 capitalize text-wine">{monthName(c.month)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.guests}</td>
                  {([
                    [c.back30, 30],
                    [c.back60, 60],
                    [c.back90, 90],
                  ] as const).map(([n, days]) => (
                    <td key={days} className="px-4 py-2.5 text-right tabular-nums">
                      {c.matured >= days ? `${Math.round((n / Math.max(1, c.guests)) * 100)}%` : <span className="text-wine/30">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {r.winBack.length > 0 ? (
          <details className={`${card} no-print`}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-wine">Terug te halen · {r.winBackTotal}</summary>
            <div className="overflow-x-auto border-t border-border-subtle">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className={headRow}>
                    <th className={th}>Gast</th>
                    <th className={th}>Stad</th>
                    <th className={th}>Was er op</th>
                    <th className={th}>Open zondag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {r.winBack.map((g) => (
                    <tr key={g.email}>
                      <td className="px-4 py-2 text-wine">
                        {g.name || "–"} <span className="text-wine/45">{g.email}</span>
                      </td>
                      <td className="px-4 py-2">{g.city}</td>
                      <td className="px-4 py-2 tabular-nums text-wine/75">{dateShort(g.lastAt)}</td>
                      <td className="px-4 py-2 tabular-nums text-wine/75">{dateShort(g.nextAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </Question>

      <Question n={4} title="Lopen de zondagen vol?">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={`Vulgraad ${monthName(data.month, false)}`} value={pct(k.fillRate.value)}>
            <Delta kpi={k.fillRate} good="up" format="pct" />
          </Stat>
          <Stat label="Niet gekomen" value={pct(k.noShowRate.value)} />
          <Stat label="Vragen ingevuld" value={pct(k.answeredRate.value)}>
            <Delta kpi={k.answeredRate} good="up" format="pct" />
          </Stat>
        </div>

        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className={headRow}>
                <th className={th}>Komende zondag</th>
                <th className={th}>Stad</th>
                <th className={`${th} w-1/3`}>Verkocht</th>
                <th className={`${th} text-right`}>Open</th>
                <th className={`${th} text-right`}>Dagen</th>
                <th className={`${th} text-right`}>Nodig per dag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.upcoming.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-wine/55">
                    –
                  </td>
                </tr>
              ) : (
                data.upcoming.map((u) => {
                  const open = Math.max(0, u.capacity - u.sold);
                  const fill = u.capacity > 0 ? u.sold / u.capacity : 0;
                  const urgent = u.daysLeft <= 14 && fill < 0.5;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-2.5">
                        <Link href={eventHref(u.id)} className="text-burgundy hover:underline">
                          {dateShort(u.date)}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-wine">{u.city}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-3">
                          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-wine/10">
                            <span className={`block h-full rounded-full ${urgent ? "bg-red-700" : "bg-burgundy"}`} style={{ width: `${Math.min(100, fill * 100)}%` }} />
                          </span>
                          <span className={`tabular-nums ${urgent ? "font-semibold text-red-700" : "text-wine"}`}>
                            {u.sold}/{u.capacity}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{open}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{u.daysLeft}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{open === 0 ? "vol" : (open / Math.max(1, u.daysLeft)).toFixed(1).replace(".", ",")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className={headRow}>
                <th className={th}>Stad, alles tot nu</th>
                <th className={`${th} text-right`}>Geweest</th>
                <th className={`${th} text-right`}>Plekken</th>
                <th className={`${th} text-right`}>Vulgraad</th>
                <th className={`${th} text-right`}>Omzet</th>
                <th className={`${th} text-right`}>Op de lijst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.cities.map((c) => (
                <tr key={c.city}>
                  <td className="px-4 py-2.5 font-medium text-wine">{c.city}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.held}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.seats}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{pct(c.fill)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{euro(c.revenueCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.waitlist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Question>

      <Question n={5} title="Wie is onze gast?">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ShareBar title="Leeftijd" shares={data.guests.age} />
          <ShareBar title="Komt" shares={data.guests.company} />
          <ShareBar title="Taal aan tafel" shares={data.guests.language} />
          <ShareBar title="Nieuw of terug" shares={data.guests.newVsReturning} />
        </div>
      </Question>
    </div>
  );
}
