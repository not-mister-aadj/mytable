import type { Locale } from "@/i18n/config";
import {
  getAgendaExperiences,
  getExperienceBySlug,
} from "@/lib/experiences";

const DEFAULT_WARM_SLUG_LIMIT = 8;

/** Prime shared caches so the next click can render without waiting on the DB. */
export async function warmNavigationCaches(
  locale: Locale,
  experienceSlugs: string[] = [],
): Promise<void> {
  const agendaItems = await getAgendaExperiences(locale);
  const slugs = new Set(
    experienceSlugs.length > 0
      ? experienceSlugs
      : agendaItems.slice(0, DEFAULT_WARM_SLUG_LIMIT).map((item) => item.slug),
  );

  await Promise.all(
    [...slugs].map((slug) => getExperienceBySlug(locale, slug)),
  );
}

/** Fire-and-forget variant for pages that should not block on slug warming. */
export function warmExperienceSlugs(locale: Locale, slugs: string[]): void {
  const unique = [...new Set(slugs.filter(Boolean))].slice(
    0,
    DEFAULT_WARM_SLUG_LIMIT,
  );
  if (unique.length === 0) return;
  void Promise.all(unique.map((slug) => getExperienceBySlug(locale, slug)));
}
