"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import {
  canReserve,
  formatPerPerson,
  formatSpotsBadge,
  formatViewsLabel,
  getEventIdForCheckout,
  getSpotsLeft,
  getViewsThisWeek,
} from "@/lib/experience-booking";
import { splitDateTime } from "@/lib/experience-detail";
import { useDbEvents } from "@/lib/use-db-events";

interface BookingCardProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  statusLabels: Dictionary["agenda"]["status"];
  reserveCta: string;
  locale: Locale;
  className?: string;
}

export function BookingCard({
  experience,
  labels,
  statusLabels,
  reserveCta,
  locale,
  className = "",
}: BookingCardProps) {
  const { date, time } = splitDateTime(experience.dateTime);
  const isSoldOut = !canReserve(experience);
  const spotsLeft = getSpotsLeft(experience);
  const views = getViewsThisWeek(experience.id);
  const priceLine = formatPerPerson(experience.price, labels.perPerson);
  const eventDbId = getEventIdForCheckout(experience);
  const dbCheckoutEnabled = useDbEvents() && Boolean(eventDbId);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(1);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDbId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventDbId,
          email,
          name,
          seats,
          locale,
          dietaryNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Netwerkfout. Probeer opnieuw.");
      setLoading(false);
    }
  }

  return (
    <motion.aside
      layout
      className={`rounded-3xl border border-border-subtle bg-beige p-6 shadow-[0_20px_50px_rgba(43,13,18,0.1)] sm:p-7 ${className}`}
    >
      <p className="font-serif text-3xl font-medium text-burgundy">{priceLine}</p>

      {spotsLeft !== null && spotsLeft > 0 ? (
        <span className="mt-4 inline-block rounded-full bg-burgundy px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-cream">
          {formatSpotsBadge(labels.spotsLeftBadge, spotsLeft)}
        </span>
      ) : (
        <span className="mt-4 inline-block rounded-full bg-burgundy/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-cream">
          {statusLabels.soldOut}
        </span>
      )}

      <p className="mt-2 text-sm text-wine/55">
        {labels.spotsByStatus[experience.status]}
      </p>

      <dl className="mt-6 space-y-3 border-t border-border-subtle pt-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-wine/55">{labels.bookingDate}</dt>
          <dd className="text-right font-medium text-wine">{date}</dd>
        </div>
        {time ? (
          <div className="flex justify-between gap-4">
            <dt className="text-wine/55">{labels.bookingTime}</dt>
            <dd className="text-right font-medium text-wine">{time}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-wine/55">{labels.bookingCity}</dt>
          <dd className="text-right font-medium text-wine">{experience.city}</dd>
        </div>
      </dl>

      {views !== null ? (
        <div className="mt-5 flex items-center gap-2">
          <div className="flex -space-x-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-beige bg-gradient-to-br from-burgundy/80 to-wine text-[10px] font-bold text-cream"
              >
                {["S", "M", "E", "T"][i]}
              </span>
            ))}
          </div>
          <p className="text-xs text-wine/50">
            {formatViewsLabel(labels.bookingViewsLabel, views)}
          </p>
        </div>
      ) : null}

      {dbCheckoutEnabled && !isSoldOut ? (
        <form onSubmit={handleCheckout} className="mt-6 space-y-3">
          <label className="block text-sm text-wine">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2"
            />
          </label>
          <label className="block text-sm text-wine">
            Naam (optioneel)
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2"
            />
          </label>
          <label className="block text-sm text-wine">
            Aantal plaatsen
            <select
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2"
            >
              {Array.from(
                { length: Math.min(spotsLeft ?? 4, 4) },
                (_, i) => i + 1,
              ).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-wine">
            Dieetwensen (optioneel)
            <textarea
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2"
            />
          </label>
          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-burgundy px-6 py-3 text-sm font-medium text-cream disabled:opacity-50"
          >
            {loading ? "Doorsturen…" : reserveCta}
          </button>
        </form>
      ) : (
        <a
          href="#newsletter"
          className={`mt-6 flex w-full items-center justify-center rounded-full bg-burgundy px-6 py-3 text-sm font-medium text-cream ${isSoldOut ? "pointer-events-none opacity-50" : ""}`}
        >
          {reserveCta}
        </a>
      )}

      <ul className="mt-6 space-y-2.5 border-t border-border-subtle pt-6">
        {labels.bookingTrustBullets.map((line) => (
          <li
            key={line}
            className="flex items-start gap-2 text-sm text-wine/70"
          >
            <span className="mt-0.5 text-gold" aria-hidden>
              ✓
            </span>
            {line}
          </li>
        ))}
      </ul>
    </motion.aside>
  );
}
