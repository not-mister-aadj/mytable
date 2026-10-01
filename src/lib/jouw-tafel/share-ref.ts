"use server";

import { recipientRef } from "@/lib/email/tracked-link";

/** utm_campaign of the quiz, and the campaign the share code is made for. */
const QUIZ_CAMPAIGN = "jouw-tafel";

/**
 * The `r` code for someone's share link: the same per-person code the mail
 * links use (src/lib/email/tracked-link.ts), so a booking that comes in
 * through a shared link can be traced back to who shared it, without their
 * email address ever appearing in the URL.
 */
export async function quizShareRef(email: string): Promise<string | null> {
  const value = typeof email === "string" ? email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 320) return null;
  return recipientRef(QUIZ_CAMPAIGN, value);
}
