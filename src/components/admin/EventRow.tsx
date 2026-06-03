"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Event } from "@/db/schema";
import { adminPath } from "@/lib/admin-url";
import { getSiteUrl } from "@/lib/admin-url";
import { OccupancyBar } from "./OccupancyBar";
import { StatusPill, getEventListStatus } from "./StatusPill";
import { duplicateEventAction } from "@/app/admin/(dashboard)/events/actions";

function formatEventDate(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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
          {event.city} · {formatEventDate(new Date(event.startsAt))}
        </p>
        <div className="mt-3 max-w-xs">
          <OccupancyBar sold={event.spotsSold} capacity={event.capacity} compact />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:shrink-0">
        <Link
          href={adminPath(`/events/${event.id}/edit`)}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Edit
        </Link>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Preview
        </a>
        <form action={duplicateEventAction.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
          >
            Duplicate
          </button>
        </form>
      </div>
    </motion.article>
  );
}
