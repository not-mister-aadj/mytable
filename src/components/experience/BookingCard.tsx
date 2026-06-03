"use client";

import { motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import {
  canReserve,
  formatPerPerson,
  formatSpotsBadge,
  formatViewsLabel,
  getSpotsLeft,
  getViewsThisWeek,
} from "@/lib/experience-booking";
import { splitDateTime } from "@/lib/experience-detail";
import { Button } from "../ui/Button";

interface BookingCardProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  statusLabels: Dictionary["agenda"]["status"];
  reserveCta: string;
  className?: string;
}

export function BookingCard({
  experience,
  labels,
  statusLabels,
  reserveCta,
  className = "",
}: BookingCardProps) {
  const { date, time } = splitDateTime(experience.dateTime);
  const isSoldOut = !canReserve(experience);
  const spotsLeft = getSpotsLeft(experience.status);
  const views = getViewsThisWeek(experience.id);
  const priceLine = formatPerPerson(experience.price, labels.perPerson);

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

      <Button
        href="#newsletter"
        variant="primary"
        className={`mt-6 w-full ${isSoldOut ? "pointer-events-none opacity-50" : ""}`}
      >
        {reserveCta}
      </Button>

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
