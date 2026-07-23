import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { siteSettings } from "@/db/schema";
import {
  WAITLIST_WHATSAPP_SETTING_KEY,
  emptyWaitlistWhatsappLinks,
  parseWaitlistWhatsappLinks,
  type WaitlistWhatsappLinks,
} from "@/lib/waitlist-whatsapp";

export async function getWaitlistWhatsappLinks(): Promise<WaitlistWhatsappLinks> {
  if (!isDbConfigured()) return emptyWaitlistWhatsappLinks();
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, WAITLIST_WHATSAPP_SETTING_KEY))
      .limit(1);
    return parseWaitlistWhatsappLinks(row?.value);
  } catch (error) {
    console.error("[waitlist-whatsapp] Failed to load site_settings:", error);
    return emptyWaitlistWhatsappLinks();
  }
}

export async function setWaitlistWhatsappLinks(
  links: WaitlistWhatsappLinks,
): Promise<void> {
  if (!isDbConfigured()) {
    throw new Error("Database niet geconfigureerd");
  }
  const db = getDb();
  const value = parseWaitlistWhatsappLinks(links);
  await db
    .insert(siteSettings)
    .values({
      key: WAITLIST_WHATSAPP_SETTING_KEY,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });
}
