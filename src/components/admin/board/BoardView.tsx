import Link from "next/link";
import type { BoardData, Kpi, Share } from "@/lib/admin/board-data";
import { SnapshotButton } from "./SnapshotButton";

/** The Board page: one month of MyTable, readable by someone who wasn't
 * in the day-to-day. Every number has its definition next to it. */

const euro = (cents: number | null, digits = 0) =>
  cents === null ? "–" : `€${(cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
const monthName = (key: string, withYear = true) =>
  new Intl.DateTimeFormat("nl-NL", { month: "long", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(
    new Date(`${key}-15T12:00:00Z`),
  );
const monthShort = (key: string) =>
  new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "UTC" }).format(new Date(`${key}-15T12:00:00Z`)).replace(".", "");

type Direction = "up" | "down";

function Delta({ kpi, good, format, label: compare = "vs vorige maand" }: { kpi: Kpi; good: Direction; format: "count" | "money" | "pct" | "euro" | "x"; label?: string }) {
  if (kpi.value === null || kpi.previous === null) return <span className="text-xs text-wine/40">geen vergelijking</span>;
  const diff = kpi.value - kpi.previous;
  if (Math.abs(diff) < 1e-9) return <span className="text-xs text-wine/45">gelijk aan vorige maand</span>;
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

function Tile({ label, value, sub, children }: { label: string; value: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border-subtle bg-beige/60 p-4 break-inside-avoid">
      <p className="text-xs font-medium text-wine/55">{label}</p>
      <p className="font-serif text-3xl leading-tight text-burgundy tabular-nums">{value}</p>
      {children}
      {sub ? <p className="mt-auto pt-1 text-[11px] leading-snug text-wine/45">{sub}</p> : null}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="font-serif text-xl text-burgundy">{title}</h2>
      {note ? <p className="mt-0.5 max-w-prose text-sm text-wine/55">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ShareBar({ title, shares }: { title: string; shares: Share[] }) {
  const total = shares.reduce((s, x) => s + x.count, 0);
  const tones = ["bg-burgundy", "bg-burgundy/70", "bg-burgundy/45", "bg-burgundy/25", "bg-wine/10"];
  return (
    <div className="rounded-xl border border-border-subtle bg-beige/60 p-4 break-inside-avoid">
      <p className="text-sm font-medium text-wine">{title}</p>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-wine/10">
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

export function BoardView({ data, monthHref }: { data: BoardData; monthHref: (month: string) => string }) {
  const k = data.kpis;
  const maxRevenue = Math.max(1, ...data.months.map((m) => Math.max(m.revenueCents, m.targetCents ?? 0)));
  const hasMembershipRevenue = data.months.some((m) => m.membershipCents > 0);
  const funnelTop = data.funnel.posthog?.[0]?.count ?? 0;
  const contribution = data.unit.contributionCents;

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
          <p className="mt-1 text-sm text-wine/60">
            {data.isCurrentMonth ? "Lopende maand, stand van vandaag." : "Afgesloten maand."} Vergeleken met {monthName(data.previousMonth, false)}.
          </p>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Tile
          label="Omzet"
          value={euro(k.revenueCents.value)}
          sub={`Tickets voor zondagen in ${monthName(data.month, false)} plus lidmaatschappen betaald in ${monthName(data.month, false)}.${k.targetCents !== null ? ` Doel ${euro(k.targetCents)}.` : ""}`}
        >
          <p className="flex flex-wrap gap-x-3 text-xs text-wine/70">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-burgundy" /> Tickets {euro(k.ticketRevenueCents.value)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-amber-500" /> Leden {euro(k.membershipRevenueCents.value)}
            </span>
          </p>
          <Delta kpi={k.revenueCents} good="up" format="money" />
          {k.targetCents !== null ? (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-wine/10">
              <div
                className={`h-full rounded-full ${(k.revenueCents.value ?? 0) >= k.targetCents ? "bg-emerald-600" : "bg-burgundy/70"}`}
                style={{ width: `${Math.min(100, ((k.revenueCents.value ?? 0) / k.targetCents) * 100)}%` }}
              />
            </div>
          ) : null}
        </Tile>
        <Tile
          label="MRR"
          value={euro(k.mrrCents.value)}
          sub={`Terugkerende omzet per maand uit lidmaatschappen, ${data.isCurrentMonth ? "vandaag" : "aan het eind van de maand"}. Een plan van 4 maanden telt voor €9 per maand.`}
        >
          <Delta kpi={k.mrrCents} good="up" format="money" label="vs begin van de maand" />
        </Tile>
        <Tile
          label="Leden"
          value={String(k.members.active.value ?? 0)}
          sub={`Actieve lidmaatschappen. Deze maand ${k.members.new} nieuw, ${k.members.churned} opgezegd.`}
        >
          <Delta kpi={k.members.active} good="up" format="count" label="vs begin van de maand" />
        </Tile>
        <Tile
          label="Plekken verkocht"
          value={String(k.seats.value ?? 0)}
          sub={k.projectedSeats !== null ? `Verwacht ${k.projectedSeats}: verkocht plus open plekken bij de gemiddelde vulgraad.` : "Plekken voor zondagen deze maand."}
        >
          <Delta kpi={k.seats} good="up" format="count" />
        </Tile>
        <Tile label="Betalende gasten" value={String(k.guests.value ?? 0)} sub="Unieke mensen met een ticket voor deze maand.">
          <Delta kpi={k.guests} good="up" format="count" />
        </Tile>
        <Tile label="Komt terug" value={pct(k.repeatRate.value)} sub="Deel van alle gasten tot nu toe dat 2 of meer zondagen boekte.">
          <Delta kpi={k.repeatRate} good="up" format="pct" />
        </Tile>
        <Tile label="Vulgraad" value={pct(k.fillRate.value)} sub="Verkochte plekken gedeeld door aangeboden plekken, voor zondagen die al geweest zijn.">
          {k.fillRate.value === null ? <span className="text-xs text-wine/45">Nog geen zondag geweest deze maand</span> : <Delta kpi={k.fillRate} good="up" format="pct" />}
        </Tile>
        <Tile
          label="Advertentiekosten per ticket"
          value={euro(k.costPerTicketCents.value, 2)}
          sub="Meta-uitgaven gedeeld door tickets geboekt in deze maand. Boven €10 kost een ticket meer dan het oplevert."
        >
          {data.hasAdSpend ? <Delta kpi={k.costPerTicketCents} good="down" format="euro" /> : <span className="text-xs text-wine/45">Nog geen advertentiekosten ingelezen</span>}
        </Tile>
        <Tile label="ROAS" value={k.roas.value === null ? "–" : `${k.roas.value.toFixed(2)}×`} sub="Omzet uit boekingen deze maand per €1 aan advertenties.">
          {data.hasAdSpend ? <Delta kpi={k.roas} good="up" format="x" /> : null}
        </Tile>
        <Tile label="Op de lijst" value={k.waitlistTotal.toLocaleString("nl-NL")} sub={`${k.waitlistNew.value} nieuw deze maand.`}>
          <Delta kpi={k.waitlistNew} good="up" format="count" label={data.isCurrentMonth ? "vs zelfde dagen vorige maand" : "vs vorige maand"} />
        </Tile>
        <Tile label="Steden" value={`${k.cities.planned}`} sub={`Steden met een zondag deze maand, ${k.cities.held} al geweest.`} />
        <Tile
          label="Vragen ingevuld"
          value={pct(k.answeredRate.value)}
          sub={`Gasten die iets over zichzelf vertelden.${k.noShowRate.value !== null ? ` Niet gekomen: ${pct(k.noShowRate.value)}.` : ""}`}
        >
          <Delta kpi={k.answeredRate} good="up" format="pct" />
        </Tile>
      </div>

      <Section title="Groei per maand" note="Omzet per maand sinds de Sunday Socials (augustus 2026): tickets op de maand van de zondag, lidmaatschappen op de maand van betaling. Met het doel uit het plan naar €10.000 per maand.">
        <div className="rounded-xl border border-border-subtle bg-beige/60 p-4">
          <div className="flex h-48 items-end gap-2">
            {data.months.map((m) => (
              <div key={m.month} className="group relative flex h-full flex-1 flex-col justify-end">
                {m.targetCents !== null ? (
                  <div className="absolute inset-x-0 border-t-2 border-dashed border-red-700/60" style={{ bottom: `${(m.targetCents / maxRevenue) * 100}%` }} />
                ) : null}
                <div
                  className="flex flex-col justify-end"
                  style={{ height: `${(m.revenueCents / maxRevenue) * 100}%`, minHeight: m.revenueCents > 0 ? 2 : 0 }}
                  title={`${monthName(m.month)}: ${euro(m.revenueCents)}${m.future ? " al verkocht" : ""} (tickets ${euro(m.ticketCents)}, leden ${euro(m.membershipCents)}), ${m.seats} plekken${m.targetCents !== null ? `, doel ${euro(m.targetCents)}` : ""}`}
                >
                  {m.membershipCents > 0 ? (
                    <div
                      className={`rounded-t ${m.month === data.month ? "bg-amber-500" : "bg-amber-500/55"}`}
                      style={{ height: `${(m.membershipCents / m.revenueCents) * 100}%`, minHeight: 2 }}
                    />
                  ) : null}
                  <div
                    className={`${m.membershipCents > 0 ? "" : "rounded-t"} ${m.month === data.month ? "bg-burgundy" : m.future ? "border border-dashed border-burgundy/50 bg-burgundy/15" : "bg-burgundy/45"}`}
                    style={{ height: `${m.revenueCents > 0 ? (m.ticketCents / m.revenueCents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 text-center text-[11px] text-wine/50">
            {data.months.map((m) => (
              <span key={m.month} className="flex-1">
                {monthShort(m.month)}
                <span className="block tabular-nums text-wine/70">{m.revenueCents > 0 ? euro(m.revenueCents) : ""}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-4 text-xs text-wine/55">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-burgundy" /> Tickets
            </span>
            {hasMembershipRevenue ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Lidmaatschappen
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-burgundy/50 bg-burgundy/15" /> Al verkocht voor komende maanden
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-red-700/60" /> Doel
            </span>
          </p>
        </div>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Per ticket" note="Wat één ticket oplevert, en wat een gast ons waard is. Sinds de Sunday Socials (augustus 2026).">
          <div className="rounded-xl border border-border-subtle bg-beige/60 p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 font-serif text-2xl text-burgundy">
              <span>{euro(data.unit.avgPriceCents, 2)}</span>
              <span className="text-base text-wine/45">ticket</span>
              <span className="text-wine/40">−</span>
              <span>{euro(data.unit.costPerTicketCents, 2)}</span>
              <span className="text-base text-wine/45">ads</span>
              <span className="text-wine/40">=</span>
              <span className={contribution !== null && contribution < 0 ? "text-red-700" : ""}>{euro(contribution, 2)}</span>
              <span className="text-base text-wine/45">over</span>
            </div>
            <p className="mt-2 text-sm text-wine/60">De zaak kost ons niets: gasten betalen hun eten en drinken zelf.</p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
              <div>
                <p className="text-xs text-wine/55">Waarde per gast (LTV)</p>
                <p className="font-serif text-2xl text-burgundy">{euro(data.unit.ltvCents, 2)}</p>
                <p className="text-[11px] text-wine/45">{data.unit.ticketsPerGuest.toFixed(2)} tickets per gast × gemiddelde prijs</p>
              </div>
              <div>
                <p className="text-xs text-wine/55">Kosten per nieuwe gast (CAC)</p>
                <p className="font-serif text-2xl text-burgundy">{euro(data.unit.cacCents, 2)}</p>
                <p className="text-[11px] text-wine/45">Alle advertentiekosten gedeeld door nieuwe gasten in die periode</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Van bezoek tot boeking" note="Laatste 30 dagen. Unieke mensen per stap (PostHog), en hoeveel nieuwe wachtlijstaanmeldingen al boekten.">
          <div className="rounded-xl border border-border-subtle bg-beige/60 p-5">
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
                          {prevCount ? <span className="ml-2 text-xs text-wine/45">{Math.round((step.count / prevCount) * 100)}% van vorige stap</span> : null}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-wine/10">
                        <div className="h-full rounded-full bg-burgundy/70" style={{ width: `${funnelTop > 0 ? Math.max(1, (step.count / funnelTop) * 100) : 0}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-wine/60">PostHog is niet gekoppeld.</p>
            )}
            <p className="mt-4 border-t border-border-subtle pt-3 text-sm text-wine/70">
              Wachtlijst: <span className="font-medium text-wine">{data.funnel.waitlistNew}</span> nieuwe aanmeldingen,{" "}
              <span className="font-medium text-wine">{data.funnel.waitlistBooked}</span> daarvan boekten al (
              {data.funnel.waitlistNew > 0 ? Math.round((data.funnel.waitlistBooked / data.funnel.waitlistNew) * 100) : 0}%).
            </p>
          </div>
        </Section>
      </div>

      <Section title="Kanalen" note={`Waar de boekingen van ${monthName(data.month, false)} vandaan kwamen, op basis van de link waarmee mensen binnenkwamen.`}>
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-beige/60">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-[0.06em] text-wine/50">
                <th className="px-4 py-2.5 font-medium">Kanaal</th>
                <th className="px-4 py-2.5 text-right font-medium">Plekken</th>
                <th className="px-4 py-2.5 text-right font-medium">Omzet</th>
                <th className="px-4 py-2.5 text-right font-medium">Uitgegeven</th>
                <th className="px-4 py-2.5 text-right font-medium">Per plek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.channels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-wine/55">
                    Nog geen boekingen deze maand.
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
                        c.spendCents !== null && c.seats > 0 && c.spendCents / c.seats > 1000 ? "text-red-700" : "text-wine"
                      }`}
                    >
                      {c.spendCents === null ? "–" : c.seats > 0 ? euro(c.spendCents / c.seats, 2) : "geen verkoop"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Steden" note="Alle Sunday Socials tot nu toe, per stad.">
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-beige/60">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-[0.06em] text-wine/50">
                <th className="px-4 py-2.5 font-medium">Stad</th>
                <th className="px-4 py-2.5 text-right font-medium">Geweest</th>
                <th className="px-4 py-2.5 text-right font-medium">Plekken</th>
                <th className="px-4 py-2.5 text-right font-medium">Vulgraad</th>
                <th className="px-4 py-2.5 text-right font-medium">Omzet</th>
                <th className="px-4 py-2.5 text-right font-medium">Op de lijst</th>
                <th className="px-4 py-2.5 font-medium">Volgende zondag</th>
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
                  <td className="px-4 py-2.5 text-wine/75">
                    {c.next
                      ? `${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(c.next.date))} · ${c.next.sold}/${c.next.capacity}`
                      : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Komen ze terug?" note="Gasten per maand van hun eerste boeking, en welk deel binnen 30, 60 en 90 dagen opnieuw boekte. Nog te vers om te tellen: leeg.">
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-beige/60">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-[0.06em] text-wine/50">
                <th className="px-4 py-2.5 font-medium">Eerste boeking</th>
                <th className="px-4 py-2.5 text-right font-medium">Gasten</th>
                <th className="px-4 py-2.5 text-right font-medium">Na 30 dagen</th>
                <th className="px-4 py-2.5 text-right font-medium">Na 60 dagen</th>
                <th className="px-4 py-2.5 text-right font-medium">Na 90 dagen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.cohorts.map((c) => (
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
      </Section>

      <Section title="Wie onze gast is" note="Boekingen van de laatste 90 dagen. Leeftijd uit de boeking, anders uit de wachtlijst.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ShareBar title="Leeftijd" shares={data.guests.age} />
          <ShareBar title="Komt" shares={data.guests.company} />
          <ShareBar title="Taal aan tafel" shares={data.guests.language} />
          <ShareBar title="Nieuw of terug" shares={data.guests.newVsReturning} />
        </div>
      </Section>

      <p className="max-w-prose text-xs text-wine/45">
        Bronnen: boekingen en wachtlijst uit de MyTable-database, bezoek uit PostHog, advertentiekosten uit Meta (ingelezen per dag). Edities die buiten de
        app zijn verkocht staan hier niet in.
      </p>
    </div>
  );
}
