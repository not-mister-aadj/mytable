import type { Locale } from "@/i18n/config";
import { getCatalogExperiences } from "@/data/experience-catalog";
import { getDictionary } from "@/i18n/get-dictionary";
import { eq, and, gte, or, sql } from "drizzle-orm";
import { events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { useDbEvents } from "@/lib/env";
import { enrichDbEvent } from "@/lib/event-mapper";
import { enrichExperience, type EnrichedExperience } from "./experience-detail";

async function fetchPublishedFromDb(
  locale: Locale,
): Promise<EnrichedExperience[]> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.workflowStatus, "published"),
        or(
          gte(events.startsAt, now),
          and(
            sql`${events.endsAt} IS NOT NULL`,
            gte(events.endsAt, now),
          ),
        ),
      ),
    )
    .orderBy(events.startsAt);

  return rows.map((row) => enrichDbEvent(row, locale));
}

function fetchFromCatalog(locale: Locale): EnrichedExperience[] {
  return getCatalogExperiences(locale).map(enrichExperience);
}

/** Canonical list: agenda / homepage */
export async function getAllExperiences(
  locale: Locale,
): Promise<EnrichedExperience[]> {
  if (useDbEvents() && isDbConfigured()) {
    try {
      return await fetchPublishedFromDb(locale);
    } catch (err) {
      console.error("[experiences] DB fetch failed, falling back to catalog", err);
    }
  }
  return fetchFromCatalog(locale);
}

export async function getExperienceBySlug(
  locale: Locale,
  slug: string,
): Promise<EnrichedExperience | undefined> {
  const all = await getAllExperiences(locale);
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
  const all = await getAllExperiences(locale);
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
  const all = await getAllExperiences(locale);
  return all.map((item) => item.slug);
}

/** Sync agenda items for dictionary merge */
export async function getAgendaItems(locale: Locale) {
  return getAllExperiences(locale);
}

export function getCatalogAgendaItems(locale: Locale) {
  return getDictionary(locale).agenda.items;
}
