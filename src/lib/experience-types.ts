import { cache } from "react";
import { eq, inArray } from "drizzle-orm";
import { experienceTypes } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { ensureExperienceTypesSchema } from "@/lib/ensure-experience-types-schema";
import {
  EXPERIENCE_TYPE_DEFINITIONS,
  type ExperienceTypeSlug,
  getExperienceTypeDefinition,
  isValidExperienceType,
  DEFAULT_EXPERIENCE_TYPE,
} from "@/lib/experience-type-definitions";

export {
  EXPERIENCE_TYPE_DEFINITIONS,
  type ExperienceTypeSlug,
  getExperienceTypeDefinition,
  isValidExperienceType,
  DEFAULT_EXPERIENCE_TYPE,
};

/** At most once per request */
export const ensureExperienceTypesSchemaCached = cache(ensureExperienceTypesSchema);

export async function ensureExperienceTypesSeeded() {
  if (!isDbConfigured()) return;
  await ensureExperienceTypesSchemaCached();
  const db = getDb();
  for (const def of EXPERIENCE_TYPE_DEFINITIONS) {
    const [existing] = await db
      .select()
      .from(experienceTypes)
      .where(eq(experienceTypes.slug, def.slug))
      .limit(1);
    if (!existing) {
      await db
        .insert(experienceTypes)
        .values({
          slug: def.slug,
          nameNl: def.nameNl,
          nameEn: def.nameEn,
          mood: def.mood,
          venueIds: [],
        })
        .onConflictDoNothing();
    }
  }
}

/** At most once per request */
export const ensureExperienceTypesSeededCached = cache(ensureExperienceTypesSeeded);

export async function getExperienceTypesBySlugs(slugs: string[]) {
  if (!isDbConfigured() || slugs.length === 0) return [];
  await ensureExperienceTypesSeededCached();
  const db = getDb();
  return db
    .select()
    .from(experienceTypes)
    .where(inArray(experienceTypes.slug, slugs));
}

export async function getExperienceType(slug: string) {
  if (!isDbConfigured()) return undefined;
  try {
    await ensureExperienceTypesSeededCached();
    const db = getDb();
    const [row] = await db
      .select()
      .from(experienceTypes)
      .where(eq(experienceTypes.slug, slug))
      .limit(1);
    return row;
  } catch (error) {
    console.error("[getExperienceType] query failed for", slug, error);
    return undefined;
  }
}

export async function getAllExperienceTypes() {
  if (!isDbConfigured()) return [];
  await ensureExperienceTypesSeededCached();
  const db = getDb();
  return db.select().from(experienceTypes);
}

export async function getVenueIdsForExperienceType(slug: string): Promise<string[]> {
  const row = await getExperienceType(slug);
  const ids = row?.venueIds ?? [];
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
}
