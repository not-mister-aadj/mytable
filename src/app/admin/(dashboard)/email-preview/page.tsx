import Link from "next/link";
import { headers } from "next/headers";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import {
  EMAIL_PERIODS,
  EMAIL_PREVIEW_PATHS,
  getEmailStats,
  type EmailPeriod,
  type Rate,
} from "@/lib/admin/email-stats";

type Props = { searchParams: Promise<{ periode?: string; mail?: string }> };

const PREVIEWS: Array<[string, string]> = [
  ["/email-preview/booking-confirmation", "Boekingsbevestiging"],
  ["/email-preview/booking-moved", "Boeking verplaatst"],
  ["/email-preview/membership", "Lidmaatschap"],
  ["/email-preview/account-welcome", "Welkom aan tafel"],
  ["/email-preview/sunday-table-confirmation", "Sunday Social bevestiging"],
  ["/email-preview/sunday-table-cancel", "Annulering"],
  ["/email-preview/sunday-table-plus-one", "+1"],
  ["/email-preview/sunday-table-location", "Locatie"],
  ["/email-preview/sunday-table-review", "Review"],
  ["/email-preview/sunday-table-intro-request", "Vragen"],
  ["/email-preview/sunday-table-waitlist-welcome", "Wachtlijst welkom"],
  ["/email-preview/sunday-table-waitlist-invite", "Wachtlijst uitnodiging"],
];

const euro = (cents: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);

const weekLabel = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

function pct(r: Rate | null): number | null {
  return r && r.total > 0 ? r.part / r.total : null;
}

function RateCell({ value, previous, bad = false }: { value: Rate | null; previous?: Rate | null; bad?: boolean }) {
  const now = pct(value);
  if (now === null) return <td className="px-4 py-3 text-right text-wine/35">–</td>;
  const before = pct(previous ?? null);
  const diff = before === null ? null : Math.round((now - before) * 100);
  const better = diff !== null && diff !== 0 && (bad ? diff < 0 : diff > 0);
  return (
    <td className="px-4 py-3 text-right tabular-nums">
      <span className={bad && value!.part > 0 ? "font-medium text-red-700" : "font-medium text-wine"}>{Math.round(now * 100)}%</span>
      {diff !== null && diff !== 0 ? (
        <span className={`ml-1 text-xs ${better ? "text-emerald-700" : "text-red-700"}`}>
          {diff > 0 ? "▲" : "▼"}
          {Math.abs(diff)}
        </span>
      ) : null}
      <span className="block text-[11px] text-wine/45">
        {value!.part} van {value!.total}
      </span>
    </td>
  );
}

export default async function EmailTemplatesPage({ searchParams }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const params = await searchParams;
  const period: EmailPeriod = EMAIL_PERIODS.some((p) => p.id === params.periode) ? (params.periode as EmailPeriod) : "30";
  const detail = params.mail?.trim() || null;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();
  const href = (p: EmailPeriod, mail: string | null) => {
    const q = new URLSearchParams();
    if (p !== "30") q.set("periode", p);
    if (mail) q.set("mail", mail);
    const s = q.toString();
    return adminPath(`/email-preview${s ? `?${s}` : ""}`, hostname);
  };

  const stats = await getEmailStats(period, detail);
  const detailStats = detail ? stats.kinds.find((k) => k.kind === detail) : null;
  const maxSent = Math.max(1, ...(stats.weeks ?? []).map((w) => w.sent));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-burgundy">E-mailtemplates</h1>
        <nav className="flex gap-1 rounded-full border border-border-subtle bg-cream p-1 text-sm">
          {EMAIL_PERIODS.map((p) => (
            <Link
              key={p.id}
              href={href(p.id, detail)}
              className={`rounded-full px-3 py-1 ${p.id === period ? "bg-burgundy text-cream" : "text-wine/70 hover:text-burgundy"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border-subtle/80 bg-beige/50">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
              <th className="px-4 py-3 text-left">Mail</th>
              <th className="px-4 py-3 text-right">Verstuurd</th>
              <th className="px-4 py-3 text-right">Geopend</th>
              <th className="px-4 py-3 text-right">Geklikt</th>
              <th className="px-4 py-3 text-right">Geboekt</th>
              <th className="px-4 py-3 text-right">Omzet</th>
              <th className="px-4 py-3 text-right">Spam</th>
              <th className="px-4 py-3 text-right">Bounce</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {stats.kinds.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-wine/50">
                  Geen mails in deze periode
                </td>
              </tr>
            ) : null}
            {stats.kinds.map((k) => (
              <tr
                key={k.kind}
                className={`border-b border-border-subtle/50 ${k.kind === detail ? "bg-cream" : "hover:bg-cream/60"}`}
              >
                <td className="px-4 py-3">
                  <Link href={href(period, k.kind === detail ? null : k.kind)} className="font-medium text-wine hover:text-burgundy">
                    {k.kind}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-wine">{k.sent}</td>
                <RateCell value={k.opened} previous={k.previous.opened} />
                <RateCell value={k.clicked} previous={k.previous.clicked} />
                <RateCell value={k.booked} previous={k.previous.booked} />
                <td className="px-4 py-3 text-right tabular-nums text-wine">{k.revenueCents > 0 ? euro(k.revenueCents) : "–"}</td>
                <RateCell value={k.spam} bad />
                <RateCell value={k.bounce} bad />
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                  {EMAIL_PREVIEW_PATHS[k.kind] ? (
                    <Link href={adminPath(EMAIL_PREVIEW_PATHS[k.kind]!, hostname)} className="text-burgundy hover:underline">
                      Voorbeeld
                    </Link>
                  ) : null}
                  <Link
                    href={adminPath(`/emails?soort=${encodeURIComponent(k.kind)}`, hostname)}
                    className="ml-3 text-burgundy hover:underline"
                  >
                    Mails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && detailStats && stats.weeks ? (
        <section className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-5">
          <h2 className="font-serif text-xl text-burgundy">{detail} per week</h2>
          <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-max items-end gap-3">
              {stats.weeks.map((w) => (
                <div key={w.week} className="w-28 text-center text-xs">
                  <div className="flex h-28 items-end justify-center">
                    <div
                      className="w-8 rounded-t bg-burgundy/70"
                      style={{ height: `${(w.sent / maxSent) * 100}%`, minHeight: 2 }}
                      title={`${w.sent} verstuurd`}
                    />
                  </div>
                  <p className="mt-1 font-medium tabular-nums text-wine">{w.sent}</p>
                  <p className="text-wine/45">{weekLabel(w.week)}</p>
                  <dl className="mt-2 space-y-0.5 tabular-nums text-wine/70">
                    {(
                      [
                        ["Geopend", pct(w.opened) === null ? "–" : `${Math.round(pct(w.opened)! * 100)}%`],
                        ["Geklikt", pct(w.clicked) === null ? "–" : `${Math.round(pct(w.clicked)! * 100)}%`],
                        ["Geboekt", String(w.booked.part)],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-1">
                        <dt className="text-wine/45">{label}</dt>
                        <dd className="font-medium text-wine">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border-subtle/70 pt-4 text-xs text-wine/50">
        <span>Voorbeelden:</span>
        {PREVIEWS.map(([path, label]) => (
          <Link key={path} href={adminPath(path, hostname)} className="text-burgundy hover:underline">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
