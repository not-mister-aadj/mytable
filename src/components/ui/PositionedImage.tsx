"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import type { ImageSettings } from "@/lib/image-settings";
import {
  DEFAULT_FOCAL,
  focalToObjectPosition,
} from "@/lib/image-settings";

export function PositionedImage({
  src,
  alt,
  settings,
  fill = true,
  className = "object-cover",
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  settings?: ImageSettings | null;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const focal = settings?.focalPoint ?? DEFAULT_FOCAL;
  const zoom = settings?.zoom ?? 1;
  const style: CSSProperties = {
    objectPosition: focalToObjectPosition(focal),
    ...(zoom > 1
      ? {
          transform: `scale(${zoom})`,
          transformOrigin: `${focal.x}% ${focal.y}%`,
        }
      : {}),
  };

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      style={style}
      sizes={sizes}
      priority={priority}
    />
  );
}
