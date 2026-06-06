import type { CustomerStatusKey } from "@/lib/customers/types";

export function resolveCustomerStatus(input: {
  paidBookingsCount: number;
  totalBookings: number;
  failedPaymentsCount: number;
  waitlistCount: number;
}): CustomerStatusKey {
  if (input.paidBookingsCount > 1) return "repeat";
  if (input.paidBookingsCount === 1) return "paying";
  if (input.failedPaymentsCount > 0) return "payment_issue";
  if (input.totalBookings > 0) return "new";
  if (input.waitlistCount > 0) return "waitlist_only";
  return "new";
}

export function customerStatusLabel(status: CustomerStatusKey): string {
  switch (status) {
    case "repeat":
      return "Terugkerende gast";
    case "paying":
      return "Betalende gast";
    case "payment_issue":
      return "Betalingsprobleem";
    case "waitlist_only":
      return "Alleen wachtlijst";
    default:
      return "Nieuw";
  }
}

export function customerStatusPillClass(status: CustomerStatusKey): string {
  switch (status) {
    case "repeat":
      return "bg-gold/15 text-wine ring-gold/30";
    case "paying":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/60";
    case "payment_issue":
      return "bg-red-50 text-red-800 ring-red-200/60";
    case "waitlist_only":
      return "bg-wine/5 text-wine/70 ring-wine/10";
    default:
      return "bg-cream text-wine/70 ring-border-subtle";
  }
}
