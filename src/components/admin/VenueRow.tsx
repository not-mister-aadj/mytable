"use client";

import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/db/schema";
import { deleteVenueAction } from "@/app/admin/(dashboard)/venues/actions";
import { adminPath } from "@/lib/admin-url";

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

function confirmDeleteVenue(venue: Venue) {
  return confirm(
    `Weet je zeker dat je "${venue.name}" wilt verwijderen? De venue wordt losgekoppeld van events en experience types.`,
  );
}

export function VenueRow({ venue }: { venue: Venue }) {
  const editHref = adminPath(`/venues/${venue.id}/edit`);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-beige p-4 sm:flex-row sm:items-center sm:gap-6">
      <Link href={editHref} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={venue.imageUrl ?? "/images/restaurant-interior.jpg"}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg text-burgundy">{venue.name}</p>
          <p className="text-sm text-wine/70">
            {venue.city}
            {venue.area ? ` · ${venue.area}` : ""}
            {venue.address ? ` · ${venue.address}` : ""}
          </p>
          {venue.atmosphere ? (
            <p className="mt-0.5 text-xs text-wine/55">{venue.atmosphere}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-sm text-wine/50">
            {venue.descriptionNl}
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap gap-2 sm:shrink-0">
        <Link
          href={editHref}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm hover:border-burgundy/30"
        >
          Bewerken
        </Link>
        <form
          action={deleteVenueAction.bind(null, venue.id)}
          onSubmit={(e) => {
            if (!confirmDeleteVenue(venue)) e.preventDefault();
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
    </article>
  );
}
