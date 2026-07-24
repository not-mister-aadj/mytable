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

type GroupedSignup = {
  email: string;
  name: string | null;
  locale: string;
  createdAt: string;
  cities: string[];
  preferences: WaitlistSignupRow["preferences"];
  rowCount: number;
};

function groupSignups(signups: WaitlistSignupRow[]): GroupedSignup[] {
  const byEmail = new Map<string, WaitlistSignupRow[]>();
  for (const row of signups) {
    const key = row.email.toLowerCase();
    const list = byEmail.get(key) ?? [];
    list.push(row);
    byEmail.set(key, list);
  }

  return [...byEmail.values()]
    .map((rows) => {
      const sorted = [...rows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const withPrefs =
        sorted.find((row) => row.preferences != null) ?? sorted[0]!;
      const labels = formatWaitlistPreferenceLabels(withPrefs.preferences);
      const citySet = new Set<string>();
      for (const row of sorted) {
        if (row.city) citySet.add(row.city);
        for (const city of row.preferences?.cities ?? []) citySet.add(city);
      }
      for (const city of labels.cities) citySet.add(city);

      return {
        email: withPrefs.email,
        name: sorted.find((row) => row.name?.trim())?.name ?? null,
        locale: withPrefs.locale,
        createdAt: sorted[0]!.createdAt,
        cities: [...citySet].sort(),
        preferences: withPrefs.preferences,
        rowCount: sorted.length,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function AnswerBlock({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-wine/45">
        {label}
      </p>
      {values.length === 0 ? (
        <p className="mt-1 text-sm text-wine/35">—</p>
      ) : (
        <p className="mt-1 text-sm leading-relaxed text-wine/80">
          {values.join(" · ")}
        </p>
      )}
    </div>
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

  const grouped = useMemo(() => groupSignups(signups), [signups]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const row of grouped) {
      for (const city of row.cities) set.add(city);
    }
    return [...set].sort();
  }, [grouped]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grouped.filter((row) => {
      const labels = formatWaitlistPreferenceLabels(row.preferences);
      const cityMatch =
        cityFilter === "all" || row.cities.includes(cityFilter);
      if (!cityMatch) return false;
      if (!q) return true;
      const haystack = [
        row.email,
        row.name ?? "",
        joinPreferenceLabels(row.cities),
        joinPreferenceLabels(labels.interests),
        joinPreferenceLabels(labels.why),
        joinPreferenceLabels(labels.company),
        joinPreferenceLabels(labels.tableType),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [grouped, cityFilter, search]);

  return (
    <div className="space-y-8 lg:max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            Marketing
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Wachtlijst
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Eén kaart per persoon met alle quiz-antwoorden. Oudere
            e-mailaanmeldingen zonder quiz tonen streepjes bij de antwoorden.
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
              {filtered.length === 1 ? "persoon" : "personen"}
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
        <ul className="space-y-4">
          {filtered.map((row) => {
            const labels = formatWaitlistPreferenceLabels(row.preferences);
            return (
              <li
                key={row.email}
                className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.04)] sm:p-6"
              >
                <div className="flex flex-col gap-3 border-b border-border-subtle/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-serif text-xl text-burgundy">
                      {row.name?.trim() || "Geen naam"}
                    </p>
                    <p className="mt-1 text-sm text-wine/70">{row.email}</p>
                  </div>
                  <div className="text-sm text-wine/55 sm:text-right">
                    <p className="uppercase tracking-[0.08em]">{row.locale}</p>
                    <p className="mt-1">{formatDate(row.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnswerBlock label="Ervaringen" values={labels.interests} />
                  <AnswerBlock label="Waarom" values={labels.why} />
                  <AnswerBlock label="Hoe komen" values={labels.company} />
                  <AnswerBlock label="Type tafel" values={labels.tableType} />
                  <AnswerBlock label="Steden" values={row.cities} />
                  <AnswerBlock
                    label="Flexibel in regio"
                    values={[labels.regionFlexible ? "Ja" : "Nee"]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
