"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBookingRow, AdminBookingsPageData } from "@/lib/admin-bookings-types";
import { BookingDetailDrawer } from "@/components/admin/bookings/BookingDetailDrawer";
import {
  BookingsFilters,
  defaultBookingFilters,
  type BookingFilters,
} from "@/components/admin/bookings/BookingsFilters";
import {
  BookingsInsightBanner,
  BookingsKpiBar,
} from "@/components/admin/bookings/BookingsKpiBar";
import { BookingsTable } from "@/components/admin/bookings/BookingsTable";
import { eventOccupancyState } from "@/components/admin/bookings/booking-utils";
import { matchesBookingStatusFilter } from "@/lib/booking-lifecycle";

function matchesSearch(row: AdminBookingRow, q: string): boolean {
  const normalized = q.replace(/\s/g, "").toLowerCase();
  const codeQuery = normalized.replace(/^mt-?/i, "");
  const code = row.reservationCode.toLowerCase();
  const codeBody = code.replace(/^mt-?/i, "");

  if (
    code.includes(normalized) ||
    (codeQuery.length > 0 && codeBody.includes(codeQuery))
  ) {
    return true;
  }

  const haystack = [
    row.email,
    row.customerName ?? "",
    row.event.nameNl,
    row.event.nameEn,
    row.event.city,
    row.transferDestination?.nameNl ?? "",
    row.transferDestination?.city ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function filterBookings(
  bookings: AdminBookingRow[],
  filters: BookingFilters,
): AdminBookingRow[] {
  const q = filters.search.trim().toLowerCase();
  const now = Date.now();

  return bookings.filter((row) => {
    if (
      filters.status !== "all" &&
      !matchesBookingStatusFilter(
        {
          paymentStatus: row.paymentStatus,
          lifecycleStatus: row.lifecycleStatus,
        },
        filters.status,
      )
    ) {
      return false;
    }

    if (filters.city !== "all" && row.event.city !== filters.city) {
      return false;
    }
    if (
      filters.experienceType !== "all" &&
      row.event.experienceType !== filters.experienceType
    ) {
      return false;
    }
    if (filters.audience === "girlsOnly" && !row.event.femaleOnly) {
      return false;
    }
    if (filters.audience === "mixed" && row.event.femaleOnly) {
      return false;
    }

    const eventTime = new Date(row.event.startsAt).getTime();
    if (filters.timing === "upcoming" && eventTime <= now) return false;
    if (filters.timing === "past" && eventTime > now) return false;

    if (filters.occupancy !== "all") {
      const occ = eventOccupancyState(row.event);
      if (occ !== filters.occupancy) return false;
    }

    if (q && !matchesSearch(row, q)) return false;

    return true;
  });
}

export function BookingsOperationsView({
  data,
}: {
  data: AdminBookingsPageData;
}) {
  const [filters, setFilters] = useState<BookingFilters>(defaultBookingFilters);
  const [selected, setSelected] = useState<AdminBookingRow | null>(null);
  const router = useRouter();

  const filtered = useMemo(
    () => filterBookings(data.bookings, filters),
    [data.bookings, filters],
  );

  useEffect(() => {
    if (!selected) return;
    const updated = data.bookings.find((row) => row.id === selected.id);
    if (updated) setSelected(updated);
  }, [data.bookings, selected?.id]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
          Operaties
        </p>
        <h1 className="mt-2 font-serif text-3xl text-burgundy sm:text-4xl">
          Boekingen
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
          Overzicht van gasten, verplaatsingen en betalingen. Actieve gasten
          tellen mee voor bezetting; verplaatste boekingen blijven zichtbaar
          voor traceerbaarheid.
        </p>
      </div>

      <BookingsInsightBanner kpis={data.kpis} />
      <BookingsKpiBar kpis={data.kpis} />

      <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6">
        <BookingsFilters
          filters={filters}
          cities={data.cities}
          experienceTypes={data.experienceTypes}
          resultCount={filtered.length}
          onChange={setFilters}
        />
      </div>

      <BookingsTable rows={filtered} onSelect={setSelected} />

      <BookingDetailDrawer
        booking={selected}
        allBookings={data.bookings}
        stripeDashboardBase={data.stripeDashboardBase}
        onClose={() => setSelected(null)}
        onBookingUpdated={() => router.refresh()}
      />
    </div>
  );
}
