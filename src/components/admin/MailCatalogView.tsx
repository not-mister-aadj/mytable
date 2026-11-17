import Link from "next/link";
import { Suspense } from "react";
import { EMAIL_PREVIEW_PATHS } from "@/lib/admin/email-stats";
import { getMailKindActivity, getUpcomingMails, type KindActivity } from "@/lib/admin/mail-overview";
import { adminPath } from "@/lib/admin-url";
import { MAIL_CATALOG, MAIL_GOALS, SUNDAY_FLOW, catalogMail } from "@/lib/email/mail-catalog";

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

const HOW_STYLE: Record<string, string> = {
  Automatisch: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
  Ingepland: "bg-sky-50 text-sky-900 ring-sky-200/80",
  "Met de hand": "bg-amber-50 text-amber-900 ring-amber-200/80",
  "Wacht op akkoord": "bg-amber-50 text-amber-900 ring-amber-200/80",
};

function How({ label }: { label: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${HOW_STYLE[label] ?? ""}`}>
      {label}
    </span>
  );
}

/** Every mail we send, by what it is for, with when it goes; and what goes out the coming two weeks. */
export async function MailCatalogView({ hostname }: { hostname: string }) {
  const activity = await getMailKindActivity();
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-xl text-burgundy">Komende 14 dagen</h2>
        <Suspense fallback={<p className="mt-3 text-sm text-wine/50">Laden…</p>}>
          <Upcoming hostname={hostname} />
        </Suspense>
      </section>

      <section>
        <h2 className="font-serif text-xl text-burgundy">Rond een zondag</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border-subtle/80 bg-beige/50 p-4">
          <ol className="flex min-w-max items-stretch gap-2">
            {SUNDAY_FLOW.map((step, i) => {
              const mail = catalogMail(step.kind);
              return (
                <li key={step.kind} className="flex items-stretch gap-2">
                  {i > 0 ? <span aria-hidden className="self-center text-wine/30">→</span> : null}
                  <div className={`w-36 rounded-xl border px-3 py-2.5 ${step.day === 0 ? "border-burgundy/40 bg-cream" : "border-border-subtle bg-cream/70"}`}>
                    <p className="text-xs font-semibold tabular-nums text-burgundy">
                      {step.day === 0 ? "De zondag" : `${step.day > 0 ? "+" : ""}${step.day} ${Math.abs(step.day) === 1 ? "dag" : "dagen"}`}
                    </p>
                    <p className="text-xs text-wine/50">{step.time}</p>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-wine">{mail?.title ?? step.kind}</p>
                    <p className="mt-1 text-xs text-wine/50">{mail?.auto ? "Automatisch" : "Met de hand"}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {MAIL_GOALS.map((goal) => {
        const mails = MAIL_CATALOG.filter((m) => m.goal === goal.id);
        return (
          <section key={goal.id} id={goal.id}>
            <h2 className="font-serif text-xl text-burgundy">{goal.label}</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border-subtle/80 bg-beige/50">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                    <th className="w-[22%] px-4 py-3">Mail</th>
                    <th className="w-[26%] px-4 py-3">Wanneer</th>
                    <th className="w-[13%] px-4 py-3">Hoe</th>
                    <th className="w-[17%] px-4 py-3">Aan</th>
                    <th className="w-[9%] px-4 py-3">Laatst</th>
                    <th className="w-[8%] whitespace-nowrap px-4 py-3 text-right">30 dagen</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {mails.map((mail) => {
                    const seen: KindActivity | undefined = activity.get(mail.kind);
                    const preview = EMAIL_PREVIEW_PATHS[mail.kind];
                    return (
                      <tr key={mail.kind} className="border-b border-border-subtle/50 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-wine">{mail.title}</td>
                        <td className="px-4 py-3 text-wine/75">{mail.when}</td>
                        <td className="px-4 py-3">
                          <How label={mail.auto ? "Automatisch" : "Met de hand"} />
                        </td>
                        <td className="px-4 py-3 text-wine/75">{mail.to}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-wine/75">{seen ? clean(day.format(seen.last)) : "–"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-wine">{seen && seen.last30 > 0 ? seen.last30 : "–"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                          {preview ? (
                            <Link href={adminPath(preview, hostname)} className="text-burgundy hover:underline">
                              Voorbeeld
                            </Link>
                          ) : null}
                          {mail.managePath ? (
                            <Link href={adminPath(mail.managePath, hostname)} className="ml-3 text-burgundy hover:underline">
                              Beheer
                            </Link>
                          ) : null}
                          {seen ? (
                            <Link
                              href={adminPath(`/emails?tab=verstuurd&soort=${encodeURIComponent(mail.kind)}`, hostname)}
                              className="ml-3 text-burgundy hover:underline"
                            >
                              Verstuurd
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

async function Upcoming({ hostname }: { hostname: string }) {
  const rows = await getUpcomingMails();
  if (rows.length === 0) return <p className="mt-3 text-sm text-wine/50">Niets gepland</p>;
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-border-subtle/80 bg-beige/50">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
            <th className="px-4 py-3">Wanneer</th>
            <th className="px-4 py-3">Mail</th>
            <th className="px-4 py-3">Zondag</th>
            <th className="px-4 py-3 text-right">Aantal</th>
            <th className="px-4 py-3">Hoe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const href = row.managePath ? adminPath(row.managePath, hostname) : null;
            return (
              <tr key={i} className="border-b border-border-subtle/50 last:border-b-0">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-wine/75">{clean((row.dayOnly ? day : dayTime).format(row.at))}</td>
                <td className="px-4 py-3 font-medium text-wine">
                  {href ? (
                    <Link href={href} className="hover:text-burgundy hover:underline">
                      {row.title}
                    </Link>
                  ) : (
                    row.title
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-wine/75">
                  {row.sunday ? `${row.sunday.city} · ${clean(day.format(row.sunday.startsAt))}` : "–"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-wine">{row.count ?? "–"}</td>
                <td className="px-4 py-3">
                  <How label={row.how} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
