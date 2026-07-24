"use client";

import { useMemo, useState } from "react";
import type { WaitlistSignupRow } from "@/lib/waitlist-data";
import {
  formatWaitlistPreferenceLabels,
  joinPreferenceLabels,
} from "@/lib/waitlist-preference-labels";
import type { WaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp";
import { WaitlistWhatsappLinksForm } from "./WaitlistWhatsappLinksForm";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function AnswersCell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-wine/35">—</span>;
  }
  return (
    <ul className="space-y-0.5">
      {values.map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  );
}

export function WaitlistView({
  signups,
  whatsappLinks,
}: {
  signups: WaitlistSignupRow[];
  whatsappLinks: WaitlistWhatsappLinks;
}) {
  const [cityFilter, setCityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const row of signups) {
      if (row.city) set.add(row.city);
      for (const city of row.preferences?.cities ?? []) set.add(city);
    }
    return [...set].sort();
  }, [signups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return signups.filter((row) => {
      const labels = formatWaitlistPreferenceLabels(row.preferences);
      const cityMatch =
        cityFilter === "all" ||
        row.city === cityFilter ||
        labels.cities.includes(cityFilter);
      if (!cityMatch) return false;
      if (!q) return true;
      const haystack = [
        row.email,
        row.name ?? "",
        row.city,
        joinPreferenceLabels(labels.interests),
        joinPreferenceLabels(labels.why),
        joinPreferenceLabels(labels.company),
        joinPreferenceLabels(labels.tableType),
        joinPreferenceLabels(labels.cities),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [signups, cityFilter, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            Marketing
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Wachtlijst
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Aanmeldingen via de wachtlijst-quiz. Alle antwoorden staan per rij.
            WhatsApp-links stel je hieronder in.
          </p>
        </div>
        <a
          href="/api/admin/waitlist/export"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
        >
          Exporteer Excel
        </a>
      </div>

      <WaitlistWhatsappLinksForm initialLinks={whatsappLinks} />

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail, stad of antwoord…"
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
            <p className="text-sm text-wine/55">
              {filtered.length}{" "}
              {filtered.length === 1 ? "inschrijving" : "inschrijvingen"}
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center">
          <p className="font-serif text-xl text-burgundy">Nog geen inschrijvingen</p>
          <p className="mt-2 text-sm text-wine/60">
            Zodra iemand zich aanmeldt op de website, verschijnt het hier.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Naam</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Ervaringen</th>
                  <th className="px-5 py-3.5">Waarom</th>
                  <th className="px-5 py-3.5">Hoe komen</th>
                  <th className="px-5 py-3.5">Type tafel</th>
                  <th className="px-5 py-3.5">Steden</th>
                  <th className="px-5 py-3.5">Flexibel</th>
                  <th className="px-5 py-3.5">Taal</th>
                  <th className="px-5 py-3.5">Aangemeld</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const labels = formatWaitlistPreferenceLabels(row.preferences);
                  const citiesShown =
                    labels.cities.length > 0 ? labels.cities : [row.city];

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border-subtle/50 align-top last:border-0"
                    >
                      <td className="px-5 py-4 font-medium text-wine">
                        {row.name?.trim() || (
                          <span className="font-normal text-wine/35">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-wine/80">{row.email}</td>
                      <td className="px-5 py-4 text-wine/75">
                        <AnswersCell values={labels.interests} />
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        <AnswersCell values={labels.why} />
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        <AnswersCell values={labels.company} />
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        <AnswersCell values={labels.tableType} />
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        <AnswersCell values={citiesShown} />
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        {labels.regionFlexible ? "Ja" : "Nee"}
                      </td>
                      <td className="px-5 py-4 uppercase text-wine/60">
                        {row.locale}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-wine/75">
                        {formatDate(row.createdAt)}
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
