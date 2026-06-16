import { cache } from "react";
import { and, eq, ne, or } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { events } from "@/db/schema";
import type { Event } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { isDbEventsEnabled } from "@/lib/env";
import { enrichDbEventWithContent } from "@/lib/event-mapper";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { parseEventExtras } from "@/lib/event-extras";
import { fetchVenuesByIds } from "@/lib/venues";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import {
  getExperienceTypesBySlugs,
  ensureExperienceTypesSeededCached,
} from "@/lib/experience-types";
import {
  parseTypeContent,
  type ExperienceTypeContent,
} from "@/lib/experience-type-content.types";
import { publishedAgendaEventsWhere } from "@/lib/published-events-filter";

export async function loadTypeContentMap(
  slugs: string[],
): Promise<Map<string, ExperienceTypeContent>> {
  const unique = [...new Set(slugs.filter(Boolean))];
  const map = new Map<string, ExperienceTypeContent>();
  if (!isDbConfigured() || unique.length === 0) {
    for (const slug of unique) {
      map.set(slug, parseTypeContent({}));
    }
    return map;
  }
  await ensureExperienceTypesSeededCached();
  const rows = await getExperienceTypesBySlugs(unique);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  for (const slug of unique) {
    map.set(slug, parseTypeContent(bySlug.get(slug)?.content ?? {}));
  }
  return map;
}

export const getAgendaEventRowBySlug = cache(
  async (slug: string): Promise<Event | undefined> => {
    if (!isDbConfigured()) return undefined;
    const db = getDb();
    const [row] = await db
      .select()
      .from(events)
      .where(and(publishedAgendaEventsWhere(), eq(events.slug, slug)))
      .limit(1);
    return row;
  },
);

export const getPublishedExperienceBySlug = cache(
  async (
    locale: Locale,
    slug: string,
  ): Promise<EnrichedExperience | undefined> => {
    const row = await getAgendaEventRowBySlug(slug);
    if (!row) return undefined;
    const typeSlug = row.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
    const contentMap = await loadTypeContentMap([typeSlug]);
    const extras = parseEventExtras(row.extras);
    const venues =
      extras.venueIds && extras.venueIds.length > 0
        ? await fetchVenuesByIds(extras.venueIds)
        : [];
    return enrichDbEventWithContent(
      row,
      locale,
      contentMap.get(typeSlug) ?? parseTypeContent({}),
      venues,
    );
  },
);

export async function getPublishedSlugs(): Promise<string[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select({ slug: events.slug })
    .from(events)
    .where(publishedAgendaEventsWhere());
  return rows.map((r) => r.slug);
}

export async function enrichPublishedRows(
  rows: Event[],
  locale: Locale,
): Promise<EnrichedExperience[]> {
  if (rows.length === 0) return [];
  const typeSlugs = rows.map((r) => r.experienceType ?? DEFAULT_EXPERIENCE_TYPE);
  const contentMap = await loadTypeContentMap(typeSlugs);

  const allVenueIds = [
    ...new Set(
      rows.flatMap((row) => parseEventExtras(row.extras).venueIds ?? []),
    ),
  ];
  const venueRows = allVenueIds.length > 0 ? await fetchVenuesByIds(allVenueIds) : [];
  const venuesById = new Map(venueRows.map((v) => [v.id, v]));

  return rows.map((row) => {
    const typeSlug = row.experienceType ?? DEFAULT_EXPERIENCE_TYPE;
    const venueIds = parseEventExtras(row.extras).venueIds ?? [];
    const venues = venueIds
      .map((id) => venuesById.get(id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
    return enrichDbEventWithContent(
      row,
      locale,
      contentMap.get(typeSlug) ?? parseTypeContent({}),
      venues,
    );
  });
}

export async function getRelatedPublishedExperiences(
  locale: Locale,
  current: EnrichedExperience,
  limit = 3,
): Promise<EnrichedExperience[]> {
  if (!isDbEventsEnabled() || !isDbConfigured()) return [];

  const db = getDb();
  const categoryColumn =
    locale === "nl" ? events.categoryNl : events.categoryEn;

  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        publishedAgendaEventsWhere(),
        ne(events.slug, current.slug),
        or(
          eq(events.mood, current.mood),
          eq(events.city, current.city),
          eq(categoryColumn, current.category),
        ),
      ),
    )
    .orderBy(events.startsAt)
    .limit(limit + 2);

  const enriched = await enrichPublishedRows(rows, locale);
  return enriched
    .filter((item) => item.slug !== current.slug)
    .slice(0, limit);
}

/** DB slug lookup; catalog callers use experiences.ts */
export async function getDbExperienceBySlug(
  locale: Locale,
  slug: string,
): Promise<EnrichedExperience | undefined> {
  if (!isDbEventsEnabled() || !isDbConfigured()) return undefined;
  try {
    return await getPublishedExperienceBySlug(locale, slug);
  } catch (err) {
    console.error("[experience-data] slug fetch failed", err);
    return undefined;
  }
}
