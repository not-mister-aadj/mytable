"use server";

import { completeFeedback, saveFeedback, verifyFeedbackToken, type FeedbackState } from "@/lib/feedback";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings } from "@/db/schema";
import { setProfilePhoto } from "@/lib/profile-photo";
import { bookFreeSeatAfterFeedback, type FreeSeatResult } from "@/lib/feedback-free-seat";

/** Saves the answers given so far, only for the booking in the link. */
export async function saveFeedbackAction(token: string, input: Partial<FeedbackState>): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  const { photoUrl: _ignored, ...rest } = input;
  void _ignored;
  await saveFeedback(bookingId, rest);
  return { ok: true };
}

/** The last screen: everything saved, and marked as complete. */
export async function completeFeedbackAction(token: string, input: Partial<FeedbackState>): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  const { photoUrl: _ignored, ...rest } = input;
  void _ignored;
  await completeFeedback(bookingId, rest);
  return { ok: true };
}

/** A profile photo with their quote: saved on the person, so the account
 * shows it too and we never ask again. */
export async function uploadFeedbackPhotoAction(token: string, form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false, error: "invalid" };
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "missing" };
  const [booking] = await getDb().select({ email: bookings.email }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return { ok: false, error: "invalid" };
  const result = await setProfilePhoto(booking.email, file);
  if (result.ok) await saveFeedback(bookingId, { photoUrl: result.url });
  return result;
}

/** "De volgende is op ons": the free seat after Matig or Niet leuk. */
export async function bookFreeSeatAction(token: string, eventId: string): Promise<FreeSeatResult> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false, error: "not_allowed" };
  return bookFreeSeatAfterFeedback(bookingId, eventId);
}
