"use server";

import { shareTablePageIntro, verifyTablePageToken } from "@/lib/table-page";

/** "Deel mijn intro" on the table page: only for the booking in the link. */
export async function shareTableIntroAction(token: string): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  await shareTablePageIntro(bookingId);
  return { ok: true };
}
