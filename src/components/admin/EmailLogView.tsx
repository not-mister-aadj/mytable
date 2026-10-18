"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmailPreviewDialog } from "@/components/admin/EmailPreviewDialog";
import { EmailStatusPill } from "@/components/admin/EmailStatusPill";
import { EMAIL_TRACKING_SINCE } from "@/lib/email/email-tracking";
import { adminPath } from "@/lib/admin-url";
import type { EmailLogListRow } from "@/lib/email/email-log";

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

const selectClass =
  "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40";

/** Every email MyTable sent, with search, filters and the mail as it was sent. */
export function EmailLogView({ rows }: { rows: EmailLogListRow[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
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
  }, [rows, search, kind, sender, status, fromDate, toDate]);

  const stats = useMemo(() => rates(filtered), [filtered]);

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
    search !== "" || kind !== "all" || sender !== "all" || status !== "all" || fromDate !== "" || toDate !== "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-burgundy sm:text-4xl">E-mails</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          Elke mail die MyTable verstuurde, nieuwste eerst. Klik op een mail om hem te zien zoals de ontvanger hem
          kreeg.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail, afzender of onderwerp…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass} aria-label="Soort mail">
            <option value="all">Alle soorten</option>
            {kinds.map(([label, count]) => (
              <option key={label} value={label}>
                {label} ({count})
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
                        {row.kind}
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
