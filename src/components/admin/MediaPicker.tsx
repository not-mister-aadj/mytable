"use client";

import { useState } from "react";
import type { ImageSettings, ImageUsage } from "@/lib/image-settings";
import {
  createImageSettings,
  isUsableImageUrl,
} from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { ImageEditModal } from "./ImageEditModal";
import { MediaLibrary, type MediaItem } from "./MediaLibrary";

export function MediaPicker({
  value,
  onChange,
  label = "Afbeelding",
  usage = "agenda-card",
}: {
  value?: ImageSettings | null;
  onChange: (settings: ImageSettings | undefined) => void;
  label?: string;
  usage?: ImageUsage;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editSettings, setEditSettings] = useState<ImageSettings | null>(null);

  const hasImage = value?.url && isUsableImageUrl(value.url);

  function startEdit(base: ImageSettings) {
    setEditSettings(base);
  }

  function handleLibrarySelect(url: string, item?: MediaItem) {
    setLibraryOpen(false);
    startEdit(
      createImageSettings(url, usage, {
        ...value,
        url,
        mediaId: item?.path ?? value?.mediaId,
      }),
    );
  }

  return (
    <div>
      <span className="text-sm font-medium text-wine">{label}</span>
      <div className="mt-2 flex items-start gap-4">
        {hasImage ? (
          <button
            type="button"
            onClick={() => value && startEdit(value)}
            className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-border-subtle"
          >
            <PositionedImage
              src={value!.url}
              alt=""
              settings={value}
              sizes="144px"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex h-24 w-36 flex-col items-center justify-center rounded-xl border border-dashed border-burgundy/30 bg-cream px-2 text-center text-xs text-burgundy hover:bg-cream/80"
          >
            Kies afbeelding
          </button>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="rounded-full bg-burgundy px-4 py-2 text-sm text-cream"
          >
            {hasImage ? "Wijzig afbeelding" : "Kies uit library"}
          </button>
          {hasImage ? (
            <>
              <button
                type="button"
                onClick={() => value && startEdit(value)}
                className="text-xs text-burgundy underline"
              >
                Afbeelding aanpassen
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-xs text-wine/50 hover:text-burgundy"
              >
                Verwijderen
              </button>
            </>
          ) : null}
        </div>
      </div>

      <MediaLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleLibrarySelect}
      />

      {editSettings ? (
        <ImageEditModal
          open
          onClose={() => setEditSettings(null)}
          usage={usage}
          initial={editSettings}
          onSave={(s) => {
            onChange(s);
            setEditSettings(null);
          }}
        />
      ) : null}
    </div>
  );
}
