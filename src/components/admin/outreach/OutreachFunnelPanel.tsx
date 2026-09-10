"use client";

import { formatRate, type OutreachFunnel } from "@/lib/outreach/funnel";

/** Bar width relative to the widest stage, so a small funnel still reads. */
function barWidth(count: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max((count / max) * 100, count > 0 ? 3 : 0)}%`;
}

const STAGE_COLORS: Record<string, string> = {
  mailed: "bg-wine/30",
  delivered: "bg-emerald-500/50",
  opened: "bg-burgundy/60",
  clicked: "bg-gold/70",
  replied: "bg-burgundy",
  interested: "bg-emerald-600/70",
  partner: "bg-emerald-700",
};

export function OutreachFunnelPanel({ funnel }: { funnel: OutreachFunnel }) {
  const max = funnel.stages[0]?.count ?? 0;

  return (
    <section className="space-y-5 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl text-burgundy">Funnel</h2>
        <p className="text-xs text-wine/50">
          Percentages ten opzichte van de {funnel.mailed} gemailde{" "}
          {funnel.mailed === 1 ? "zaak" : "zaken"} · huidige selectie
        </p>
      </div>

      {funnel.mailed === 0 ? (
        <p className="text-sm text-wine/60">
          Nog niets verstuurd. Zodra de eerste batch eruit is, vult deze funnel
          zich vanzelf.
        </p>
      ) : (
        <>
          <ol className="space-y-2.5">
            {funnel.stages.map((stage) => (
              <li key={stage.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-wine/70">
                  {stage.label}
                </span>
                <span className="relative h-6 flex-1 overflow-hidden rounded-full bg-wine/[0.05]">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${STAGE_COLORS[stage.key] ?? "bg-burgundy/50"}`}
                    style={{ width: barWidth(stage.count, max) }}
                  />
                </span>
                <span className="w-28 shrink-0 text-right text-xs text-wine/60">
                  <span className="font-medium text-burgundy">{stage.count}</span>
                  {stage.key === "mailed" ? (
                    <span className="ml-1.5 text-wine/45">{stage.hint}</span>
                  ) : (
                    <span className="ml-1.5">{formatRate(stage.rate)}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>

          {funnel.awaitingTracking ? (
            <p className="rounded-xl border border-gold/40 bg-gold/[0.1] px-4 py-3 text-xs text-[#7A5A2B]">
              Er is nog geen enkele bezorg- of open-melding binnengekomen. Zolang
              dat zo is zeggen &quot;Afgeleverd&quot; en &quot;Geopend&quot; niets
              — controleer de webhook in Resend.
            </p>
          ) : null}

          {funnel.bounced > 0 || funnel.unsubscribed > 0 ? (
            <p className="text-xs text-wine/55">
              Uitgevallen:{" "}
              {funnel.bounced > 0 ? `${funnel.bounced} bounce` : ""}
              {funnel.bounced > 0 && funnel.unsubscribed > 0 ? " · " : ""}
              {funnel.unsubscribed > 0 ? `${funnel.unsubscribed} afgemeld` : ""}
            </p>
          ) : null}

          {funnel.steps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead>
                  <tr className="text-wine/45">
                    <th className="pb-2 font-medium">Mail</th>
                    <th className="pb-2 font-medium">Verstuurd</th>
                    <th className="pb-2 font-medium">Afgeleverd</th>
                    <th className="pb-2 font-medium">Geopend</th>
                    <th className="pb-2 font-medium">Antwoorden</th>
                  </tr>
                </thead>
                <tbody className="text-wine/70">
                  {funnel.steps.map((step) => (
                    <tr key={step.step} className="border-t border-border-subtle/60">
                      <td className="py-2 font-medium text-burgundy">
                        Mail {step.step}
                      </td>
                      <td className="py-2">{step.sent}</td>
                      <td className="py-2">
                        {step.delivered}
                        <span className="ml-1 text-wine/45">
                          {formatRate(step.delivered / step.sent)}
                        </span>
                      </td>
                      <td className="py-2">
                        {step.opened}
                        <span className="ml-1 text-wine/45">
                          {formatRate(step.opened / step.sent)}
                        </span>
                      </td>
                      <td className="py-2">
                        {step.replies}
                        <span className="ml-1 text-wine/45">
                          {formatRate(step.replies / step.sent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-wine/45">
                Een antwoord telt bij de mail die als laatste verstuurd was — de
                sequence stopt zodra iemand reageert, dus die toewijzing klopt
                exact.
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
