"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition } from "react";
import { resendBookingConfirmationAction } from "@/app/admin/(dashboard)/events/actions";
import type { AdminBookingRow } from "@/lib/admin-bookings-types";
import { getGuestHistory } from "@/components/admin/bookings/booking-utils";
import { adminPath } from "@/lib/admin-url";
import { formatMoney } from "@/lib/booking-display";
import {
  formatSeatingPreference,
  isSeatingPreference,
} from "@/lib/booking-seating";
import {
  formatTableLanguagePreference,
  isTableLanguagePreference,
} from "@/lib/booking-table-language";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import {
  BookingStatusPill,
  GuestInsightPill,
  PaymentStatusPill,
} from "@/components/admin/bookings/BookingStatusPills";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-wine/45">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function BookingDetailDrawer({
  booking,
  allBookings,
  stripeDashboardBase,
  onClose,
  onBookingUpdated,
}: {
  booking: AdminBookingRow | null;
  allBookings: AdminBookingRow[];
  stripeDashboardBase: string;
  onClose: () => void;
  onBookingUpdated?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const history = booking
    ? getGuestHistory(allBookings, booking.email, booking.id)
    : [];

  const canResendConfirmation =
    booking?.paymentStatus === "paid" &&
    booking.lifecycleStatus === "active";

  function handleResendConfirmation() {
    if (!booking || !canResendConfirmation) return;

    const guestName = booking.customerName?.trim() || "deze gast";
    const confirmed = confirm(
      `Bevestigingsmail opnieuw sturen naar ${booking.email}?\n\n` +
        `${guestName} ontvangt de boekingsbevestiging voor ${booking.event.nameNl} opnieuw.`,
    );
    if (!confirmed) return;

    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const result = await resendBookingConfirmationAction(booking.id);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setActionSuccess("Bevestigingsmail verstuurd.");
      onBookingUpdated?.();
    });
  }

  const stripeUrl = booking?.stripePaymentIntentId
    ? `${stripeDashboardBase}payments/${booking.stripePaymentIntentId}`
    : booking?.stripeCheckoutSessionId
      ? `${stripeDashboardBase}checkout/sessions/${booking.stripeCheckoutSessionId}`
      : null;

  return (
    <AnimatePresence>
      {booking ? (
        <>
          <motion.button
            type="button"
            aria-label="Sluiten"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-wine/20 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border-subtle bg-cream shadow-[-20px_0_60px_rgba(43,13,18,0.12)]"
          >
            <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">
                  Boeking
                </p>
                <h2 className="mt-1 font-serif text-2xl text-burgundy">
                  {booking.customerName || "Gast"}
                </h2>
                <p className="mt-1 font-mono text-xs text-wine/55">
                  {booking.reservationCode}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-wine/50 transition hover:bg-beige hover:text-wine"
                aria-label="Sluit paneel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-8">
                <DetailSection title="Gastprofiel">
                  <div className="flex items-start gap-4 rounded-2xl border border-border-subtle/80 bg-beige/60 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-burgundy/10 text-lg font-medium text-burgundy">
                      {booking.guestInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-wine">
                        {booking.customerId ? (
                          <Link
                            href={adminPath(`/customers/${booking.customerId}`)}
                            className="hover:text-burgundy hover:underline"
                          >
                            {booking.email}
                          </Link>
                        ) : (
                          booking.email
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <PaymentStatusPill status={booking.paymentStatus} />
                        <BookingStatusPill status={booking.bookingStatus} />
                        {booking.guestInsight ? (
                          <GuestInsightPill label={booking.guestInsight} />
                        ) : null}
                        {booking.customerId ? (
                          <Link
                            href={adminPath(`/customers/${booking.customerId}`)}
                            className="text-sm text-burgundy underline-offset-2 hover:underline"
                          >
                            Klantprofiel
                          </Link>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-wine/65">
                        {booking.seats}{" "}
                        {booking.seats === 1 ? "plek" : "plekken"} ·{" "}
                        {booking.isSolo ? "Komt alleen" : "Geboekt als groep"}
                      </p>
                      {booking.previousPaidCount > 0 ? (
                        <p className="mt-1 text-sm text-wine/65">
                          {booking.previousPaidCount} eerdere{" "}
                          {booking.previousPaidCount === 1
                            ? "boeking"
                            : "boekingen"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </DetailSection>

                <DetailSection title="Tafel">
                  <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/60">
                    <div className="relative aspect-[16/9] bg-wine/5">
                      <Image
                        src={booking.event.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="400px"
                        unoptimized={booking.event.imageUrl.includes("supabase.co")}
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-wine">{booking.event.nameNl}</p>
                      <p className="mt-1 text-sm text-wine/60">
                        {booking.event.city} ·{" "}
                        {formatDateTime(booking.event.startsAt)}
                      </p>
                      <div className="mt-4">
                        <OccupancyBar
                          sold={booking.event.spotsSold}
                          capacity={booking.event.capacity}
                        />
                      </div>
                      <Link
                        href={adminPath(`/events/${booking.event.id}/edit`)}
                        className="mt-4 inline-block text-sm text-burgundy underline-offset-2 hover:underline"
                      >
                        Tafel bewerken
                      </Link>
                    </div>
                  </div>
                </DetailSection>

                <DetailSection title="Betaling">
                  <dl className="space-y-3 rounded-2xl border border-border-subtle/80 bg-beige/60 p-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-wine/55">Totaal</dt>
                      <dd className="font-medium text-wine">
                        {formatMoney(
                          booking.amountCents,
                          booking.currency,
                          booking.locale === "en" ? "en" : "nl",
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-wine/55">Status</dt>
                      <dd>
                        <PaymentStatusPill status={booking.paymentStatus} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-wine/55">Geboekt op</dt>
                      <dd className="text-wine/75">
                        {formatDateTime(booking.createdAt)}
                      </dd>
                    </div>
                    {stripeUrl ? (
                      <div className="pt-1">
                        <a
                          href={stripeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-burgundy underline-offset-2 hover:underline"
                        >
                          Bekijk in Stripe
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                          </svg>
                        </a>
                      </div>
                    ) : null}
                  </dl>
                </DetailSection>

                {booking.seatingPreference &&
                isSeatingPreference(booking.seatingPreference) ? (
                  <DetailSection title="Tafelwens">
                    <div className="space-y-3 rounded-2xl border border-border-subtle/80 bg-beige/60 p-4 text-sm leading-relaxed text-wine/75">
                      <p>
                        {formatSeatingPreference(booking.seatingPreference, "nl")}
                      </p>
                      {booking.seatingPreference === "join_others" &&
                      booking.tableLanguagePreference &&
                      isTableLanguagePreference(booking.tableLanguagePreference) ? (
                        <p>
                          {formatTableLanguagePreference(
                            booking.tableLanguagePreference,
                            "nl",
                          )}
                        </p>
                      ) : null}
                    </div>
                  </DetailSection>
                ) : null}

                {booking.dietaryNotes ? (
                  <DetailSection title="Dieetwensen">
                    <p className="rounded-2xl border border-border-subtle/80 bg-beige/60 p-4 text-sm leading-relaxed text-wine/75">
                      {booking.dietaryNotes}
                    </p>
                  </DetailSection>
                ) : null}

                {booking.adminNotes ? (
                  <DetailSection title="Admin notities">
                    <p className="rounded-2xl border border-border-subtle/80 bg-beige/60 p-4 text-sm leading-relaxed text-wine/75">
                      {booking.adminNotes}
                    </p>
                  </DetailSection>
                ) : null}

                <DetailSection title="Tijdlijn">
                  <ol className="space-y-3 border-l border-border-subtle pl-4">
                    {booking.timeline.length > 0 ? (
                      booking.timeline.map((entry) => (
                        <li
                          key={entry.id}
                          className="relative text-sm text-wine/75"
                        >
                          <span
                            className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${
                              entry.tone === "success"
                                ? "bg-emerald-500"
                                : entry.tone === "warning"
                                  ? "bg-orange-500"
                                  : entry.tone === "danger"
                                    ? "bg-red-500"
                                    : "bg-burgundy"
                            }`}
                          />
                          <p>{entry.label}</p>
                          <p className="mt-0.5 text-xs text-wine/50">
                            {entry.at}
                            {entry.by ? ` · ${entry.by}` : ""}
                          </p>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="relative text-sm text-wine/75">
                          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-burgundy" />
                          Reservering aangemaakt · {formatDateTime(booking.createdAt)}
                        </li>
                        <li className="relative text-sm text-wine/75">
                          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          Betaling · {booking.paymentStatus}
                        </li>
                      </>
                    )}
                  </ol>
                </DetailSection>

                {booking.transferDestination ? (
                  <DetailSection title="Verplaatsing">
                    <div className="rounded-2xl border border-orange-200/80 bg-orange-50/70 p-4 text-sm text-orange-950">
                      <p className="font-semibold">Verplaatst naar</p>
                      <p className="mt-1 font-medium">
                        {booking.transferDestination.nameNl}
                      </p>
                      <p className="text-orange-900/75">
                        {booking.transferDestination.city} ·{" "}
                        {formatDateTime(booking.transferDestination.startsAt)}
                      </p>
                      {booking.transferredBy ? (
                        <p className="mt-2 text-xs text-orange-900/65">
                          Door {booking.transferredBy}
                          {booking.transferredAt
                            ? ` · ${formatDateTime(booking.transferredAt)}`
                            : ""}
                        </p>
                      ) : null}
                      <Link
                        href={adminPath(
                          `/events/${booking.transferDestination.id}/edit`,
                        )}
                        className="mt-3 inline-block font-medium text-orange-900 underline-offset-2 hover:underline"
                      >
                        Naar doeltafel
                      </Link>
                    </div>
                  </DetailSection>
                ) : null}

                {history.length > 0 ? (
                  <DetailSection title="Eerdere boekingen">
                    <ul className="space-y-2">
                      {history.slice(0, 5).map((item) => (
                        <li
                          key={item.id}
                          className="rounded-xl border border-border-subtle/70 bg-beige/40 px-3 py-2.5 text-sm"
                        >
                          <p className="font-medium text-wine">{item.event.nameNl}</p>
                          <p className="mt-0.5 text-xs text-wine/55">
                            {formatDateTime(item.event.startsAt)} ·{" "}
                            {formatMoney(
                              item.amountCents,
                              item.currency,
                              item.locale === "en" ? "en" : "nl",
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </DetailSection>
                ) : null}

                {canResendConfirmation ? (
                  <DetailSection title="Acties">
                    <div className="rounded-2xl border border-border-subtle/80 bg-beige/60 p-4">
                      <p className="text-sm text-wine/65">
                        Stuur de boekingsbevestiging opnieuw naar{" "}
                        <span className="font-medium text-wine">{booking.email}</span>.
                      </p>
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={isPending}
                        className="mt-4 rounded-full border border-border-subtle bg-cream px-5 py-2 text-sm font-medium text-wine transition hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? "Bezig…" : "Bevestigingsmail opnieuw sturen"}
                      </button>
                      {actionError ? (
                        <p className="mt-3 text-sm text-red-800">{actionError}</p>
                      ) : null}
                      {actionSuccess ? (
                        <p className="mt-3 text-sm text-emerald-800">{actionSuccess}</p>
                      ) : null}
                    </div>
                  </DetailSection>
                ) : null}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
