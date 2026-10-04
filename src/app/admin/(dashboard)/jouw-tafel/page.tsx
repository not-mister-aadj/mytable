import Link from "next/link";
import { headers } from "next/headers";
import { FormatTabs } from "@/components/admin/FormatTabs";
import { isDbConfigured } from "@/db/index";
import { jouwTafelTablePath } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath, resolveHostname } from "@/lib/admin-url";
import { QUIZ_CITIES } from "@/lib/jouw-tafel/logic";
import { SERIES_WARN_DAYS } from "@/lib/jouw-tafel/series-logic";
import { loadSeriesAdminData, type SeriesTableRow } from "@/lib/jouw-tafel/series-server";
import {
  addPauseAction,
  deletePauseAction,
  generateNowAction,
  removeTableAction,
  saveSeriesAction,
  saveTableAction,
} from "./actions";

const card = "rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6";
const field =
  "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40";
const button =
  "rounded-full bg-burgundy px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-cream transition hover:bg-wine";
const ghostButton =
  "rounded-full border border-border-subtle px-3.5 py-2 text-xs font-semibold text-wine/70 transition hover:border-burgundy/40 hover:text-burgundy";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y!, m! - 1, d!, 12)),
  );
}

function formatMoment(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function status(row: SeriesTableRow): string {
  if (row.comingSoon) return "Binnenkort";
  if (row.membersOnlyUntil && new Date(row.membersOnlyUntil).getTime() > Date.now()) {
    return `Open voor leden tot ${formatMoment(row.membersOnlyUntil)}`;
  }
  return row.spotsSold >= row.capacity ? "Vol" : "Open";
}

export default async function AdminJouwTafelPage() {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const data = await loadSeriesAdminData();
  const attention = data.tables.filter((t) => t.needsAttention);
  const freeCities = QUIZ_CITIES.filter((c) => !data.series.some((s) => s.city === c));

  return (
    <div className="space-y-8">
      <FormatTabs active="jouw-tafel" hostname={hostname} />

      <div>
        <h1 className="font-serif text-3xl text-burgundy">Sunday Table</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          De tafels van Jouw tafel (/jouw-tafel). Elke nacht maakt het systeem de data van elke reeks tot 10 weken
          vooruit aan, meteen boekbaar tot de maximale capaciteit. De zaak koppel je voor je eigen planning; gasten
          horen hem later. Deze tafels staan nooit in de agenda.
        </p>
      </div>

      {attention.length > 0 ? (
        <section className="rounded-2xl border border-gold/50 bg-gold/10 p-5 sm:p-6">
          <h2 className="font-serif text-xl text-burgundy">Aandacht nodig</h2>
          <p className="mt-1 text-sm text-wine/65">
            Binnen {SERIES_WARN_DAYS} dagen en nog zonder zaak:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-wine">
            {attention.map((t) => (
              <li key={t.id}>
                <span className="font-semibold">{t.city}</span> · {formatDate(t.date)} ·{" "}
                {t.spotsSold} / {t.capacity} geboekt
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-burgundy">Komende tafels</h2>
          <form action={generateNowAction}>
            <button type="submit" className={ghostButton}>
              Nu aanvullen
            </button>
          </form>
        </div>
        {data.tables.length === 0 ? (
          <p className="mt-4 text-sm text-wine/60">Nog geen tafels. Voeg een reeks toe of klik op Nu aanvullen.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="py-3 pr-4">Datum</th>
                  <th className="py-3 pr-4">Stad</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Verkocht / max</th>
                  <th className="py-3 pr-4">Zaak</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                {data.tables.map((t) => (
                  <tr key={t.id} className="border-b border-border-subtle/50 align-middle">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <a
                        href={jouwTafelTablePath("nl", t.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-wine underline-offset-4 hover:underline"
                      >
                        {formatDate(t.date)}
                      </a>
                      {t.seriesId ? null : <span className="ml-2 text-xs text-wine/45">(los)</span>}
                    </td>
                    <td className="py-3 pr-4">{t.city}</td>
                    <td className={`py-3 pr-4 ${t.needsAttention ? "font-semibold text-burgundy" : "text-wine/70"}`}>
                      {status(t)}
                    </td>
                    <td className="py-3 pr-4" colSpan={3}>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={saveTableAction} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={t.id} />
                          <span className="tabular-nums text-wine/70">{t.spotsSold} /</span>
                          <input
                            type="number"
                            name="capacity"
                            min={Math.max(1, t.spotsSold)}
                            max={100}
                            defaultValue={t.capacity}
                            className={`${field} w-20`}
                            aria-label={`Maximale capaciteit ${t.city} ${t.date}`}
                          />
                          <button type="submit" className={button}>
                            Opslaan
                          </button>
                        </form>
                        <span className="text-xs text-wine/60">
                          {t.venueNames.length > 0 ? t.venueNames.join(", ") : "Nog geen zaak"}
                        </span>
                        <Link href={adminPath(`/jouw-tafel/${t.id}`, hostname)} className={ghostButton}>
                          Indelen
                        </Link>
                        {t.spotsSold === 0 ? (
                          <form action={removeTableAction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit" className={ghostButton}>
                              Verwijder datum
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-wine/50">
              Zaken en groepjes regel je per tafel via Indelen, of via de Kalender.
            </p>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="font-serif text-xl text-burgundy">Reeksen</h2>
        <p className="mt-1 text-sm text-wine/65">
          Per stad een tafel om de zoveel weken. Een datum in een pauze wordt overgeslagen, het ritme loopt door.
        </p>
        <div className="mt-4 space-y-3">
          {data.series.map((s) => (
            <form key={s.id} action={saveSeriesAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="city" value={s.city} />
              <span className="w-28 font-semibold text-wine">{s.city}</span>
              <label className="text-xs text-wine/55">
                Vanaf{" "}
                <input type="date" name="firstDate" defaultValue={s.firstDate} className={field} />
              </label>
              <label className="text-xs text-wine/55">
                om de{" "}
                <input
                  type="number"
                  name="intervalWeeks"
                  min={1}
                  max={12}
                  defaultValue={s.intervalWeeks}
                  className={`${field} w-16`}
                />{" "}
                weken
              </label>
              <label className="text-xs text-wine/55">
                om <input type="time" name="startTime" defaultValue={s.startTime} className={field} />
              </label>
              <label className="text-xs text-wine/55">
                max{" "}
                <input
                  type="number"
                  name="defaultCapacity"
                  min={1}
                  max={100}
                  defaultValue={s.defaultCapacity}
                  className={`${field} w-20`}
                />
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-wine/70">
                <input type="checkbox" name="active" defaultChecked={s.active} /> aan
              </label>
              <button type="submit" className={button}>
                Opslaan
              </button>
            </form>
          ))}
        </div>
        <form action={saveSeriesAction} className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-subtle/60 pt-5">
          <span className="w-28 text-sm font-semibold text-wine/70">Nieuwe reeks</span>
          {freeCities.length > 0 ? (
            <select name="city" className={field} defaultValue={freeCities[0]} aria-label="Stad">
              {freeCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input name="city" placeholder="Stad" className={field} aria-label="Stad" />
          )}
          <input type="date" name="firstDate" className={field} aria-label="Eerste zondag" required />
          <input type="number" name="intervalWeeks" min={1} max={12} defaultValue={4} className={`${field} w-16`} aria-label="Om de zoveel weken" />
          <input type="time" name="startTime" defaultValue="14:00" className={field} aria-label="Starttijd" />
          <input type="number" name="defaultCapacity" min={1} max={100} defaultValue={20} className={`${field} w-20`} aria-label="Maximale capaciteit" />
          <input type="hidden" name="active" value="on" />
          <button type="submit" className={button}>
            Toevoegen
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className="font-serif text-xl text-burgundy">Pauzes</h2>
        <p className="mt-1 text-sm text-wine/65">
          Geen tafels in deze periodes, in geen enkele stad. Een nieuwe pauze haalt tafels zonder boekingen in die
          periode weg.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {data.pauses.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3">
              <span className="text-wine">
                {formatDate(p.startsOn)} t/m {formatDate(p.endsOn)}
                {p.label ? <span className="text-wine/55"> · {p.label}</span> : null}
              </span>
              <form action={deletePauseAction}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className={ghostButton}>
                  Verwijder
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addPauseAction} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="date" name="startsOn" className={field} aria-label="Van" required />
          <input type="date" name="endsOn" className={field} aria-label="Tot en met" required />
          <input name="label" placeholder="Bijvoorbeeld zomer" className={field} aria-label="Omschrijving" />
          <button type="submit" className={button}>
            Pauze toevoegen
          </button>
        </form>
      </section>

    </div>
  );
}
