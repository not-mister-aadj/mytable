"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  encodeSundayTableSlug,
  type SundayTableAdminRow,
} from "@/lib/sunday-table-signups-data";

function formatTableDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function tableTypeLabel(type: string) {
  return type === "girls_only" ? "Girls only" : "Mixed";
}

function planSummary(breakdown: Record<string, number>) {
  const parts = Object.entries(breakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([plan, count]) => `${plan}: ${count}`);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

export function SundayTablesAdminView({
  tables,
  detailBasePath,
}: {
  tables: SundayTableAdminRow[];
  detailBasePath: string;
}) {
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [onlyWithSignups, setOnlyWithSignups] = useState(false);
  const [search, setSearch] = useState("");

  const cities = useMemo(
    () => [...new Set(tables.map((t) => t.city))].sort(),
    [tables],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((row) => {
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (typeFilter !== "all" && row.tableType !== typeFilter) return false;
      if (onlyWithSignups && row.signupCount === 0) return false;
      if (!q) return true;
      return (
        row.city.toLowerCase().includes(q) ||
        row.tableDate.includes(q) ||
        tableTypeLabel(row.tableType).toLowerCase().includes(q)
      );
    });
  }, [tables, cityFilter, typeFilter, onlyWithSignups, search]);

  const totalSignups = useMemo(
    () => filtered.reduce((sum, row) => sum + row.signupCount, 0),
    [filtered],
  );
  const totalSeats = useMemo(
    () => filtered.reduce((sum, row) => sum + row.seatCount, 0),
    [filtered],
  );
  const tablesWithPeople = useMemo(
    () => filtered.filter((row) => row.signupCount > 0).length,
    [filtered],
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
          Clubmember
        </p>
        <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
          Sunday Tables
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          Overzicht van aankomende Sunday Tables per stad en type. Klik op een
          rij om de clubmembers te zien die zich hebben aangemeld.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Tafels in filter
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">
            {filtered.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Met aanmeldingen
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">
            {tablesWithPeople}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Totaal mensen
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">{totalSignups}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Totaal plekken (+1)
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">{totalSeats}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op stad of datum…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Filter op stad"
            >
              <option value="all">Alle steden</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Filter op tafeltype"
            >
              <option value="all">Alle types</option>
              <option value="girls_only">Girls only</option>
              <option value="mixed">Mixed</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-wine/70">
              <input
                type="checkbox"
                checked={onlyWithSignups}
                onChange={(e) => setOnlyWithSignups(e.target.checked)}
                className="rounded border-border-subtle"
              />
              Alleen met aanmeldingen
            </label>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center">
          <p className="font-serif text-xl text-burgundy">Geen tafels gevonden</p>
          <p className="mt-2 text-sm text-wine/60">
            Pas je filters aan of wacht tot er aanmeldingen binnenkomen.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Stad</th>
                  <th className="px-5 py-3.5">Datum</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Mensen</th>
                  <th className="px-5 py-3.5">Plekken</th>
                  <th className="px-5 py-3.5">Plannen</th>
                  <th className="px-5 py-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const slug = encodeSundayTableSlug(row);
                  const href = `${detailBasePath}/${slug}`;
                  return (
                    <tr
                      key={slug}
                      className="border-b border-border-subtle/50 last:border-0 transition hover:bg-cream/40"
                    >
                      <td className="px-5 py-4 font-medium text-wine">
                        <Link href={href} className="hover:underline">
                          {row.city}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-wine/80">
                        <Link href={href}>{formatTableDate(row.tableDate)}</Link>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.tableType === "girls_only"
                              ? "bg-[#f7e4ea] text-wine"
                              : "bg-cream text-wine/70"
                          }`}
                        >
                          {tableTypeLabel(row.tableType)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-burgundy">
                        {row.signupCount}
                      </td>
                      <td className="px-5 py-4 text-wine/80">{row.seatCount}</td>
                      <td className="px-5 py-4 text-wine/60">
                        {planSummary(row.planBreakdown)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={href}
                          className="text-sm font-medium text-burgundy hover:underline"
                        >
                          Bekijk →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
