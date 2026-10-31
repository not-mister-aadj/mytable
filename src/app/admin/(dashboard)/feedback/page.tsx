import Link from "next/link";
import { isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { loadFeedbackOverview, type FeedbackListRow, type FeedbackPeriod, type Score } from "@/lib/admin/feedback-overview";

type Props = { searchParams: Promise<{ periode?: string; stad?: string }> };

const PERIODS: { id: FeedbackPeriod; label: string }[] = [
  { id: "30", label: "30 dagen" },
  { id: "90", label: "90 dagen" },
  { id: "all", label: "Alles" },
];

const MOOD: Record<string, { label: string; dot: string }> = {
  great: { label: "Geweldig", dot: "bg-[#1f9d55]" },
  good: { label: "Leuk", dot: "bg-[#8cc795]" },
  meh: { label: "Matig", dot: "bg-[#e9a2a2]" },
  bad: { label: "Niet leuk", dot: "bg-[#d64550]" },
};

const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "-");

function filterHref(periode: FeedbackPeriod, stad: string | null) {
  const q = new URLSearchParams();
  if (periode !== "90") q.set("periode", periode);
  if (stad) q.set("stad", stad);
  const s = q.toString();
  return adminPath(`/feedback${s ? `?${s}` : ""}`);
}

/** How we score after a Sunday: in total, per city, per bar, and every answer. */
export default async function AdminFeedbackPage({ searchParams }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;
  const sp = await searchParams;
  const periode: FeedbackPeriod = sp.periode === "30" || sp.periode === "all" ? sp.periode : "90";
  const stad = sp.stad?.trim() || null;
  const data = await loadFeedbackOverview(periode, stad);
  const t = data.total;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-burgundy">Feedback</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          {PERIODS.map((p) => (
            <Pill key={p.id} href={filterHref(p.id, stad)} on={p.id === periode}>
              {p.label}
            </Pill>
          ))}
          <span className="w-2" />
          <Pill href={filterHref(periode, null)} on={!stad}>
            Alle steden
          </Pill>
          {data.cities.map((c) => (
            <Pill key={c} href={filterHref(periode, c)} on={c === stad}>
              {c}
            </Pill>
          ))}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Respons" value={pct(t.answered, t.mailed)} hint={`${t.answered} van ${t.mailed}`} />
        <Kpi
          label="Gezelschap"
          value={pct(t.tableGood, t.answered)}
          hint={t.tableAvg !== null ? `Geweldig of leuk · gem. ${t.tableAvg.toFixed(1)}/4` : "Geweldig of leuk"}
        />
        <Kpi label="Bar" value={pct(t.venueGood, t.venueAnswered)} hint="Hier wil ik terug of fijne plek" />
        <Kpi label="Klik" value={pct(t.picked, t.answered)} hint={`${t.mutual} wederzijds`} />
        <Kpi label="Komt terug" value={pct(t.rebooked, t.rebookBase)} hint={`Boekt binnen 60 dagen · ${t.rebooked} van ${t.rebookBase}`} />
        <Kpi label="Meldingen" value={String(t.reports)} alert={t.reports > 0} />
      </section>

      <ScoreTable title="Per stad" first="Stad" rows={data.perCity.map((s) => ({ key: s.city, label: s.city, ...s }))} />
      <ScoreTable
        title="Per bar"
        first="Bar"
        rows={data.perVenue.map((s) => ({ key: `${s.venue}|${s.city}`, label: s.venue, sub: s.city, ...s }))}
      />

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">Alle antwoorden · {data.rows.length}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border-subtle bg-beige/60">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-[0.06em] text-wine/50">
                <th className="px-4 py-2.5">Zondag</th>
                <th className="px-4 py-2.5">Gast</th>
                <th className="px-4 py-2.5">Gezelschap</th>
                <th className="px-4 py-2.5">Bar</th>
                <th className="px-4 py-2.5">Wil terugzien</th>
                <th className="px-4 py-2.5">Leuk</th>
                <th className="px-4 py-2.5">Kan beter</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <AnswerRow key={r.bookingId} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Pill({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 ${on ? "bg-burgundy text-cream" : "border border-border-subtle bg-cream text-wine hover:border-burgundy/30"}`}
    >
      {children}
    </Link>
  );
}

function Kpi({ label, value, hint, alert }: { label: string; value: string; hint?: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "border-red-200 bg-red-50" : "border-border-subtle bg-beige/60"}`}>
      <p className={`text-xs font-medium uppercase tracking-[0.08em] ${alert ? "text-red-800" : "text-wine/45"}`}>{label}</p>
      <p className={`mt-1 font-serif text-3xl ${alert ? "text-red-800" : "text-burgundy"}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-wine/55">{hint}</p> : null}
    </div>
  );
}

function ScoreTable({ title, first, rows }: { title: string; first: string; rows: (Score & { key: string; label: string; sub?: string })[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border-subtle bg-beige/60">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-xs uppercase tracking-[0.06em] text-wine/50">
              <th className="px-4 py-2.5">{first}</th>
              <th className="px-4 py-2.5 text-right">Zondagen</th>
              <th className="px-4 py-2.5 text-right">Gasten</th>
              <th className="px-4 py-2.5 text-right">Respons</th>
              <th className="px-4 py-2.5 text-right">Gezelschap</th>
              <th className="px-4 py-2.5 text-right">Bar</th>
              <th className="px-4 py-2.5 text-right">Klik</th>
              <th className="px-4 py-2.5 text-right">Komt terug</th>
              <th className="px-4 py-2.5 text-right">Meldingen</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((s) => (
              <tr key={s.key} className="border-b border-border-subtle/50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-wine">
                  {s.label}
                  {s.sub ? <span className="font-normal text-wine/50"> · {s.sub}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-right text-wine/70">{s.sundays}</td>
                <td className="px-4 py-2.5 text-right text-wine/70">{s.guests}</td>
                <td className="px-4 py-2.5 text-right">{pct(s.answered, s.mailed)}</td>
                <td className="px-4 py-2.5 text-right">
                  {pct(s.tableGood, s.answered)}
                  {s.tableAvg !== null ? <span className="text-wine/45"> · {s.tableAvg.toFixed(1)}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-right">{pct(s.venueGood, s.venueAnswered)}</td>
                <td className="px-4 py-2.5 text-right">{pct(s.picked, s.answered)}</td>
                <td className="px-4 py-2.5 text-right">{pct(s.rebooked, s.rebookBase)}</td>
                <td className={`px-4 py-2.5 text-right ${s.reports > 0 ? "font-semibold text-red-800" : "text-wine/40"}`}>{s.reports}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Mood({ mood }: { mood: string | null }) {
  if (!mood) return <span className="text-wine/35">-</span>;
  const m = MOOD[mood];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${m?.dot ?? "bg-wine/30"}`} />
      {m?.label ?? mood}
    </span>
  );
}

function AnswerRow({ r }: { r: FeedbackListRow }) {
  const day = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(r.startsAt));
  return (
    <tr className="border-b border-border-subtle/50 align-top last:border-0">
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={adminPath(`/events/${r.eventId}/guests?tab=feedback`)} className="text-wine hover:text-burgundy hover:underline">
          {r.city} {day}
        </Link>
        <p className="text-xs text-wine/50">
          {r.venue ?? "-"}
          {r.group !== null ? ` · groep ${r.group}` : ""}
        </p>
      </td>
      <td className="px-4 py-3">
        {r.customerId ? (
          <Link href={adminPath(`/customers/${r.customerId}`)} className="font-medium text-wine hover:text-burgundy hover:underline">
            {r.name}
          </Link>
        ) : (
          <span className="font-medium text-wine">{r.name}</span>
        )}
        {r.reported ? <p className="mt-0.5 text-xs font-semibold text-red-800">Melding</p> : null}
      </td>
      <td className="px-4 py-3">
        <Mood mood={r.mood} />
      </td>
      <td className="px-4 py-3">
        <Mood mood={r.venueMood} />
      </td>
      <td className="px-4 py-3 text-wine/80">{r.wants.length ? r.wants.join(", ") : <span className="text-wine/35">-</span>}</td>
      <td className="max-w-[260px] px-4 py-3 text-wine/80">
        {r.liked.join(", ")}
        {r.highlight ? <p className="mt-1 text-xs italic text-wine/65">&ldquo;{r.highlight}&rdquo;</p> : null}
        {!r.liked.length && !r.highlight ? <span className="text-wine/35">-</span> : null}
      </td>
      <td className="max-w-[260px] px-4 py-3 text-wine/80">
        {r.disliked.join(", ")}
        {r.improve ? <p className="mt-1 text-xs italic text-wine/65">&ldquo;{r.improve}&rdquo;</p> : null}
        {!r.disliked.length && !r.improve ? <span className="text-wine/35">-</span> : null}
      </td>
    </tr>
  );
}
