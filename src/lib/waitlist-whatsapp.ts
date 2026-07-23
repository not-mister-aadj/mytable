import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";

export const WAITLIST_WHATSAPP_SETTING_KEY = "waitlist_whatsapp";

export const WAITLIST_WHATSAPP_INTERESTS: WaitlistInterestId[] = [
  "wine_tasting",
  "chefs_special",
  "wine_walk",
  "aperitivo",
];

export const WAITLIST_WHATSAPP_LABELS: Record<WaitlistInterestId, string> = {
  wine_tasting: "Wijnproeverij",
  chefs_special: "Chef's Table",
  wine_walk: "Wine Walk",
  aperitivo: "Golden Hour Aperitivo",
};

export type WaitlistWhatsappLinks = Record<WaitlistInterestId, string>;

export function emptyWaitlistWhatsappLinks(): WaitlistWhatsappLinks {
  return {
    wine_tasting: "",
    chefs_special: "",
    wine_walk: "",
    aperitivo: "",
  };
}

export function parseWaitlistWhatsappLinks(
  value: unknown,
): WaitlistWhatsappLinks {
  const base = emptyWaitlistWhatsappLinks();
  if (!value || typeof value !== "object") return base;
  const raw = value as Record<string, unknown>;
  for (const id of WAITLIST_WHATSAPP_INTERESTS) {
    const link = raw[id];
    if (typeof link === "string") {
      base[id] = link.trim();
    }
  }
  return base;
}

export function isUsableWhatsappInviteUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "chat.whatsapp.com" ||
        parsed.hostname === "wa.me" ||
        parsed.hostname.endsWith(".whatsapp.com"))
    );
  } catch {
    return false;
  }
}

export function resolveWhatsappInviteForInterests(
  links: WaitlistWhatsappLinks,
  interests: WaitlistInterestId[],
): string | null {
  for (const interest of interests) {
    const url = links[interest]?.trim() ?? "";
    if (isUsableWhatsappInviteUrl(url)) return url;
  }
  return null;
}

export function resolveWhatsappInvitesForInterests(
  links: WaitlistWhatsappLinks,
  interests: WaitlistInterestId[],
): Array<{ id: WaitlistInterestId; url: string }> {
  const invites: Array<{ id: WaitlistInterestId; url: string }> = [];
  for (const interest of interests) {
    const url = links[interest]?.trim() ?? "";
    if (isUsableWhatsappInviteUrl(url)) {
      invites.push({ id: interest, url });
    }
  }
  return invites;
}
