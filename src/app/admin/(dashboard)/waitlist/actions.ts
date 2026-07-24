"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";
import { removeWaitlistSignupByEmail } from "@/lib/waitlist-data";
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
    revalidatePath(adminPath("/waitlist"));
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

export async function removeWaitlistSignupAction(
  email: string,
): Promise<{ error: string | null }> {
  await requireAdmin();

  if (!isDbConfigured()) {
    return { error: "Database niet geconfigureerd." };
  }

  try {
    const removed = await removeWaitlistSignupByEmail(email);
    if (removed === 0) {
      return { error: "Deze persoon staat niet (meer) op de wachtlijst." };
    }

    revalidatePath("/admin/waitlist");
    revalidatePath(adminPath("/waitlist"));
    return { error: null };
  } catch (error) {
    console.error("[waitlist] remove failed", error);
    return { error: "Verwijderen mislukt. Probeer het opnieuw." };
  }
}
