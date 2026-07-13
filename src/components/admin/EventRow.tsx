"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Event } from "@/db/schema";
import { adminPath } from "@/lib/admin-url";
import { getSiteUrl } from "@/lib/admin-url";
import { OccupancyBar } from "./OccupancyBar";
import { EventPublicLabels } from "./EventPublicLabels";
import { StatusPill, getEventListStatus } from "./StatusPill";
import {
  deleteEventAction,
  duplicateEventAction,
} from "@/app/admin/(dashboard)/events/actions";
import { formatEventAdminListDate } from "@/lib/event-datetime-local";

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function confirmDelete(event: Event) {
  const bookingNote =
    event.spotsSold > 0
      ? `\n\nLet op: ${event.spotsSold} boeking(en) worden ook verwijderd.`
      : "";
  return confirm(
    `Weet je zeker dat je "${event.nameNl}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.${bookingNote}`,
  );
}

export function EventRow({ event }: { event: Event }) {
  const status = getEventListStatus(event);
  const publicUrl = `${getSiteUrl()}/nl/agenda/${event.slug}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-beige p-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
        <Image
          src={event.imageUrl || "/images/wine-bar.jpg"}
          alt=""
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-serif text-lg text-burgundy">{event.nameNl}</h3>
          <StatusPill status={status} />
        </div>
        <p className="mt-0.5 text-sm text-wine/70">
          {event.city} · {formatEventAdminListDate(new Date(event.startsAt))}
        </p>
        <EventPublicLabels event={event} />
        <div className="mt-3 max-w-xs">
          <OccupancyBar sold={event.spotsSold} capacity={event.capacity} compact />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:shrink-0">
        <Link
          href={adminPath(`/events/${event.id}/edit`)}
          prefetch={false}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Bewerken
        </Link>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Voorbeeld
        </a>
        <form action={duplicateEventAction.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
          >
            Dupliceren
          </button>
        </form>
        <form
          action={deleteEventAction.bind(null, event.id)}
          onSubmit={(e) => {
            if (!confirmDelete(event)) e.preventDefault();
          }}
        >
          <button
            type="submit"
            aria-label="Verwijderen"
            title="Verwijderen"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-border-subtle bg-cream text-wine/70 transition-colors hover:border-red-800/40 hover:bg-red-50 hover:text-red-900"
          >
            <TrashIcon />
          </button>
        </form>
      </div>
    </motion.article>
  );
}
