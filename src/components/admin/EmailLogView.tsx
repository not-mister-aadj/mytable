"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmailPreviewDialog } from "@/components/admin/EmailPreviewDialog";
import { EmailStatusPill } from "@/components/admin/EmailStatusPill";
import { EMAIL_TRACKING_SINCE } from "@/lib/email/email-tracking";
import { adminPath } from "@/lib/admin-url";
import type { EmailLogListRow } from "@/lib/email/email-log";
import { MAIL_GOALS, mailGoal, mailTitle } from "@/lib/email/mail-catalog";

/** Rows shown at first and added per step while scrolling. */
const PAGE_SIZE = 50;

const dateTime = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

const amsterdamDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" });

const STATUS_FILTERS: Array<[string, string]> = [
  ["opened", "Geopend of geklikt"],
  ["clicked", "Geklikt"],
  ["not-opened", "Niet geopend"],
  ["problem", "Bounce, spam of tegengehouden"],
];

const trackingStart = new Date(EMAIL_TRACKING_SINCE).getTime();
const trackingStartLabel = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
}).format(new Date(EMAIL_TRACKING_SINCE));

const PROBLEMS = new Set(["bounced", "complained", "suppressed"]);
const OPENED = new Set(["opened", "clicked"]);

function pct(part: number, total: number): string {
  if (total === 0) return "-";
  return `${Math.round((part / total) * 1000) / 10}%`;
}

function matchesStatus(filter: string, row: EmailLogListRow): boolean {
  const event = row.lastEvent ?? "";
  switch (filter) {
    case "opened":
      return OPENED.has(event) || row.openCount > 0;
    case "clicked":
      return event === "clicked" || row.clickCount > 0;
    case "not-opened":
      return !OPENED.has(event) && row.openCount === 0 && !PROBLEMS.has(event);
    case "problem":
      return PROBLEMS.has(event);
    default:
      return true;
  }
}

/** Rates over a set of mails: delivery problems over all, opens and clicks
 * only over mails sent since tracking was on. */
function rates(rows: EmailLogListRow[]) {
  const bounced = rows.filter((r) => r.lastEvent === "bounced").length;
  const spam = rows.filter((r) => r.lastEvent === "complained").length;
  const held = rows.filter((r) => r.lastEvent === "suppressed").length;
  const tracked = rows.filter((r) => new Date(r.sentAt).getTime() >= trackingStart && !PROBLEMS.has(r.lastEvent ?? ""));
  const opened = tracked.filter((r) => OPENED.has(r.lastEvent ?? "") || r.openCount > 0).length;
  const clicked = tracked.filter((r) => r.lastEvent === "clicked" || r.clickCount > 0).length;
  return { total: rows.length, bounced, spam, held, tracked: tracked.length, opened, clicked };
}

/** Mails of one kind that went out together: one send to a group of people. */
type Send = { id: string; kind: string; variant: string | null; at: string; subject: string; rows: EmailLogListRow[]; opened: number; clicked: number; problems: number };

const SEND_GAP_MS = 15 * 60 * 1000;

/** What the subjects of one send share: the whole subject, or its start and end around what differs per guest. */
function sharedSubject(subjects: string[]): string {
  const distinct = [...new Set(subjects)];
  if (distinct.length === 1) return distinct[0]!;
  let start = 0;
  const shortest = Math.min(...distinct.map((s) => s.length));
  while (start < shortest && distinct.every((s) => s[start] === distinct[0]![start])) start++;
  let end = 0;
  while (end < shortest - start && distinct.every((s) => s[s.length - 1 - end] === distinct[0]![distinct[0]!.length - 1 - end])) end++;
  if (start + end >= 12) return `${distinct[0]!.slice(0, start)}…${end > 0 ? distinct[0]!.slice(-end) : ""}`;
  const counts = new Map<string, number>();
  for (const s of subjects) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

/** Rows (newest first) into sends: the same kind of mail, each within a quarter of an hour of the one before. */
function groupSends(rows: EmailLogListRow[]): Send[] {
  const sends: Array<{ kind: string; variant: string | null; rows: EmailLogListRow[]; oldest: number }> = [];
  const current = new Map<string, (typeof sends)[number]>();
  for (const row of rows) {
    const t = new Date(row.sentAt).getTime();
    // A variant is its own send: two versions of a mail going out together stay apart.
    const key = `${row.kind}|${row.variant ?? ""}`;
    const running = current.get(key);
    if (running && running.oldest - t <= SEND_GAP_MS) {
      running.rows.push(row);
      running.oldest = t;
    } else {
      const send = { kind: row.kind, variant: row.variant, rows: [row], oldest: t };
      current.set(key, send);
      sends.push(send);
    }
  }
  return sends.map((send) => ({
    id: send.rows[0]!.id,
    kind: send.kind,
    variant: send.variant,
    at: send.rows[send.rows.length - 1]!.sentAt,
    subject: sharedSubject(send.rows.map((r) => r.subject)),
    rows: send.rows,
    opened: send.rows.filter((r) => OPENED.has(r.lastEvent ?? "") || r.openCount > 0).length,
    clicked: send.rows.filter((r) => r.lastEvent === "clicked" || r.clickCount > 0).length,
    problems: send.rows.filter((r) => PROBLEMS.has(r.lastEvent ?? "")).length,
  }));
}

const selectClass =
  "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40";

/** Every email MyTable sent, with search, filters and the mail as it was sent. */
export function EmailLogView({ rows, initialKind = "all" }: { rows: EmailLogListRow[]; initialKind?: string }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(initialKind);
  const [goal, setGoal] = useState("all");
  // A link to one kind of mail wants the mails themselves.
  const [view, setView] = useState<"sends" | "mails">(initialKind === "all" ? "sends" : "mails");
  // Mails planned at Resend are in the log with their future send time.
  const [loadedAt] = useState(() => Date.now());
  const [sender, setSender] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState<EmailLogListRow | null>(null);

  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const senders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) if (row.fromAddress) counts.set(row.fromAddress, (counts.get(row.fromAddress) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (kind !== "all" && row.kind !== kind) return false;
      if (goal !== "all" && (mailGoal(row.kind) ?? "other") !== goal) return false;
      if (sender !== "all" && (row.fromAddress ?? "") !== sender) return false;
      if (status !== "all" && !matchesStatus(status, row)) return false;
      const day = amsterdamDay.format(new Date(row.sentAt));
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      if (!q) return true;
      return (
        row.to.toLowerCase().includes(q) ||
        (row.name ?? "").toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        (row.fromAddress ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, kind, goal, sender, status, fromDate, toDate]);

  const stats = useMemo(() => rates(filtered), [filtered]);
  const sends = useMemo(() => groupSends(filtered), [filtered]);

  // Back to the first page whenever the filtered list changes.
  const [page, setPage] = useState({ list: filtered, count: PAGE_SIZE });
  const visibleCount = page.list === filtered ? page.count : PAGE_SIZE;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const showMore = () => setPage({ list: filtered, count: visibleCount + PAGE_SIZE });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const showMoreRef = useRef(showMore);
  useEffect(() => {
    showMoreRef.current = showMore;
  });
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) showMoreRef.current();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  const recipients = useMemo(() => new Set(filtered.map((row) => row.to.toLowerCase())).size, [filtered]);
  const filtering =
    search !== "" || kind !== "all" || goal !== "all" || sender !== "all" || status !== "all" || fromDate !== "" || toDate !== "";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="flex gap-1 self-start rounded-full border border-border-subtle bg-cream p-1 text-sm">
            {(
              [
                ["sends", "Per verzending"],
                ["mails", "Per mail"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={`rounded-full px-3 py-1 ${view === id ? "bg-burgundy text-cream" : "text-wine/70 hover:text-burgundy"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail, afzender of onderwerp…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className={selectClass} aria-label="Doel">
            <option value="all">Alle doelen</option>
            {MAIL_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
            <option value="other">Overig</option>
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass} aria-label="Soort mail">
            <option value="all">Alle soorten</option>
            {kinds.map(([label, count]) => (
              <option key={label} value={label}>
                {mailTitle(label)} ({count})
              </option>
            ))}
          </select>
          {senders.length > 0 ? (
            <select value={sender} onChange={(e) => setSender(e.target.value)} className={selectClass} aria-label="Verzonden vanaf">
              <option value="all">Alle afzenders</option>
              {senders.map(([address, count]) => (
                <option key={address} value={address}>
                  {address} ({count})
                </option>
              ))}
            </select>
          ) : null}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label="Status">
            <option value="all">Alle statussen</option>
            {STATUS_FILTERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-wine/65">
            Van
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={selectClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-wine/65">
            Tot
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={selectClass} />
          </label>
          {filtering ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setKind("all");
                setGoal("all");
                setSender("all");
                setStatus("all");
                setFromDate("");
                setToDate("");
              }}
              className="text-xs font-medium text-wine/60 underline underline-offset-2 hover:text-burgundy"
            >
              Wis alles
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-wine/60">
          {filtered.length} {filtered.length === 1 ? "mail" : "mails"} aan {recipients}{" "}
          {recipients === 1 ? "persoon" : "mensen"}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Openrate", pct(stats.opened, stats.tracked), `${stats.opened} van ${stats.tracked} sinds ${trackingStartLabel}`],
            ["Klikrate", pct(stats.clicked, stats.tracked), `${stats.clicked} van ${stats.tracked} sinds ${trackingStartLabel}`],
            ["Spamrate", pct(stats.spam, stats.total), `${stats.spam} van ${stats.total}`],
            ["Bouncerate", pct(stats.bounced, stats.total), `${stats.bounced} van ${stats.total}`],
            ["Tegengehouden", pct(stats.held, stats.total), `${stats.held} van ${stats.total}`],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-xl border border-border-subtle/70 bg-beige/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-wine/45">{label}</dt>
              <dd className="mt-1 font-serif text-2xl text-burgundy">{value}</dd>
              <dd className="text-xs text-wine/50">{hint}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-xl text-burgundy">Geen mails gevonden</p>
            <p className="mt-2 text-sm text-wine/60">Pas je zoekopdracht of filters aan.</p>
          </div>
        ) : view === "sends" ? (
          <SendsView sends={sends} loadedAt={loadedAt} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Verstuurd</th>
                  <th className="px-5 py-3.5">Aan</th>
                  <th className="px-5 py-3.5">Verzonden vanaf</th>
                  <th className="px-5 py-3.5">Soort</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Onderwerp</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className="border-b border-border-subtle/50 transition hover:bg-cream/70">
                    <td className="whitespace-nowrap px-5 py-3.5 text-wine/70">{dateTime.format(new Date(row.sentAt))}</td>
                    <td className="px-5 py-3.5">
                      {row.customerId ? (
                        <Link
                          href={adminPath(`/customers/${row.customerId}`)}
                          className="font-medium text-wine hover:text-burgundy"
                        >
                          {row.name}
                        </Link>
                      ) : null}
                      <p className={row.customerId ? "text-xs text-wine/55" : "text-wine/70"}>{row.to}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {row.fromAddress ? (
                        <>
                          <p className="text-wine/70">{row.fromAddress}</p>
                          {row.fromName ? <p className="text-xs text-wine/50">{row.fromName}</p> : null}
                        </>
                      ) : (
                        <span className="text-wine/40">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-wine/75 ring-1 ring-inset ring-border-subtle">
                        {mailTitle(row.kind)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <EmailStatusPill state={row} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setOpen(row)}
                        className="text-left font-medium text-wine underline decoration-wine/25 underline-offset-2 transition hover:text-burgundy"
                      >
                        {row.subject}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              ref={sentinelRef}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-wine/60"
            >
              <span>
                {visible.length} van {filtered.length} mails
              </span>
              {hasMore ? (
                <button
                  type="button"
                  onClick={showMore}
                  className="rounded-full border border-border-subtle bg-cream px-4 py-1.5 text-sm font-medium text-wine transition hover:border-burgundy/40 hover:text-burgundy"
                >
                  Toon meer
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {open ? (
        <EmailPreviewDialog
          logId={open.id}
          subject={open.subject}
          sentAt={open.sentAt}
          to={open.name ? `${open.name} (${open.to})` : open.to}
          from={open.fromAddress ? (open.fromName ? `${open.fromName} (${open.fromAddress})` : open.fromAddress) : null}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

/** Sends on the left; on the right who got the one you picked, and the mail of the guest you point at. */
function SendsView({ sends, loadedAt }: { sends: Send[]; loadedAt: number }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [shownRow, setShownRow] = useState<string | null>(null);
  const send = sends.find((s) => s.id === picked) ?? sends[0] ?? null;
  const row = send ? (send.rows.find((r) => r.id === shownRow) ?? send.rows[0]!) : null;
  // A short wait, so moving the mouse down the names doesn't load every mail on the way.
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null);
  const point = (id: string) => {
    if (hover.current) clearTimeout(hover.current);
    hover.current = setTimeout(() => setShownRow(id), 120);
  };

  return (
    <div className="grid items-start xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:divide-x xl:divide-border-subtle/70">
      <div className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                <th className="px-4 py-3.5">Verstuurd</th>
                <th className="px-4 py-3.5">Mail</th>
                <th className="px-4 py-3.5 text-right">Aan</th>
                <th className="px-4 py-3.5 text-right">Geopend</th>
                <th className="px-4 py-3.5 text-right">Geklikt</th>
                <th className="px-4 py-3.5 text-right">Probleem</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {sends.slice(0, limit).map((s) => {
                const on = send?.id === s.id;
                const planned = new Date(s.at).getTime() > loadedAt;
                return (
                  <tr
                    key={s.id}
                    tabIndex={0}
                    aria-selected={on}
                    onClick={() => setPicked(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setPicked(s.id);
                    }}
                    className={`cursor-pointer border-b border-border-subtle/50 align-top outline-none transition focus-visible:ring-2 focus-visible:ring-burgundy/40 ${
                      on ? "bg-burgundy/[0.07]" : "hover:bg-cream/70"
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-wine/70">
                      {dateTime.format(new Date(s.at))}
                      {planned ? <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900">Ingepland</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-wine">
                        {mailTitle(s.kind)}
                        {s.variant ? <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-wine/70 ring-1 ring-inset ring-border-subtle">Variant {s.variant}</span> : null}
                      </p>
                      <p className="text-xs text-wine/55">{s.subject}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-wine">{s.rows.length}</td>
                    <td className="px-4 py-3 text-right text-wine/75">{s.opened || "–"}</td>
                    <td className="px-4 py-3 text-right text-wine/75">{s.clicked || "–"}</td>
                    <td className={`px-4 py-3 text-right ${s.problems ? "font-medium text-red-700" : "text-wine/75"}`}>{s.problems || "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-wine/60">
          <span>
            {Math.min(limit, sends.length)} van {sends.length} verzendingen
          </span>
          {limit < sends.length ? (
            <button
              type="button"
              onClick={() => setLimit(limit + PAGE_SIZE)}
              className="rounded-full border border-border-subtle bg-cream px-4 py-1.5 text-sm font-medium text-wine transition hover:border-burgundy/40 hover:text-burgundy"
            >
              Toon meer
            </button>
          ) : null}
        </div>
      </div>

      {send && row ? (
        <aside className="min-w-0 p-4 sm:p-5 xl:sticky xl:top-4">
          <h2 className="font-serif text-xl text-burgundy">{mailTitle(send.kind)}</h2>
          <p className="mt-1 text-sm text-wine/60">
            {dateTime.format(new Date(send.at))} · {send.rows.length} {send.rows.length === 1 ? "ontvanger" : "ontvangers"}
          </p>
          <ul className="mt-3 max-h-56 divide-y divide-border-subtle/60 overflow-y-auto rounded-xl border border-border-subtle bg-cream/70">
            {send.rows.map((r) => (
              <li
                key={r.id}
                tabIndex={0}
                onMouseEnter={() => point(r.id)}
                onFocus={() => setShownRow(r.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm outline-none ${row.id === r.id ? "bg-burgundy/[0.07]" : ""}`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {r.customerId ? (
                    <Link href={adminPath(`/customers/${r.customerId}`)} className="font-medium text-wine hover:text-burgundy hover:underline">
                      {r.name}
                    </Link>
                  ) : (
                    <span className="text-wine">{r.to}</span>
                  )}
                </span>
                <EmailStatusPill state={r} />
              </li>
            ))}
          </ul>
          <p className="mt-3 truncate text-sm text-wine">
            <span className="text-wine/50">Aan </span>
            {row.name ? `${row.name} (${row.to})` : row.to}
          </p>
          <p className="text-sm text-wine">
            <span className="text-wine/50">Onderwerp </span>
            {row.subject}
          </p>
          {row.variant || row.version ? (
            <p className="text-sm text-wine">
              {row.variant ? (
                <>
                  <span className="text-wine/50">Variant </span>
                  {row.variant}{" "}
                </>
              ) : null}
              {row.version ? (
                <>
                  <span className="text-wine/50">Versie </span>
                  <span className="font-mono text-xs">{row.version}</span>
                </>
              ) : null}
            </p>
          ) : null}
          {row.vars ? (
            <dl className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {Object.entries(row.vars)
                .filter(([, v]) => v !== null && v !== "")
                .map(([k, v]) => (
                  <div key={k} className="rounded-full bg-cream px-2.5 py-0.5 ring-1 ring-inset ring-border-subtle">
                    <dt className="inline text-wine/50">{k} </dt>
                    <dd className="inline text-wine">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          ) : null}
          {row.hasHtml ? (
            <iframe key={row.id} title={row.subject} src={`/api/admin/email-log/${row.id}`} sandbox="" className="mt-3 h-[480px] w-full rounded-xl border border-border-subtle bg-white" />
          ) : (
            <p className="mt-3 text-sm text-wine/50">Van deze mail is de inhoud niet bewaard</p>
          )}
        </aside>
      ) : null}
    </div>
  );
}
