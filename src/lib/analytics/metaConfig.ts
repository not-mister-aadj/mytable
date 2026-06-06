import { isLocalDevHost } from "@/lib/admin-url";

export function getMetaPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
}

export function getMetaCapiAccessToken(): string | null {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || null;
}

export function getMetaCapiTestEventCode(): string | null {
  return process.env.META_CAPI_TEST_EVENT_CODE?.trim() || null;
}

export function isMetaPixelConfigured(): boolean {
  return Boolean(getMetaPixelId());
}

/** False on localhost/LAN — browser pixel must not load or fire there. */
export function isMetaPixelEnabled(): boolean {
  if (!isMetaPixelConfigured()) return false;
  if (typeof window !== "undefined" && isLocalDevHost(window.location.hostname)) {
    return false;
  }
  return true;
}

export function isMetaCapiConfigured(): boolean {
  return Boolean(getMetaPixelId() && getMetaCapiAccessToken());
}
