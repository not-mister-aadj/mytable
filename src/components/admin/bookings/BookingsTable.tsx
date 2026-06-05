"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { AdminBookingRow } from "@/lib/admin-bookings-types";
import { formatMoney } from "@/lib/booking-display";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import {
  BookingStatusPill,
  GuestInsightPill,
  PaymentStatusPill,
} from "@/components/admin/bookings/BookingStatusPills";
import { eventOccupancyState } from "@/components/admin/bookings/booking-utils";

function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function BookingsTable({
  rows,
  onSelect,
}: {
  rows: AdminBookingRow[];
  onSelect: (row: AdminBookingRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center">
        <p className="font-serif text-xl text-burgundy">Geen boekingen gevonden</p>
        <p className="mt-2 text-sm text-wine/60">
          Pas je filters aan of wacht op nieuwe reserveringen.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
              <th className="px-5 py-3.5">Gast</th>
              <th className="px-5 py-3.5">Tafel</th>
              <th className="px-5 py-3.5">Datum</th>
              <th className="px-5 py-3.5">Plekken</th>
              <th className="px-5 py-3.5">Betaling</th>
              <th className="px-5 py-3.5">Bedrag</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Acties</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const occupancy = eventOccupancyState(row.event);
              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => onSelect(row)}
                  className="group cursor-pointer border-b border-border-subtle/50 transition hover:bg-cream/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/10 font-medium text-burgundy">
                        {row.guestInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-wine">
                          {row.customerName || "Gast"}
                        </p>
                        <p className="truncate text-xs text-wine/55">{row.email}</p>
                        {row.guestInsight ? (
                          <div className="mt-1.5">
                            <GuestInsightPill label={row.guestInsight} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-wine/5">
                        <Image
                          src={row.event.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                          unoptimized={row.event.imageUrl.includes("supabase.co")}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-wine">
                          {row.event.nameNl}
                        </p>
                        <p className="text-xs text-wine/55">
                          {row.event.city}
                          {row.event.femaleOnly ? " · Girls only" : " · Gemengd"}
                        </p>
                        <div className="mt-2 max-w-[140px]">
                          <OccupancyBar
                            sold={row.event.spotsSold}
                            capacity={row.event.capacity}
                            compact
                            showLabel
                          />
                        </div>
                        {occupancy === "almostFull" ? (
                          <p className="mt-1 text-[11px] font-medium text-amber-700">
                            Bijna vol
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-wine/75">
                    {formatEventDate(row.event.startsAt)}
                  </td>
                  <td className="px-5 py-4 font-medium text-wine">{row.seats}</td>
                  <td className="px-5 py-4">
                    <PaymentStatusPill status={row.paymentStatus} />
                  </td>
                  <td className="px-5 py-4 font-medium text-wine">
                    {formatMoney(
                      row.amountCents,
                      row.currency,
                      row.locale === "en" ? "en" : "nl",
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <BookingStatusPill status={row.bookingStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row);
                      }}
                      className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-xs font-medium text-wine/70 opacity-0 transition group-hover:opacity-100 hover:border-burgundy/30 hover:text-burgundy"
                    >
                      Details
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border-subtle/60 lg:hidden">
        {rows.map((row, index) => (
          <motion.button
            key={row.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            onClick={() => onSelect(row)}
            className="flex w-full gap-4 px-4 py-4 text-left transition hover:bg-cream/70"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/10 font-medium text-burgundy">
              {row.guestInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-wine">
                  {row.customerName || row.email}
                </p>
                <PaymentStatusPill status={row.paymentStatus} />
              </div>
              <p className="mt-1 text-sm text-wine/70">{row.event.nameNl}</p>
              <p className="mt-1 text-xs text-wine/55">
                {formatEventDate(row.event.startsAt)} · {row.seats} plekken
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
