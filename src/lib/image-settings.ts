import { images } from "@/data/images";

export type ImageAspectRatio =
  | "16:10"
  | "4:3"
  | "16:9"
  | "21:9"
  | "1:1"
  | "3:4"
  | "4:5";

export type ImageUsage =
  | "agenda-card"
  | "hero"
  | "hero-mobile"
  | "gallery"
  | "venue";

export type ImageFocalPoint = { x: number; y: number };

export type ImageSettings = {
  mediaId?: string;
  url: string;
  focalPoint: ImageFocalPoint;
  aspectRatio: ImageAspectRatio;
  zoom?: number;
};

export const DEFAULT_FOCAL: ImageFocalPoint = { x: 50, y: 45 };

export const DEFAULT_EVENT_IMAGE = images.wineBar;
export const DEFAULT_VENUE_IMAGE = images.restaurantInterior;

const USAGE_DEFAULT_RATIO: Record<ImageUsage, ImageAspectRatio> = {
  "agenda-card": "16:10",
  hero: "21:9",
  "hero-mobile": "4:5",
  gallery: "4:3",
  venue: "4:3",
};

export const RATIO_OPTIONS: Record<ImageUsage, ImageAspectRatio[]> = {
  "agenda-card": ["16:10", "4:3"],
  hero: ["21:9", "16:9"],
  "hero-mobile": ["4:5", "4:3"],
  gallery: ["1:1", "4:3", "3:4"],
  venue: ["4:3"],
};

export function defaultAspectForUsage(usage: ImageUsage): ImageAspectRatio {
  return USAGE_DEFAULT_RATIO[usage];
}

export function aspectRatioToCss(ratio: ImageAspectRatio): string {
  return ratio.replace(":", " / ");
}

export function focalToObjectPosition(focal: ImageFocalPoint): string {
  const x = Math.min(100, Math.max(0, focal.x));
  const y = Math.min(100, Math.max(0, focal.y));
  return `${x}% ${y}%`;
}

export function imageSettingsStyle(
  settings?: ImageSettings | null,
): { objectPosition: string; transform?: string } {
  if (!settings) return { objectPosition: focalToObjectPosition(DEFAULT_FOCAL) };
  const zoom = settings.zoom ?? 1;
  return {
    objectPosition: focalToObjectPosition(
      settings.focalPoint ?? DEFAULT_FOCAL,
    ),
    ...(zoom > 1 ? { transform: `scale(${zoom})` } : {}),
  };
}

export function createImageSettings(
  url: string,
  usage: ImageUsage,
  partial?: Partial<ImageSettings>,
): ImageSettings {
  return {
    url,
    mediaId: partial?.mediaId,
    focalPoint: partial?.focalPoint ?? DEFAULT_FOCAL,
    aspectRatio: partial?.aspectRatio ?? defaultAspectForUsage(usage),
    zoom: partial?.zoom ?? 1,
  };
}

export function parseImageSettings(raw: unknown): ImageSettings | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url.trim() : "";
  if (!url) return undefined;
  const fp = o.focalPoint;
  let focalPoint = DEFAULT_FOCAL;
  if (fp && typeof fp === "object") {
    const f = fp as Record<string, unknown>;
    const x = Number(f.x);
    const y = Number(f.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      focalPoint = {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      };
    }
  }
  const aspectRatio = isAspectRatio(o.aspectRatio)
    ? o.aspectRatio
    : "4:3";
  const zoom = Number(o.zoom);
  return {
    url,
    mediaId: typeof o.mediaId === "string" ? o.mediaId : undefined,
    focalPoint,
    aspectRatio,
    zoom: Number.isFinite(zoom) ? Math.min(2, Math.max(1, zoom)) : 1,
  };
}

function isAspectRatio(v: unknown): v is ImageAspectRatio {
  return (
    v === "16:10" ||
    v === "4:3" ||
    v === "16:9" ||
    v === "21:9" ||
    v === "1:1" ||
    v === "3:4" ||
    v === "4:5"
  );
}

/** Legacy URL string or full settings object */
export function coerceImageSettings(
  raw: unknown,
  usage: ImageUsage,
): ImageSettings | undefined {
  if (typeof raw === "string" && raw.trim()) {
    return createImageSettings(raw.trim(), usage);
  }
  const parsed = parseImageSettings(raw);
  if (parsed) return parsed;
  return undefined;
}

export function parseGalleryImages(raw: unknown): ImageSettings[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => coerceImageSettings(item, "gallery"))
    .filter((s): s is ImageSettings => Boolean(s));
}

export function galleryUrls(items: ImageSettings[]): string[] {
  return items.map((i) => i.url);
}

export function isUsableImageUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith("/images/") && !url.includes("unsplash")) return false;
  return true;
}

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (file.size === 0) return "Kies een afbeelding.";
  if (file.size > MAX_IMAGE_BYTES) {
    return "Afbeelding is te groot (max 10 MB).";
  }
  const mime = file.type.toLowerCase();
  if (mime && !ALLOWED_IMAGE_MIME.includes(mime as (typeof ALLOWED_IMAGE_MIME)[number])) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const okExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext ?? "");
    if (!okExt) {
      return "Alleen JPG, PNG, WebP of GIF zijn toegestaan.";
    }
  }
  return null;
}
