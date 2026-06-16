"use client";

import type { Venue } from "@/db/schema";
import type { VenueImageRef } from "@/lib/venue-images";
import {
  buildVenueImageCatalog,
  venueImageRefKey,
} from "@/lib/venue-images";
import { PositionedImage } from "@/components/ui/PositionedImage";

type VenueImagePickerProps = {
  allVenues: Venue[];
  venueIds: string[];
  galleryRefs: VenueImageRef[];
  heroRef?: VenueImageRef;
  cardRef?: VenueImageRef;
  separateHero: boolean;
  onGalleryChange: (refs: VenueImageRef[] | undefined) => void;
  onHeroChange: (ref: VenueImageRef | undefined) => void;
  onCardChange: (ref: VenueImageRef | undefined) => void;
};

export function VenueImagePicker({
  allVenues,
  venueIds,
  galleryRefs,
  heroRef,
  cardRef,
  separateHero,
  onGalleryChange,
  onHeroChange,
  onCardChange,
}: VenueImagePickerProps) {
  const catalog = buildVenueImageCatalog(allVenues, venueIds);
  const galleryKeys = new Set(galleryRefs.map(venueImageRefKey));
  const heroKey = heroRef ? venueImageRefKey(heroRef) : null;
  const cardKey = cardRef ? venueImageRefKey(cardRef) : null;

  if (venueIds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-cream/50 p-6 text-sm text-wine/60">
        Selecteer eerst venue(s) in de vorige stap. Alle event-afbeeldingen komen
        uit de venue-bibliotheek — geen aparte uploads op het event.
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-cream/50 p-6 text-sm text-wine/60">
        De geselecteerde venue(s) hebben nog geen foto&apos;s. Voeg een hero en
        galerij toe via{" "}
        <span className="font-medium text-wine">Admin → Venues</span>.
      </div>
    );
  }

  function toggleGallery(ref: VenueImageRef) {
    const key = venueImageRefKey(ref);
    if (galleryKeys.has(key)) {
      const next = galleryRefs.filter((r) => venueImageRefKey(r) !== key);
      onGalleryChange(next.length > 0 ? next : undefined);
      return;
    }
    onGalleryChange([...galleryRefs, ref]);
  }

  function moveGallery(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= galleryRefs.length) return;
    const next = [...galleryRefs];
    [next[index], next[target]] = [next[target], next[index]];
    onGalleryChange(next);
  }

  const byVenue = new Map<string, typeof catalog>();
  for (const item of catalog) {
    const list = byVenue.get(item.venueName) ?? [];
    list.push(item);
    byVenue.set(item.venueName, list);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-wine/60">
        Kies afbeeldingen uit de venue-bibliotheek. Wijzigingen aan venue-foto&apos;s
        werken automatisch door op alle gekoppelde events.
      </p>

      {[...byVenue.entries()].map(([venueName, items]) => (
        <div key={venueName}>
          <h3 className="text-sm font-medium text-burgundy">{venueName}</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => {
              const key = venueImageRefKey(item.ref);
              const inGallery = galleryKeys.has(key);
              const isHero = heroKey === key;
              const isCard = cardKey === key;

              return (
                <div
                  key={key}
                  className={`overflow-hidden rounded-xl border bg-cream ${
                    inGallery || isHero || isCard
                      ? "border-burgundy/40 ring-1 ring-burgundy/20"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="relative aspect-[4/3]">
                    <PositionedImage
                      src={item.settings.url}
                      alt=""
                      settings={item.settings}
                      sizes="200px"
                    />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {isCard ? (
                        <span className="rounded-full bg-burgundy px-2 py-0.5 text-[10px] font-medium text-cream">
                          Kaart
                        </span>
                      ) : null}
                      {isHero ? (
                        <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium text-wine">
                          Hero
                        </span>
                      ) : null}
                      {inGallery ? (
                        <span className="rounded-full bg-wine/80 px-2 py-0.5 text-[10px] font-medium text-cream">
                          Galerij
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-1.5 p-2">
                    <p className="text-[10px] text-wine/50">{item.label}</p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onCardChange(isCard ? undefined : item.ref)
                        }
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          isCard
                            ? "bg-burgundy text-cream"
                            : "border border-border-subtle text-wine/70 hover:border-burgundy/30"
                        }`}
                      >
                        {isCard ? "✓ Kaart" : "Kaart"}
                      </button>
                      {separateHero ? (
                        <button
                          type="button"
                          onClick={() =>
                            onHeroChange(isHero ? undefined : item.ref)
                          }
                          className={`rounded-full px-2 py-1 text-[10px] ${
                            isHero
                              ? "bg-gold text-wine"
                              : "border border-border-subtle text-wine/70 hover:border-burgundy/30"
                          }`}
                        >
                          {isHero ? "✓ Hero" : "Hero"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleGallery(item.ref)}
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          inGallery
                            ? "bg-wine text-cream"
                            : "border border-border-subtle text-wine/70 hover:border-burgundy/30"
                        }`}
                      >
                        {inGallery ? "✓ Galerij" : "Galerij"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {galleryRefs.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-wine">Volgorde sfeerimpressie</h3>
          <p className="mt-1 text-xs text-wine/50">
            Eerste foto wordt groot op de detailpagina getoond.
          </p>
          <ul className="mt-3 space-y-2">
            {galleryRefs.map((ref, index) => {
              const item = catalog.find(
                (c) => venueImageRefKey(c.ref) === venueImageRefKey(ref),
              );
              if (!item) return null;
              return (
                <li
                  key={venueImageRefKey(ref)}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-beige px-3 py-2"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                    <PositionedImage
                      src={item.settings.url}
                      alt=""
                      settings={item.settings}
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-xs text-wine/70">
                    <span className="font-medium text-wine">
                      {index + 1}. {item.venueName}
                    </span>
                    <span className="text-wine/50"> · {item.label}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={() => moveGallery(index, -1)}
                        className="text-xs text-wine/50 hover:text-burgundy"
                      >
                        ↑
                      </button>
                    ) : null}
                    {index < galleryRefs.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => moveGallery(index, 1)}
                        className="text-xs text-wine/50 hover:text-burgundy"
                      >
                        ↓
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleGallery(ref)}
                      className="text-xs text-wine/50 hover:text-burgundy"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
