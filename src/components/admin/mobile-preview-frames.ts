export type MobilePreviewSize = "small" | "mid" | "large";

/** Logical viewport sizes (CSS px) matching common phones */
export const MOBILE_PREVIEW_FRAMES: Record<
  MobilePreviewSize,
  { label: string; width: number; height: number; device: string }
> = {
  small: {
    label: "Klein",
    width: 375,
    height: 667,
    device: "iPhone SE / compact",
  },
  mid: {
    label: "Mid",
    width: 390,
    height: 844,
    device: "iPhone 14 / standaard",
  },
  large: {
    label: "Groot",
    width: 430,
    height: 932,
    device: "iPhone Pro Max / groot",
  },
};

export const DEFAULT_MOBILE_PREVIEW_SIZE: MobilePreviewSize = "mid";
