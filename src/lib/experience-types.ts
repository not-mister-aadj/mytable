import { eq } from "drizzle-orm";
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
  for (const def of EXPERIENCE_TYPE_DEFINITIONS) {
    const [existing] = await db
      .select()
      .from(experienceTypes)
      .where(eq(experienceTypes.slug, def.slug))
      .limit(1);
    if (!existing) {
      await db.insert(experienceTypes).values({
        slug: def.slug,
        nameNl: def.nameNl,
        nameEn: def.nameEn,
        mood: def.mood,
        venueIds: [],
      });
    }
  }
}

export async function getExperienceType(slug: string) {
  if (!isDbConfigured()) return undefined;
  await ensureExperienceTypesSeeded();
  const db = getDb();
  const [row] = await db
    .select()
    .from(experienceTypes)
    .where(eq(experienceTypes.slug, slug))
    .limit(1);
  return row;
}

export async function getAllExperienceTypes() {
  if (!isDbConfigured()) return [];
  await ensureExperienceTypesSeeded();
  const db = getDb();
  return db.select().from(experienceTypes);
}

export async function getVenueIdsForExperienceType(slug: string): Promise<string[]> {
  const row = await getExperienceType(slug);
  const ids = row?.venueIds ?? [];
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
}
