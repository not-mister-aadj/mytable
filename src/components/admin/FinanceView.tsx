import Link from "next/link";
import type { FinanceData, FinanceGranularity, FinancePeriod } from "@/lib/admin-finance";

// Validated with the dataviz palette checks against the admin surface
// (#faf6f0): distinct for all colour-vision types and >= 3:1 contrast.
const REVENUE_COLOR = "#982a45";
const AD_SPEND_COLOR = "#b8801c";

const WINDOW_LABEL: Record<FinanceGranularity, string> = {
  dag: "laatste 30 dagen",
  week: "laatste 13 weken",
  maand: "laatste 12 maanden",
};

const TOGGLE_LABEL: Record<FinanceGranularity, string> = {
  dag: "Per dag",
  week: "Per week",
  maand: "Per maand",
};

function euro(value: number, decimals = 0): string {
  return `€${value.toLocaleString("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function signedEuro(value: number): string {
  if (Math.round(value) === 0) return euro(0);
  return `${value > 0 ? "+" : "−"}${euro(Math.abs(value))}`;
}

/** A round axis maximum (1, 2, 2.5 or 5 times a power of ten) so the
 * gridlines land on readable amounts. */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * power) return step * power;
  }
  return 10 * power;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-beige p-4 sm:p-5">
      <p className="text-sm text-wine/60">{label}</p>
      <p className="mt-1 font-serif text-2xl tabular-nums text-wine sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-wine/50">{hint}</p> : null}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-wine/75">
      <span aria-hidden className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Chart({
  periods,
  granularity,
  showAdSpend,
}: {
  periods: FinancePeriod[];
  granularity: FinanceGranularity;
  showAdSpend: boolean;
}) {
  const max = niceMax(
    Math.max(...periods.map((p) => Math.max(p.revenue, showAdSpend ? p.adSpend : 0)), 0),
  );
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  // Thirty day labels would collide on a phone; every fifth is enough.
  const labelEvery = granularity === "dag" ? 5 : 1;

  return (
    <div className="flex gap-3">
      <div className="relative h-56 w-12 shrink-0 text-right text-xs tabular-nums text-wine/50">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2"
            style={{ bottom: `${(tick / max) * 100}%` }}
          >
            {euro(tick)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className={granularity === "dag" ? "min-w-[640px]" : ""}>
          <div className="relative h-56">
            {ticks.map((tick) => (
              <div
                key={tick}
                aria-hidden
                className={`absolute inset-x-0 border-b ${tick === 0 ? "border-wine/25" : "border-wine/8"}`}
                style={{ bottom: `${(tick / max) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex">
              {periods.map((period, index) => {
                const net = period.revenue - period.adSpend;
                const alignRight = index > periods.length / 2;
                return (
                  <div
                    key={period.key}
                    tabIndex={0}
                    aria-label={`${period.longLabel}: inkomsten ${euro(period.revenue)}${
                      showAdSpend ? `, advertentiekosten ${euro(period.adSpend)}` : ""
                    }`}
                    className="group relative flex h-full flex-1 items-end justify-center gap-0.5 px-1 outline-none sm:px-2 hover:bg-wine/[0.04] focus-visible:bg-wine/[0.06]"
                  >
                    <div
                      className="w-full max-w-7 rounded-t-[4px]"
                      style={{
                        height: `${(period.revenue / max) * 100}%`,
                        backgroundColor: REVENUE_COLOR,
                      }}
                    />
                    {showAdSpend ? (
                      <div
                        className="w-full max-w-7 rounded-t-[4px]"
                        style={{
                          height: `${(period.adSpend / max) * 100}%`,
                          backgroundColor: AD_SPEND_COLOR,
                        }}
                      />
                    ) : null}
                    <div
                      role="tooltip"
                      className={`pointer-events-none absolute top-1 z-10 hidden w-48 rounded-xl border border-border-subtle bg-cream p-3 text-xs shadow-[0_10px_30px_rgba(43,13,18,0.12)] group-hover:block group-focus-visible:block ${
                        alignRight ? "right-0" : "left-0"
                      }`}
                    >
                      <p className="font-medium text-wine">{period.longLabel}</p>
                      <dl className="mt-2 space-y-1 tabular-nums">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="flex items-center gap-1.5 text-wine/70">
                            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: REVENUE_COLOR }} />
                            Inkomsten
                          </dt>
                          <dd className="text-wine">{euro(period.revenue, 2)}</dd>
                        </div>
                        {showAdSpend ? (
                          <div className="flex items-center justify-between gap-3">
                            <dt className="flex items-center gap-1.5 text-wine/70">
                              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: AD_SPEND_COLOR }} />
                              Advertenties
                            </dt>
                            <dd className="text-wine">{euro(period.adSpend, 2)}</dd>
                          </div>
                        ) : null}
                        <div className="flex justify-between gap-3 border-t border-border-subtle pt-1">
                          <dt className="text-wine/70">Tickets</dt>
                          <dd className="text-wine">{period.tickets}</dd>
                        </div>
                        {showAdSpend ? (
                          <div className="flex justify-between gap-3">
                            <dt className="text-wine/70">Resultaat</dt>
                            <dd className="font-medium text-wine">{signedEuro(net)}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex text-xs text-wine/55">
            {periods.map((period, index) => {
              const last = index === periods.length - 1;
              const shown = index % labelEvery === 0 || last;
              // Twelve or thirteen labels do not fit a phone: every third there.
              const phoneHidden = granularity !== "dag" && index % 3 !== 0 && !last;
              return (
                <span
                  key={period.key}
                  className={`flex-1 truncate text-center ${phoneHidden ? "max-sm:invisible" : ""}`}
                >
                  {shown ? period.label : ""}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaSetupNotice({ status, error }: { status: FinanceData["adSpendStatus"]; error?: string }) {
  if (status === "ok") return null;
  return (
    <section className="rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm text-wine/80">
      {status === "not_configured" ? (
        <>
          <p className="font-medium text-wine">Advertentiekosten zijn nog niet gekoppeld</p>
          <p className="mt-1">
            De grafiek toont nu alleen inkomsten. Voor de kosten uit Meta is een token met de
            rechten <code className="rounded bg-cream px-1">ads_read</code> nodig, als{" "}
            <code className="rounded bg-cream px-1">META_ADS_ACCESS_TOKEN</code> in Vercel.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>Meta Business-instellingen, Gebruikers, Systeemgebruikers: voeg er een toe.</li>
            <li>Geef die gebruiker toegang tot advertentieaccount MyTable (prestaties bekijken).</li>
            <li>Genereer een token met de rechten ads_read en zet het in Vercel.</li>
          </ol>
        </>
      ) : (
        <>
          <p className="font-medium text-wine">Advertentiekosten konden niet worden opgehaald</p>
          <p className="mt-1">Meta gaf deze melding: {error}</p>
        </>
      )}
    </section>
  );
}

export function FinanceView({ data, basePath }: { data: FinanceData; basePath: string }) {
  const { periods, totals, granularity } = data;
  const showAdSpend = data.adSpendStatus === "ok";
  const net = totals.revenue - totals.adSpend;
  const perTicket = totals.tickets > 0 ? totals.adSpend / totals.tickets : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-burgundy">Financiën</h1>
          <p className="mt-1 text-sm text-wine/60">
            Inkomsten en advertentiekosten, {WINDOW_LABEL[granularity]}.
          </p>
        </div>
        <nav aria-label="Tijdseenheid" className="flex gap-1 rounded-full border border-border-subtle bg-beige p-1">
          {(Object.keys(TOGGLE_LABEL) as FinanceGranularity[]).map((option) => (
            <Link
              key={option}
              href={`${basePath}?per=${option}`}
              aria-current={option === granularity ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                option === granularity
                  ? "bg-burgundy text-cream"
                  : "text-wine/70 hover:text-wine"
              }`}
            >
              {TOGGLE_LABEL[option]}
            </Link>
          ))}
        </nav>
      </header>

      <MetaSetupNotice status={data.adSpendStatus} error={data.adSpendError} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Inkomsten"
          value={euro(totals.revenue)}
          hint={`${totals.tickets} ${totals.tickets === 1 ? "ticket" : "tickets"} verkocht`}
        />
        <StatTile
          label="Advertentiekosten"
          value={showAdSpend ? euro(totals.adSpend) : "–"}
          hint={showAdSpend ? "Meta (Facebook en Instagram)" : "nog niet gekoppeld"}
        />
        <StatTile
          label="Resultaat"
          value={showAdSpend ? signedEuro(net) : "–"}
          hint={showAdSpend ? (net >= 0 ? "meer verdiend dan uitgegeven" : "meer uitgegeven dan verdiend") : undefined}
        />
        <StatTile
          label="Advertentiekosten per ticket"
          value={showAdSpend && perTicket !== null ? euro(perTicket, 2) : "–"}
          hint={showAdSpend ? "advertentiekosten gedeeld door verkochte tickets" : undefined}
        />
      </div>

      <section className="rounded-2xl border border-border-subtle bg-beige p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-burgundy">{TOGGLE_LABEL[granularity]}</h2>
          <div className="flex flex-wrap gap-4">
            <LegendSwatch color={REVENUE_COLOR} label="Inkomsten" />
            {showAdSpend ? <LegendSwatch color={AD_SPEND_COLOR} label="Advertentiekosten" /> : null}
          </div>
        </div>
        <div className="mt-6">
          <Chart periods={periods} granularity={granularity} showAdSpend={showAdSpend} />
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border-subtle bg-beige">
        <table className="w-full min-w-[520px] text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-wine/55">
              <th className="px-5 py-3 font-medium">Periode</th>
              <th className="px-5 py-3 text-right font-medium">Inkomsten</th>
              <th className="px-5 py-3 text-right font-medium">Tickets</th>
              <th className="px-5 py-3 text-right font-medium">Advertenties</th>
              <th className="px-5 py-3 text-right font-medium">Resultaat</th>
            </tr>
          </thead>
          <tbody>
            {[...periods].reverse().map((period) => (
              <tr key={period.key} className="border-b border-border-subtle/60 last:border-0">
                <td className="px-5 py-2.5 text-wine">{period.longLabel}</td>
                <td className="px-5 py-2.5 text-right text-wine">{euro(period.revenue, 2)}</td>
                <td className="px-5 py-2.5 text-right text-wine/70">{period.tickets}</td>
                <td className="px-5 py-2.5 text-right text-wine">
                  {showAdSpend ? euro(period.adSpend, 2) : "–"}
                </td>
                <td className="px-5 py-2.5 text-right text-wine">
                  {showAdSpend ? signedEuro(period.revenue - period.adSpend) : "–"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-wine/20 font-medium">
              <td className="px-5 py-3 text-wine">Totaal</td>
              <td className="px-5 py-3 text-right text-wine">{euro(totals.revenue, 2)}</td>
              <td className="px-5 py-3 text-right text-wine">{totals.tickets}</td>
              <td className="px-5 py-3 text-right text-wine">{showAdSpend ? euro(totals.adSpend, 2) : "–"}</td>
              <td className="px-5 py-3 text-right text-wine">{showAdSpend ? signedEuro(net) : "–"}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <p className="text-xs leading-relaxed text-wine/50">
        Inkomsten zijn betaalde boekingen in de app, inclusief btw en voor aftrek van
        betaalkosten, op de dag van boeken. Edities die buiten de app zijn verkocht tellen niet
        mee. Advertentiekosten komen uit Meta en worden elk uur ververst.
      </p>
    </div>
  );
}
