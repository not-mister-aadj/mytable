import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import type { Event } from "@/db/schema";
import { sundayTableLocationPath } from "@/i18n/config";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { sundayTableLpSlugFromCity } from "@/data/sunday-table-lp-cities";

/** Sunday Table's reveal page (/sunday-table/[city]/[date]) shows a live
 * "spots left" chip, but isn't covered by the generic /agenda paths below,
 * so a fresh purchase or admin edit wouldn't show up there until the
 * page's own 60s ISR window happened to pass. */
function sundayTablePaths(event: Pick<Event, "experienceType" | "city" | "startsAt">): string[] {
  if (event.experienceType !== "sunday-table") return [];
  const citySlug = sundayTableLpSlugFromCity(event.city);
  if (!citySlug) return [];
  const dateIso = amsterdamDateIso(new Date(event.startsAt));
  return [
    sundayTableLocationPath("nl", citySlug, dateIso),
    sundayTableLocationPath("en", citySlug, dateIso),
  ];
}

/** Pass the full event row (not just its slug) whenever it's on hand, so
 * Sunday Table editions also revalidate their own reveal page. */
export function revalidateEventPaths(
  event: string | Pick<Event, "slug" | "experienceType" | "city" | "startsAt">,
) {
  const slug = typeof event === "string" ? event : event.slug;
  const extraPaths = typeof event === "string" ? [] : sundayTablePaths(event);

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
    ...extraPaths,
  ]) {
    revalidatePath(path);
  }
}
