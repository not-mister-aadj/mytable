"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { removePriorityListSignupByEmail } from "@/lib/priority-list-data";
import { revalidatePath } from "next/cache";

export async function removePriorityListSignupAction(
  email: string,
): Promise<{ error: string | null }> {
  await requireAdmin();

  if (!isDbConfigured()) {
    return { error: "Database niet geconfigureerd." };
  }

  try {
    const removed = await removePriorityListSignupByEmail(email);
    if (removed === 0) {
      return { error: "Deze persoon staat niet (meer) op de Priority List." };
    }

    revalidatePath(adminPath("/priority-list"));
    return { error: null };
  } catch (error) {
    console.error("[priority-list] remove failed", error);
    return { error: "Verwijderen mislukt. Probeer het opnieuw." };
  }
}
