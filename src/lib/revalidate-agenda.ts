import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";

export function revalidateEventPaths(slug: string) {
  revalidateTag(PUBLISHED_EVENTS_CACHE_TAG, "max");
  revalidateTag(`experience:${slug}`, "max");
  revalidatePath("/nl/agenda");
  revalidatePath("/en/agenda");
  revalidatePath(`/nl/agenda/${slug}`);
  revalidatePath(`/en/agenda/${slug}`);
  revalidatePath("/nl");
  revalidatePath("/en");
  revalidatePath("/girls-only");
  revalidatePath("/en/girls-only");
  revalidatePath("/admin/bookings");
}
