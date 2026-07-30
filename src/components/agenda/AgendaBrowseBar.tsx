"use client";

import type { Dictionary } from "@/i18n/types";
import type { DateFilterOption } from "@/lib/agenda";

interface AgendaBrowseBarProps {
  browse: Dictionary["agenda"]["browse"];
  cities: string[];
  dates: DateFilterOption[];
  selectedCity: string;
  selectedDate: string;
  onCityChange: (city: string) => void;
  onDateChange: (dateKey: string) => void;
  resultCount: number;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function AgendaBrowseBar({
  browse,
  cities,
  dates,
  selectedCity,
  selectedDate,
  onCityChange,
  onDateChange,
  resultCount,
  onClear,
  hasActiveFilters,
}: AgendaBrowseBarProps) {
  const selectClass =
    "w-full appearance-none rounded-xl border border-wine/15 bg-cream px-3.5 py-2.5 pr-9 text-sm font-medium text-wine shadow-sm transition focus:border-wine/30 focus:outline-none focus:ring-2 focus:ring-wine/10";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-wine/55">
            {browse.cityLabel}
          </span>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className={selectClass}
              aria-label={browse.cityLabel}
            >
              <option value="">{browse.cityAll}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-wine/40"
              aria-hidden
            >
              ▾
            </span>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-wine/55">
            {browse.dateLabel}
          </span>
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className={selectClass}
              aria-label={browse.dateLabel}
            >
              <option value="">{browse.dateAll}</option>
              {dates.map((date) => (
                <option key={date.key} value={date.key}>
                  {date.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-wine/40"
              aria-hidden
            >
              ▾
            </span>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-wine/60">
          {browse.results.replace("{count}", String(resultCount))}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-burgundy underline-offset-2 transition hover:text-wine hover:underline"
          >
            {browse.clear}
          </button>
        ) : null}
      </div>
    </div>
  );
}
