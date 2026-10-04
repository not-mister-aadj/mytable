"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CONCEPT_FILTER_OPTIONS,
  ConceptBadge,
  matchesConceptFilter,
  type ConceptFilter,
} from "@/components/admin/ConceptBadge";
import type {
  AdminCustomerListRow,
  AdminCustomersPageData,
} from "@/lib/admin-customers-data";
import { adminPath } from "@/lib/admin-url";
import { formatMoney } from "@/lib/booking-display";
import {
  customerStatusPillClass,
} from "@/lib/customers/status";
import type { CustomerStatusKey } from "@/lib/customers/types";
import { WAITLIST_LANGUAGE_LABELS } from "@/lib/customers/list-answers";
import { customerRowsToCsv } from "@/lib/customers/list-csv";
import {
  AGE_LABELS,
  GENDER_LABELS,
  TICKET_PRICE_LABELS,
} from "@/lib/priority-list-labels";
import { CustomersCharts } from "@/components/admin/customers-list/CustomersCharts";
import { CustomerCampaignPanel } from "@/components/admin/customers-list/CustomerCampaignPanel";

type FilterKey =
  | "all"
  | "paying"
  | "repeat"
  | "failed_payments";

type BuyerFilter = "all" | "buyers" | "waitlist_only";

type SortKey =
  | "name"
  | "email"
  | "city"
  | "memberSince"
  | "firstBookingAt"
  | "bookings"
  | "seats"
  | "spent"
  | "lastBookingAt"
  | "status";

type SortDir = "asc" | "desc";

/** Filter value for "question not answered" on the waitlist answer filters. */
const NOT_ANSWERED = "__none";

const STATUS_FILTER_LABELS: Record<Exclude<FilterKey, "all">, string> = {
  paying: "Betalend",
  repeat: "Terugkerend",
  failed_payments: "Betalingsprobleem",
};

const BUYER_FILTER_LABELS: Record<Exclude<BuyerFilter, "all">, string> = {
  buyers: "Koper",
  waitlist_only: "Alleen wachtlijst",
};

const COLUMNS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: "name", label: "Klant", defaultDir: "asc" },
  { key: "email", label: "E-mail", defaultDir: "asc" },
  { key: "city", label: "Stad", defaultDir: "asc" },
  { key: "memberSince", label: "Lid sinds", defaultDir: "desc" },
  { key: "firstBookingAt", label: "Eerste aankoop", defaultDir: "desc" },
  { key: "bookings", label: "Boekingen", defaultDir: "desc" },
  { key: "seats", label: "Plekken", defaultDir: "desc" },
  { key: "spent", label: "Totaal besteed", defaultDir: "desc" },
  { key: "lastBookingAt", label: "Laatste boeking", defaultDir: "desc" },
  { key: "status", label: "Status", defaultDir: "asc" },
];

function sortValue(row: AdminCustomerListRow, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return row.displayName.toLowerCase();
    case "email":
      return row.email.toLowerCase();
    case "city":
      return row.city?.toLowerCase() ?? null;
    case "memberSince":
      return new Date(row.memberSince).getTime();
    case "firstBookingAt":
      return row.firstBookingAt ? new Date(row.firstBookingAt).getTime() : null;
    case "bookings":
      return row.paidBookingsCount;
    case "seats":
      return row.totalSeatsBooked;
    case "spent":
      return row.totalSpentCents;
    case "lastBookingAt":
      return row.lastBookingAt ? new Date(row.lastBookingAt).getTime() : null;
    case "status":
      return row.statusLabel.toLowerCase();
  }
}

function compareRows(
  a: AdminCustomerListRow,
  b: AdminCustomerListRow,
  key: SortKey,
  dir: SortDir,
): number {
  const va = sortValue(a, key);
  const vb = sortValue(b, key);
  // Empty values always go to the bottom, whatever the direction.
  if (va === null && vb === null) return 0;
  if (va === null) return 1;
  if (vb === null) return -1;
  const base =
    typeof va === "number" && typeof vb === "number"
      ? va - vb
      : String(va).localeCompare(String(vb), "nl");
  return dir === "asc" ? base : -base;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatInputDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function answerLabel(value: string, labels: Record<string, string>) {
  if (value === NOT_ANSWERED) return "Niet ingevuld";
  return labels[value] ?? value;
}

function matchesAnswer(filter: string, value: string | null) {
  if (filter === "all") return true;
  if (filter === NOT_ANSWERED) return value === null;
  return value === filter;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-burgundy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-wine/55">{hint}</p> : null}
    </div>
  );
}

const selectClass =
  "rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40";

function AnswerSelect({
  value,
  onChange,
  allLabel,
  labels,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  labels: Record<string, string>;
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClass}
      aria-label={ariaLabel}
    >
      <option value="all">{allLabel}</option>
      {Object.entries(labels).map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
      <option value={NOT_ANSWERED}>Niet ingevuld</option>
    </select>
  );
}

export function CustomersView({ data }: { data: AdminCustomersPageData }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");
  const [buyerFilter, setBuyerFilter] = useState<BuyerFilter>("all");
  const [conceptFilter, setConceptFilter] = useState<ConceptFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ageFilter, setAgeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("memberSince");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [chartsOpen, setChartsOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return data.customers.filter((row) => {
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (
        eventTypeFilter !== "all" &&
        row.favoriteEventType !== eventTypeFilter
      ) {
        return false;
      }

      if (statusFilter === "paying" && row.paidBookingsCount === 0) return false;
      if (statusFilter === "repeat" && row.paidBookingsCount < 2) return false;
      if (statusFilter === "failed_payments" && row.failedPaymentsCount === 0) {
        return false;
      }

      if (
        conceptFilter !== "all" &&
        (!row.signupConcept || !matchesConceptFilter(conceptFilter, row.signupConcept, row.hasAccount))
      ) {
        return false;
      }

      if (buyerFilter === "buyers" && !row.isBuyer) return false;
      if (buyerFilter === "waitlist_only" && row.isBuyer) return false;

      const memberSince = new Date(row.memberSince).getTime();
      if (fromTime !== null && memberSince < fromTime) return false;
      if (toTime !== null && memberSince > toTime) return false;

      if (!matchesAnswer(ageFilter, row.ageRange)) return false;
      if (!matchesAnswer(genderFilter, row.gender)) return false;
      if (!matchesAnswer(languageFilter, row.waitlistLanguage)) return false;
      if (!matchesAnswer(budgetFilter, row.ticketBudget)) return false;

      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        row.displayName.toLowerCase().includes(q) ||
        (row.city?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    data.customers,
    search,
    cityFilter,
    eventTypeFilter,
    statusFilter,
    buyerFilter,
    conceptFilter,
    fromDate,
    toDate,
    ageFilter,
    genderFilter,
    languageFilter,
    budgetFilter,
  ]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [filtered, sortKey, sortDir],
  );

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(COLUMNS.find((c) => c.key === key)?.defaultDir ?? "asc");
  }

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (search.trim()) {
    chips.push({ key: "search", label: `Zoek: ${search.trim()}`, clear: () => setSearch("") });
  }
  if (buyerFilter !== "all") {
    chips.push({
      key: "buyer",
      label: BUYER_FILTER_LABELS[buyerFilter],
      clear: () => setBuyerFilter("all"),
    });
  }
  if (conceptFilter !== "all") {
    chips.push({
      key: "concept",
      label: `Concept: ${CONCEPT_FILTER_OPTIONS.find((o) => o.value === conceptFilter)?.label ?? conceptFilter}`,
      clear: () => setConceptFilter("all"),
    });
  }
  if (statusFilter !== "all") {
    chips.push({
      key: "status",
      label: `Status: ${STATUS_FILTER_LABELS[statusFilter]}`,
      clear: () => setStatusFilter("all"),
    });
  }
  if (cityFilter !== "all") {
    chips.push({ key: "city", label: `Stad: ${cityFilter}`, clear: () => setCityFilter("all") });
  }
  if (eventTypeFilter !== "all") {
    chips.push({
      key: "type",
      label: `Type: ${eventTypeFilter}`,
      clear: () => setEventTypeFilter("all"),
    });
  }
  if (fromDate) {
    chips.push({
      key: "from",
      label: `Aangemeld van ${formatInputDate(fromDate)}`,
      clear: () => setFromDate(""),
    });
  }
  if (toDate) {
    chips.push({
      key: "to",
      label: `Aangemeld tot ${formatInputDate(toDate)}`,
      clear: () => setToDate(""),
    });
  }
  if (ageFilter !== "all") {
    chips.push({
      key: "age",
      label: `Leeftijd: ${answerLabel(ageFilter, AGE_LABELS)}`,
      clear: () => setAgeFilter("all"),
    });
  }
  if (genderFilter !== "all") {
    chips.push({
      key: "gender",
      label: `Geslacht: ${answerLabel(genderFilter, GENDER_LABELS)}`,
      clear: () => setGenderFilter("all"),
    });
  }
  if (languageFilter !== "all") {
    chips.push({
      key: "language",
      label: `Taal: ${answerLabel(languageFilter, WAITLIST_LANGUAGE_LABELS)}`,
      clear: () => setLanguageFilter("all"),
    });
  }
  if (budgetFilter !== "all") {
    chips.push({
      key: "budget",
      label: `Ticketbudget: ${answerLabel(budgetFilter, TICKET_PRICE_LABELS)}`,
      clear: () => setBudgetFilter("all"),
    });
  }

  function clearAll() {
    setSearch("");
    setBuyerFilter("all");
    setConceptFilter("all");
    setStatusFilter("all");
    setCityFilter("all");
    setEventTypeFilter("all");
    setFromDate("");
    setToDate("");
    setAgeFilter("all");
    setGenderFilter("all");
    setLanguageFilter("all");
    setBudgetFilter("all");
  }

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(customerRowsToCsv(sorted), `mytable-klanten-${date}.csv`);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
          CRM
        </p>
        <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
          Klanten
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          Iedereen die zich aanmeldde of boekte, op basis van e-mailadres. De
          cijfers hieronder tellen alleen kopers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Totaal klanten" value={String(data.kpis.totalCustomers)} />
        <KpiCard
          label="Betalende klanten"
          value={String(data.kpis.payingCustomers)}
        />
        <KpiCard
          label="Terugkerende gasten"
          value={String(data.kpis.repeatCustomers)}
        />
        <KpiCard
          label="Totale omzet"
          value={formatMoney(data.kpis.totalRevenueCents, "EUR", "nl")}
        />
        <KpiCard
          label="Gem. besteding"
          value={formatMoney(data.kpis.avgSpendPerCustomerCents, "EUR", "nl")}
          hint="Per betalende klant"
        />
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setChartsOpen((open) => !open)}
          aria-expanded={chartsOpen}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm font-medium text-wine transition hover:border-burgundy/40 hover:text-burgundy"
        >
          <span aria-hidden>{chartsOpen ? "▾" : "▸"}</span>
          Grafieken
        </button>
        {chartsOpen ? <CustomersCharts rows={filtered} /> : null}
      </div>

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op e-mail, naam of stad…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <select
            value={buyerFilter}
            onChange={(e) => setBuyerFilter(e.target.value as BuyerFilter)}
            className={selectClass}
            aria-label="Filter op koper of wachtlijst"
          >
            <option value="all">Iedereen</option>
            <option value="buyers">Koper</option>
            <option value="waitlist_only">Alleen wachtlijst</option>
          </select>
          <select
            value={conceptFilter}
            onChange={(e) => setConceptFilter(e.target.value as ConceptFilter)}
            className={selectClass}
            aria-label="Filter op concept"
          >
            {CONCEPT_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterKey)}
            className={selectClass}
            aria-label="Filter op status"
          >
            <option value="all">Alle statussen</option>
            <option value="paying">Betalend</option>
            <option value="repeat">Terugkerend</option>
            <option value="failed_payments">Betalingsprobleem</option>
          </select>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter op stad"
          >
            <option value="all">Alle steden</option>
            {data.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter op type"
          >
            <option value="all">Alle types</option>
            {data.eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="text-sm text-wine/55 lg:ml-auto">
            {filtered.length} van {data.customers.length}
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <label className="flex items-center gap-2 text-sm text-wine/65">
            Aangemeld van
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={selectClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-wine/65">
            tot
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={selectClass}
            />
          </label>
          <AnswerSelect
            value={ageFilter}
            onChange={setAgeFilter}
            allLabel="Alle leeftijden"
            labels={AGE_LABELS}
            ariaLabel="Filter op leeftijd"
          />
          <AnswerSelect
            value={genderFilter}
            onChange={setGenderFilter}
            allLabel="Elk geslacht"
            labels={GENDER_LABELS}
            ariaLabel="Filter op geslacht"
          />
          <AnswerSelect
            value={languageFilter}
            onChange={setLanguageFilter}
            allLabel="Elke taal"
            labels={WAITLIST_LANGUAGE_LABELS}
            ariaLabel="Filter op taal"
          />
          <AnswerSelect
            value={budgetFilter}
            onChange={setBudgetFilter}
            allLabel="Elk ticketbudget"
            labels={TICKET_PRICE_LABELS}
            ariaLabel="Filter op ticketbudget"
          />
        </div>

        {chips.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 rounded-full bg-burgundy/10 px-3 py-1 text-xs font-medium text-burgundy transition hover:bg-burgundy/15"
                aria-label={`Filter ${chip.label} verwijderen`}
              >
                {chip.label}
                <span aria-hidden>×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-wine/60 underline underline-offset-2 hover:text-burgundy"
            >
              Wis alles
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border-subtle/70 pt-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={sorted.length === 0}
            className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm font-medium text-wine transition hover:border-burgundy/40 hover:text-burgundy disabled:opacity-50"
          >
            Export (CSV)
          </button>
          <button
            type="button"
            onClick={() => setMailOpen(true)}
            disabled={sorted.length === 0}
            className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
          >
            Mail deze selectie ({sorted.length})
          </button>
        </div>
      </div>

      <CustomerCampaignPanel
        open={mailOpen}
        rows={sorted}
        onClose={() => setMailOpen(false)}
      />

      <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
        {sorted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-xl text-burgundy">Geen klanten gevonden</p>
            <p className="mt-2 text-sm text-wine/60">
              Pas je filters aan of wacht op nieuwe aanmeldingen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  {COLUMNS.map((column) => {
                    const active = column.key === sortKey;
                    return (
                      <th
                        key={column.key}
                        className="px-5 py-3.5"
                        aria-sort={
                          active
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(column.key)}
                          className={`inline-flex items-center gap-1 uppercase tracking-[0.06em] transition hover:text-burgundy ${active ? "text-burgundy" : ""}`}
                        >
                          {column.label}
                          <span aria-hidden className={active ? "" : "opacity-30"}>
                            {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-border-subtle/50 transition hover:bg-cream/70"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={adminPath(`/customers/${row.id}`)}
                        className="font-medium text-wine hover:text-burgundy"
                      >
                        {row.displayName}
                      </Link>
                      {row.signupConcept ? (
                        <span className="ml-2 align-middle">
                          <ConceptBadge concept={row.signupConcept} hasAccount={row.hasAccount} />
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-wine/70">{row.email}</td>
                    <td className="px-5 py-4 text-wine/70">
                      {row.city ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-wine/70">
                      {formatDate(row.memberSince)}
                    </td>
                    <td className="px-5 py-4 text-wine/70">
                      {formatDate(row.firstBookingAt)}
                    </td>
                    <td className="px-5 py-4 font-medium text-wine">
                      {row.paidBookingsCount}
                    </td>
                    <td className="px-5 py-4 text-wine/75">{row.totalSeatsBooked}</td>
                    <td className="px-5 py-4 font-medium text-wine">
                      {formatMoney(row.totalSpentCents, "EUR", "nl")}
                    </td>
                    <td className="px-5 py-4 text-wine/70">
                      {formatDate(row.lastBookingAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${customerStatusPillClass(row.status as CustomerStatusKey)}`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
