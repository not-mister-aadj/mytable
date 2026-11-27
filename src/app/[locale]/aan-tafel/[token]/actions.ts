"use server";

import { confirmAttendance } from "@/lib/attendance";
import { cancelLate } from "@/lib/late-cancel";
import { isCancelReason } from "@/lib/cancel-reasons";
import { saveVenueAnswers, type VenueAnswers } from "@/lib/venue-questions";
import { longDate } from "@/lib/admin/sunday-mails";
import { handOverSeat } from "@/lib/seat-handover";
import { moveSeat } from "@/lib/seat-move";
import { savePlusOneAnswers, shareTablePageIntro, verifyTablePageToken, type PlusOneAnswers } from "@/lib/table-page";
import { setFeedbackPhoto } from "@/lib/feedback";
import { createHandOverLink, revokeHandOverLink } from "@/lib/seat-handover-link";

/** The profile photo, set from the top of the table page on the day. */
export async function uploadTablePhotoAction(token: string, form: FormData): Promise<{ ok: true; url: string } | { ok: false }> {
  const bookingId = await verifyTablePageToken(token);
  const file = form.get("photo");
  if (!bookingId || !(file instanceof File) || file.size === 0) return { ok: false };
  return setFeedbackPhoto(bookingId, file);
}

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

/** "Ja, ik kom" from "Kom je zondag?", for the booking in the link. */
export async function confirmAttendanceAction(token: string): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  return { ok: await confirmAttendance(bookingId) };
}

/** "Kun je toch niet?": gives up the seat of the booking in the link, until the start, with what happened. */
export async function cancelLateAction(token: string, reason?: string, kind?: string): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  return { ok: (await cancelLate(bookingId, new Date(), reason, isCancelReason(kind) ? kind : undefined)).ok };
}

/** "Verzet mijn plek": moves the seat in the link to the Sunday they picked. */
export async function moveSeatAction(
  token: string,
  eventId: string,
  locale: "nl" | "en",
): Promise<{ ok: true; label: string; tableUrl: string } | { ok: false; error: string }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId || !/^[0-9a-f-]{36}$/i.test(eventId)) return { ok: false, error: "closed" };
  const lang = locale === "en" ? "en" : "nl";
  const result = await moveSeat(bookingId, eventId, lang);
  if (!result.ok) return result;
  return { ok: true, label: `${longDate(new Date(result.startsAt), lang)} in ${result.city}`, tableUrl: result.tableUrl };
}

/** "Geef mijn plek door": someone else comes in their place. */
export async function handOverSeatAction(token: string, to: { name: string; email: string }): Promise<{ ok: boolean; error?: string }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false, error: "closed" };
  const result = await handOverSeat(bookingId, { name: String(to?.name ?? ""), email: String(to?.email ?? "") });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** "Geef mijn plek door" as a link to share: the open one, else a new one. */
export async function shareSeatLinkAction(token: string): Promise<{ ok: boolean; url?: string }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  const url = await createHandOverLink(bookingId);
  return url ? { ok: true, url } : { ok: false };
}

/** "Link intrekken": the shared link stops working. */
export async function revokeSeatLinkAction(token: string): Promise<{ ok: boolean }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  await revokeHandOverLink(bookingId);
  return { ok: true };
}

/** "Twee vragen" from the venue (diet, live music): for the booking in the link. */
export async function saveVenueAnswersAction(token: string, patch: VenueAnswers): Promise<{ ok: boolean; answers?: VenueAnswers }> {
  const bookingId = await verifyTablePageToken(token);
  if (!bookingId) return { ok: false };
  const answers = await saveVenueAnswers(bookingId, patch);
  return answers ? { ok: true, answers } : { ok: false };
}
