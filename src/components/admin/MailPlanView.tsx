import Link from "next/link";
import { getDayVolume } from "@/lib/admin/mail-insights";
import { getUpcomingMails, type UpcomingMail } from "@/lib/admin/mail-overview";
import { adminPath } from "@/lib/admin-url";
import { EMAIL_DAY_LIMIT, EMAIL_DAY_WARN } from "@/lib/email/volume";

const amsterdamDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" });
const dayLabel = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

const HOW: Record<UpcomingMail["how"], string> = {
  Automatisch: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
  Ingepland: "bg-sky-50 text-sky-900 ring-sky-200/80",
  "Met de hand": "bg-amber-50 text-amber-900 ring-amber-200/80",
  "Wacht op akkoord": "bg-amber-50 text-amber-900 ring-amber-200/80",
};

/** The coming week as a calendar: what goes out each day, counted against the daily limit. */
export async function MailPlanView({ hostname }: { hostname: string }) {
  const now = new Date();
  const upcoming = await getUpcomingMails(now, 7);
  const volume = await getDayVolume(now);

  const days = volume.map((v) => {
    const items = upcoming.filter((u) => amsterdamDay.format(u.at) === v.day);
    // Planned mails and queued invites are in the day's count already; the rest still has to be made.
    const toCome = items.filter((u) => u.how === "Automatisch" || u.how === "Met de hand").reduce((n, u) => n + (u.count ?? 0), 0);
    return { ...v, items, total: v.sent + v.planned + toCome };
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle/80 bg-beige/50">
      <div className="grid min-w-[980px] grid-cols-7 divide-x divide-border-subtle/70">
        {days.map((d, i) => {
          const over = d.total >= EMAIL_DAY_LIMIT;
          const near = d.total >= EMAIL_DAY_WARN;
          return (
            <section key={d.day} className="flex min-h-[320px] flex-col">
              <h2 className={`border-b border-border-subtle/70 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] ${i === 0 ? "bg-cream text-burgundy" : "bg-cream/60 text-wine/55"}`}>
                {i === 0 ? "Vandaag" : dayLabel.format(new Date(`${d.day}T12:00:00Z`)).replace(/\./g, "")}
              </h2>
              <ul className="flex-1 space-y-3 px-3 py-3">
                {d.items.map((u, j) => {
                  const body = (
                    <>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${HOW[u.how]}`}>{u.count ?? "?"}</span>
                        <span className="text-xs text-wine/50">{u.dayOnly ? u.how : `${time.format(u.at)} · ${u.how}`}</span>
                      </span>
                      <span className="mt-0.5 block text-sm font-medium leading-snug text-wine">{u.title}</span>
                      {u.sunday ? <span className="block text-xs text-wine/55">{u.sunday.city}</span> : null}
                    </>
                  );
                  return (
                    <li key={j}>
                      {u.managePath ? (
                        <Link href={adminPath(u.managePath, hostname)} className="block rounded-lg transition hover:bg-cream/80">
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
                {d.items.length === 0 ? <li className="text-sm text-wine/35">–</li> : null}
              </ul>
              <div className="border-t border-border-subtle/70 px-3 py-2.5">
                <p className={`text-sm tabular-nums ${over ? "font-semibold text-red-700" : near ? "font-semibold text-amber-800" : "text-wine/70"}`}>
                  {d.total} van {EMAIL_DAY_LIMIT}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-wine/10">
                  <div
                    className={`h-full rounded-full ${over ? "bg-red-600" : near ? "bg-amber-500" : "bg-burgundy/70"}`}
                    style={{ width: `${Math.min(100, (d.total / EMAIL_DAY_LIMIT) * 100)}%` }}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
