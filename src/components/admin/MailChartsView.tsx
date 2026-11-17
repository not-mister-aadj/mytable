import Link from "next/link";
import type { ReactNode } from "react";
import { CHART_GOALS, INSIGHT_PERIODS, getMailInsights, type ChartGoal, type InsightPeriod, type Rate } from "@/lib/admin/mail-insights";
import { adminPath } from "@/lib/admin-url";
import { MAIL_CATALOG, MAIL_GOALS, mailTitle } from "@/lib/email/mail-catalog";
import { EMAIL_DAY_LIMIT, EMAIL_DAY_WARN } from "@/lib/email/volume";

/** A goal keeps its colour in every chart (fixed order, never by rank). */
const GOAL_COLOR: Record<ChartGoal, string> = {
  boeken: "#2a78d6",
  vooraf: "#eb6834",
  achteraf: "#1baf7a",
  groei: "#eda100",
  lid: "#e87ba4",
  overig: "#b4a79b",
};
const GOAL_LABEL: Record<string, string> = Object.fromEntries(MAIL_GOALS.map((g) => [g.id, g.label]));
/** The mails under a goal, for the tooltip on its name. */
const GOAL_MAILS: Record<string, string> = Object.fromEntries(
  MAIL_GOALS.map((g) => [g.id, MAIL_CATALOG.filter((m) => m.goal === g.id).map((m) => m.title).join(" · ")]),
);
const BURGUNDY = "#5a0f1b";
const TRACK = "#efe5d9";

const nf = new Intl.NumberFormat("nl-NL");
const euro = (cents: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
const share = (r: Rate) => (r.total > 0 ? r.part / r.total : null);
const pct = (r: Rate, digits = 0) => {
  const s = share(r);
  return s === null ? "–" : `${(s * 100).toFixed(digits).replace(".", ",")}%`;
};
const WEEKDAY = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const WEEKDAY_LONG = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const dayShort = new Intl.DateTimeFormat("nl-NL", { weekday: "short", timeZone: "UTC" });
const sunday = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });

function Card({ who, title, take, children }: { who: string; title: string; take: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border-subtle/80 bg-beige/50 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">{who}</p>
      <h2 className="mt-0.5 font-serif text-xl text-burgundy">{title}</h2>
      <p className="mb-5 mt-2 text-base font-semibold leading-snug text-wine">{take}</p>
      {children}
    </section>
  );
}

const Em = ({ children }: { children: ReactNode }) => <span className="text-burgundy">{children}</span>;
const Empty = () => <p className="py-8 text-center text-sm text-wine/45">Nog te weinig data</p>;

/** The difference with the period before, in the unit of the number next to it. Red when it moved the wrong way. */
function Change({ now, before, goodUp = true, digits = 0 }: { now: number | null; before: number | null; goodUp?: boolean; digits?: number }) {
  if (now === null || before === null) return null;
  const diff = now - before;
  const shown = Math.abs(diff).toFixed(digits).replace(".", ",");
  if (Number(Math.abs(diff).toFixed(digits)) === 0) return <span className="text-wine/40">=</span>;
  const good = diff > 0 === goodUp;
  return (
    <span className={`whitespace-nowrap font-semibold ${good ? "text-emerald-700" : "text-red-700"}`}>
      {diff > 0 ? "▲ +" : "▼ -"}
      {shown}
    </span>
  );
}

/** Horizontal bars: a label, the bar, one number, and how it moved since the period before. The rest is in the tooltip. */
function Bars({
  rows,
  max,
  color = BURGUNDY,
}: {
  rows: Array<{ label: string; value: number; text: string; hint?: string; change?: ReactNode }>;
  max: number;
  color?: string;
}) {
  const changes = rows.some((r) => r.change !== undefined);
  return (
    <div className={`grid items-center gap-x-3 gap-y-3 text-sm ${changes ? "grid-cols-[minmax(110px,36%)_1fr_auto_3.5rem]" : "grid-cols-[minmax(110px,38%)_1fr_auto]"}`}>
      {rows.map((r) => (
        <div key={r.label} className="contents" title={r.hint}>
          <span className="text-wine">{r.label}</span>
          <span className="h-[22px] rounded-r" style={{ background: TRACK }}>
            <span className="block h-full rounded-r" style={{ width: `${max > 0 ? Math.max(r.value > 0 ? 1.5 : 0, (r.value / max) * 100) : 0}%`, background: color }} />
          </span>
          <span className="min-w-[3.5rem] text-right text-base font-semibold tabular-nums text-wine">{r.text}</span>
          {changes ? <span className="text-right text-xs tabular-nums">{r.change}</span> : null}
        </div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-wine/65">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Delta({ now, before, points = false }: { now: number | null; before: number | null; points?: boolean }) {
  if (now === null || before === null || (!points && before === 0)) return null;
  const diff = points ? Math.round((now - before) * 100) : Math.round(((now - before) / before) * 100);
  if (diff === 0) return <span className="text-wine/45">gelijk aan de periode ervoor</span>;
  return (
    <span>
      <span className={`font-semibold ${diff > 0 ? "text-emerald-700" : "text-red-700"}`}>
        {diff > 0 ? "▲ +" : "▼ "}
        {diff}
        {points ? " punten" : "%"}
      </span>{" "}
      <span className="text-wine/45">t.o.v. de periode ervoor</span>
    </span>
  );
}

function Kpi({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border-subtle/80 bg-beige/50 px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">{label}</p>
      <p className="mt-0.5 font-serif text-3xl leading-tight text-burgundy">{value}</p>
      <p className="mt-0.5 min-h-[1rem] text-xs text-wine/60">{children}</p>
    </div>
  );
}

/** The Grafieken tab: what mail brings in, what we send, how guests respond, and whether it arrives. */
export async function MailChartsView({ period, hostname }: { period: InsightPeriod; hostname: string }) {
  const d = await getMailInsights(period);
  const k = d.kpis;
  const href = (p: InsightPeriod) => adminPath(`/emails?tab=grafieken${p === "30" ? "" : `&periode=${p}`}`, hostname);

  const today = d.limit[0]!;
  const tight = d.limit.find((l) => l.sent + l.planned >= EMAIL_DAY_WARN);
  const best = d.selling[0];

  const goals = CHART_GOALS.filter((g) => d.volume.some((v) => (v.byGoal[g] ?? 0) > 0));
  const totalMax = Math.max(1, ...d.volume.map((v) => v.total));
  const cellMax = Math.max(1, ...d.volume.flatMap((v) => goals.map((g) => v.byGoal[g] ?? 0)));
  // The conclusion is about the last whole week (or day), not the one still running.
  const whole = d.volume.filter((v) => !v.running);
  const last = whole[whole.length - 1];
  const prior = whole[whole.length - 2];
  const unit = d.volumePerDay ? "dag" : "week";
  const moved = last && prior && prior.total > 0 ? Math.round(((last.total - prior.total) / prior.total) * 100) : null;
  // The goal that explains most of the move.
  const mover =
    last && prior && moved
      ? goals
          .map((g) => ({ g, now: last.byGoal[g] ?? 0, was: prior.byGoal[g] ?? 0 }))
          .filter((x) => (x.now - x.was) * moved > 0)
          .sort((a, b) => Math.abs(b.now - b.was) - Math.abs(a.now - a.was))[0]
      : null;

  const funnelMax = Math.max(1, d.funnel[0]!.value);
  const per100 = d.funnel[0]!.value > 0 ? ((k.bookings / d.funnel[0]!.value) * 100).toFixed(1).replace(".", ",") : null;

  const cityRows = d.cities.filter((c) => c.sent >= 5).map((c) => ({ ...c, rate: (c.booked / c.sent) * 100 }));
  cityRows.sort((a, b) => b.rate - a.rate);

  const confirmTotals = d.confirms.reduce((n, c) => ({ yes: n.yes + c.yes, all: n.all + c.yes + c.moved + c.silent }), { yes: 0, all: 0 });
  const comes = d.steps.find((s) => s.label === "Komt");
  const feedback = d.steps.find((s) => s.label === "Geeft feedback");
  const heatMax = Math.max(1, ...d.heat.days.flat());
  const problems = d.senders.reduce((n, s) => ({ part: n.part + s.problems.part, total: n.total + s.problems.total }), { part: 0, total: 0 });
  const limitMax = Math.max(EMAIL_DAY_LIMIT, ...d.limit.map((l) => l.sent + l.planned));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav className="flex w-fit gap-1 rounded-full border border-border-subtle bg-cream p-1 text-sm">
          {INSIGHT_PERIODS.map((p) => (
            <Link key={p.id} href={href(p.id)} className={`rounded-full px-3 py-1 ${p.id === period ? "bg-burgundy text-cream" : "text-wine/70 hover:text-burgundy"}`}>
              {p.label}
            </Link>
          ))}
        </nav>
        {period !== "alle" ? <p className="text-xs text-wine/55">▲▼ verschil met de {period} dagen ervoor</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Verstuurd" value={nf.format(k.sent)}>
          <Delta now={k.sent} before={k.sentBefore} />
        </Kpi>
        <Kpi label="Afgeleverd" value={pct(k.delivered, 1)}>
          {k.delivered.total - k.delivered.part} niet aangekomen
        </Kpi>
        <Kpi label="Geopend" value={pct(k.opened)}>
          <Delta now={share(k.opened)} before={k.openedBefore ? share(k.openedBefore) : null} points />
        </Kpi>
        <Kpi label="Geklikt" value={pct(k.clicked)}>
          <Delta now={share(k.clicked)} before={k.clickedBefore ? share(k.clickedBefore) : null} points />
        </Kpi>
        <Kpi label="Boekingen uit mail" value={nf.format(k.bookings)}>
          binnen 7 dagen na een mail
        </Kpi>
        <Kpi label="Omzet uit mail" value={euro(k.revenueCents)}>
          {k.allRevenueCents > 0 ? `${Math.round((k.revenueCents / k.allRevenueCents) * 100)}% van alle omzet` : null}
        </Kpi>
        <Kpi label="Daglimiet vandaag" value={`${today.sent + today.planned} van ${EMAIL_DAY_LIMIT}`}>
          {today.planned > 0 ? `${today.planned} staan nog gepland` : null}
        </Kpi>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          who="Directie"
          title="Wat leveren mails op die een plek moeten verkopen?"
          take={
            per100 === null ? (
              "Nog geen uitnodigingen of andere wervende mails in deze periode."
            ) : k.bookings === 0 ? (
              "Nog geen betaalde plek uit mail in deze periode."
            ) : (
              <>
                Van elke 100 uitnodigingen en andere wervende mails leiden er <Em>{per100}</Em> tot een betaalde plek: <Em>{k.bookings} {k.bookings === 1 ? "boeking" : "boekingen"}, {euro(k.revenueCents)}</Em>.
              </>
            )
          }
        >
          <div className="grid grid-cols-[minmax(90px,22%)_1fr_auto_auto_3.5rem] items-center gap-x-3 gap-y-3 text-sm">
            {d.funnel.map((f, i) => (
              <div key={f.label} className="contents">
                <span className="text-wine">{f.label}</span>
                <span className="h-[22px] rounded-r" style={{ background: TRACK }}>
                  <span className="block h-full rounded-r" style={{ width: `${Math.max(f.value > 0 ? 1.5 : 0, (f.value / funnelMax) * 100)}%`, background: BURGUNDY }} />
                </span>
                <span className="text-right text-base font-semibold tabular-nums text-wine">{nf.format(f.value)}</span>
                <span className="w-12 text-right text-xs tabular-nums text-wine/55">{pct({ part: f.value, total: d.funnel[0]!.value }, f.value / funnelMax < 0.1 ? 1 : 0)}</span>
                <span className="text-right text-xs tabular-nums" title={f.before === null ? undefined : `Periode ervoor: ${nf.format(f.before)}`}>
                  {i === 0 ? (
                    <Change now={f.value} before={f.before} />
                  ) : (
                    <Change
                      now={d.funnel[0]!.value > 0 ? (f.value / d.funnel[0]!.value) * 100 : null}
                      before={f.before !== null && d.funnel[0]!.before ? (f.before / d.funnel[0]!.before) * 100 : null}
                      digits={1}
                    />
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          who="Directie en groei"
          title="Hoeveel sturen we, en waarvoor?"
          take={
            last ? (
              <>
                <Em>{nf.format(last.total)} mails</Em> in de laatste volle {unit}
                {moved !== null && moved !== 0 ? (
                  <>
                    , <Em>{Math.abs(moved)}% {moved > 0 ? "meer" : "minder"}</Em> dan de {unit} ervoor
                  </>
                ) : null}
                .
                {mover ? (
                  <>
                    {" "}
                    Vooral {moved! > 0 ? "meer" : "minder"} {GOAL_LABEL[mover.g]?.toLowerCase()} ({mover.now} tegen {mover.was}).
                  </>
                ) : null}
              </>
            ) : (
              `Nog geen volle ${unit} in deze periode.`
            )
          }
        >
          {d.volume.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-x-2 border-spacing-y-1.5 text-sm tabular-nums">
                <thead>
                  <tr className="text-xs text-wine/55">
                    <th />
                    {d.volume.map((v) => (
                      <th key={v.key} className={`px-1 pb-1 text-right font-medium ${v.running ? "text-wine/40" : ""}`}>
                        <span className={`block ${v.running ? "" : "text-wine"}`}>{v.running ? (d.volumePerDay ? "vandaag" : "deze week") : v.label}</span>
                        <span className="block font-normal">{v.running ? "tot nu toe" : v.sub}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="whitespace-nowrap pr-2 text-left font-semibold text-wine">Totaal</th>
                    {d.volume.map((v) => (
                      <td key={v.key} className={`text-right align-bottom ${v.running ? "opacity-50" : ""}`}>
                        <span className="block text-base font-semibold text-wine">{nf.format(v.total)}</span>
                        <span className="mt-0.5 block h-1.5 rounded-full" style={{ background: TRACK }}>
                          <span className="ml-auto block h-full rounded-full" style={{ width: `${(v.total / totalMax) * 100}%`, background: BURGUNDY }} />
                        </span>
                      </td>
                    ))}
                  </tr>
                  {goals.map((g) => (
                    <tr key={g}>
                      <th className="whitespace-nowrap pr-2 text-left font-normal text-wine" title={GOAL_MAILS[g]}>
                        <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: GOAL_COLOR[g] }} />
                        {GOAL_LABEL[g]}
                      </th>
                      {d.volume.map((v) => {
                        const n = v.byGoal[g] ?? 0;
                        return (
                          <td key={v.key} className={`text-right align-bottom ${v.running ? "opacity-50" : ""}`}>
                            <span className={`block ${n > 0 ? "text-wine" : "text-wine/30"}`}>{n > 0 ? nf.format(n) : "–"}</span>
                            <span className="mt-0.5 block h-1.5 rounded-full" style={{ background: TRACK }}>
                              <span className="ml-auto block h-full rounded-full" style={{ width: `${(n / cellMax) * 100}%`, background: GOAL_COLOR[g] }} />
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          who="Groei"
          title="Welke mail zet aan tot boeken?"
          take={
            best && best.booked.part === 0 ? (
              "Nog geen boekingen uit mail in deze periode."
            ) : best ? (
              <>
                <Em>{mailTitle(best.kind)}</Em> doet het het best: <Em>{pct(best.booked, 1)}</Em> boekt binnen 7 dagen.
              </>
            ) : (
              "Nog geen mail met genoeg ontvangers om te vergelijken."
            )
          }
        >
          {d.selling.length === 0 ? (
            <Empty />
          ) : (
            <Bars
              color="#2a78d6"
              max={Math.max(...d.selling.map((s) => (share(s.booked) ?? 0) * 100), 1)}
              rows={d.selling.map((s) => ({
                label: mailTitle(s.kind),
                value: (share(s.booked) ?? 0) * 100,
                text: pct(s.booked, 1),
                hint: `${s.booked.part} van ${s.booked.total} ontvangers · ${euro(s.revenueCents)}${s.before ? ` · periode ervoor ${pct(s.before, 1)}` : ""}`,
                change: <Change now={(share(s.booked) ?? 0) * 100} before={s.before ? (share(s.before) ?? 0) * 100 : null} digits={1} />,
              }))}
            />
          )}
        </Card>

        <Card
          who="Groei"
          title="Uitnodigingen per stad"
          take={
            cityRows.length > 1 ? (
              <>
                <Em>{cityRows[0]!.city}</Em> boekt {cityRows[0]!.rate.toFixed(1).replace(".", ",")} per 100 uitnodigingen, <Em>{cityRows[cityRows.length - 1]!.city}</Em>{" "}
                {cityRows[cityRows.length - 1]!.rate.toFixed(1).replace(".", ",")}.
              </>
            ) : cityRows.length === 1 ? (
              <>
                <Em>{cityRows[0]!.city}</Em>: {cityRows[0]!.rate.toFixed(1).replace(".", ",")} boekingen per 100 uitnodigingen.
              </>
            ) : (
              "Nog geen uitnodigingen in deze periode."
            )
          }
        >
          {cityRows.length === 0 ? (
            <Empty />
          ) : (
            <Bars
              color="#2a78d6"
              max={Math.max(...cityRows.map((c) => c.rate), 1)}
              rows={cityRows.map((c) => ({
                label: c.city,
                value: c.rate,
                text: c.rate.toFixed(1).replace(".", ","),
                hint: `${c.sent} verstuurd · ${c.clicked} geklikt · ${c.booked} geboekt${c.before ? ` · periode ervoor ${c.before.booked} van ${c.before.sent}` : ""}`,
                change: <Change now={c.rate} before={c.before && c.before.sent >= 5 ? (c.before.booked / c.before.sent) * 100 : null} digits={1} />,
              }))}
            />
          )}
        </Card>

        <Card
          who="Groei"
          title="Melden mensen zich af voor uitnodigingen?"
          take={
            d.prefs.unsubscribed.total === 0 ? (
              "Nog geen uitnodigingen in deze periode."
            ) : (
              <>
                <Em>
                  {d.prefs.unsubscribed.part} van {nf.format(d.prefs.unsubscribed.total)}
                </Em>{" "}
                uitgenodigden zetten alle steden uit ({pct(d.prefs.unsubscribed, 1)}).
              </>
            )
          }
        >
          {d.prefs.unsubscribed.total === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-6">
              <Bars
                color="#a1262f"
                max={Math.max(1, d.prefs.unsubscribed.part)}
                rows={[
                  {
                    label: "Afgemeld",
                    value: d.prefs.unsubscribed.part,
                    text: nf.format(d.prefs.unsubscribed.part),
                    change: (
                      <Change
                        now={(share(d.prefs.unsubscribed) ?? 0) * 100}
                        before={d.prefs.before && d.prefs.before.total > 0 ? (share(d.prefs.before) ?? 0) * 100 : null}
                        goodUp={false}
                        digits={1}
                      />
                    ),
                    hint: d.prefs.before ? `Periode ervoor: ${d.prefs.before.part} van ${d.prefs.before.total}` : undefined,
                  },
                  { label: "Via de voorkeurenpagina", value: d.prefs.viaPage, text: nf.format(d.prefs.viaPage), change: null },
                  { label: "Via de afmeldknop van de mailapp", value: d.prefs.viaMailApp, text: nf.format(d.prefs.viaMailApp), change: null },
                ]}
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-separate border-spacing-x-2 text-sm tabular-nums">
                  <thead>
                    <tr className="text-xs text-wine/55">
                      <th />
                      {d.volume.map((v) => (
                        <th key={v.key} className={`px-1 pb-1 text-right font-medium ${v.running ? "text-wine/40" : "text-wine"}`}>
                          {v.running ? (d.volumePerDay ? "vandaag" : "deze week") : v.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th className="whitespace-nowrap pr-2 text-left font-normal text-wine">Afgemeld</th>
                      {d.prefs.perColumn.map((n, i) => (
                        <td key={d.volume[i]!.key} className={`text-right ${n > 0 ? "font-semibold text-wine" : "text-wine/30"}`}>
                          {n > 0 ? n : "–"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        <Card
          who="Groei"
          title="Welke steden zetten ze uit of aan?"
          take={
            d.prefs.cities.length === 0 ? (
              "Nog niemand heeft een stad gewijzigd in deze periode."
            ) : (
              <>
                <Em>{d.prefs.cities[0]!.city}</Em> wordt het vaakst gewijzigd: {d.prefs.cities[0]!.off} keer uit, {d.prefs.cities[0]!.less} keer minder vaak, {d.prefs.cities[0]!.on} keer aan.
              </>
            )
          }
        >
          {d.prefs.cities.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full border-separate border-spacing-x-3 border-spacing-y-2 text-sm tabular-nums">
              <thead>
                <tr className="text-xs font-medium text-wine/55">
                  <th />
                  <th className="text-right">Uitgezet</th>
                  <th className="text-right">Minder vaak</th>
                  <th className="text-right">Aangezet</th>
                </tr>
              </thead>
              <tbody>
                {d.prefs.cities.map((c) => {
                  const max = Math.max(1, ...d.prefs.cities.flatMap((x) => [x.off, x.less, x.on]));
                  const cells: Array<[number, string]> = [
                    [c.off, "#a1262f"],
                    [c.less, "#eda100"],
                    [c.on, "#1baf7a"],
                  ];
                  return (
                    <tr key={c.city}>
                      <th className="whitespace-nowrap text-left font-normal text-wine">{c.city}</th>
                      {cells.map(([n, color], i) => (
                        <td key={i} className="w-1/4 text-right align-bottom">
                          <span className={`block ${n > 0 ? "text-base font-semibold text-wine" : "text-wine/30"}`}>{n > 0 ? n : "–"}</span>
                          <span className="mt-0.5 block h-1.5 rounded-full" style={{ background: TRACK }}>
                            <span className="ml-auto block h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: color }} />
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          who="Operatie"
          title="Komt iedereen?"
          take={
            confirmTotals.all > 0 ? (
              <>
                Gemiddeld zegt <Em>{Math.round((confirmTotals.yes / confirmTotals.all) * 100)}%</Em> ja op &quot;Kom je zondag?&quot;.
              </>
            ) : (
              "Nog geen zondag met antwoorden op \"Kom je zondag?\"."
            )
          }
        >
          {d.confirms.length === 0 ? (
            <Empty />
          ) : (
            <>
              <Legend
                items={[
                  { label: "Ja, ik kom", color: "#1baf7a" },
                  { label: "Verzet", color: "#eda100" },
                  { label: "Geen reactie", color: "#cdbfb0" },
                ]}
              />
              <div className="grid grid-cols-[minmax(120px,30%)_1fr] items-center gap-x-3 gap-y-3 text-sm">
                {d.confirms.map((c) => {
                  const all = c.yes + c.moved + c.silent;
                  const parts: Array<[number, string]> = [
                    [c.yes, "#1baf7a"],
                    [c.moved, "#eda100"],
                    [c.silent, "#cdbfb0"],
                  ];
                  return (
                    <div key={c.eventId} className="contents">
                      <Link href={adminPath(`/events/${c.eventId}/guests?tab=mails`, hostname)} className="text-wine hover:text-burgundy hover:underline">
                        {c.city} {sunday.format(new Date(c.startsAt)).replace(".", "")}
                      </Link>
                      <span className="flex h-[26px] gap-0.5" title={`${c.yes} ja · ${c.moved} verzet · ${c.silent} geen reactie`}>
                        {parts.map(([n, color], i) =>
                          n > 0 ? (
                            <span key={i} className="flex min-w-0 items-center justify-center overflow-hidden text-xs font-semibold tabular-nums text-wine" style={{ flex: n, background: color }}>
                              {n / all >= 0.1 ? `${Math.round((n / all) * 100)}%` : ""}
                            </span>
                          ) : null,
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card
          who="Operatie"
          title="Waar haken gasten af rond een zondag?"
          take={
            comes && feedback ? (
              <>
                <Em>{pct(comes.rate)}</Em> van de gasten komt, <Em>{pct(feedback.rate)}</Em> geeft daarna feedback.
              </>
            ) : (
              "Nog te weinig zondagen in deze periode."
            )
          }
        >
          {d.steps.length === 0 ? (
            <Empty />
          ) : (
            <Bars max={100} rows={d.steps.map((s) => ({
                label: s.label,
                value: (share(s.rate) ?? 0) * 100,
                text: pct(s.rate),
                hint: `${s.rate.part} van ${s.rate.total}${s.before ? ` · periode ervoor ${pct(s.before)}` : ""}`,
                change: <Change now={(share(s.rate) ?? 0) * 100} before={s.before ? (share(s.before) ?? 0) * 100 : null} />,
              }))}
            />
          )}
        </Card>

        <Card
          who="Marketing"
          title="Wanneer lezen ze?"
          take={
            d.heat.peak ? (
              <>
                De meeste mails worden geopend op <Em>{WEEKDAY_LONG[d.heat.peak.day]}</Em> tussen <Em>{d.heat.slots[d.heat.peak.slot]!.replace("-", " en ")} uur</Em>.
              </>
            ) : (
              "Nog geen geopende mails in deze periode."
            )
          }
        >
          {!d.heat.peak ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-[2rem_repeat(7,1fr)] gap-1 text-[11px] text-wine/55">
              <span />
              {d.heat.slots.map((s) => (
                <span key={s} className="text-center">
                  {s}
                </span>
              ))}
              {d.heat.days.map((slots, day) => (
                <div key={day} className="contents">
                  <span className="flex items-center">{WEEKDAY[day]}</span>
                  {slots.map((n, slot) => (
                    <span
                      key={slot}
                      title={`${WEEKDAY_LONG[day]} ${d.heat.slots[slot]} uur: ${n} geopend`}
                      className="flex h-8 items-center justify-center rounded text-xs font-semibold tabular-nums"
                      style={{ background: `rgba(90,15,27,${(0.05 + (n / heatMax) * 0.85).toFixed(2)})`, color: n / heatMax > 0.5 ? "#ffffff" : "#2b0d12" }}
                    >
                      {n > 0 ? n : ""}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          who="Techniek"
          title="Komt het aan?"
          take={
            problems.total > 0 ? (
              <>
                <Em>
                  {problems.part} van {nf.format(problems.total)}
                </Em>{" "}
                mails kwamen niet goed aan ({pct(problems, 1)}).
              </>
            ) : (
              "Nog geen mails in deze periode."
            )
          }
        >
          {problems.total === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-6">
              <Bars
                color="#a1262f"
                max={Math.max(5, ...d.senders.map((s) => (share(s.problems) ?? 0) * 100))}
                rows={d.senders.slice(0, 5).map((s) => ({
                  label: s.from,
                  value: (share(s.problems) ?? 0) * 100,
                  text: pct(s.problems, 1),
                  hint: `${s.problems.part} van ${s.problems.total} · bounce, spam of tegengehouden`,
                  change: <Change now={(share(s.problems) ?? 0) * 100} before={s.before ? (share(s.before) ?? 0) * 100 : null} goodUp={false} digits={1} />,
                }))}
              />
              <Bars
                color="#a1262f"
                max={Math.max(5, ...d.providers.map((s) => (share(s.problems) ?? 0) * 100))}
                rows={d.providers.map((s) => ({
                  label: s.name,
                  value: (share(s.problems) ?? 0) * 100,
                  text: pct(s.problems, 1),
                  hint: `${s.problems.part} van ${s.problems.total}`,
                  change: <Change now={(share(s.problems) ?? 0) * 100} before={s.before ? (share(s.before) ?? 0) * 100 : null} goodUp={false} digits={1} />,
                }))}
              />
            </div>
          )}
        </Card>

        <Card
          who="Techniek"
          title="Passen we binnen de daglimiet?"
          take={
            tight ? (
              <>
                <Em>{WEEKDAY_LONG[(new Date(`${tight.day}T12:00:00Z`).getUTCDay() + 6) % 7]}</Em> staat op <Em>{tight.sent + tight.planned}</Em> van {EMAIL_DAY_LIMIT}: te krap.
              </>
            ) : (
              <>
                Vandaag <Em>{today.sent + today.planned}</Em> van {EMAIL_DAY_LIMIT}. De komende week past.
              </>
            )
          }
        >
          <Legend
            items={[
              { label: "Verstuurd", color: BURGUNDY },
              { label: "Gepland", color: "#b98a90" },
              { label: `Vanaf ${EMAIL_DAY_WARN}`, color: "#a1262f" },
            ]}
          />
          <div className="relative flex h-44 items-end gap-3 border-b border-[#cdbfb0]">
            <span className="absolute inset-x-0 border-t border-dashed border-red-700/70" style={{ bottom: `${(EMAIL_DAY_LIMIT / limitMax) * 88}%` }}>
              <span className="absolute -top-4 right-0 text-[11px] text-red-700">limiet {EMAIL_DAY_LIMIT}</span>
            </span>
            {d.limit.map((l) => {
              const total = l.sent + l.planned;
              const hot = total >= EMAIL_DAY_WARN;
              return (
                <div key={l.day} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${l.sent} verstuurd · ${l.planned} gepland`}>
                  <p className="mb-1 text-center text-xs font-semibold tabular-nums text-wine">{total}</p>
                  <div className="mx-auto flex w-full max-w-[44px] flex-col-reverse gap-0.5 overflow-hidden rounded-t" style={{ height: `${(total / limitMax) * 88}%` }}>
                    {l.sent > 0 ? <div style={{ flex: l.sent, background: hot ? "#a1262f" : BURGUNDY }} /> : null}
                    {l.planned > 0 ? <div style={{ flex: l.planned, background: hot ? "#d17a80" : "#b98a90" }} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-3 text-center text-[11px] text-wine/50">
            {d.limit.map((l, i) => (
              <span key={l.day} className="min-w-0 flex-1">
                {i === 0 ? "vandaag" : dayShort.format(new Date(`${l.day}T12:00:00Z`)).replace(".", "")}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
