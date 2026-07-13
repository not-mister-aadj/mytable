import type { Locale } from "@/i18n/config";
import { getCatalogExperiences } from "@/data/experience-catalog";
import { getDictionary } from "@/i18n/get-dictionary";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { isDbEventsEnabled, shouldUseCatalogOnDbError, shouldUseStaticCatalogFallback } from "@/lib/env";
import {
  enrichPublishedRows,
  getDbExperienceBySlug,
  getPublishedSlugs,
  getRelatedPublishedExperiences,
} from "@/lib/experience-data";
import {
  publishedAgendaEventsWhere,
  publishedLandingEventsWhere,
} from "@/lib/published-events-filter";
import { enrichExperience, type EnrichedExperience } from "./experience-detail";

export const PUBLISHED_EVENTS_CACHE_TAG = "published-events";

const PUBLISHED_CACHE_SECONDS = 60;

async function fetchPublishedFromDb(
  locale: Locale,
  whereClause: ReturnType<typeof publishedLandingEventsWhere>,
): Promise<EnrichedExperience[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(whereClause)
    .orderBy(events.startsAt);

  return enrichPublishedRows(rows, locale);
}

function fetchFromCatalog(locale: Locale): EnrichedExperience[] {
  return getCatalogExperiences(locale).map(enrichExperience);
}

async function loadPublishedExperiences(
  locale: Locale,
  whereClause: ReturnType<typeof publishedLandingEventsWhere>,
): Promise<EnrichedExperience[]> {
  if (isDbEventsEnabled() && isDbConfigured()) {
    try {
      return await fetchPublishedFromDb(locale, whereClause);
    } catch (err) {
      const cause =
        err instanceof Error && "cause" in err
          ? (err as Error & { cause?: unknown }).cause
          : err;
      console.error("[experiences] DB fetch failed", cause ?? err);
      if (!shouldUseCatalogOnDbError()) throw err;
    }
  } else if (!shouldUseStaticCatalogFallback()) {
    return [];
  }
  return fetchFromCatalog(locale);
}

function cachePublishedExperiences(
  locale: Locale,
  scope: "landing" | "agenda",
  whereClause: ReturnType<typeof publishedLandingEventsWhere>,
) {
  return unstable_cache(
    async () => loadPublishedExperiences(locale, whereClause),
    ["published-experiences", scope, locale],
    {
      revalidate: PUBLISHED_CACHE_SECONDS,
      tags: [PUBLISHED_EVENTS_CACHE_TAG, `${PUBLISHED_EVENTS_CACHE_TAG}:${scope}`],
    },
  )();
}

/** Landing page: open for booking, not closed. */
export async function getLandingExperiences(
  locale: Locale,
): Promise<EnrichedExperience[]> {
  return cachePublishedExperiences(
    locale,
    "landing",
    publishedLandingEventsWhere(),
  );
}

/** Agenda page: includes closed events until 7 days after start. */
export async function getAgendaExperiences(
  locale: Locale,
): Promise<EnrichedExperience[]> {
  return cachePublishedExperiences(
    locale,
    "agenda",
    publishedAgendaEventsWhere(),
  );
}

/** @deprecated Use getLandingExperiences or getAgendaExperiences */
export async function getAllExperiences(
  locale: Locale,
): Promise<EnrichedExperience[]> {
  return getLandingExperiences(locale);
}

function cacheExperienceBySlug(locale: Locale, slug: string) {
  return unstable_cache(
    async () => getDbExperienceBySlug(locale, slug),
    ["experience-by-slug", locale, slug],
    {
      revalidate: PUBLISHED_CACHE_SECONDS,
      tags: [PUBLISHED_EVENTS_CACHE_TAG, `experience:${slug}`],
    },
  )();
}

export async function getExperienceBySlug(
  locale: Locale,
  slug: string,
): Promise<EnrichedExperience | undefined> {
  if (isDbEventsEnabled() && isDbConfigured()) {
    try {
      const fromDb = await cacheExperienceBySlug(locale, slug);
      if (fromDb) return fromDb;
      return undefined;
    } catch (err) {
      console.error("[experiences] slug lookup failed", err);
      if (!shouldUseCatalogOnDbError()) throw err;
    }
  } else if (!shouldUseStaticCatalogFallback()) {
    return undefined;
  }
  const all = fetchFromCatalog(locale);
  return all.find((item) => item.slug === slug);
}

export async function getExperienceByDbId(
  id: string,
): Promise<import("@/db/schema").Event | undefined> {
  if (!isDbConfigured()) return undefined;
  const db = getDb();
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row;
}

export async function getRelatedExperiences(
  locale: Locale,
  current: EnrichedExperience,
  limit = 3,
): Promise<EnrichedExperience[]> {
  if (isDbEventsEnabled() && isDbConfigured()) {
    try {
      const related = await getRelatedPublishedExperiences(
        locale,
        current,
        limit,
      );
      if (related.length > 0) return related;
    } catch (err) {
      console.error("[experiences] related fetch failed", err);
      if (!shouldUseCatalogOnDbError()) throw err;
    }
  }
  if (!shouldUseStaticCatalogFallback() && !shouldUseCatalogOnDbError()) return [];
  const all = fetchFromCatalog(locale);
  return all
    .filter((item) => item.slug !== current.slug)
    .filter(
      (item) =>
        item.mood === current.mood ||
        item.city === current.city ||
        item.category === current.category,
    )
    .slice(0, limit);
}

export async function getAllExperienceSlugs(locale: Locale): Promise<string[]> {
  if (isDbEventsEnabled() && isDbConfigured()) {
    try {
      return await getPublishedSlugs();
    } catch (err) {
      console.error("[experiences] slug list failed", err);
      if (!shouldUseCatalogOnDbError()) throw err;
    }
  } else if (!shouldUseStaticCatalogFallback()) {
    return [];
  }
  const all = fetchFromCatalog(locale);
  return all.map((item) => item.slug);
}

/** Sync agenda items for dictionary merge */
export async function getAgendaItems(locale: Locale) {
  return getAgendaExperiences(locale);
}

export function getCatalogAgendaItems(locale: Locale) {
  return getDictionary(locale).agenda.items;
}
