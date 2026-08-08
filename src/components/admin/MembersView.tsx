"use client";

import { useMemo, useState } from "react";
import { MemberDetailModal } from "@/components/admin/MemberDetailModal";
import type {
  AdminMemberListRow,
  AdminMemberSubscriptionStatus,
  AdminMembersPageData,
} from "@/lib/admin-members-data";

type FilterKey =
  | "all"
  | "none"
  | "active"
  | "past_due"
  | "canceled"
  | "onboarding_done"
  | "onboarding_missing";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function subscriptionPillClass(status: AdminMemberSubscriptionStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-900 ring-emerald-600/15";
    case "past_due":
      return "bg-red-100 text-red-900 ring-red-600/15";
    case "canceled":
      return "bg-wine/10 text-wine/55 ring-wine/10";
    default:
      return "bg-wine/5 text-wine/50 ring-wine/10";
  }
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

function matchesFilter(row: AdminMemberListRow, filter: FilterKey): boolean {
  switch (filter) {
    case "none":
      return row.subscriptionStatus === "none";
    case "active":
    case "past_due":
    case "canceled":
      return row.subscriptionStatus === filter;
    case "onboarding_done":
      return row.onboardingCompleted;
    case "onboarding_missing":
      return !row.onboardingCompleted;
    default:
      return true;
  }
}

export function MembersView({ data }: { data: AdminMembersPageData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<AdminMemberListRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.members.filter((row) => {
      if (!matchesFilter(row, statusFilter)) return false;
      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.shortId.toLowerCase().includes(q) ||
        row.citiesLabel.toLowerCase().includes(q) ||
        row.subscriptionStatusLabel.toLowerCase().includes(q)
      );
    });
  }, [data.members, search, statusFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
            CRM
          </p>
          <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
            Members
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Alle accounts uit Auth, met onboardingprofiel en
            clubabonnement-status. Klik een rij voor details.
          </p>
        </div>
        <a
          href="/api/admin/members/export"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
        >
          Exporteer Excel
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Accounts" value={String(data.kpis.totalMembers)} />
        <KpiCard
          label="Met abonnement"
          value={String(data.kpis.withSubscription)}
        />
        <KpiCard
          label="Active"
          value={String(data.kpis.activeSubscriptions)}
        />
        <KpiCard
          label="Geen abonnement"
          value={String(data.kpis.noSubscription)}
        />
        <KpiCard
          label="Onboarding klaar"
          value={String(data.kpis.onboardingCompleted)}
        />
      </div>

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail of ID…"
            className="w-full max-w-md rounded-full border border-border-subtle bg-cream px-4 py-2.5 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterKey)}
            className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
            aria-label="Filter op status"
          >
            <option value="all">Alle statussen</option>
            <option value="none">Geen abonnement</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Geannuleerd</option>
            <option value="onboarding_done">Onboarding klaar</option>
            <option value="onboarding_missing">Onboarding open</option>
          </select>
          <p className="text-sm text-wine/55 lg:ml-auto">
            {filtered.length} van {data.members.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-xl text-burgundy">
              Geen members gevonden
            </p>
            <p className="mt-2 text-sm text-wine/60">
              Pas je filters aan of wacht op nieuwe accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Naam</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Gender</th>
                  <th className="px-5 py-3.5">Leeftijd</th>
                  <th className="px-5 py-3.5">Stad</th>
                  <th className="px-5 py-3.5">Intent</th>
                  <th className="px-5 py-3.5">Tafel</th>
                  <th className="px-5 py-3.5">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-border-subtle/50 transition hover:bg-cream/70"
                    onClick={() => setSelected(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(row);
                      }
                    }}
                    tabIndex={0}
                    title="Open details"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-wine/55">
                      {row.shortId}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-wine hover:text-burgundy">
                        {row.name}
                      </p>
                      <p className="mt-0.5 text-xs text-wine/45">
                        {row.onboardingCompleted
                          ? "Onboarding klaar"
                          : "Onboarding open"}
                        {row.personality !== null
                          ? ` · ${row.personalityLabel}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-wine/70">{row.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${subscriptionPillClass(row.subscriptionStatus)}`}
                      >
                        {row.subscriptionStatusLabel}
                      </span>
                      {row.cancelAtPeriodEnd ? (
                        <p className="mt-1 text-xs text-wine/45">
                          Zegt op einde periode
                        </p>
                      ) : null}
                      {row.currentPeriodEnd ? (
                        <p className="mt-1 text-xs text-wine/45">
                          Tot {formatDate(row.currentPeriodEnd)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-wine/70">{row.genderLabel}</td>
                    <td className="px-5 py-4 text-wine/70">
                      {row.age != null ? row.age : "—"}
                    </td>
                    <td className="px-5 py-4 text-wine/70">{row.citiesLabel}</td>
                    <td className="px-5 py-4 text-wine/70">
                      {row.joinIntentLabel}
                    </td>
                    <td className="px-5 py-4 text-wine/70">
                      {row.tableTypeLabel}
                    </td>
                    <td className="px-5 py-4 text-wine/70">
                      {formatDate(row.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <MemberDetailModal
          member={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
