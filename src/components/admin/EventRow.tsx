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
  const pageHref = adminPath(`/events/${event.id}/guests`);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-xl border border-border-subtle bg-beige/60 p-3 transition hover:border-burgundy/25"
    >
      <Link href={pageHref} prefetch={false} className="relative hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
        <Image src={event.imageUrl || "/images/wine-bar.jpg"} alt="" fill className="object-cover" sizes="80px" />
      </Link>

      <Link href={pageHref} prefetch={false} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-wine">
            {event.city} · {formatEventAdminListDate(new Date(event.startsAt))}
          </h3>
          <StatusPill status={status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-wine/55">{event.nameNl}</p>
        <EventPublicLabels event={event} />
      </Link>

      <div className="hidden w-40 shrink-0 md:block">
        <OccupancyBar sold={event.spotsSold} capacity={event.capacity} compact />
      </div>

      <details className="relative shrink-0">
        <summary
          aria-label="Meer acties"
          className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-border-subtle bg-cream text-wine/60 transition hover:border-burgundy/30 hover:text-burgundy [&::-webkit-details-marker]:hidden"
        >
          …
        </summary>
        <div className="absolute right-0 z-20 mt-2 flex w-48 flex-col gap-1 rounded-xl border border-border-subtle bg-beige p-2 text-sm shadow-xl">
          <Link href={adminPath(`/events/${event.id}/edit`)} prefetch={false} className="rounded-lg px-3 py-2 text-wine hover:bg-cream">
            Bewerken
          </Link>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-2 text-wine hover:bg-cream">
            Publieke pagina
          </a>
          <form action={duplicateEventAction.bind(null, event.id)}>
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-wine hover:bg-cream">
              Dupliceren
            </button>
          </form>
          <form
            action={deleteEventAction.bind(null, event.id)}
            onSubmit={(e) => {
              if (!confirmDelete(event)) e.preventDefault();
            }}
          >
            <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-900 hover:bg-red-50">
              <TrashIcon />
              Verwijderen
            </button>
          </form>
        </div>
      </details>
    </motion.article>
  );
}
