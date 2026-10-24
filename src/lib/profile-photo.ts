import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { customers } from "@/db/schema";
import { normalizeEmail } from "@/lib/customers/normalize";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, validateImageFile } from "@/lib/image-settings";
import { createSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";

/** A person's profile photo, kept on the customer: set in the account
 * settings or with their feedback, and shown next to their quote. */

export async function getProfilePhoto(email: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ photoUrl: customers.photoUrl })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(email)))
    .limit(1);
  return row?.photoUrl ?? null;
}

/** Uploads the file and sets it as the person's photo. */
export async function setProfilePhoto(email: string, file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const problem = validateImageFile(file);
  if (problem) return { ok: false, error: problem };
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) return { ok: false, error: "too_big" };
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const mime = ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])
    ? file.type
    : `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;
  const { id: customerId } = await upsertCustomerFromEmail({ email });
  const supabase = createSupabaseAdminClient();
  const path = `profiles/${customerId}-${Date.now()}.${safeExt}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, { contentType: mime, upsert: false });
  if (error) return { ok: false, error: error.message };
  const url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  await getDb().update(customers).set({ photoUrl: url, updatedAt: new Date() }).where(eq(customers.id, customerId));
  return { ok: true, url };
}
