"use client";

import type { Dictionary } from "@/i18n/types";

interface AgendaBrowseBarProps {
  browse: Dictionary["agenda"]["browse"];
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
  resultCount: number;
  onClear: () => void;
  hasActiveFilters: boolean;
  /** Opens the waitlist modal for "your city isn't here yet". */
  onWaitlistClick: () => void;
}

export function AgendaBrowseBar({
  browse,
  cities,
  selectedCity,
  onCityChange,
  resultCount,
  onClear,
  hasActiveFilters,
  onWaitlistClick,
}: AgendaBrowseBarProps) {
  const chipBase =
    "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition";
  const chipActive = "border-burgundy bg-burgundy text-cream";
  const chipInactive =
    "border-wine/15 bg-cream text-wine/70 hover:border-wine/30 hover:text-wine";

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-wine/55">
          {browse.cityLabel}
        </span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={browse.cityLabel}
        >
          <button
            type="button"
            onClick={() => onCityChange("")}
            className={`${chipBase} ${selectedCity === "" ? chipActive : chipInactive}`}
          >
            {browse.cityAll}
          </button>
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onCityChange(city)}
              className={`${chipBase} ${selectedCity === city ? chipActive : chipInactive}`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
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
        <p className="text-sm text-wine/55">
          {browse.cityMissingNote}{" "}
          <button
            type="button"
            onClick={onWaitlistClick}
            className="font-medium text-burgundy underline-offset-2 transition hover:text-wine hover:underline"
          >
            {browse.cityMissingCta}
          </button>
        </p>
      </div>
    </div>
  );
}
