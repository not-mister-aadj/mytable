import type { TimelineState, TimelineStep } from "@/lib/admin/mail-overview";

const day = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
const dayTime = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});
const clean = (s: string) => s.replace(/\./g, "");

const STATE: Record<TimelineState, { label: string; className: string }> = {
  sent: { label: "Verstuurd", className: "bg-emerald-50 text-emerald-800 ring-emerald-200/70" },
  partial: { label: "Deels verstuurd", className: "bg-amber-50 text-amber-900 ring-amber-200/80" },
  planned: { label: "Ingepland", className: "bg-sky-50 text-sky-900 ring-sky-200/80" },
  coming: { label: "Komt", className: "bg-wine/[0.05] text-wine/60 ring-border-subtle" },
  late: { label: "Niet verstuurd", className: "bg-red-50 text-red-800 ring-red-200" },
  off: { label: "Uit", className: "bg-wine/[0.05] text-wine/45 ring-border-subtle" },
  none: { label: "Niemand", className: "bg-wine/[0.05] text-wine/45 ring-border-subtle" },
};

/** One Sunday's mails in order: what went out when, what is planned, what still comes. */
export function SundayMailTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-border-subtle bg-beige/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
            <th className="px-4 py-3">Wanneer</th>
            <th className="px-4 py-3">Mail</th>
            <th className="px-4 py-3">Hoe</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Gasten</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => {
            const state = STATE[step.state];
            // What happened wins over the plan: the real send time, else the planned one, else the rule.
            const went = step.sent > 0 && step.sentAt;
            const when = step.planned ? dayTime.format(step.planned.at) : went ? dayTime.format(step.sentAt!) : (step.dayOnly ? day : dayTime).format(step.at);
            const count = step.planned
              ? String(step.planned.count)
              : step.total === null
                ? "–"
                : step.state === "coming" || step.state === "off" || step.state === "none"
                  ? String(step.total)
                  : `${step.sent} van ${step.total}`;
            return (
              <tr key={step.kind} className="border-b border-border-subtle/50 last:border-b-0">
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-wine/75">{clean(when)}</td>
                <td className="px-4 py-2.5 font-medium text-wine">{step.title}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-wine/60">{step.auto ? "Automatisch" : "Met de hand"}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${state.className}`}>
                    {state.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-wine">{count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
