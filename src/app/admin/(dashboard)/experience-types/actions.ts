"use server";

import { eq } from "drizzle-orm";
import { experienceTypes } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { parseTypeContent } from "@/lib/experience-type-content.types";
import { isValidExperienceType } from "@/lib/experience-types";
import { redirect } from "next/navigation";

export async function updateExperienceTypeAction(
  slug: string,
  formData: FormData,
) {
  await requireAdmin();
  if (!isDbConfigured()) throw new Error("Database niet geconfigureerd");
  if (!isValidExperienceType(slug)) throw new Error("Onbekend experience type");

  let venueIds: string[] = [];
  let content = parseTypeContent({});

  try {
    const payload = JSON.parse(String(formData.get("payload") ?? "{}")) as {
      venueIds?: unknown;
      content?: unknown;
    };
    if (Array.isArray(payload.venueIds)) {
      venueIds = payload.venueIds.filter((id): id is string => typeof id === "string");
    }
    content = parseTypeContent(payload.content ?? {});
  } catch {
    venueIds = [];
    content = parseTypeContent({});
  }

  const db = getDb();
  await db
    .update(experienceTypes)
    .set({
      venueIds,
      content: content as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(experienceTypes.slug, slug));

  redirect(adminPath(`/experience-types/${slug}?saved=1`));
}
