"use client";

import { useState } from "react";
import type { ImageSettings } from "@/lib/image-settings";
import { createImageSettings, galleryUrls } from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { ImageEditModal } from "./ImageEditModal";
import { MediaLibrary, type MediaItem } from "./MediaLibrary";

type EventGalleryEditorProps = {
  images: ImageSettings[];
  onChange: (images: ImageSettings[] | undefined) => void;
  label?: string;
  hint?: string;
};

export function EventGalleryEditor({
  images,
  onChange,
  label = "Sfeerimpressie",
  hint = "Foto's op de detailpagina. Leeg = standaard van het experience type.",
}: EventGalleryEditorProps) {
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
          <span className="text-sm font-medium text-wine">{label}</span>
          {hint ? (
            <p className="mt-1 text-xs text-wine/50">{hint}</p>
          ) : null}
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
                <p className="truncate text-xs text-wine/60">{item.url}</p>
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
                {index === 0 ? (
                  <p className="mt-1 text-[10px] text-wine/45">
                    Eerste foto = groot op de pagina
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-wine/50">
          Nog geen eigen foto&apos;s. Voeg er een of meer toe, of laat leeg voor
          de standaard sfeerimpressie.
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
