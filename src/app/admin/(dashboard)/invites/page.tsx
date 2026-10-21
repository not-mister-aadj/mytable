import Link from "next/link";
import { headers } from "next/headers";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { getInvitesDashboard, type InviteRow } from "@/lib/admin/invites-data";
import { InviteModeSwitch } from "@/components/admin/InviteModeSwitch";
import { InviteQueue } from "@/components/admin/InviteQueue";
import { InviteRulesInfo, type InviteRulesSection } from "@/components/admin/InviteRulesInfo";
import { EARLY_ACCESS_HOURS } from "@/lib/membership/logic";
import { MIN_DAYS_BEFORE, NEW_SIGNUP_WAIT_DAYS, NUDGE_AFTER_DAYS, NUDGE_UNTIL_DAYS, PLAN_DAYS } from "@/lib/invites/engine";
import {
  CHECKIN_AFTER,
  CHECKIN_WAIT_DAYS,
  ENGAGE_DAYS,
  INVITE_LEAD_DAYS,
  SEATS_LEFT_SHOWN,
  SEND_WINDOW,
  SLOW_AFTER,
} from "@/lib/invites/logic";
import { approveToday, saveInviteSettingsForm, settleUncertainInvite, startInvites, togglePause } from "./actions";

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

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Every rule, read from the same constants the planner and sender use. */
type PeopleCounts = { total: number; never: number; once: number; twice: number; slow: number; checkin: number; stopped: number; unsubscribed: number; bounced: number };

/** How many people are at each step, from the Mensen list. */
function peopleCounts(people: Array<{ status: string; ignored: number }>): PeopleCounts {
  const c: PeopleCounts = { total: people.length, never: 0, once: 0, twice: 0, slow: 0, checkin: 0, stopped: 0, unsubscribed: 0, bounced: 0 };
  for (const p of people) {
    if (p.status === "Afgemeld") c.unsubscribed++;
    else if (p.status === "Bounce/spam") c.bounced++;
    else if (p.status === "Gestopt") c.stopped++;
    else if (p.status === "Slapend") c.checkin++;
    else if (p.status === "Afwachtend") c.slow++;
    else if (p.ignored >= 2) c.twice++;
    else if (p.ignored === 1) c.once++;
    else c.never++;
  }
  return c;
}

const n = (count: number) => (count === 1 ? "1 persoon" : `${count} mensen`);

function rulesSections(capStart: number, capGrowth: number, capToday: number, c: PeopleCounts): InviteRulesSection[] {
  return [
    {
      title: "Hoe vaak",
      lines: [
        "Hoogstens 1 uitnodiging per 30 dagen per persoon.",
        "Meer dan 2 steden: hoogstens 2 per maand, minstens 10 dagen ertussen.",
        "Met de hand verstuurde uitnodigingen tellen mee.",
        `De eerste uitnodiging pas ${NEW_SIGNUP_WAIT_DAYS} dagen na de eerste aanmelding.`,
      ],
    },
    {
      title: "Minder na geen reactie",
      lines: [
        `Genegeerd = geen klik en geen boeking binnen ${ENGAGE_DAYS} dagen.`,
        `Klik of boeking: teller terug naar 0. Nu nooit genegeerd: ${n(c.never)}.`,
        `1 of 2 keer op rij genegeerd: gewoon ritme. Nu: ${n(c.once)} 1 keer, ${n(c.twice)} 2 keer.`,
        `${SLOW_AFTER} keer op rij genegeerd: hoogstens 1 per 60 dagen. Nu: ${n(c.slow)}.`,
        `${CHECKIN_AFTER} keer op rij genegeerd: één mail "Nog interesse?". Nu: ${n(c.checkin)}.`,
        `Daarop binnen ${CHECKIN_WAIT_DAYS} dagen geen klik: gestopt, tot ze zelf weer iets doen. Nu: ${n(c.stopped)}.`,
      ],
    },
    {
      title: "Zelf gekozen",
      lines: [
        "Link onderaan elke mail: per stad Elke keer, Minder vaak of Niet.",
        "Minder vaak = hoogstens 1 per 60 dagen (als alle steden op Minder vaak staan).",
        `Niet = geen uitnodigingen voor die stad. Afmelden in Gmail zet alle steden op Niet. Nu overal Niet: ${n(c.unsubscribed)}.`,
        "Steden toevoegen kan op dezelfde pagina.",
      ],
    },
    {
      title: "Herinnering na een klik",
      lines: [`Klik zonder boeking: ${NUDGE_AFTER_DAYS} dagen later één herinnering voor die zondag, tot ${NUDGE_UNTIL_DAYS} dagen na de klik.`],
    },
    {
      title: "Wie",
      lines: [
        "Iedereen die zich ergens aanmeldde: wachtlijst, ticket, \"laat het me weten\", quiz, account.",
        `Niet: testadressen, bounce of spam (${n(c.bounced)}), wie overal Niet koos.`,
        `Nu op de lijst met een stad: ${n(c.total)}.`,
        "Een event valt af als ze het al boekten, al voor dat event zijn uitgenodigd of niet in de leeftijdsgroep passen (alleen als hun leeftijd bekend is).",
      ],
    },
    {
      title: "Welke zondagen",
      lines: [
        `Vanaf ${INVITE_LEAD_DAYS / 7} weken voor de zondag, nooit voordat het event opengaat. Leden ${EARLY_ACCESS_HOURS} uur eerder.`,
        `Minstens ${MIN_DAYS_BEFORE} dagen voor de zondag, alleen met plekken vrij.`,
        "Meerdere zondagen in één mail, de eerste bovenaan.",
      ],
    },
    {
      title: "Wanneer",
      lines: [
        "Op de weekdag en rond het tijdstip waarop iemand zich aanmeldde, met een paar minuten variatie.",
        `Alleen tussen ${clock(SEND_WINDOW.start)} en ${clock(SEND_WINDOW.end)}, nooit op feestdagen (ook Goede Vrijdag, 24 en 31 december).`,
        `Elke ochtend om 06:00 wordt de wachtrij voor de komende ${PLAN_DAYS} dagen gemaakt.`,
        "Handmatig: alleen goedgekeurde mails gaan uit. Niet goedgekeurd: vervalt 20 uur na het tijdstip, volgende ochtend opnieuw gepland.",
        "Automatisch: elke mail gaat op zijn tijdstip uit.",
      ],
    },
    {
      title: "Inhoud",
      lines: [
        "Platte tekst van Het MyTable-team <hallo@tafels.mytable.club>, antwoorden naar info@mytable.club.",
        "Eerste zin uit wat ze zoeken (wachtlijst of quiz); wie alleen komt krijgt \"Veel mensen schuiven alleen aan\".",
        `"Nog X plekken" vanaf ${SEATS_LEFT_SHOWN} over. Anders "Loopt snel vol" bij meer dan de helft verkocht of een uitverkochte vorige editie. Anders niets.`,
        "Geen namen van bars.",
      ],
    },
    {
      title: "Grenzen en veiligheid",
      lines: [
        `Hoogstens ${capToday} mails vandaag (start ${capStart}, +${capGrowth} per week).`,
        "Per persoon hoogstens één open mail, en nooit een uitnodiging als ze in de laatste 3 dagen al een kregen.",
        "Elke mail wordt maar één keer verstuurd. Een mislukte mail pauzeert alles en mailt het team.",
      ],
    },
  ];
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
  const counts = peopleCounts(d.people);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl text-burgundy">Uitnodigingen</h1>
            <InviteRulesInfo sections={rulesSections(s.capStart, s.capGrowthPerWeek, d.cap, counts)} />
          </div>
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

      {d.uncertain.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm">
          <p className="font-medium text-red-800">Onzeker of verstuurd</p>
          <ul className="mt-2 space-y-2">
            {d.uncertain.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="font-medium text-wine">{r.name ?? r.email}</span>{" "}
                  <span className="text-xs text-wine/55">
                    {r.email} · {when(r.claimedAt)}
                    {r.skipReason ? ` · ${r.skipReason}` : ""}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={settleUncertainInvite}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="sent" value="1" />
                    <button className="rounded-full border border-border-subtle bg-cream px-3 py-1 text-xs text-wine">Verstuurd</button>
                  </form>
                  <form action={settleUncertainInvite}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="sent" value="0" />
                    <button className="rounded-full border border-border-subtle bg-cream px-3 py-1 text-xs text-wine">Niet verstuurd</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
                <th className={th}>Wanneer</th>
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
                  <td className={`${td} whitespace-nowrap text-wine/70`}>{when(r.handledAt)}</td>
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
        <>
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              ["Nooit genegeerd", counts.never],
              ["1 keer", counts.once],
              ["2 keer", counts.twice],
              ["Afwachtend", counts.slow],
              ["Slapend", counts.checkin],
              ["Gestopt", counts.stopped],
              ["Afgemeld", counts.unsubscribed],
              ["Bounce/spam", counts.bounced],
            ] as const
          ).map(([label, value]) => (
            <span key={label} className="rounded-full border border-border-subtle bg-cream px-3 py-1 text-wine/70">
              {label} <span className="font-semibold tabular-nums text-wine">{value}</span>
            </span>
          ))}
        </div>
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
        </>
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
