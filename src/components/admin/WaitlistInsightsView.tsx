"use client";

import { useState } from "react";
import Link from "next/link";
import type { CountBucket, WaitlistInsights } from "@/lib/waitlist-insights-data";

// Data-viz tokens (dataviz skill's validated default palette), scoped to
// this view only — the surrounding admin chrome keeps MyTable's own
// wine/burgundy/cream tokens. Sequential blue for every chart here: every
// chart in this dashboard is a magnitude comparison (counts), not multiple
// simultaneous series, so one hue is the correct, honest choice throughout.
const vizStyle = (
  <style>{`
    .viz-root {
      --viz-surface: #fcfcfb;
      --viz-ink-primary: #0b0b0b;
      --viz-ink-secondary: #52514e;
      --viz-ink-muted: #898781;
      --viz-grid: #e1e0d9;
      --viz-baseline: #c3c2b7;
      --viz-series-1: #2a78d6;
      --viz-series-1-wash: rgba(42, 120, 214, 0.1);
      --viz-good: #0ca30c;
      --viz-seq-100: #cde2fb;
      --viz-seq-250: #86b6ef;
      --viz-seq-400: #3987e5;
      --viz-seq-550: #1c5cab;
      --viz-seq-700: #0d366b;
    }
  `}</style>
);

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: { value: number; suffix: string };
}) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-burgundy">{value}</p>
      {delta ? (
        <p
          className="mt-1 text-xs font-medium"
          style={{ color: delta.value >= 0 ? "var(--viz-good, #0ca30c)" : "#d03b3b" }}
        >
          {delta.value >= 0 ? "▲" : "▼"} {Math.abs(delta.value)} {delta.suffix}
        </p>
      ) : null}
    </div>
  );
}

/** Horizontal magnitude bars — the one reusable form for every categorical
 * breakdown in this dashboard (funnel, weekday, city, format, gender, …).
 * Bar length + color both carry magnitude (sequential blue); count and %
 * of total are direct-labeled since there's no room for a legend to add
 * anything a single-hue chart doesn't already say. */
function HorizontalBars({
  title,
  subtitle,
  buckets,
  total,
  labelFor,
  emptyLabel = "Nog geen data",
}: {
  title: string;
  subtitle?: string;
  buckets: CountBucket[];
  total: number;
  labelFor?: (id: string, fallback: string) => string;
  emptyLabel?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const hasData = buckets.some((b) => b.count > 0);

  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-[var(--viz-surface)] p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
      <h3 className="font-serif text-base text-burgundy">{title}</h3>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-[var(--viz-ink-secondary)]">{subtitle}</p>
      ) : null}
      {!hasData ? (
        <p className="mt-6 py-4 text-center text-sm text-[var(--viz-ink-muted)]">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {buckets.map((bucket) => {
            const label = labelFor ? labelFor(bucket.id, bucket.label) : bucket.label;
            const pct = total > 0 ? Math.round((bucket.count / total) * 100) : 0;
            const widthPct = Math.max(3, (bucket.count / max) * 100);
            const isHovered = hovered === bucket.id;
            return (
              <div
                key={bucket.id}
                className="group relative"
                onMouseEnter={() => setHovered(bucket.id)}
                onMouseLeave={() => setHovered((h) => (h === bucket.id ? null : h))}
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-[var(--viz-ink-primary)]">{label}</span>
                  <span className="shrink-0 tabular-nums text-[var(--viz-ink-secondary)]">
                    {bucket.count} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--viz-grid)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: "var(--viz-series-1)",
                      opacity: isHovered ? 1 : 0.85,
                    }}
                  />
                </div>
                {isHovered ? (
                  <div className="pointer-events-none absolute -top-8 left-0 z-10 rounded-lg bg-[var(--viz-ink-primary)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
                    {label}: {bucket.count} ({pct}% van totaal)
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Daily trend, last 30 days — thin columns, sequential blue, hover
 * tooltip per day. One series, so no legend box (per marks-and-anatomy). */
function DailyTrendChart({ data }: { data: WaitlistInsights["dailySignups"] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-[var(--viz-surface)] p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-serif text-lg text-burgundy">Aanmeldingen per dag</h3>
          <p className="mt-0.5 text-xs text-[var(--viz-ink-secondary)]">
            Laatste 30 dagen · {total} in totaal
          </p>
        </div>
      </div>
      <div className="relative mt-6 flex h-40 items-end gap-[3px]">
        {data.map((point, i) => {
          const heightPct = Math.max(2, (point.count / max) * 100);
          const isHovered = hovered === i;
          return (
            <div
              key={point.date}
              className="group relative flex-1"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              <div
                className="w-full rounded-t-[3px] transition-[height,opacity] duration-200"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: "var(--viz-series-1)",
                  opacity: isHovered ? 1 : 0.8,
                }}
              />
              {isHovered ? (
                <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--viz-ink-primary)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
                  {formatDateShort(point.date)}: {point.count}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--viz-ink-muted)]">
        <span>{formatDateShort(data[0]?.date ?? "")}</span>
        <span>{formatDateShort(data[data.length - 1]?.date ?? "")}</span>
      </div>
    </div>
  );
}

/** City × format cross-tab — sequential blue heatmap, for exactly the kind
 * of "where should we launch next" comparison a spreadsheet buries. */
function CityFormatMatrix({
  matrix,
  formatLabels,
}: {
  matrix: WaitlistInsights["cityFormatMatrix"];
  formatLabels: Record<string, string>;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(...matrix.counts.flat(), 1);

  function colorFor(count: number) {
    if (count === 0) return "var(--viz-grid)";
    const ratio = count / max;
    if (ratio > 0.75) return "var(--viz-seq-700)";
    if (ratio > 0.5) return "var(--viz-seq-550)";
    if (ratio > 0.25) return "var(--viz-seq-400)";
    return "var(--viz-seq-250)";
  }

  if (matrix.cities.length === 0 || matrix.formats.length === 0) {
    return (
      <div className="rounded-2xl border border-border-subtle/80 bg-[var(--viz-surface)] p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
        <h3 className="font-serif text-lg text-burgundy">Stad × Format</h3>
        <p className="mt-6 py-4 text-center text-sm text-[var(--viz-ink-muted)]">
          Nog geen data
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-[var(--viz-surface)] p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
      <h3 className="font-serif text-lg text-burgundy">Stad × Format</h3>
      <p className="mt-0.5 text-xs text-[var(--viz-ink-secondary)]">
        Waar zit de vraag naar welk format — donkerder is meer aanmeldingen.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate" style={{ borderSpacing: 4 }}>
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-[var(--viz-ink-secondary)]" />
              {matrix.formats.map((format) => (
                <th
                  key={format}
                  className="px-1 pb-2 text-center text-[11px] font-medium text-[var(--viz-ink-secondary)]"
                >
                  {formatLabels[format] ?? format}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.cities.map((city, rowIndex) => (
              <tr key={city}>
                <td className="pr-3 text-right text-xs font-medium text-[var(--viz-ink-primary)]">
                  {city}
                </td>
                {matrix.formats.map((format, colIndex) => {
                  const count = matrix.counts[rowIndex]?.[colIndex] ?? 0;
                  const cellKey = `${city}-${format}`;
                  const isHovered = hovered === cellKey;
                  return (
                    <td key={format} className="p-0">
                      <div
                        className="group relative flex h-11 w-14 items-center justify-center rounded-lg text-xs font-semibold transition-transform"
                        style={{
                          backgroundColor: colorFor(count),
                          color: count / max > 0.5 ? "#ffffff" : "var(--viz-ink-primary)",
                          transform: isHovered ? "scale(1.06)" : undefined,
                        }}
                        onMouseEnter={() => setHovered(cellKey)}
                        onMouseLeave={() =>
                          setHovered((h) => (h === cellKey ? null : h))
                        }
                      >
                        {count > 0 ? count : ""}
                        {isHovered ? (
                          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--viz-ink-primary)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
                            {city} · {formatLabels[format] ?? format}: {count}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WaitlistInsightsView({
  insights,
  wachtlijstHref,
  labelMaps,
}: {
  insights: WaitlistInsights;
  wachtlijstHref: string;
  labelMaps: {
    city: Record<string, string>;
    format: Record<string, string>;
    gender: Record<string, string>;
    ageRange: Record<string, string>;
    why: Record<string, string>;
    company: Record<string, string>;
    tableType: Record<string, string>;
    vibe: Record<string, string>;
    budget: Record<string, string>;
    experience: Record<string, string>;
  };
}) {
  const weekOverWeekDelta = insights.thisWeek - insights.lastWeek;

  return (
    <div className="viz-root space-y-8">
      {vizStyle}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={wachtlijstHref}
            className="text-sm font-medium text-burgundy hover:underline"
          >
            ← Wachtlijst
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            MyTable
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Wachtlijst Insights
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Alles wat er binnenkomt via de wachtlijst — groei, wie het zijn, wat ze
            willen, en waar de vraag zit.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Totaal aanmeldingen" value={String(insights.totalSignups)} />
        <StatTile
          label="Deze week"
          value={String(insights.thisWeek)}
          delta={{ value: weekOverWeekDelta, suffix: "vs. vorige week" }}
        />
        <StatTile label="Deze maand" value={String(insights.thisMonth)} />
        <StatTile
          label="Gem. steden / aanmelding"
          value={insights.avgCitiesPerSignup.toFixed(1)}
        />
        <StatTile
          label="Vult vragen in"
          value={`${Math.round(insights.completionRate)}%`}
        />
      </div>

      <DailyTrendChart data={insights.dailySignups} />

      <div className="grid gap-4 lg:grid-cols-2">
        <HorizontalBars
          title="Funnel"
          subtitle="Hoe ver komen mensen na aanmelden"
          buckets={insights.funnel}
          total={insights.totalSignups}
        />
        <HorizontalBars
          title="Aanmeldingen per weekdag"
          buckets={insights.weekdaySignups}
          total={insights.totalSignups}
        />
      </div>

      <CityFormatMatrix
        matrix={insights.cityFormatMatrix}
        formatLabels={labelMaps.format}
      />

      <div>
        <h2 className="font-serif text-xl text-burgundy">Wie ze zijn en wat ze willen</h2>
        <p className="mt-1 text-sm text-wine/60">
          Elke balk = % van alle aanmeldingen — meerkeuzevragen tellen dus per keer
          dat een antwoord gekozen werd.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <HorizontalBars
            title="Steden"
            buckets={insights.breakdowns.city}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.city[id] ?? fallback}
          />
          <HorizontalBars
            title="Formats"
            buckets={insights.breakdowns.format}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.format[id] ?? fallback}
          />
          <HorizontalBars
            title="Gender"
            buckets={insights.breakdowns.gender}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.gender[id] ?? fallback}
          />
          <HorizontalBars
            title="Leeftijd"
            buckets={insights.breakdowns.ageRange}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.ageRange[id] ?? fallback}
          />
          <HorizontalBars
            title="Waarom"
            buckets={insights.breakdowns.why}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.why[id] ?? fallback}
          />
          <HorizontalBars
            title="Met wie"
            buckets={insights.breakdowns.company}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.company[id] ?? fallback}
          />
          <HorizontalBars
            title="Tafelkeuze"
            buckets={insights.breakdowns.tableType}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.tableType[id] ?? fallback}
          />
          <HorizontalBars
            title="Sfeer"
            buckets={insights.breakdowns.vibe}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.vibe[id] ?? fallback}
          />
          <HorizontalBars
            title="Budget"
            buckets={insights.breakdowns.budget}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.budget[id] ?? fallback}
          />
          <HorizontalBars
            title="Ervaring"
            buckets={insights.breakdowns.experience}
            total={insights.totalSignups}
            labelFor={(id, fallback) => labelMaps.experience[id] ?? fallback}
          />
        </div>
      </div>
    </div>
  );
}
