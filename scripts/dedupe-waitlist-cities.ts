/**
 * Vindt wachtlijst-aanmeldingen die dezelfde persoon en dezelfde stad zijn,
 * maar als aparte rijen in de database staan doordat de stad met andere
 * leestekens of hoofdletters is ingetypt ("Den Bosch !!" vs "Den bosch").
 *
 *   npx tsx scripts/dedupe-waitlist-cities.ts            # alleen rapporteren
 *   npx tsx scripts/dedupe-waitlist-cities.ts --apply    # daadwerkelijk samenvoegen
 *
 * Zonder --apply verandert er niets. Met --apply wordt per groep één rij
 * behouden en de rest verwijderd:
 *
 *   - behouden wordt de rij die al een welkomstmail kreeg (anders krijgt
 *     iemand er alsnog een tweede), anders de oudste;
 *   - de behouden rij krijgt de genormaliseerde stadsnaam, en de rijkste
 *     voorkeuren, naam en customer-koppeling uit de groep;
 *   - groepen waarvan een rij aan een Sunday Table-uitnodiging hangt worden
 *     overgeslagen en apart gemeld, omdat verwijderen die uitnodiging zou
 *     meenemen. Die los je met de hand op.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

type Signup = {
  id: string;
  email: string;
  city: string;
  name: string | null;
  locale: string;
  source: string;
  preferences: Record<string, unknown> | null;
  customerId: string | null;
  welcomeEmailSentAt: Date | null;
  createdAt: Date;
};

function score(row: Signup): number {
  return row.preferences ? Object.keys(row.preferences).length : 0;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL ontbreekt in .env.local");
    process.exit(1);
  }

  const { getDb } = await import("../src/db/index");
  const { waitlistSignups, sundayTableWaitlistInvites } = await import(
    "../src/db/schema"
  );
  const { asc, inArray } = await import("drizzle-orm");
  const { normalizeWaitlistCity, cityMatchKey, CITY_SEPARATOR } = await import(
    "../src/lib/waitlist-city"
  );

  const db = getDb();
  const rows = (await db
    .select()
    .from(waitlistSignups)
    .orderBy(asc(waitlistSignups.createdAt))) as Signup[];

  // Groepeer op persoon + stad-zoals-hij-bedoeld-was.
  const groups = new Map<string, Signup[]>();
  for (const row of rows) {
    const canonical = normalizeWaitlistCity(row.city);
    const key = `${row.email.trim().toLowerCase()}::${cityMatchKey(canonical)}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const duplicates = [...groups.values()].filter((group) => group.length > 1);
  const singles = [...groups.values()]
    .filter((group) => group.length === 1)
    .map((group) => group[0]);

  // Iemand die meerdere steden in één veld typte is geen hernoemklus: die rij
  // hoort opgesplitst te worden en dat is een keuze, geen automatisme.
  const multiCity = singles.filter((row) => CITY_SEPARATOR.test(row.city));
  const renames = singles.filter(
    (row) =>
      !CITY_SEPARATOR.test(row.city) &&
      normalizeWaitlistCity(row.city) !== row.city,
  );

  console.log(`Aanmeldingen totaal : ${rows.length}`);
  console.log(`Dubbele groepen     : ${duplicates.length}`);
  console.log(`Alleen hernoemen    : ${renames.length}`);
  console.log(`Handmatig nakijken  : ${multiCity.length}`);
  console.log("");

  const invites = await db
    .select({ signupId: sundayTableWaitlistInvites.waitlistSignupId })
    .from(sundayTableWaitlistInvites);
  const invitedIds = new Set(invites.map((row) => row.signupId));

  const skipped: Signup[][] = [];
  let merged = 0;
  let removed = 0;

  for (const group of duplicates) {
    const canonical = normalizeWaitlistCity(group[0].city);
    const keep =
      group.find((row) => row.welcomeEmailSentAt) ??
      [...group].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      )[0];
    const drop = group.filter((row) => row.id !== keep.id);

    console.log(`${group[0].email} → "${canonical}" (${group.length} rijen)`);
    for (const row of group) {
      const marks = [
        row.id === keep.id ? "BEHOUDEN" : "verwijderen",
        row.welcomeEmailSentAt ? "welkomstmail verstuurd" : null,
        invitedIds.has(row.id) ? "HEEFT UITNODIGING" : null,
      ].filter(Boolean);
      console.log(
        `   ${row.createdAt.toISOString().slice(0, 16).replace("T", " ")}  ` +
          `"${row.city}"  ${marks.join(" · ")}`,
      );
    }

    if (drop.some((row) => invitedIds.has(row.id))) {
      skipped.push(group);
      console.log("   → overgeslagen: een te verwijderen rij hangt aan een uitnodiging");
      console.log("");
      continue;
    }

    if (APPLY) {
      const richest = [...group].sort((a, b) => score(b) - score(a))[0];
      // Delete before renaming, inside one transaction. Renaming first collides
      // with the unique key whenever a row still waiting to be deleted already
      // carries the canonical spelling — which is exactly what happened on the
      // first real run ("Den Bosch" existed next to "Den Bosch!").
      await db.transaction(async (tx) => {
        await tx
          .delete(waitlistSignups)
          .where(inArray(waitlistSignups.id, drop.map((row) => row.id)));
        await tx
          .update(waitlistSignups)
          .set({
            city: canonical,
            name: group.find((row) => row.name)?.name ?? keep.name,
            preferences: richest.preferences ?? keep.preferences,
            customerId:
              group.find((row) => row.customerId)?.customerId ?? keep.customerId,
            welcomeEmailSentAt:
              group.find((row) => row.welcomeEmailSentAt)?.welcomeEmailSentAt ??
              keep.welcomeEmailSentAt,
          })
          .where(inArray(waitlistSignups.id, [keep.id]));
      });
      merged += 1;
      removed += drop.length;
    }
    console.log("");
  }

  if (renames.length > 0) {
    console.log("Rijen die alleen een nettere stadsnaam krijgen:");
    for (const row of renames) {
      console.log(`   ${row.email}: "${row.city}" → "${normalizeWaitlistCity(row.city)}"`);
    }
    if (APPLY) {
      for (const row of renames) {
        await db
          .update(waitlistSignups)
          .set({ city: normalizeWaitlistCity(row.city) })
          .where(inArray(waitlistSignups.id, [row.id]));
      }
    }
    console.log("");
  }

  if (multiCity.length > 0) {
    console.log("Meerdere steden in één veld — deze raakt het script niet aan:");
    for (const row of multiCity) {
      const parts = row.city
        .split(CITY_SEPARATOR)
        .map((part) => normalizeWaitlistCity(part))
        .filter(Boolean);
      console.log(`   ${row.email}: "${row.city}"`);
      console.log(`      zou moeten zijn: ${parts.join(" | ")}`);
    }
    console.log("");
  }

  if (APPLY) {
    console.log(`Samengevoegd: ${merged} groepen, ${removed} rijen verwijderd.`);
    console.log(`Hernoemd    : ${renames.length} rijen.`);
    if (skipped.length > 0) {
      console.log(`Overgeslagen: ${skipped.length} groepen met een uitnodiging.`);
    }
  } else {
    console.log("PROEFDRAAI — er is niets gewijzigd.");
    console.log("Draai opnieuw met --apply om dit door te voeren.");
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
