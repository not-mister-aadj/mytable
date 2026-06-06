"use client";

import { useMemo } from "react";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { imageUrlKey } from "@/lib/image-url-key";
import type { ImageSettings } from "@/lib/image-settings";

type GalleryItem = {
  url: string;
  settings?: ImageSettings;
};

function pickUniqueGalleryItems(
  items: GalleryItem[],
  fallbacks: string[],
): GalleryItem[] {
  const used = new Set<string>();

  return items.map((item) => {
    for (const url of [item.url, ...fallbacks]) {
      if (!url) continue;
      const key = imageUrlKey(url);
      if (used.has(key)) continue;
      used.add(key);
      return {
        url,
        settings: key === imageUrlKey(item.url) ? item.settings : undefined,
      };
    }
    return item;
  });
}

export function BookingGalleryGrid({
  items,
  fallbacks,
  altPrefix,
}: {
  items: GalleryItem[];
  fallbacks: string[];
  altPrefix: string;
}) {
  const displayItems = useMemo(
    () => pickUniqueGalleryItems(items, fallbacks),
    [items, fallbacks],
  );

  if (displayItems.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {displayItems.map((item, index) => (
        <div
          key={`${item.url}-${index}`}
          className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(43,13,18,0.10)]"
        >
          <PositionedImage
            src={item.url}
            alt={`${altPrefix} ${index + 1}`}
            settings={item.settings}
            sizes="(max-width: 1024px) 33vw, 200px"
          />
        </div>
      ))}
    </div>
  );
}
