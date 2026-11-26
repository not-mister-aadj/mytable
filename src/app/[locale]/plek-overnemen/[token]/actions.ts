"use server";

import { signInFromMail } from "@/lib/auth/mail-login";
import { getMemberUser } from "@/lib/member-auth";
import { claimHandOverLink } from "@/lib/seat-handover-link";
import { tablePageUrl } from "@/lib/table-page";

/**
 * "Neem de plek over": the seat moves to them. Someone new is signed in on
 * this device (the account was just made for them); someone with an account
 * is not, because whoever opened a shared link need not own that address.
 */
export async function claimSeatAction(
  token: string,
  input: { name: string; email: string; birthDate: string; locale: "nl" | "en" },
): Promise<{ ok: true; tableUrl: string } | { ok: false; error: string }> {
  const result = await claimHandOverLink(token, {
    name: String(input?.name ?? ""),
    email: String(input?.email ?? ""),
    birthDate: String(input?.birthDate ?? ""),
  });
  if (!result.ok) return { ok: false, error: result.error };
  if (result.newAccount) {
    const current = await getMemberUser().catch(() => null);
    if (!current) await signInFromMail(result.email).catch(() => false);
  }
  return { ok: true, tableUrl: await tablePageUrl(result.bookingId, input?.locale === "en" ? "en" : "nl", "") };
}
