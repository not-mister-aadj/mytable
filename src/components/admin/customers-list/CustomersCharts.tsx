"use client";

import { useMemo } from "react";
import type { AdminCustomerListRow } from "@/lib/admin-customers-data";

const WEEKS = 16;
const TOP_CITIES = 10;

/** Monday 00:00 local time of the week `date` falls in. */
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function weekLabel(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  }).format(date);
}

type WeekBucket = { start: Date; signups: number; buyers: number };

function buildWeeks(rows: AdminCustomerListRow[]): WeekBucket[] {
  const firstWeek = startOfWeek(new Date());
  firstWeek.setDate(firstWeek.getDate() - (WEEKS - 1) * 7);

  const weeks: WeekBucket[] = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(firstWeek);
    start.setDate(firstWeek.getDate() + i * 7);
    return { start, signups: 0, buyers: 0 };
  });

  const indexOf = (iso: string | null): number => {
    if (!iso) return -1;
    const week = startOfWeek(new Date(iso));
    const diffDays = Math.round(
      (week.getTime() - firstWeek.getTime()) / (24 * 60 * 60 * 1000),
    );
    const index = Math.round(diffDays / 7);
    return index >= 0 && index < WEEKS ? index : -1;
  };

  for (const row of rows) {
    const signupIndex = indexOf(row.memberSince);
    if (signupIndex >= 0) weeks[signupIndex].signups += 1;
    if (row.isBuyer) {
      const buyerIndex = indexOf(row.firstBookingAt);
      if (buyerIndex >= 0) weeks[buyerIndex].buyers += 1;
    }
  }

  return weeks;
}

function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const width = 640;
  const height = 220;
  const padTop = 18;
  const padBottom = 28;
  const padX = 8;
  const chartHeight = height - padTop - padBottom;
  const groupWidth = (width - padX * 2) / weeks.length;
  const barWidth = Math.max(4, (groupWidth - 6) / 2);
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.signups, w.buyers)));

  const barY = (value: number) => padTop + chartHeight - (value / max) * chartHeight;
  const barH = (value: number) => (value / max) * chartHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Aanmeldingen en eerste aankopen per week"
    >
      <line
        x1={padX}
        x2={width - padX}
        y1={padTop + chartHeight}
        y2={padTop + chartHeight}
        className="stroke-wine/20"
        strokeWidth={1}
      />
      {weeks.map((week, i) => {
        const x = padX + i * groupWidth + (groupWidth - barWidth * 2 - 2) / 2;
        return (
          <g key={week.start.toISOString()}>
            <title>
              {`Week van ${weekLabel(week.start)}: ${week.signups} aanmeldingen, ${week.buyers} eerste aankopen`}
            </title>
            <rect
              x={x}
              y={barY(week.signups)}
              width={barWidth}
              height={barH(week.signups)}
              rx={2}
              className="fill-burgundy"
            />
            <rect
              x={x + barWidth + 2}
              y={barY(week.buyers)}
              width={barWidth}
              height={barH(week.buyers)}
              rx={2}
              className="fill-gold"
            />
            {week.signups > 0 ? (
              <text
                x={x + barWidth / 2}
                y={barY(week.signups) - 4}
                textAnchor="middle"
                className="fill-wine/60 text-[9px]"
              >
                {week.signups}
              </text>
            ) : null}
            {week.buyers > 0 ? (
              <text
                x={x + barWidth * 1.5 + 2}
                y={barY(week.buyers) - 4}
                textAnchor="middle"
                className="fill-wine/60 text-[9px]"
              >
                {week.buyers}
              </text>
            ) : null}
            {i % 2 === 0 ? (
              <text
                x={padX + i * groupWidth + groupWidth / 2}
                y={height - 8}
                textAnchor="middle"
                className="fill-wine/50 text-[10px]"
              >
                {weekLabel(week.start)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function CityBars({ rows }: { rows: AdminCustomerListRow[] }) {
  const { top, unknown } = useMemo(() => {
    const counts = new Map<string, number>();
    let unknownCount = 0;
    for (const row of rows) {
      if (!row.city) {
        unknownCount += 1;
        continue;
      }
      counts.set(row.city, (counts.get(row.city) ?? 0) + 1);
    }
    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nl"))
      .slice(0, TOP_CITIES);
    return { top: sorted, unknown: unknownCount };
  }, [rows]);

  const max = Math.max(1, ...top.map(([, count]) => count));

  if (top.length === 0) {
    return <p className="text-sm text-wine/55">Geen steden in deze selectie.</p>;
  }

  return (
    <div className="space-y-2">
      {top.map(([city, count]) => (
        <div key={city} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-wine/75">{city}</span>
          <div className="h-4 flex-1 rounded-full bg-beige/70">
            <div
              className="h-4 rounded-full bg-burgundy"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-medium text-wine">
            {count}
          </span>
        </div>
      ))}
      {unknown > 0 ? (
        <p className="pt-1 text-xs text-wine/50">{unknown} zonder bekende stad</p>
      ) : null}
    </div>
  );
}

export function CustomersCharts({ rows }: { rows: AdminCustomerListRow[] }) {
  const weeks = useMemo(() => buildWeeks(rows), [rows]);

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
            Aanmeldingen per week
          </p>
          <div className="flex items-center gap-4 text-xs text-wine/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-burgundy" /> Aanmeldingen
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Eerste aankopen
            </span>
          </div>
        </div>
        <div className="mt-4">
          <WeeklyChart weeks={weeks} />
        </div>
        <p className="mt-2 text-xs text-wine/50">
          Laatste {WEEKS} weken, op basis van de huidige filters. Aanmeldingen
          tellen per week van Lid sinds, eerste aankopen per week van de
          eerste aankoop.
        </p>
      </div>
      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
          Klanten per stad
        </p>
        <div className="mt-4">
          <CityBars rows={rows} />
        </div>
      </div>
    </div>
  );
}
