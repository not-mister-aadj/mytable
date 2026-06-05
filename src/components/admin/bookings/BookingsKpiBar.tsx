import type { ReactNode } from "react";
import type { AdminBookingsKpi } from "@/lib/admin-bookings-types";

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-beige/80 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            {label}
          </p>
          <p className="mt-2 font-serif text-2xl text-burgundy">{value}</p>
          {hint ? (
            <p className="mt-1.5 text-xs text-wine/55">{hint}</p>
          ) : null}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-burgundy/70">
          {icon}
        </div>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-6 4 3 5-8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function BookingsKpiBar({ kpis }: { kpis: AdminBookingsKpi }) {
  const revenue = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(kpis.revenueThisWeekCents / 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <KpiCard
        label="Aankomende gasten"
        value={String(kpis.upcomingGuests)}
        hint={
          kpis.guestsArrivingTomorrow > 0
            ? `${kpis.guestsArrivingTomorrow} morgen`
            : undefined
        }
        icon={<UsersIcon />}
      />
      <KpiCard
        label="Omzet deze week"
        value={revenue}
        icon={<RevenueIcon />}
      />
      <KpiCard
        label="Bezetting"
        value={`${kpis.occupancyRatePct}%`}
        hint="Aankomende tafels"
        icon={<ChartIcon />}
      />
      <KpiCard
        label="Aankomende tafels"
        value={String(kpis.upcomingTables)}
        icon={<CalendarIcon />}
      />
      <KpiCard
        label="Open betalingen"
        value={String(kpis.pendingPayments)}
        icon={<ClockIcon />}
      />
      <KpiCard
        label="Gem. tafelbezetting"
        value={`${kpis.avgTableFillPct}%`}
        icon={<ChartIcon />}
      />
      <KpiCard
        label="Terugkerende gasten"
        value={`${kpis.returningGuestsPct}%`}
        icon={<RepeatIcon />}
      />
    </div>
  );
}

export function BookingsInsightBanner({ kpis }: { kpis: AdminBookingsKpi }) {
  if (kpis.guestsArrivingTomorrow <= 0 && kpis.pendingPayments <= 0) {
    return null;
  }

  const messages: string[] = [];
  if (kpis.guestsArrivingTomorrow > 0) {
    messages.push(
      `${kpis.guestsArrivingTomorrow} ${kpis.guestsArrivingTomorrow === 1 ? "gast arriveert" : "gasten arriveren"} morgen`,
    );
  }
  if (kpis.pendingPayments > 0) {
    messages.push(
      `${kpis.pendingPayments} ${kpis.pendingPayments === 1 ? "betaling wacht" : "betalingen wachten"} op bevestiging`,
    );
  }

  return (
    <div className="rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/10 via-beige to-cream px-5 py-4 text-sm text-wine/80 shadow-[0_8px_30px_rgba(43,13,18,0.04)]">
      <span className="font-medium text-burgundy">Vandaag relevant · </span>
      {messages.join(" · ")}
    </div>
  );
}
