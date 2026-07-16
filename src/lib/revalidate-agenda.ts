import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";

export function revalidateEventPaths(slug: string) {
  revalidateTag(PUBLISHED_EVENTS_CACHE_TAG, "max");
  revalidateTag(`experience:${slug}`, "max");

  for (const path of [
    "/agenda",
    "/en/agenda",
    `/agenda/${slug}`,
    `/en/agenda/${slug}`,
    "/nl/agenda",
    `/nl/agenda/${slug}`,
    "/",
    "/nl",
    "/en",
    "/girls-only",
    "/en/girls-only",
    "/sitemap.xml",
    "/admin/bookings",
  ]) {
    revalidatePath(path);
  }
}
