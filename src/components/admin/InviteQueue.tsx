"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveInvites,
  getRecipientHistory,
  postponeInvites,
  skipInvites,
  type RecipientHistoryItem,
} from "@/app/admin/(dashboard)/invites/actions";
import type { InviteRow } from "@/lib/admin/invites-data";

const TZ = "Europe/Amsterdam";
const KIND: Record<string, string> = { invite: "Uitnodiging", nudge: "Herinnering", checkin: "Nog interesse?" };
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const time = (iso: string) => new Intl.DateTimeFormat("nl-NL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const when = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const select = "rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine";

type Pending = { kind: "approve" | "skip" | "later"; ids: string[]; days?: number };

function consequence(p: Pending, rows: InviteRow[]): string {
  const picked = rows.filter((r) => p.ids.includes(r.id));
  const n = picked.length;
  const mails = n === 1 ? "1 mail" : `${n} mails`;
  if (p.kind === "skip") return `${mails} ${n === 1 ? "wordt" : "worden"} overgeslagen. Morgenochtend plant het systeem deze mensen opnieuw in.`;
  if (p.kind === "later") {
    const span = p.days === 7 ? "1 week" : p.days === 1 ? "1 dag" : `${p.days} dagen`;
    return `${mails} ${n === 1 ? "schuift" : "schuiven"} ${span} op, op hetzelfde tijdstip, en ${n === 1 ? "moet" : "moeten"} daarna opnieuw goedgekeurd worden.`;
  }
  const now = Date.now();
  const late = picked.filter((r) => Date.parse(r.scheduledFor) <= now).length;
  const later = picked.filter((r) => Date.parse(r.scheduledFor) > now).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const parts: string[] = [];
  if (late) parts.push(`${late === 1 ? "1 mail gaat" : `${late} mails gaan`} binnen een minuut uit`);
  if (later.length) {
    const first = later[0]!.scheduledFor;
    const last = later[later.length - 1]!.scheduledFor;
    const sameDay = dayKey(first) === dayKey(last);
    parts.push(
      later.length === 1
        ? `1 mail gaat ${when(first)} uit`
        : sameDay
          ? `${later.length} mails gaan ${when(first).replace(/ \d\d:\d\d$/, "")} uit tussen ${time(first)} en ${time(last)}`
          : `${later.length} mails gaan uit tussen ${when(first)} en ${when(last)}`,
    );
  }
  return `${parts.join(", ")}. Elke mail apart, op het tijdstip van de ontvanger.`;
}

export function InviteQueue({ rows, approval, now }: { rows: InviteRow[]; approval: boolean; now: string }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [period, setPeriod] = useState<"today" | "tomorrow" | "week" | "all">("all");
  const [city, setCity] = useState("all");
  const [event, setEvent] = useState("all");
  const [lang, setLang] = useState("all");
  const [onlyLater, setOnlyLater] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending | null>(null);
  const [history, setHistory] = useState<{ email: string; items: RecipientHistoryItem[] | null } | null>(null);

  const cities = useMemo(() => [...new Set(rows.flatMap((r) => r.cities))].sort(), [rows]);
  const eventsList = useMemo(() => [...new Set(rows.flatMap((r) => r.events))].sort(), [rows]);
  const nowMs = Date.parse(now);
  const today = dayKey(now);
  const tomorrow = dayKey(new Date(nowMs + 86400000).toISOString());
  const weekEnd = nowMs + 7 * 86400000;

  const filtered = rows.filter((r) => {
    const d = dayKey(r.scheduledFor);
    if (period === "today" && d !== today) return false;
    if (period === "tomorrow" && d !== tomorrow) return false;
    if (period === "week" && Date.parse(r.scheduledFor) > weekEnd) return false;
    if (city !== "all" && !r.cities.includes(city)) return false;
    if (event !== "all" && !r.events.includes(event)) return false;
    if (lang !== "all" && r.locale !== lang) return false;
    if (onlyLater && !r.postponed) return false;
    return true;
  });
  const hidden = rows.length - filtered.length;
  const visibleSelected = [...selected].filter((id) => filtered.some((r) => r.id === id));
  const allSelected = filtered.length > 0 && visibleSelected.length === filtered.length;

  // A filter change clears the selection, so nothing hidden is acted on.
  const setFilter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setSelected(new Set());
  };

  const run = (p: Pending) => {
    startTransition(async () => {
      if (p.kind === "approve") await approveInvites(p.ids);
      if (p.kind === "skip") await skipInvites(p.ids);
      if (p.kind === "later") await postponeInvites(p.ids, p.days ?? 1);
      setSelected(new Set());
      setPending(null);
      router.refresh();
    });
  };

  const openHistory = (email: string) => {
    setHistory({ email, items: null });
    startTransition(async () => {
      const items = await getRecipientHistory(email);
      setHistory({ email, items });
    });
  };

  const approvable = (ids: string[]) => ids.filter((id) => rows.find((r) => r.id === id)?.status === "queued");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={select} value={period} onChange={(e) => setFilter(setPeriod)(e.target.value as typeof period)} aria-label="Wanneer">
          <option value="all">Alles</option>
          <option value="today">Vandaag</option>
          <option value="tomorrow">Morgen</option>
          <option value="week">Komende 7 dagen</option>
        </select>
        <select className={select} value={city} onChange={(e) => setFilter(setCity)(e.target.value)} aria-label="Stad">
          <option value="all">Alle steden</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={select} value={event} onChange={(e) => setFilter(setEvent)(e.target.value)} aria-label="Event">
          <option value="all">Alle events</option>
          {eventsList.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <select className={select} value={lang} onChange={(e) => setFilter(setLang)(e.target.value)} aria-label="Taal">
          <option value="all">NL en EN</option>
          <option value="nl">Nederlands</option>
          <option value="en">Engels</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-wine/70">
          <input type="checkbox" checked={onlyLater} onChange={(e) => setFilter(setOnlyLater)(e.target.checked)} className="accent-burgundy" />
          Uitgesteld
        </label>
      </div>

      {visibleSelected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-burgundy/5 px-4 py-2 text-sm">
          <span className="text-wine/70">{visibleSelected.length} geselecteerd</span>
          {approvable(visibleSelected).length > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setPending({ kind: "approve", ids: approvable(visibleSelected) })}
              className="rounded-full bg-burgundy px-3 py-1 font-medium text-cream"
            >
              Goedkeuren ({approvable(visibleSelected).length})
            </button>
          ) : null}
          {[1, 2, 7].map((d) => (
            <button
              key={d}
              type="button"
              disabled={busy}
              onClick={() => setPending({ kind: "later", ids: visibleSelected, days: d })}
              className="rounded-full border border-border-subtle bg-cream px-3 py-1 text-wine"
            >
              Later: {d === 7 ? "1 week" : d === 1 ? "1 dag" : `${d} dagen`}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => setPending({ kind: "skip", ids: visibleSelected })}
            className="rounded-full border border-border-subtle bg-cream px-3 py-1 text-wine"
          >
            Overslaan ({visibleSelected.length})
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border-subtle/80 bg-beige/50">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle/80 bg-cream/60 text-left text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Alles selecteren"
                  checked={allSelected}
                  onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((r) => r.id)) : new Set())}
                  className="accent-burgundy"
                />
              </th>
              <th className="px-4 py-3">Wanneer</th>
              <th className="px-4 py-3">Wie</th>
              <th className="px-4 py-3">Soort</th>
              <th className="px-4 py-3">Events</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-wine/50">
                  {hidden > 0 ? (
                    <>
                      {hidden} {hidden === 1 ? "mail verborgen" : "mails verborgen"} door je filter.{" "}
                      <button
                        type="button"
                        className="text-burgundy underline"
                        onClick={() => {
                          setPeriod("all");
                          setCity("all");
                          setEvent("all");
                          setLang("all");
                          setOnlyLater(false);
                        }}
                      >
                        Toon alles
                      </button>
                    </>
                  ) : (
                    "Niets gepland"
                  )}
                </td>
              </tr>
            ) : null}
            {filtered.map((r) => (
              <tr key={r.id} className={`border-b border-border-subtle/50 ${selected.has(r.id) ? "bg-burgundy/5" : ""}`}>
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    aria-label={`Selecteer ${r.name ?? r.email}`}
                    checked={selected.has(r.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(r.id);
                      else next.delete(r.id);
                      setSelected(next);
                    }}
                    className="accent-burgundy"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-wine/70">
                  {when(r.scheduledFor)}
                  {r.postponed ? <span className="ml-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">Later</span> : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-wine">{r.name ?? r.email}</p>
                  <p className="text-xs text-wine/50">
                    {r.cities.join(", ")} · {r.locale.toUpperCase()}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs">
                    <button type="button" onClick={() => openHistory(r.email)} className="text-burgundy hover:underline">
                      Geschiedenis
                    </button>
                    {r.body ? (
                      <details>
                        <summary className="cursor-pointer text-burgundy">Voorbeeld</summary>
                        <div className="mt-2 max-w-xl rounded-xl border border-border-subtle bg-white p-3">
                          <p className="font-semibold text-wine">{r.subject}</p>
                          <pre className="mt-2 whitespace-pre-wrap font-sans text-wine/80">{r.body}</pre>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-wine/70">{KIND[r.kind]}</td>
                <td className="px-4 py-3 align-top text-wine/70">{r.events.join(" · ") || "–"}</td>
                <td className="px-4 py-3 align-top text-xs text-wine/60">{r.status === "approved" ? "Goedgekeurd" : approval ? "Wacht op goedkeuring" : "Gepland"}</td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs">
                  {r.status === "queued" ? (
                    <button type="button" disabled={busy} onClick={() => setPending({ kind: "approve", ids: [r.id] })} className="mr-3 font-medium text-burgundy hover:underline">
                      Goedkeuren
                    </button>
                  ) : null}
                  <button type="button" disabled={busy} onClick={() => setPending({ kind: "later", ids: [r.id], days: 1 })} className="mr-3 text-burgundy hover:underline">
                    Later
                  </button>
                  <button type="button" disabled={busy} onClick={() => setPending({ kind: "skip", ids: [r.id] })} className="text-burgundy hover:underline">
                    Overslaan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4" onClick={() => !busy && setPending(null)}>
          <div className="w-full max-w-md rounded-2xl bg-beige p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-xl text-burgundy">
              {pending.kind === "approve" ? "Goedkeuren" : pending.kind === "later" ? "Later" : "Overslaan"}
            </p>
            <p className="mt-2 text-sm text-wine/80">{consequence(pending, rows)}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setPending(null)} className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm text-wine">
                Annuleren
              </button>
              <button type="button" disabled={busy} onClick={() => run(pending)} className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream">
                {busy ? "Bezig…" : "Bevestigen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {history ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4" onClick={() => setHistory(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-beige p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <p className="font-serif text-xl text-burgundy">{history.email}</p>
              <button type="button" onClick={() => setHistory(null)} className="text-sm text-wine/60">
                Sluiten
              </button>
            </div>
            {history.items === null ? (
              <p className="mt-4 text-sm text-wine/50">Laden…</p>
            ) : history.items.length === 0 ? (
              <p className="mt-4 text-sm text-wine/50">Nog geen mails</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {history.items.map((h, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 border-b border-border-subtle/50 pb-2">
                    <span>
                      <span className="block text-xs text-wine/50">{when(h.at)}</span>
                      <span className="text-wine">{h.subject}</span>
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-cream px-2 py-0.5 text-xs text-wine/70">{h.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
