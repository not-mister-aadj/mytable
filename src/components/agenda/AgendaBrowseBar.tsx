"use client";

import type { Dictionary } from "@/i18n/types";

interface AgendaBrowseBarProps {
  browse: Dictionary["agenda"]["browse"];
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
  /** Age brackets on offer ("20-39", "35+"); the row is hidden when empty. */
  ageBrackets: string[];
  selectedAge: string;
  onAgeChange: (bracket: string) => void;
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
  ageBrackets,
  selectedAge,
  onAgeChange,
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

  // On phones this bar sticks under the header while the cards scroll by,
  // so it stays compact there: one swipeable line per filter, the group
  // names only for screen readers, and no waitlist line (the page ends with
  // its own waitlist block).
  const labelClass =
    "sr-only text-[11px] font-semibold uppercase tracking-[0.16em] text-wine/55 sm:not-sr-only sm:mb-2 sm:block";
  const rowClass =
    "-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden";

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div>
        <span className={labelClass}>
          {browse.cityLabel}
        </span>
        <div
          className={rowClass}
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

      {ageBrackets.length > 0 ? (
        <div>
          <span className={labelClass}>
            {browse.ageLabel}
          </span>
          <div
            className={rowClass}
            role="group"
            aria-label={browse.ageLabel}
          >
            <button
              type="button"
              onClick={() => onAgeChange("")}
              className={`${chipBase} ${selectedAge === "" ? chipActive : chipInactive}`}
            >
              {browse.ageAll}
            </button>
            {ageBrackets.map((bracket) => (
              <button
                key={bracket}
                type="button"
                onClick={() => onAgeChange(bracket)}
                className={`${chipBase} ${selectedAge === bracket ? chipActive : chipInactive}`}
              >
                {browse.ageOption.replace("{bracket}", bracket)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <p className="text-sm text-wine/60">
            {resultCount === 1
              ? browse.resultsOne
              : browse.results.replace("{count}", String(resultCount))}
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
        <p className="hidden text-sm text-wine/55 sm:block">
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
