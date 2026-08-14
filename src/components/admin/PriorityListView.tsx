"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminPath } from "@/lib/admin-url";
import { removePriorityListSignupAction } from "@/app/admin/(dashboard)/priority-list/actions";
import type { PriorityListSignupRow } from "@/lib/priority-list-data";
import { priorityListRowsToExcelCsv } from "@/lib/priority-list-csv";
import {
  FORMAT_LABELS,
  GENDER_LABELS,
  AGE_LABELS,
  WHY_LABELS,
  COMPANY_LABELS,
  TABLE_TYPE_LABELS,
  VIBE_LABELS,
  BUDGET_LABELS,
  EXPERIENCE_LABELS,
  labelList,
} from "@/lib/priority-list-labels";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function isThisWeek(iso: string) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= weekAgo;
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-burgundy/20 bg-burgundy/[0.06] px-2.5 py-0.5 text-xs font-medium text-burgundy">
      {children}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-wine/85">{value}</p>
    </div>
  );
}

function confirmRemove(row: PriorityListSignupRow): boolean {
  const label = row.name?.trim() || row.email;
  const cities =
    row.cities.length > 0 ? `\n\nSteden: ${row.cities.join(", ")}` : "";

  return confirm(
    `Weet je zeker dat je ${label} van de wachtlijst wilt halen?${cities}\n\nDit kan niet ongedaan worden gemaakt.`,
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** One preference-array field (gender, why, company, ...) filterable by a
 * single chosen value — "contains" match, since the underlying answers are
 * multi-select. */
type PrefFilterKey =
  | "gender"
  | "ageRange"
  | "why"
  | "company"
  | "tableType"
  | "vibe"
  | "budget"
  | "experience";

const PREF_FILTERS: Array<{
  key: PrefFilterKey;
  label: string;
  options: Record<string, string>;
}> = [
  { key: "gender", label: "Gender", options: GENDER_LABELS },
  { key: "ageRange", label: "Leeftijd", options: AGE_LABELS },
  { key: "why", label: "Waarom", options: WHY_LABELS },
  { key: "company", label: "Met wie", options: COMPANY_LABELS },
  { key: "tableType", label: "Tafelkeuze", options: TABLE_TYPE_LABELS },
  { key: "vibe", label: "Sfeer", options: VIBE_LABELS },
  { key: "budget", label: "Budget", options: BUDGET_LABELS },
  { key: "experience", label: "Ervaring", options: EXPERIENCE_LABELS },
];

const EMPTY_PREF_FILTERS: Record<PrefFilterKey, string> = {
  gender: "all",
  ageRange: "all",
  why: "all",
  company: "all",
  tableType: "all",
  vibe: "all",
  budget: "all",
  experience: "all",
};

export function PriorityListView({
  signups: initialSignups,
}: {
  signups: PriorityListSignupRow[];
}) {
  const router = useRouter();
  const [signups, setSignups] = useState(initialSignups);
  const [cityFilter, setCityFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [prefFilters, setPrefFilters] =
    useState<Record<PrefFilterKey, string>>(EMPTY_PREF_FILTERS);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  useEffect(() => {
    setSignups(initialSignups);
  }, [initialSignups]);

  const cities = useMemo(
    () => [...new Set(signups.flatMap((signup) => signup.cities))].sort(),
    [signups],
  );

  const formats = useMemo(
    () =>
      [
        ...new Set(
          signups.flatMap((signup) => signup.preferences?.interests ?? []),
        ),
      ].sort(),
    [signups],
  );

  const activePrefFilterCount = useMemo(
    () => Object.values(prefFilters).filter((v) => v !== "all").length,
    [prefFilters],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return signups.filter((row) => {
      if (cityFilter !== "all" && !row.cities.includes(cityFilter)) return false;
      if (
        formatFilter !== "all" &&
        !(row.preferences?.interests ?? []).includes(formatFilter as never)
      )
        return false;
      for (const { key } of PREF_FILTERS) {
        const value = prefFilters[key];
        if (value === "all") continue;
        const fieldValues = (row.preferences?.[key] as string[] | undefined) ?? [];
        if (!fieldValues.includes(value)) return false;
      }
      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        (row.name?.toLowerCase().includes(q) ?? false) ||
        row.cities.some((city) => city.toLowerCase().includes(q))
      );
    });
  }, [signups, cityFilter, formatFilter, prefFilters, search]);

  const totalCitySelections = useMemo(
    () => filtered.reduce((sum, row) => sum + row.cities.length, 0),
    [filtered],
  );

  const thisWeekCount = useMemo(
    () => filtered.filter((row) => isThisWeek(row.createdAt)).length,
    [filtered],
  );

  const hasAnyFilter =
    cityFilter !== "all" ||
    formatFilter !== "all" ||
    activePrefFilterCount > 0 ||
    search.trim().length > 0;

  function resetFilters() {
    setCityFilter("all");
    setFormatFilter("all");
    setPrefFilters(EMPTY_PREF_FILTERS);
    setSearch("");
  }

  function handleExport() {
    const csv = priorityListRowsToExcelCsv(filtered);
    const date = new Date().toISOString().slice(0, 10);
    const suffix = hasAnyFilter ? "-gefilterd" : "";
    downloadCsv(csv, `mytable-wachtlijst${suffix}-${date}.xls`);
  }

  async function handleRemove(row: PriorityListSignupRow) {
    if (!confirmRemove(row)) return;

    setRemovingEmail(row.email);
    const result = await removePriorityListSignupAction(row.email);
    setRemovingEmail(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    setSignups((current) =>
      current.filter((signup) => signup.email !== row.email),
    );
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            MyTable
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Wachtlijst
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Iedereen op de wachtlijst: via de Sunday Table-pagina, de formatpagina's,
            of het opt-in vinkje bij een girls-only boeking. Klik een rij open voor
            gender, leeftijd, motivatie en voorkeuren.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <a
            href={adminPath("/priority-list/insights")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-burgundy/25 bg-cream px-5 py-2.5 text-sm font-medium text-burgundy transition hover:border-burgundy/50 hover:bg-burgundy/[0.04]"
          >
            Insights
            <span aria-hidden className="text-xs opacity-60">
              ↗
            </span>
          </a>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
          >
            Exporteer Excel{hasAnyFilter ? ` (${filtered.length} gefilterd)` : ""}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            {hasAnyFilter ? "In filter" : "Unieke aanmeldingen"}
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Deze week
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">{thisWeekCount}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Stadkeuzes totaal
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">{totalCitySelections}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of stad…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              aria-label="Filter op format"
            >
              <option value="all">Alle formats</option>
              {formats.map((format) => (
                <option key={format} value={format}>
                  {FORMAT_LABELS[format] ?? format}
                </option>
              ))}
            </select>
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
            <button
              type="button"
              onClick={() => setShowMoreFilters((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                activePrefFilterCount > 0
                  ? "border-burgundy/40 bg-burgundy/[0.06] text-burgundy"
                  : "border-border-subtle bg-cream text-wine hover:border-burgundy/40"
              }`}
            >
              Meer filters
              {activePrefFilterCount > 0 ? ` (${activePrefFilterCount})` : ""}
              <ChevronIcon open={showMoreFilters} />
            </button>
            {hasAnyFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-wine/50 underline-offset-2 hover:text-burgundy hover:underline"
              >
                Filters wissen
              </button>
            ) : null}
          </div>
        </div>

        {showMoreFilters ? (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-subtle/60 pt-4 sm:grid-cols-4">
            {PREF_FILTERS.map(({ key, label, options }) => (
              <label key={key} className="block text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-wine/50">
                  {label}
                </span>
                <select
                  value={prefFilters[key]}
                  onChange={(e) =>
                    setPrefFilters((current) => ({
                      ...current,
                      [key]: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
                  aria-label={`Filter op ${label.toLowerCase()}`}
                >
                  <option value="all">Alle</option>
                  {Object.entries(options).map(([id, optionLabel]) => (
                    <option key={id} value={id}>
                      {optionLabel}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center">
          <p className="font-serif text-xl text-burgundy">
            {hasAnyFilter ? "Geen aanmeldingen in dit filter" : "Nog geen aanmeldingen"}
          </p>
          <p className="mt-2 text-sm text-wine/60">
            {hasAnyFilter
              ? "Probeer een filter aan te passen of te wissen."
              : "Zodra iemand zich op de wachtlijst zet, verschijnt het hier."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Naam</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Steden</th>
                  <th className="px-5 py-3.5">Formats</th>
                  <th className="px-5 py-3.5">Aangemeld</th>
                  <th className="px-5 py-3.5 text-right">
                    <span className="sr-only">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isRemoving = removingEmail === row.email;
                  const isExpanded = expandedEmail === row.email;
                  const prefs = row.preferences;
                  const hasDetails =
                    prefs &&
                    ((prefs.gender?.length ?? 0) > 0 ||
                      (prefs.ageRange?.length ?? 0) > 0 ||
                      (prefs.why?.length ?? 0) > 0 ||
                      (prefs.company?.length ?? 0) > 0 ||
                      (prefs.tableType?.length ?? 0) > 0 ||
                      (prefs.vibe?.length ?? 0) > 0 ||
                      (prefs.budget?.length ?? 0) > 0 ||
                      (prefs.experience?.length ?? 0) > 0 ||
                      Boolean(prefs.whyOther));

                  return (
                    <>
                      <tr
                        key={row.email}
                        className={`border-b border-border-subtle/50 last:border-0 ${
                          hasDetails ? "cursor-pointer hover:bg-cream/40" : ""
                        }`}
                        onClick={() =>
                          hasDetails &&
                          setExpandedEmail((current) =>
                            current === row.email ? null : row.email,
                          )
                        }
                      >
                        <td className="px-5 py-4 font-medium text-wine">
                          <span className="flex items-center gap-2">
                            {hasDetails ? (
                              <ChevronIcon open={isExpanded} />
                            ) : (
                              <span className="w-4" aria-hidden />
                            )}
                            {row.name ?? <span className="text-wine/35">-</span>}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-wine/80">{row.email}</td>
                        <td className="px-5 py-4 text-wine/75">
                          {row.cities.join(", ")}
                        </td>
                        <td className="px-5 py-4">
                          {(prefs?.interests?.length ?? 0) > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {prefs!.interests.map((id) => (
                                <Chip key={id}>{FORMAT_LABELS[id] ?? id}</Chip>
                              ))}
                            </div>
                          ) : (
                            <span className="text-wine/35">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-wine/75">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRemove(row);
                            }}
                            disabled={isRemoving}
                            aria-label={`${row.name ?? row.email} van de lijst halen`}
                            title="Van de lijst halen"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-cream text-wine/70 transition-colors hover:border-red-800/40 hover:bg-red-50 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && hasDetails ? (
                        <tr className="border-b border-border-subtle/50 bg-cream/30 last:border-0">
                          <td colSpan={6} className="px-5 py-5">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                              <DetailField
                                label="Gender"
                                value={labelList(
                                  prefs!.gender ?? [],
                                  GENDER_LABELS,
                                ).join(", ")}
                              />
                              <DetailField
                                label="Leeftijd"
                                value={labelList(
                                  prefs!.ageRange ?? [],
                                  AGE_LABELS,
                                ).join(", ")}
                              />
                              <DetailField
                                label="Tafelkeuze"
                                value={labelList(
                                  prefs!.tableType ?? [],
                                  TABLE_TYPE_LABELS,
                                ).join(", ")}
                              />
                              <DetailField
                                label="Sfeer"
                                value={labelList(prefs!.vibe ?? [], VIBE_LABELS).join(
                                  ", ",
                                )}
                              />
                              <DetailField
                                label="Budget"
                                value={labelList(
                                  prefs!.budget ?? [],
                                  BUDGET_LABELS,
                                ).join(", ")}
                              />
                              <DetailField
                                label="Ervaring"
                                value={labelList(
                                  prefs!.experience ?? [],
                                  EXPERIENCE_LABELS,
                                ).join(", ")}
                              />
                              <DetailField
                                label="Met wie"
                                value={labelList(
                                  prefs!.company ?? [],
                                  COMPANY_LABELS,
                                ).join(", ")}
                              />
                              <DetailField
                                label="Waarom"
                                value={labelList(prefs!.why ?? [], WHY_LABELS).join(
                                  ", ",
                                )}
                              />
                              {prefs!.whyOther ? (
                                <div className="col-span-2 sm:col-span-4">
                                  <DetailField
                                    label="Anders, namelijk"
                                    value={prefs!.whyOther}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
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
