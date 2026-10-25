"use server";

import { cancelLate } from "@/lib/late-cancel";
import { savePlusOneAnswers, shareTablePageIntro, verifyTablePageToken, type PlusOneAnswers } from "@/lib/table-page";

/** "Deel mijn intro" on the table page: only for the booking in the link. */
export async function shareTableIntroAction(token: string): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  await shareTablePageIntro(bookingId);
  return { ok: true };
}

/** The visitor's answers for their +1, only for this page. */
export async function savePlusOneAction(token: string, answers: PlusOneAnswers): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  await savePlusOneAnswers(bookingId, answers);
  return { ok: true };
}

/** "Kun je toch niet?": cancels the booking in the link, until the start. */
export async function cancelLateAction(token: string): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  return { ok: (await cancelLate(bookingId)).ok };
}
