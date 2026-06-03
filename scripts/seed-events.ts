import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import {
  catalogSeedEntries,
  DEFAULT_CAPACITY,
  spotsSoldFromStatus,
} from "../src/data/catalog-seed-data";
import { parseExperienceStartsAt } from "../src/lib/upcoming-event";

function parseEndAt(dateTime: string, locale: "nl" | "en"): Date | null {
  const segments = dateTime.split("·").map((s) => s.trim());
  if (segments.length < 2) return null;
  const timePart = segments[1];
  const range = timePart.match(/(\d{1,2}):(\d{2})–(\d{1,2}):(\d{2})/);
  if (!range) return null;
  const start = parseExperienceStartsAt(dateTime, locale);
  if (!start) return null;
  const end = new Date(start);
  end.setHours(Number.parseInt(range[3], 10), Number.parseInt(range[4], 10), 0, 0);
  if (end <= start) {
    end.setHours(end.getHours() + 3);
  }
  return end;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(url, { prepare: false });
  const db = drizzle(client, { schema });

  const [existingVenue] = await db.select().from(schema.venues).limit(1);
  let venueId = existingVenue?.id;

  if (!venueId) {
    const [venue] = await db
      .insert(schema.venues)
      .values({
        name: "Partnerrestaurant",
        city: "Amsterdam",
        area: "Centrum",
        atmosphere: "Chef's special",
        descriptionNl:
          "Eén locatie, één tafel. De chef bereidt specials voor de groep, wijn en spijs die bij elkaar passen.",
        descriptionEn:
          "One venue, one table. The chef prepares specials for the group with wine and food that match.",
        imageUrl: "/images/restaurant-interior.jpg",
      })
      .returning();
    venueId = venue.id;
    console.log("Created default venue", venueId);
  }

  for (const entry of catalogSeedEntries) {
    const startsAt = parseExperienceStartsAt(entry.dateTimeNl, "nl");
    if (!startsAt) {
      console.warn(`Skip ${entry.id}: could not parse date`);
      continue;
    }
    const endsAt = parseEndAt(entry.dateTimeNl, "nl");
    const capacity = DEFAULT_CAPACITY;
    const spotsSold = spotsSoldFromStatus(entry.status, capacity);

    const [existing] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.legacyId, entry.id))
      .limit(1);

    const values = {
      legacyId: entry.id,
      slug: entry.slug,
      workflowStatus: "published" as const,
      city: entry.city,
      startsAt,
      endsAt,
      priceCents: entry.price * 100,
      capacity,
      spotsSold,
      femaleOnly: entry.femaleOnly ?? false,
      venueId,
      imageUrl: entry.image,
      nameNl: entry.names.nl,
      nameEn: entry.names.en,
      taglineNl: entry.tagline?.nl ?? null,
      taglineEn: entry.tagline?.en ?? null,
      categoryNl: entry.categories.nl,
      categoryEn: entry.categories.en,
      publishedAt: new Date(),
    };

    if (existing) {
      await db
        .update(schema.events)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.events.id, existing.id));
      console.log(`Updated event ${entry.slug}`);
    } else {
      await db.insert(schema.events).values(values);
      console.log(`Inserted event ${entry.slug}`);
    }
  }

  await client.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
