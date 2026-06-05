"use client";

import { useMemo, useState } from "react";
import { PositionedImage } from "@/components/ui/PositionedImage";
import type { ImageSettings } from "@/lib/image-settings";

type GalleryItem = {
  url: string;
  settings?: ImageSettings;
};

export function BookingGalleryGrid({
  items,
  fallbacks,
  altPrefix,
}: {
  items: GalleryItem[];
  fallbacks: string[];
  altPrefix: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, index) => (
        <GalleryTile
          key={`${item.url}-${index}`}
          item={item}
          fallbacks={fallbacks}
          alt={`${altPrefix} ${index + 1}`}
        />
      ))}
    </div>
  );
}

function GalleryTile({
  item,
  fallbacks,
  alt,
}: {
  item: GalleryItem;
  fallbacks: string[];
  alt: string;
}) {
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const url of [item.url, ...fallbacks]) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
    return urls;
  }, [item.url, fallbacks]);

  const [index, setIndex] = useState(0);
  const src = candidates[index] ?? item.url;
  const settings = index === 0 ? item.settings : undefined;

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(43,13,18,0.1)]">
      <PositionedImage
        src={src}
        alt={alt}
        settings={settings}
        sizes="(max-width: 1024px) 33vw, 200px"
        onError={() => {
          setIndex((current) =>
            current < candidates.length - 1 ? current + 1 : current,
          );
        }}
      />
    </div>
  );
}
