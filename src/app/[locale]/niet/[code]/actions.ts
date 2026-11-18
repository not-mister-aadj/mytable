"use server";

import { redirect } from "next/navigation";
import { isDbConfigured } from "@/db/index";
import { declineEvent } from "@/lib/invites/declines";
import { loadDeclineLink } from "./load";

/** "Klopt, ik kan niet": stored only on this button, never on opening the link
 * (mail scanners open every link). */
export async function confirmDecline(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "nl";
  if (!isDbConfigured()) return;
  const link = await loadDeclineLink(code);
  if (!link) return;
  await declineEvent({ email: link.email, eventId: link.eventId, source: "mail", sendId: link.sendId });
  redirect(`${locale === "en" ? "/en" : ""}/niet/${code}?klaar=1`);
}
