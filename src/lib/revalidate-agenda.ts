import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { PUBLISHED_EVENTS_CACHE_TAG } from "@/lib/experiences";
import type { Event } from "@/db/schema";
import { sundayTableLocationPath } from "@/i18n/config";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";
import { sundaySocialSlugFromCity } from "@/lib/sunday-social-tables";
import { runOutsideRender } from "@/lib/run-outside-render";

/** Sunday Social's reveal page (/sunday-social/[city]/[date]) shows a live
 * "spots left" chip, but isn't covered by the generic /agenda paths below,
 * so a fresh purchase or admin edit wouldn't show up there until the
 * page's own 60s ISR window happened to pass. */
function sundayTablePaths(event: Pick<Event, "experienceType" | "city" | "startsAt">): string[] {
  // Series tables ("jouw-tafel") have the same date page.
  if (event.experienceType !== "sunday-table" && event.experienceType !== "jouw-tafel") return [];
  const citySlug = sundaySocialSlugFromCity(event.city);
  if (!citySlug) return [];
  const dateIso = amsterdamDateIso(new Date(event.startsAt));
  return [
    sundayTableLocationPath("nl", citySlug, dateIso),
    sundayTableLocationPath("en", citySlug, dateIso),
  ];
}

/** Pass the full event row (not just its slug) whenever it's on hand, so
 * Sunday Social editions also revalidate their own reveal page.
 *
 * Safe to call while a page renders (the confirmation page fulfils a payment
 * when the browser is back before the Stripe webhook): Next.js refuses a
 * revalidation during a render, so there it runs after the response. In a
 * route handler or a server action it runs at once, as before. */
export function revalidateEventPaths(
  event: string | Pick<Event, "slug" | "experienceType" | "city" | "startsAt">,
) {
  runOutsideRender(() => revalidateEventPathsNow(event), after);
}

function revalidateEventPathsNow(
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
    "/en/girls-only",
    "/sitemap.xml",
    "/admin/bookings",
    ...extraPaths,
  ]) {
    revalidatePath(path);
  }
}
