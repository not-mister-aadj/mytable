"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminCustomersPageData } from "@/lib/admin-customers-data";
import { adminPath } from "@/lib/admin-url";
import { formatMoney } from "@/lib/booking-display";
import {
  customerStatusPillClass,
} from "@/lib/customers/status";
import type { CustomerStatusKey } from "@/lib/customers/types";

type FilterKey =
  | "all"
  | "paying"
  | "repeat"
  | "failed_payments";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
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

export function CustomersView({ data }: { data: AdminCustomersPageData }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.customers.filter((row) => {
      if (cityFilter !== "all" && row.favoriteCity !== cityFilter) return false;
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

      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        row.displayName.toLowerCase().includes(q) ||
        (row.favoriteCity?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.customers, search, cityFilter, eventTypeFilter, statusFilter]);

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
          Betalende gasten op basis van e-mailadres — voltooide boekingen,
          omzet en activiteit in de tijd.
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterKey)}
            className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
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
            className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
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
            className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
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
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-xl text-burgundy">Geen klanten gevonden</p>
            <p className="mt-2 text-sm text-wine/60">
              Pas je filters aan of wacht op nieuwe boekingen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Klant</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Favoriete stad</th>
                  <th className="px-5 py-3.5">Boekingen</th>
                  <th className="px-5 py-3.5">Plekken</th>
                  <th className="px-5 py-3.5">Totaal besteed</th>
                  <th className="px-5 py-3.5">Laatste boeking</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
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
                    </td>
                    <td className="px-5 py-4 text-wine/70">{row.email}</td>
                    <td className="px-5 py-4 text-wine/70">
                      {row.favoriteCity ?? "—"}
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
