"use client";

import type { AdminOperationalStatus } from "@/lib/admin-bookings-types";
import type { AdminPaymentStatus } from "@/lib/admin-bookings-types";

const paymentStyles: Record<AdminPaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  pending: "bg-amber-50 text-amber-900 ring-amber-200/60",
  failed: "bg-red-50 text-red-800 ring-red-200/60",
  refunded: "bg-wine/5 text-wine/60 ring-wine/10",
};

const paymentLabels: Record<AdminPaymentStatus, string> = {
  paid: "Betaald",
  pending: "In afwachting",
  failed: "Mislukt",
  refunded: "Terugbetaald",
};

export function PaymentStatusPill({
  status,
}: {
  status: AdminPaymentStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${paymentStyles[status]}`}
    >
      {paymentLabels[status]}
    </span>
  );
}

const bookingStatusStyles: Record<AdminOperationalStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  completed: "bg-wine/5 text-wine/60 ring-wine/10",
  transferred: "bg-orange-50 text-orange-900 ring-orange-300/70",
  removed: "bg-wine/5 text-wine/50 ring-wine/10",
  pending: "bg-amber-50 text-amber-900 ring-amber-200/60",
  failed: "bg-red-50 text-red-800 ring-red-200/60",
  refunded: "bg-wine/5 text-wine/50 ring-wine/10",
};

const bookingStatusLabels: Record<AdminOperationalStatus, string> = {
  confirmed: "Actief",
  completed: "Afgerond",
  transferred: "Verplaatst",
  removed: "Geannuleerd",
  pending: "Open",
  failed: "Mislukt",
  refunded: "Terugbetaald",
};

export function BookingStatusPill({
  status,
}: {
  status: AdminOperationalStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${bookingStatusStyles[status]}`}
    >
      {bookingStatusLabels[status]}
    </span>
  );
}

export function GuestInsightPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-wine/75">
      {label}
    </span>
  );
}
