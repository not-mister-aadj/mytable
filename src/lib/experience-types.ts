import { eq, inArray } from "drizzle-orm";
import { experienceTypes } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
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

export async function ensureExperienceTypesSeeded() {
  if (!isDbConfigured()) return;
  const db = getDb();
  const slugs = EXPERIENCE_TYPE_DEFINITIONS.map((def) => def.slug);
  const existing = await db
    .select({ slug: experienceTypes.slug })
    .from(experienceTypes)
    .where(inArray(experienceTypes.slug, slugs));
  const existingSlugs = new Set(existing.map((row) => row.slug));
  const missing = EXPERIENCE_TYPE_DEFINITIONS.filter(
    (def) => !existingSlugs.has(def.slug),
  );
  if (missing.length === 0) return;

  await db
    .insert(experienceTypes)
    .values(
      missing.map((def) => ({
        slug: def.slug,
        nameNl: def.nameNl,
        nameEn: def.nameEn,
        mood: def.mood,
        venueIds: [],
      })),
    )
    .onConflictDoNothing();
}

let seeded: Promise<void> | null = null;

/**
 * At most once per server instance rather than once per request. This runs on
 * the public experience pages, where every extra round trip to the database is
 * one more chance for a request to stall; the types it guarantees only change
 * with a deploy, which starts fresh instances anyway. A failure clears the
 * memo so the next request tries again.
 */
export function ensureExperienceTypesSeededCached(): Promise<void> {
  if (!seeded) {
    seeded = ensureExperienceTypesSeeded().catch((error: unknown) => {
      seeded = null;
      throw error;
    });
  }
  return seeded;
}

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
