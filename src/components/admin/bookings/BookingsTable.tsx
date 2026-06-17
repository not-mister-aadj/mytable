"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { AdminBookingRow } from "@/lib/admin-bookings-types";
import { adminPath } from "@/lib/admin-url";
import { formatMoney } from "@/lib/booking-display";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import {
  BookingStatusPill,
  GuestInsightPill,
  PaymentStatusPill,
} from "@/components/admin/bookings/BookingStatusPills";
import { eventOccupancyState } from "@/components/admin/bookings/booking-utils";
import { formatEventAdminListDate } from "@/lib/event-datetime-local";

function formatEventDate(iso: string) {
  return formatEventAdminListDate(new Date(iso), "nl", { weekday: "short" });
}

function TransferDestinationNote({ row }: { row: AdminBookingRow }) {
  if (row.bookingStatus !== "transferred" || !row.transferDestination) {
    return null;
  }

  const dest = row.transferDestination;

  return (
    <div className="mt-2 max-w-[220px] rounded-xl border border-orange-200/80 bg-orange-50/80 px-3 py-2 text-xs text-orange-950">
      <p className="font-semibold uppercase tracking-[0.05em] text-orange-800/80">
        Verplaatst naar
      </p>
      <p className="mt-1 font-medium">{dest.nameNl}</p>
      <p className="text-orange-900/75">
        {dest.city} · {formatEventDate(dest.startsAt)}
      </p>
      <Link
        href={adminPath(`/events/${dest.id}/edit`)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1.5 inline-block font-medium text-orange-900 underline-offset-2 hover:underline"
      >
        Naar doeltafel
      </Link>
    </div>
  );
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
        <p className="font-serif text-xl text-burgundy">
          Geen bevestigde boekingen gevonden
        </p>
        <p className="mt-2 text-sm text-wine/60">
          Pas je filters aan of wacht op nieuwe betaalde reserveringen.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
              <th className="px-5 py-3.5">Gast</th>
              <th className="px-5 py-3.5">Code</th>
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
              const isTransferred = row.bookingStatus === "transferred";
              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => onSelect(row)}
                  className={`group cursor-pointer border-b border-border-subtle/50 transition hover:bg-cream/70 ${
                    isTransferred ? "bg-orange-50/40" : ""
                  }`}
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
                        <p className="truncate text-xs text-wine/55">
                          {row.customerId ? (
                            <Link
                              href={adminPath(`/customers/${row.customerId}`)}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-burgundy hover:underline"
                            >
                              {row.email}
                            </Link>
                          ) : (
                            row.email
                          )}
                        </p>
                        {row.guestInsight ? (
                          <div className="mt-1.5">
                            <GuestInsightPill label={row.guestInsight} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs tracking-wide text-wine/65">
                      {row.reservationCode}
                    </span>
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
                    <TransferDestinationNote row={row} />
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
                <BookingStatusPill status={row.bookingStatus} />
              </div>
              <p className="mt-1 text-sm text-wine/70">{row.event.nameNl}</p>
              <p className="mt-1 text-xs text-wine/55">
                {formatEventDate(row.event.startsAt)} · {row.seats} plekken
              </p>
              <p className="mt-1 font-mono text-xs text-wine/50">
                {row.reservationCode}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
