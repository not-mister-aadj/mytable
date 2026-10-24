"use server";

import { saveFeedback, verifyFeedbackToken, type FeedbackState } from "@/lib/feedback";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings } from "@/db/schema";
import { setProfilePhoto } from "@/lib/profile-photo";

/** Saves the answers given so far, only for the booking in the link. */
export async function saveFeedbackAction(token: string, input: Partial<FeedbackState>): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  const { photoUrl: _ignored, ...rest } = input;
  void _ignored;
  await saveFeedback(bookingId, rest);
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
