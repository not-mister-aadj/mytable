"use client";

import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/db/schema";
import { adminPath } from "@/lib/admin-url";

export function VenuePicker({
  allVenues,
  selectedIds,
  onChange,
  eventCity,
}: {
  allVenues: Venue[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  eventCity?: string;
}) {
  const sorted = [...allVenues].sort((a, b) => {
    const aMatch = a.city === eventCity ? 0 : 1;
    const bMatch = b.city === eventCity ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (allVenues.length === 0) {
    return (
      <p className="text-sm text-wine/60">
        Nog geen venues.{" "}
        <Link href={adminPath("/venues/new")} className="text-burgundy underline">
          Maak er een aan
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((venue) => {
        const selected = selectedIds.includes(venue.id);
        return (
          <label
            key={venue.id}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition ${
              selected
                ? "border-burgundy bg-cream"
                : "border-border-subtle bg-cream/50 hover:border-burgundy/20"
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggle(venue.id)}
              className="rounded"
            />
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={venue.imageUrl ?? "/images/restaurant-interior.jpg"}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-wine">{venue.name}</p>
              <p className="text-xs text-wine/60">
                {venue.city}
                {venue.area ? ` · ${venue.area}` : ""}
              </p>
            </div>
          </label>
        );
      })}
      <p className="text-xs text-wine/50">
        Volgorde = volgorde op de eventpagina. Eén venue voor proeverij, meerdere
        voor wine walks.
      </p>
    </div>
  );
}
