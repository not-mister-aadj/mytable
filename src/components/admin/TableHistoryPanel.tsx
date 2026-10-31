import Link from "next/link";
import { adminPath } from "@/lib/admin-url";
import { inbound, type Link as PersonLink, type TableHistory } from "@/lib/admin/table-history";

const MOOD: Record<string, { label: string; dot: string }> = {
  great: { label: "Geweldig", dot: "bg-[#1f9d55]" },
  good: { label: "Leuk", dot: "bg-[#8cc795]" },
  meh: { label: "Matig", dot: "bg-[#e9a2a2]" },
  bad: { label: "Niet leuk", dot: "bg-[#d64550]" },
};
const VENUE_LABEL: Record<string, string> = { great: "Hier wil ik terug", good: "Fijne plek", meh: "Gaat wel", bad: "Niet mijn plek" };
const SCORE = { great: 4, good: 3, meh: 2, bad: 1 } as const;

const day = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date(iso));

function MoodDot({ mood, venue }: { mood: string | null; venue?: boolean }) {
  if (!mood) return <span className="text-wine/35">-</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${MOOD[mood]?.dot ?? "bg-wine/30"}`} />
      {(venue ? VENUE_LABEL[mood] : MOOD[mood]?.label) ?? mood}
    </span>
  );
}

/** One person at the table: where they were, what they thought, who they
 * want to see again, who wants them, and who they reported. */
export function TableHistoryPanel({ history, email }: { history: TableHistory; email: string }) {
  const k = email.trim().toLowerCase();
  const p = history.get(k);
  const { wantedBy, reportedBy } = inbound(history, k);
  const visits = (p?.visits ?? []).filter((v) => new Date(v.startsAt).getTime() < Date.now());
  const came = visits.filter((v) => !v.noShow);
  const moods = came.map((v) => v.mood).filter((m): m is keyof typeof SCORE => Boolean(m));
  const avg = moods.length ? moods.reduce((n, m) => n + SCORE[m], 0) / moods.length : null;
  const wantsBack = new Set(wantedBy.map((w) => w.email));
  const uniq = (links: PersonLink[]) => [...new Map(links.map((l) => [l.email, l])).values()];
  const wants = uniq(p?.wants ?? []);
  const reported = uniq(p?.reported ?? []);
  const by = uniq(wantedBy);
  const reportedByU = uniq(reportedBy);

  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">Aan tafel</h2>
        <p className="text-sm text-wine/70">
          {came.length === 0 ? "Nog niet geweest" : `${came.length}× geweest`}
          {avg !== null ? ` · gezelschap gem. ${avg.toFixed(1)}/4` : ""}
          {visits.length > came.length ? ` · ${visits.length - came.length}× niet gekomen` : ""}
        </p>
      </div>

      {reportedByU.length > 0 ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800 ring-1 ring-red-200">
          Gemeld door {reportedByU.map((r) => `${r.name} (${day(r.at)})`).join(", ")}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <People title="Wil terugzien" links={wants} mark={(l) => (wantsBack.has(l.email) ? "✓ wederzijds" : null)} />
        <People title="Wordt teruggezien door" links={by} />
        <People title="Gemeld door deze persoon" links={reported} tone="red" />
      </div>

      {visits.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 text-xs uppercase tracking-[0.06em] text-wine/50">
                <th className="py-2 pr-4">Zondag</th>
                <th className="py-2 pr-4">Bar</th>
                <th className="py-2 pr-4">Gezelschap</th>
                <th className="py-2">Bar-oordeel</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.bookingId} className="border-b border-border-subtle/40 last:border-0">
                  <td className="py-2 pr-4">
                    <Link href={adminPath(`/events/${v.eventId}/guests?tab=feedback`)} className="text-wine hover:text-burgundy hover:underline">
                      {v.city} {day(v.startsAt)}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-wine/75">
                    {v.venue ?? "-"}
                    {v.group !== null ? <span className="text-wine/45"> · groep {v.group}</span> : null}
                  </td>
                  <td className="py-2 pr-4">{v.noShow ? <span className="text-red-800">Niet gekomen</span> : <MoodDot mood={v.mood} />}</td>
                  <td className="py-2">{v.noShow ? null : <MoodDot mood={v.venueMood} venue />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function People({ title, links, mark, tone }: { title: string; links: PersonLink[]; mark?: (l: PersonLink) => string | null; tone?: "red" }) {
  return (
    <div>
      <p className={`text-xs font-medium uppercase tracking-[0.08em] ${tone === "red" && links.length ? "text-red-800" : "text-wine/45"}`}>{title}</p>
      {links.length === 0 ? (
        <p className="mt-1 text-sm text-wine/35">-</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-sm">
          {links.map((l) => (
            <li key={l.email} className={tone === "red" ? "text-red-800" : "text-wine"}>
              {l.name}
              {mark?.(l) ? <span className="ml-1 text-xs font-semibold text-emerald-700">{mark(l)}</span> : null}
              <span className="text-xs text-wine/45"> · {day(l.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
