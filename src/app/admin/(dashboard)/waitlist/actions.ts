"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";
import {
  WAITLIST_WHATSAPP_INTERESTS,
  emptyWaitlistWhatsappLinks,
} from "@/lib/waitlist-whatsapp";
import { setWaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp.server";

export async function saveWaitlistWhatsappLinksAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  try {
    const links = emptyWaitlistWhatsappLinks();
    for (const id of WAITLIST_WHATSAPP_INTERESTS) {
      const raw = formData.get(id);
      links[id as WaitlistInterestId] =
        typeof raw === "string" ? raw.trim() : "";
    }
    await setWaitlistWhatsappLinks(links);
    revalidatePath("/admin/waitlist");
    revalidatePath("/wachtlijst");
    revalidatePath("/en/waitlist");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Opslaan mislukt",
    };
  }
}
