"use client";

export type BookingFilters = {
  search: string;
  timing: "all" | "upcoming" | "past";
  city: string;
  experienceType: string;
  audience: "all" | "girlsOnly" | "mixed";
  occupancy: "all" | "available" | "almostFull" | "soldOut";
};

export const defaultBookingFilters: BookingFilters = {
  search: "",
  timing: "all",
  city: "all",
  experienceType: "all",
  audience: "all",
  occupancy: "all",
};

export function BookingsFilters({
  filters,
  cities,
  experienceTypes,
  resultCount,
  onChange,
}: {
  filters: BookingFilters;
  cities: string[];
  experienceTypes: string[];
  resultCount: number;
  onChange: (next: BookingFilters) => void;
}) {
  const selectClass =
    "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-wine/40"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Zoek op naam, e-mail, code of tafel…"
            className="w-full rounded-full border border-border-subtle bg-cream py-2.5 pl-10 pr-4 text-sm text-wine shadow-[0_4px_20px_rgba(43,13,18,0.03)] outline-none transition placeholder:text-wine/40 focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
        </div>
        <p className="text-sm text-wine/55">
          {resultCount} bevestigd{resultCount === 1 ? "" : "e"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.timing}
          onChange={(e) =>
            onChange({
              ...filters,
              timing: e.target.value as BookingFilters["timing"],
            })
          }
          className={selectClass}
          aria-label="Periode"
        >
          <option value="all">Alle datums</option>
          <option value="upcoming">Aankomend</option>
          <option value="past">Afgelopen</option>
        </select>

        <select
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          className={selectClass}
          aria-label="Stad"
        >
          <option value="all">Alle steden</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={filters.experienceType}
          onChange={(e) =>
            onChange({ ...filters, experienceType: e.target.value })
          }
          className={selectClass}
          aria-label="Type"
        >
          <option value="all">Alle types</option>
          {experienceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.audience}
          onChange={(e) =>
            onChange({
              ...filters,
              audience: e.target.value as BookingFilters["audience"],
            })
          }
          className={selectClass}
          aria-label="Doelgroep"
        >
          <option value="all">Girls only & gemengd</option>
          <option value="girlsOnly">Girls only</option>
          <option value="mixed">Gemengd</option>
        </select>

        <select
          value={filters.occupancy}
          onChange={(e) =>
            onChange({
              ...filters,
              occupancy: e.target.value as BookingFilters["occupancy"],
            })
          }
          className={selectClass}
          aria-label="Bezetting"
        >
          <option value="all">Alle bezetting</option>
          <option value="available">Ruimte beschikbaar</option>
          <option value="almostFull">Bijna vol</option>
          <option value="soldOut">Uitverkocht</option>
        </select>
      </div>
    </div>
  );
}
