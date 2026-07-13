"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { removePriorityListSignupAction } from "@/app/admin/(dashboard)/priority-list/actions";
import type { PriorityListSignupRow } from "@/lib/priority-list-data";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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

function confirmRemove(row: PriorityListSignupRow): boolean {
  const label = row.name?.trim() || row.email;
  const cities =
    row.cities.length > 0 ? `\n\nSteden: ${row.cities.join(", ")}` : "";

  return confirm(
    `Weet je zeker dat je ${label} van de Priority List wilt halen?${cities}\n\nDit kan niet ongedaan worden gemaakt.`,
  );
}

export function PriorityListView({
  signups: initialSignups,
}: {
  signups: PriorityListSignupRow[];
}) {
  const router = useRouter();
  const [signups, setSignups] = useState(initialSignups);
  const [cityFilter, setCityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  useEffect(() => {
    setSignups(initialSignups);
  }, [initialSignups]);

  const cities = useMemo(
    () => [...new Set(signups.flatMap((signup) => signup.cities))].sort(),
    [signups],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return signups.filter((row) => {
      if (cityFilter !== "all" && !row.cities.includes(cityFilter)) return false;
      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        (row.name?.toLowerCase().includes(q) ?? false) ||
        row.cities.some((city) => city.toLowerCase().includes(q))
      );
    });
  }, [signups, cityFilter, search]);

  const totalCitySelections = useMemo(
    () => filtered.reduce((sum, row) => sum + row.cities.length, 0),
    [filtered],
  );

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
            Girls Only
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Priority List
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Aanmeldingen via de Priority List op de girls-only landingspagina.
          </p>
        </div>
        <a
          href="/api/admin/priority-list/export"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
        >
          Exporteer Excel
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Unieke aanmeldingen
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">{filtered.length}</p>
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
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center">
          <p className="font-serif text-xl text-burgundy">Nog geen aanmeldingen</p>
          <p className="mt-2 text-sm text-wine/60">
            Zodra iemand zich aanmeldt op de girls-only pagina, verschijnt het hier.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Naam</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Steden</th>
                  <th className="px-5 py-3.5">Taal</th>
                  <th className="px-5 py-3.5">Aangemeld</th>
                  <th className="px-5 py-3.5 text-right">
                    <span className="sr-only">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isRemoving = removingEmail === row.email;

                  return (
                    <tr
                      key={row.email}
                      className="border-b border-border-subtle/50 last:border-0"
                    >
                      <td className="px-5 py-4 font-medium text-wine">
                        {row.name ?? <span className="text-wine/35">—</span>}
                      </td>
                      <td className="px-5 py-4 text-wine/80">{row.email}</td>
                      <td className="px-5 py-4 text-wine/75">
                        {row.cities.join(", ")}
                      </td>
                      <td className="px-5 py-4 uppercase text-wine/60">
                        {row.locale}
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void handleRemove(row)}
                          disabled={isRemoving}
                          aria-label={`${row.name ?? row.email} van de lijst halen`}
                          title="Van de lijst halen"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-cream text-wine/70 transition-colors hover:border-red-800/40 hover:bg-red-50 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon />
                        </button>
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
