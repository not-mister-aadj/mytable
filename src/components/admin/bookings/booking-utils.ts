"use client";

import type { AdminBookingRow } from "@/lib/admin-bookings-types";

export function getGuestHistory(
  bookings: AdminBookingRow[],
  email: string,
  excludeId?: string,
): AdminBookingRow[] {
  return bookings.filter(
    (b) => b.email === email && b.id !== excludeId,
  );
}

export function eventOccupancyState(event: AdminBookingRow["event"]) {
  if (event.spotsSold >= event.capacity) return "soldOut" as const;
  if (event.capacity > 0 && event.spotsSold / event.capacity >= 0.75) {
    return "almostFull" as const;
  }
  return "available" as const;
}
