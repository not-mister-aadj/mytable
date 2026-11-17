import Link from "next/link";
import type { ReactNode } from "react";
import { CHART_GOALS, INSIGHT_PERIODS, getMailInsights, type ChartGoal, type InsightPeriod, type Rate } from "@/lib/admin/mail-insights";
import { adminPath } from "@/lib/admin-url";
import { MAIL_GOALS, mailTitle } from "@/lib/email/mail-catalog";
import { EMAIL_DAY_LIMIT, EMAIL_DAY_WARN } from "@/lib/email/volume";

/** A goal keeps its colour in every chart (fixed order, never by rank). */
const GOAL_COLOR: Record<ChartGoal, string> = {
  boeken: "#2a78d6",
  vooraf: "#eb6834",
  achteraf: "#1baf7a",
  groei: "#eda100",
  lid: "#e87ba4",
  venues: "#6250d6",
  account: "#b4a79b",
  intern: "#b4a79b",
  overig: "#cdbfb0",
};
const GOAL_INK: Partial<Record<ChartGoal, string>> = { boeken: "#ffffff", venues: "#ffffff" };
const GOAL_LABEL: Record<string, string> = { ...Object.fromEntries(MAIL_GOALS.map((g) => [g.id, g.label])), overig: "Overig" };
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

/** Horizontal bars: a label, the bar, one number. The rest is in the tooltip. */
function Bars({ rows, max, color = BURGUNDY }: { rows: Array<{ label: string; value: number; text: string; hint?: string }>; max: number; color?: string }) {
  return (
    <div className="grid grid-cols-[minmax(110px,38%)_1fr_auto] items-center gap-x-3 gap-y-3 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents" title={r.hint}>
          <span className="text-wine">{r.label}</span>
          <span className="h-[22px] rounded-r" style={{ background: TRACK }}>
            <span className="block h-full rounded-r" style={{ width: `${max > 0 ? Math.max(r.value > 0 ? 1.5 : 0, (r.value / max) * 100) : 0}%`, background: color }} />
          </span>
          <span className="min-w-[3.5rem] text-right text-base font-semibold tabular-nums text-wine">{r.text}</span>
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
  const worst = d.selling.length > 1 ? d.selling[d.selling.length - 1]! : null;
  const badSender = d.senders.find((s) => s.problems.total >= 20 && (share(s.problems) ?? 0) > 0.02);

  const notices: Array<{ tone: "good" | "watch" | "act"; tag: string; title: string; sub: string }> = [];
  if (best && best.booked.part > 0)
    notices.push({
      tone: "good",
      tag: "Gaat goed",
      title: `"${mailTitle(best.kind)}" zet het vaakst aan tot boeken`,
      sub: `${best.booked.part} van ${best.booked.total} ontvangers boekten, goed voor ${euro(best.revenueCents)}.`,
    });
  if (worst && (share(worst.booked) ?? 0) < (share(best!.booked) ?? 0))
    notices.push({
      tone: "watch",
      tag: "Let op",
      title: `"${mailTitle(worst.kind)}" zet weinig om`,
      sub: `${worst.booked.total} ontvangers, ${worst.booked.part} ${worst.booked.part === 1 ? "boeking" : "boekingen"} (${pct(worst.booked, 1)}).`,
    });
  if (tight)
    notices.push({
      tone: "act",
      tag: "Actie nodig",
      title: `${WEEKDAY_LONG[(new Date(`${tight.day}T12:00:00Z`).getUTCDay() + 6) % 7]} staat op ${tight.sent + tight.planned} van ${EMAIL_DAY_LIMIT} mails`,
      sub: "Verplaats een verzending naar een andere dag.",
    });
  else if (badSender)
    notices.push({
      tone: "act",
      tag: "Actie nodig",
      title: `${pct(badSender.problems, 1)} van de mails vanaf ${badSender.from} komt niet aan`,
      sub: `${badSender.problems.part} van ${badSender.problems.total} mails.`,
    });
  const TONE = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-800",
    watch: "border-amber-200 bg-amber-50 text-amber-800",
    act: "border-red-200 bg-red-50 text-red-800",
  };

  const goals = CHART_GOALS.filter((g) => d.volume.some((v) => (v.byGoal[g] ?? 0) > 0));
  const volumeMax = Math.max(1, ...d.volume.map((v) => v.total));
  const lastVolume = d.volume[d.volume.length - 1];
  const topGoal = lastVolume ? goals.slice().sort((a, b) => (lastVolume.byGoal[b] ?? 0) - (lastVolume.byGoal[a] ?? 0))[0] : null;

  const funnelMax = Math.max(1, d.funnel[0]!.value);
  const per100 = k.sent > 0 ? ((k.bookings / k.sent) * 100).toFixed(1).replace(".", ",") : null;

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
      <nav className="flex w-fit gap-1 rounded-full border border-border-subtle bg-cream p-1 text-sm">
        {INSIGHT_PERIODS.map((p) => (
          <Link key={p.id} href={href(p.id)} className={`rounded-full px-3 py-1 ${p.id === period ? "bg-burgundy text-cream" : "text-wine/70 hover:text-burgundy"}`}>
            {p.label}
          </Link>
        ))}
      </nav>

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

      {notices.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {notices.map((n) => (
            <div key={n.tag} className={`rounded-xl border px-4 py-3.5 ${TONE[n.tone]}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">{n.tag}</p>
              <p className="mt-1 font-semibold text-wine">{n.title}</p>
              <p className="mt-0.5 text-sm text-wine/65">{n.sub}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          who="Directie"
          title="Wat levert mail op?"
          take={
            per100 === null ? (
              "Nog geen mails in deze periode."
            ) : k.bookings === 0 ? (
              "Nog geen betaalde plek uit mail in deze periode."
            ) : (
              <>
                Van elke 100 mails leiden er <Em>{per100}</Em> tot een betaalde plek: <Em>{k.bookings} {k.bookings === 1 ? "boeking" : "boekingen"}, {euro(k.revenueCents)}</Em>.
              </>
            )
          }
        >
          <div className="grid grid-cols-[minmax(90px,24%)_1fr_auto_auto] items-center gap-x-3 gap-y-3 text-sm">
            {d.funnel.map((f) => (
              <div key={f.label} className="contents">
                <span className="text-wine">{f.label}</span>
                <span className="h-[22px] rounded-r" style={{ background: TRACK }}>
                  <span className="block h-full rounded-r" style={{ width: `${Math.max(f.value > 0 ? 1.5 : 0, (f.value / funnelMax) * 100)}%`, background: BURGUNDY }} />
                </span>
                <span className="text-right text-base font-semibold tabular-nums text-wine">{nf.format(f.value)}</span>
                <span className="w-12 text-right text-xs tabular-nums text-wine/55">{pct({ part: f.value, total: d.funnel[0]!.value }, f.value / funnelMax < 0.1 ? 1 : 0)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          who="Directie en groei"
          title="Hoeveel sturen we, en waarvoor?"
          take={
            lastVolume ? (
              <>
                <Em>{nf.format(lastVolume.total)} mails</Em> {period === "7" ? "op de laatste dag" : "in de laatste week"}
                {topGoal ? (
                  <>
                    , de meeste voor <Em>{GOAL_LABEL[topGoal]?.toLowerCase()}</Em>
                  </>
                ) : null}
                .
              </>
            ) : (
              "Nog geen mails in deze periode."
            )
          }
        >
          {d.volume.length === 0 ? (
            <Empty />
          ) : (
            <>
              <Legend items={goals.map((g) => ({ label: GOAL_LABEL[g] ?? g, color: GOAL_COLOR[g] }))} />
              <div className="flex h-56 items-end gap-2 border-b border-[#cdbfb0]">
                {d.volume.map((v) => (
                  <div key={v.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <p className="mb-1 text-center text-xs font-semibold tabular-nums text-wine">{v.total}</p>
                    <div className="mx-auto flex w-full max-w-[56px] flex-col-reverse gap-0.5" style={{ height: `${(v.total / volumeMax) * 88}%` }}>
                      {goals.map((g, i) => {
                        const n = v.byGoal[g] ?? 0;
                        if (n === 0) return null;
                        const last = goals.slice(i + 1).every((x) => !(v.byGoal[x] ?? 0));
                        return (
                          <div
                            key={g}
                            title={`${GOAL_LABEL[g]}: ${n}`}
                            className={`flex min-h-0 items-center justify-center overflow-hidden text-[11px] font-semibold tabular-nums ${last ? "rounded-t" : ""}`}
                            style={{ flex: n, background: GOAL_COLOR[g], color: GOAL_INK[g] ?? "#2b0d12" }}
                          >
                            {(n / volumeMax) * 190 >= 14 ? n : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-2 text-center text-[11px] text-wine/50">
                {d.volume.map((v) => (
                  <span key={v.label} className="min-w-0 flex-1 truncate">
                    {v.label}
                  </span>
                ))}
              </div>
            </>
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
                hint: `${s.booked.part} van ${s.booked.total} ontvangers · ${euro(s.revenueCents)}`,
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
                hint: `${c.sent} verstuurd · ${c.clicked} geklikt · ${c.booked} geboekt`,
              }))}
            />
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
            <Bars max={100} rows={d.steps.map((s) => ({ label: s.label, value: (share(s.rate) ?? 0) * 100, text: pct(s.rate), hint: `${s.rate.part} van ${s.rate.total}` }))} />
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
                rows={d.senders.slice(0, 5).map((s) => ({ label: s.from, value: (share(s.problems) ?? 0) * 100, text: pct(s.problems, 1), hint: `${s.problems.part} van ${s.problems.total} · bounce, spam of tegengehouden` }))}
              />
              <Bars
                color="#a1262f"
                max={Math.max(5, ...d.providers.map((s) => (share(s.problems) ?? 0) * 100))}
                rows={d.providers.map((s) => ({ label: s.name, value: (share(s.problems) ?? 0) * 100, text: pct(s.problems, 1), hint: `${s.problems.part} van ${s.problems.total}` }))}
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
