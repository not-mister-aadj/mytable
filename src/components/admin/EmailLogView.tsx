"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmailPreviewDialog } from "@/components/admin/EmailPreviewDialog";
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

const selectClass =
  "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40";

/** Every email MyTable sent, with search, filters and the mail as it was sent. */
export function EmailLogView({ rows }: { rows: EmailLogListRow[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState<EmailLogListRow | null>(null);

  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (kind !== "all" && row.kind !== kind) return false;
      const day = amsterdamDay.format(new Date(row.sentAt));
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      if (!q) return true;
      return (
        row.to.toLowerCase().includes(q) ||
        (row.name ?? "").toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q)
      );
    });
  }, [rows, search, kind, fromDate, toDate]);

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
  const filtering = search !== "" || kind !== "all" || fromDate !== "" || toDate !== "";

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
            placeholder="Zoek op naam, e-mail of onderwerp…"
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
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-xl text-burgundy">Geen mails gevonden</p>
            <p className="mt-2 text-sm text-wine/60">Pas je zoekopdracht of filters aan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Verstuurd</th>
                  <th className="px-5 py-3.5">Aan</th>
                  <th className="px-5 py-3.5">Soort</th>
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
                      <span className="inline-flex rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-wine/75 ring-1 ring-inset ring-border-subtle">
                        {row.kind}
                      </span>
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
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
