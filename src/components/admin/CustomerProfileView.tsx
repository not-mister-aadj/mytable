"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminCustomerProfile } from "@/lib/admin-customers-data";
import { updateCustomerNotesAction } from "@/app/admin/(dashboard)/customers/actions";
import { adminPath } from "@/lib/admin-url";
import { formatMoney } from "@/lib/booking-display";
import {
  customerStatusPillClass,
} from "@/lib/customers/status";
import {
  BookingStatusPill,
  PaymentStatusPill,
} from "@/components/admin/bookings/BookingStatusPills";
import type { AdminOperationalStatus } from "@/lib/admin-bookings-types";
import type { AdminPaymentStatus } from "@/lib/admin-bookings-types";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/45">
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl text-burgundy">{value}</p>
    </div>
  );
}

export function CustomerProfileView({
  profile,
}: {
  profile: AdminCustomerProfile;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(profile.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function saveNotes() {
    startTransition(async () => {
      const result = await updateCustomerNotesAction(profile.id, notes);
      if (result.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={adminPath("/customers")}
            className="text-sm text-wine/55 transition hover:text-burgundy"
          >
            ← Alle klanten
          </Link>
          <h1 className="mt-3 font-serif text-3xl text-burgundy sm:text-4xl">
            {profile.displayName}
          </h1>
          <p className="mt-2 text-sm text-wine/65">{profile.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${customerStatusPillClass(profile.status)}`}
            >
              {profile.statusLabel}
            </span>
            {profile.preferredCity ? (
              <span className="text-sm text-wine/60">
                Voorkeur: {profile.preferredCity}
              </span>
            ) : null}
            <span className="text-sm text-wine/50">
              Sinds {formatDate(profile.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Boekingen" value={String(profile.totalBookings)} />
        <KpiCard label="Betaald" value={String(profile.paidBookingsCount)} />
        <KpiCard
          label="Totaal besteed"
          value={formatMoney(profile.totalSpentCents, "EUR", "nl")}
        />
        <KpiCard label="Plekken" value={String(profile.totalSeatsBooked)} />
        <KpiCard
          label="Mislukte betalingen"
          value={String(profile.failedPaymentsCount)}
        />
        <KpiCard label="Wachtlijst" value={String(profile.waitlistCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
            Voorkeuren
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-wine/55">Favoriete stad</dt>
              <dd className="font-medium text-wine">
                {profile.favoriteCity ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-wine/55">Favoriet type</dt>
              <dd className="font-medium text-wine">
                {profile.favoriteEventType ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-wine/55">Taal</dt>
              <dd className="font-medium text-wine">
                {profile.language?.toUpperCase() ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-wine/55">Tags</dt>
              <dd className="font-medium text-wine">
                {profile.tags.length > 0 ? profile.tags.join(", ") : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
            Interne notities
          </h2>
          <p className="mt-2 text-xs text-wine/50">
            Alleen zichtbaar in admin — niet voor de gast.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="mt-4 w-full rounded-xl border border-border-subtle bg-cream px-4 py-3 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
            placeholder="Notities over deze klant…"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={saveNotes}
              disabled={pending}
              className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
            >
              {pending ? "Opslaan…" : "Notitie opslaan"}
            </button>
            {saved ? (
              <span className="text-sm text-emerald-700">Opgeslagen</span>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border-subtle/80 bg-beige/50 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
          Boekingen
        </h2>
        {profile.bookings.length === 0 ? (
          <p className="mt-4 text-sm text-wine/60">Nog geen boekingen.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 text-xs uppercase tracking-[0.06em] text-wine/50">
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Stad</th>
                  <th className="py-2 pr-4">Datum</th>
                  <th className="py-2 pr-4">Plekken</th>
                  <th className="py-2 pr-4">Bedrag</th>
                  <th className="py-2 pr-4">Betaling</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border-subtle/40 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-wine">
                      {b.eventName}
                    </td>
                    <td className="py-3 pr-4 text-wine/70">{b.city}</td>
                    <td className="py-3 pr-4 text-wine/70">
                      {formatDateTime(b.startsAt)}
                    </td>
                    <td className="py-3 pr-4">{b.seats}</td>
                    <td className="py-3 pr-4">
                      {formatMoney(b.amountCents, b.currency, "nl")}
                    </td>
                    <td className="py-3 pr-4">
                      <PaymentStatusPill
                        status={b.paymentStatus as AdminPaymentStatus}
                      />
                    </td>
                    <td className="py-3">
                      <BookingStatusPill
                        status={b.bookingStatus as AdminOperationalStatus}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
          Activiteit
        </h2>
        {profile.activities.length === 0 ? (
          <p className="mt-4 text-sm text-wine/60">Nog geen activiteit.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {profile.activities.map((activity) => (
              <li
                key={activity.id}
                className="relative border-l-2 border-burgundy/20 pl-4"
              >
                <p className="text-xs text-wine/45">
                  {formatDateTime(activity.createdAt)}
                </p>
                <p className="mt-1 font-medium text-wine">{activity.title}</p>
                {activity.description ? (
                  <p className="mt-0.5 text-sm text-wine/65">
                    {activity.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
