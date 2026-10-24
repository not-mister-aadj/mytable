"use server";

import { saveFeedback, verifyFeedbackToken, type FeedbackState } from "@/lib/feedback";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, validateImageFile } from "@/lib/image-settings";
import { createSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";

/** Saves the answers given so far, only for the booking in the link. */
export async function saveFeedbackAction(token: string, input: Partial<FeedbackState>): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  const { photoUrl: _ignored, ...rest } = input;
  void _ignored;
  await saveFeedback(bookingId, rest);
  return { ok: true };
}

/** The profile photo next to their quote. */
export async function uploadFeedbackPhotoAction(token: string, form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false, error: "invalid" };
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "missing" };
  const problem = validateImageFile(file);
  if (problem) return { ok: false, error: problem };
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) return { ok: false, error: "too_big" };
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const mime = ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])
    ? file.type
    : `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;
  const supabase = createSupabaseAdminClient();
  const path = `feedback/${bookingId}-${Date.now()}.${safeExt}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, { contentType: mime, upsert: false });
  if (error) return { ok: false, error: error.message };
  const url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  await saveFeedback(bookingId, { photoUrl: url });
  return { ok: true, url };
}
