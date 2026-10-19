import Link from "next/link";
import { headers } from "next/headers";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { getInvitesDashboard, type InviteRow } from "@/lib/admin/invites-data";
import { InviteModeSwitch } from "@/components/admin/InviteModeSwitch";
import { InviteQueue } from "@/components/admin/InviteQueue";
import { approveToday, saveInviteSettingsForm, startInvites, togglePause } from "./actions";

type Props = { searchParams: Promise<{ tab?: string }> };

const TABS = [
  ["wachtrij", "Wachtrij"],
  ["verstuurd", "Verstuurd"],
  ["events", "Per event"],
  ["mensen", "Mensen"],
  ["log", "Log"],
  ["instellingen", "Instellingen"],
] as const;

const KIND: Record<string, string> = { invite: "Uitnodiging", nudge: "Herinnering", checkin: "Nog interesse?" };

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
    : "–";

const card = "rounded-2xl border border-border-subtle/80 bg-beige/50";
const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.06em] text-wine/50";
const td = "px-4 py-3 align-top";

function Preview({ row }: { row: InviteRow }) {
  if (!row.body) return null;
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs text-burgundy">Voorbeeld</summary>
      <div className="mt-2 max-w-xl rounded-xl border border-border-subtle bg-white p-3 text-xs">
        <p className="font-semibold text-wine">{row.subject}</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-wine/80">{row.body}</pre>
      </div>
    </details>
  );
}

function Status({ row }: { row: InviteRow }) {
  if (row.status === "sent") {
    const label = row.booked ? "Geboekt" : row.clicked ? "Geklikt" : "Verstuurd";
    const tone = row.booked ? "bg-emerald-100 text-emerald-900" : row.clicked ? "bg-emerald-50 text-emerald-800" : "bg-cream text-wine/70";
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
  }
  if (row.status === "skipped") return <span className="text-xs text-wine/45">Overgeslagen: {row.skipReason}</span>;
  if (row.status === "failed") return <span className="text-xs text-red-700">Mislukt: {row.skipReason}</span>;
  return <span className="text-xs text-wine/60">{row.status === "approved" ? "Goedgekeurd" : "Wacht"}</span>;
}

const RUN_STATUS: Record<string, string> = { sent: "verstuurd", skipped: "overgeslagen", failed: "mislukt", invite: "uitnodiging", nudge: "herinnering", checkin: "nog interesse?" };

function CapBar({ sent, cap }: { sent: number; cap: number }) {
  const pct = cap ? Math.min(100, Math.round((sent / cap) * 100)) : 0;
  const tone = pct >= 90 ? "bg-red-600" : pct >= 75 ? "bg-amber-500" : "bg-emerald-600";
  return (
    <div className="mt-2 w-64">
      <div className="flex justify-between text-xs text-wine/55">
        <span>Vandaag verstuurd</span>
        <span className="tabular-nums">
          {sent} / {cap}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function InvitesPage({ searchParams }: Props) {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;
  const tab = (await searchParams).tab ?? "wachtrij";
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();
  const d = await getInvitesDashboard();
  const s = d.settings;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-burgundy">Uitnodigingen</h1>
          <p className="mt-1 text-sm text-wine/60">
            {!s.enabled ? "Uit" : s.paused ? "Gepauzeerd" : "Aan"} · {d.plannedToday} gepland vandaag
            {d.dueNow > 0 && !s.paused ? ` · ${d.dueNow} gaan nu uit` : ""}
          </p>
          {s.paused && s.pausedReason ? <p className="mt-1 text-sm text-red-700">Vanzelf gepauzeerd: {s.pausedReason}</p> : null}
          <CapBar sent={d.sentToday} cap={d.cap} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InviteModeSwitch mode={s.mode} dueNow={d.dueIfAuto} enabled={s.enabled} />
          {!s.enabled ? (
            <form action={startInvites}>
              <button className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream">Start</button>
            </form>
          ) : (
            <>
              {d.approval && d.waitingApprovalToday > 0 ? (
                <form action={approveToday}>
                  <button className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream">
                    Keur de {d.waitingApprovalToday} mails van vandaag goed
                  </button>
                </form>
              ) : null}
              <form action={togglePause}>
                <button className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm text-wine">
                  {s.paused ? "▶ Hervatten" : "⏸ Alles pauzeren"}
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border-subtle text-sm">
        {TABS.map(([id, label]) => (
          <Link
            key={id}
            href={adminPath(`/invites?tab=${id}`, hostname)}
            className={`-mb-px border-b-2 px-3 py-2 ${tab === id ? "border-burgundy text-burgundy" : "border-transparent text-wine/60 hover:text-burgundy"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "wachtrij" ? <InviteQueue rows={d.queue} approval={d.approval} now={d.now} /> : null}

      {tab === "verstuurd" ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 bg-cream/60">
                <th className={th}>Verstuurd</th>
                <th className={th}>Wie</th>
                <th className={th}>Soort</th>
                <th className={th}>Events</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.sent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-wine/50">
                    Nog niets verstuurd
                  </td>
                </tr>
              ) : null}
              {d.sent.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle/50">
                  <td className={`${td} whitespace-nowrap text-wine/70`}>{when(r.sentAt ?? r.scheduledFor)}</td>
                  <td className={td}>
                    <p className="font-medium text-wine">{r.name ?? r.email}</p>
                    <p className="text-xs text-wine/50">{r.email}</p>
                    <Preview row={r} />
                  </td>
                  <td className={`${td} text-wine/70`}>{KIND[r.kind]}</td>
                  <td className={`${td} text-wine/70`}>{r.events.join(" · ") || "–"}</td>
                  <td className={td}>
                    <Status row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "events" ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 bg-cream/60">
                <th className={th}>Event</th>
                <th className={`${th} text-right`}>Uitgenodigd</th>
                <th className={`${th} text-right`}>Geklikt</th>
                <th className={`${th} text-right`}>Geboekt</th>
              </tr>
            </thead>
            <tbody>
              {d.perEvent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-wine/50">
                    Nog geen uitnodigingen verstuurd
                  </td>
                </tr>
              ) : null}
              {d.perEvent.map((e) => (
                <tr key={e.label} className="border-b border-border-subtle/50">
                  <td className={`${td} font-medium text-wine`}>{e.label}</td>
                  <td className={`${td} text-right tabular-nums`}>{e.invited}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {e.clicked} <span className="text-xs text-wine/45">{e.invited ? Math.round((e.clicked / e.invited) * 100) : 0}%</span>
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {e.booked} <span className="text-xs text-wine/45">{e.invited ? Math.round((e.booked / e.invited) * 100) : 0}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "mensen" ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 bg-cream/60">
                <th className={th}>Wie</th>
                <th className={th}>Steden</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Genegeerd op rij</th>
                <th className={th}>Laatste klik</th>
                <th className={th}>Laatste boeking</th>
                <th className={th}>Volgende mail</th>
              </tr>
            </thead>
            <tbody>
              {d.people.map((p) => (
                <tr key={p.email} className="border-b border-border-subtle/50">
                  <td className={td}>
                    <p className="font-medium text-wine">{p.name ?? "–"}</p>
                    <p className="text-xs text-wine/50">{p.email}</p>
                  </td>
                  <td className={`${td} text-wine/70`}>{p.cities.join(", ") || "–"}</td>
                  <td className={`${td} text-wine/70`}>{p.status}</td>
                  <td className={`${td} text-right tabular-nums`}>{p.ignored}</td>
                  <td className={`${td} text-wine/70`}>{when(p.lastClick)}</td>
                  <td className={`${td} text-wine/70`}>{when(p.lastBooking)}</td>
                  <td className={`${td} text-wine/70`}>{when(p.next)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "log" ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 bg-cream/60">
                <th className={th}>Wanneer</th>
                <th className={th}>Ronde</th>
                <th className={`${th} text-right`}>Gepland</th>
                <th className={`${th} text-right`}>Verstuurd</th>
                <th className={`${th} text-right`}>Overgeslagen</th>
                <th className={`${th} text-right`}>Mislukt</th>
              </tr>
            </thead>
            <tbody>
              {d.runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-wine/50">
                    Nog geen rondes
                  </td>
                </tr>
              ) : null}
              {d.runs.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle/50">
                  <td className={`${td} whitespace-nowrap text-wine/70`}>{when(r.startedAt)}</td>
                  <td className={td}>
                    <p className="text-wine">
                      {r.kind === "plan" ? "Plannen" : "Versturen"}
                      {r.dryRun ? <span className="ml-1.5 text-xs text-wine/45">proef</span> : null}
                    </p>
                    {r.error ? <p className="text-xs text-red-700">{r.error}</p> : null}
                    {r.details.length > 0 ? (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-burgundy">{r.details.length} mails</summary>
                        <ul className="mt-2 space-y-0.5 text-xs text-wine/70">
                          {r.details.map((x, i) => (
                            <li key={i}>
                              {x.email} · {RUN_STATUS[x.status] ?? x.status}
                              {x.reason ? `: ${x.reason}` : ""}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{r.planned || "–"}</td>
                  <td className={`${td} text-right tabular-nums`}>{r.sent || "–"}</td>
                  <td className={`${td} text-right tabular-nums`}>{r.skipped || "–"}</td>
                  <td className={`${td} text-right tabular-nums ${r.failed ? "text-red-700" : ""}`}>{r.failed || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "instellingen" ? (
        <form action={saveInviteSettingsForm} className={`${card} max-w-lg space-y-4 p-5 text-sm`}>
          <label className="flex items-center justify-between gap-4">
            <span className="text-wine">Maximum per dag bij de start</span>
            <input name="capStart" type="number" min={1} defaultValue={s.capStart} className="w-24 rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-right" />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-wine">Erbij per week</span>
            <input name="capGrowthPerWeek" type="number" min={0} defaultValue={s.capGrowthPerWeek} className="w-24 rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-right" />
          </label>
          <p className="text-xs text-wine/50">Vandaag: maximaal {d.cap}. Verzendvenster 08:00 tot 21:30. Minder vaak na 3 genegeerd, laatste vraag na 5.</p>
          <button className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream">Opslaan</button>
        </form>
      ) : null}

      <p className="text-xs text-wine/45">
        Laatste 7 dagen: {d.health.sent7} verstuurd · {d.health.bounced7} bounce · {d.health.spam7} spam
      </p>
    </div>
  );
}
