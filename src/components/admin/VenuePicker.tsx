"use client";

import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/db/schema";
import { adminPath } from "@/lib/admin-url";
import {
  isLocationTbdVenueId,
  LOCATION_TBD_VENUE_ID,
  locationTbdPickerCopy,
} from "@/lib/location-tbd-venue";

export function VenuePicker({
  allVenues,
  selectedIds,
  onChange,
  eventCity,
  locale = "nl",
}: {
  allVenues: Venue[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  eventCity?: string;
  locale?: "nl" | "en";
}) {
  const tbdCopy = locationTbdPickerCopy(locale);
  const hasTbd = selectedIds.includes(LOCATION_TBD_VENUE_ID);

  const unselected = [...allVenues]
    .filter((v) => !selectedIds.includes(v.id))
    .sort((a, b) => {
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

  function toggleTbd() {
    if (hasTbd) {
      onChange(selectedIds.filter((id) => !isLocationTbdVenueId(id)));
    } else {
      onChange([...selectedIds, LOCATION_TBD_VENUE_ID]);
    }
  }

  function move(id: string, dir: -1 | 1) {
    const i = selectedIds.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  if (allVenues.length === 0 && !hasTbd) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-wine/60">
          Nog geen venues.{" "}
          <Link href={adminPath("/venues/new")} className="text-burgundy underline">
            Maak er een aan
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={toggleTbd}
          className="w-full rounded-xl border border-dashed border-burgundy/35 bg-cream/50 px-4 py-3 text-left text-sm text-wine transition hover:border-burgundy/50"
        >
          <span className="font-medium text-burgundy">+ {tbdCopy.pickerLabel}</span>
          <span className="mt-1 block text-xs text-wine/55">{tbdCopy.pickerHint}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedIds.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-wine">
            Geselecteerde stops (volgorde = weergave op pagina)
          </p>
          <div className="space-y-2">
            {selectedIds.map((id, index) =>
              isLocationTbdVenueId(id) ? (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-burgundy/40 bg-cream p-3"
                >
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-beige font-serif text-2xl text-burgundy/70">
                    ?
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-wine">
                      {index + 1}. {tbdCopy.pickerLabel}
                    </p>
                    <p className="text-xs text-wine/60">{tbdCopy.pickerHint}</p>
                  </div>
                  <TbdMoveButtons
                    index={index}
                    total={selectedIds.length}
                    onMove={(dir) => move(id, dir)}
                  />
                  <button
                    type="button"
                    onClick={toggleTbd}
                    className="text-xs text-red-900 underline"
                  >
                    Verwijder
                  </button>
                </div>
              ) : (
                (() => {
                  const venue = allVenues.find((v) => v.id === id);
                  if (!venue) return null;
                  return (
                    <div
                      key={venue.id}
                      className="flex items-center gap-3 rounded-xl border border-burgundy bg-cream p-3"
                    >
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={venue.imageUrl ?? "/images/restaurant-interior.jpg"}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-wine">
                          {index + 1}. {venue.name}
                        </p>
                        <p className="text-xs text-wine/60">
                          {venue.city}
                          {venue.area ? ` · ${venue.area}` : ""}
                        </p>
                      </div>
                      <TbdMoveButtons
                        index={index}
                        total={selectedIds.length}
                        onMove={(dir) => move(venue.id, dir)}
                      />
                      <button
                        type="button"
                        onClick={() => toggle(venue.id)}
                        className="text-xs text-red-900 underline"
                      >
                        Verwijder
                      </button>
                    </div>
                  );
                })()
              ),
            )}
          </div>
        </div>
      ) : null}

      {!hasTbd ? (
        <div>
          <p className="mb-2 text-sm font-medium text-wine">Placeholder</p>
          <button
            type="button"
            onClick={toggleTbd}
            className="w-full rounded-xl border border-dashed border-burgundy/35 bg-cream/50 px-4 py-3 text-left text-sm transition hover:border-burgundy/50"
          >
            <span className="font-medium text-burgundy">+ {tbdCopy.pickerLabel}</span>
            <span className="mt-1 block text-xs text-wine/55">{tbdCopy.pickerHint}</span>
          </button>
        </div>
      ) : null}

      {unselected.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-wine">Voeg venue toe</p>
          <div className="space-y-2">
            {unselected.map((venue) => (
              <label
                key={venue.id}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-border-subtle bg-cream/50 p-3 transition hover:border-burgundy/20"
              >
                <input
                  type="checkbox"
                  checked={false}
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
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TbdMoveButtons({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className="rounded border border-border-subtle px-2 py-0.5 text-xs disabled:opacity-30"
        aria-label="Omhoog"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        className="rounded border border-border-subtle px-2 py-0.5 text-xs disabled:opacity-30"
        aria-label="Omlaag"
      >
        ↓
      </button>
    </div>
  );
}
