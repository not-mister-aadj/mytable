"use client";

import { useState } from "react";
import type { ImageSettings } from "@/lib/image-settings";
import { createImageSettings, galleryUrls } from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { ImageEditModal } from "./ImageEditModal";
import { MediaLibrary, type MediaItem } from "./MediaLibrary";

type VenueGalleryEditorProps = {
  images: ImageSettings[];
  onChange: (images: ImageSettings[] | undefined) => void;
};

export function VenueGalleryEditor({
  images,
  onChange,
}: VenueGalleryEditorProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  function commit(next: ImageSettings[]) {
    onChange(next.length > 0 ? next : undefined);
  }

  function addFromLibrary(url: string, item?: MediaItem) {
    const settings = createImageSettings(url, "gallery", {
      mediaId: item?.path,
    });
    commit([...images, settings]);
  }

  function updateAt(index: number, settings: ImageSettings) {
    const next = [...images];
    next[index] = settings;
    commit(next);
  }

  function removeAt(index: number) {
    commit(images.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-wine">Galerij</span>
          <p className="mt-1 text-xs text-wine/50">
            Extra sfeerbeelden voor events op deze locatie. Sleep via omhoog /
            omlaag om te sorteren.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="rounded-full bg-burgundy px-4 py-2 text-sm text-cream"
        >
          Afbeelding toevoegen
        </button>
      </div>

      {images.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {images.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="flex items-start gap-3 rounded-xl border border-border-subtle bg-cream p-3"
            >
              <button
                type="button"
                onClick={() => setEditIndex(index)}
                className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border-subtle"
              >
                <PositionedImage
                  src={item.url}
                  alt=""
                  settings={item}
                  sizes="112px"
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-wine/70">
                  Galerij {index + 1}
                </p>
                <p className="mt-0.5 truncate text-xs text-wine/50">
                  {item.url}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIndex(index)}
                    className="text-xs text-burgundy underline"
                  >
                    Bijsnijden / focus
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="text-xs text-wine/50 hover:text-burgundy"
                  >
                    Verwijderen
                  </button>
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      className="text-xs text-wine/50 hover:text-burgundy"
                    >
                      Omhoog
                    </button>
                  ) : null}
                  {index < images.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      className="text-xs text-wine/50 hover:text-burgundy"
                    >
                      Omlaag
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-wine/50">
          Nog geen galerijfoto&apos;s. Voeg beelden toe die je later bij events
          kunt kiezen.
        </p>
      )}

      <MediaLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        multi
        selected={galleryUrls(images)}
        onSelect={addFromLibrary}
      />

      {editIndex !== null && images[editIndex] ? (
        <ImageEditModal
          open
          onClose={() => setEditIndex(null)}
          usage="gallery"
          initial={images[editIndex]}
          onSave={(s) => {
            updateAt(editIndex, s);
            setEditIndex(null);
          }}
        />
      ) : null}
    </div>
  );
}
