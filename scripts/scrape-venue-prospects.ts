/**
 * Bouwt een prospectlijst van wijnbars en restaurants met een wijnkaart,
 * via de Apify Google Maps-scraper.
 *
 * Gebruik:
 *   npx tsx scripts/scrape-venue-prospects.ts "Rotterdam" [max-per-zoekterm]
 *
 * Output: tmp/prospects-<stad>.csv met naam, adres, Google Maps-link,
 * website, e-mail, telefoon, rating en aantal reviews.
 *
 * De scraper bezoekt ook de website van elke zaak (scrapeContacts) en haalt
 * daar het e-mailadres vandaan. Zaken zonder gepubliceerd e-mailadres komen
 * wel in de CSV, met een lege e-mailkolom — die bel je.
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";

config({ path: ".env.local" });

const token = process.env.APIFY_TOKEN?.trim();
if (!token) {
  console.error("APIFY_TOKEN ontbreekt in .env.local");
  process.exit(1);
}

const city = process.argv[2]?.trim() || "Rotterdam";
const maxPerSearch = Number(process.argv[3]) || 120;

/** Zoektermen die zaken opleveren met een serieuze wijnkaart. */
const searchTerms = [
  "wijnbar",
  "wijnproeverij",
  "restaurant wijnkaart",
  "bistro",
];

/** Ketens die nooit een MyTable-avond gaan draaien. */
const excludedNames = [
  "mcdonald",
  "burger king",
  "kfc",
  "subway",
  "domino",
  "new york pizza",
  "starbucks",
  "la place",
  "febo",
  "happy italy",
  "van der valk",
  "vapiano",
  "loetje",
  "the seafood bar",
];

/** Zonder een van deze woorden in de categorie is het geen zaak met wijnkaart. */
const requiredCategoryHints = [
  "restaurant",
  "bar",
  "bistro",
  "brasserie",
  "eetcaf",
  "wijn",
  "gastropub",
  "pub",
];

/** Categorieën die wel matchen maar toch niet passen. */
const excludedCategoryHints = [
  "winkel",
  "slijterij",
  "bakkerij",
  "supermarkt",
  "hotel",
  "fastfood",
  "cafetaria",
  "snackbar",
  "afhaal",
  "bezorg",
  "koffie",
  "lunchroom",
  "ijssalon",
  "museum",
  "attractie",
  "catering",
  "shishabar",
  "sportbar",
  "karaoke",
  "nachtclub",
  "discotheek",
];

type Place = {
  title?: string;
  address?: string;
  url?: string;
  website?: string;
  phone?: string;
  totalScore?: number;
  reviewsCount?: number;
  categoryName?: string;
  price?: string;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  emails?: string[];
};

function mapsLink(place: Place): string {
  if (place.url) return place.url;
  const query = encodeURIComponent(`${place.title ?? ""} ${city}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function main() {
  console.log(`Zoeken in ${city}: ${searchTerms.join(", ")}`);
  console.log(`Maximaal ${maxPerSearch} zaken per zoekterm.\n`);

  // Een eerdere run opnieuw filteren kost geen credits: RUN_ID=... meegeven.
  const existingRunId = process.env.RUN_ID?.trim();
  if (existingRunId) {
    const info = await fetch(
      `https://api.apify.com/v2/actor-runs/${existingRunId}?token=${token}`,
    );
    const { data } = (await info.json()) as {
      data: { defaultDatasetId: string };
    };
    const cached = await fetch(
      `https://api.apify.com/v2/datasets/${data.defaultDatasetId}/items?token=${token}&clean=true`,
    );
    return writeCsv((await cached.json()) as Place[]);
  }

  // De synchrone endpoint kapt af na 300 seconden, dus starten en pollen.
  const start = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: searchTerms,
        locationQuery: `${city}, Netherlands`,
        maxCrawledPlacesPerSearch: maxPerSearch,
        language: "nl",
        skipClosedPlaces: true,
        scrapeContacts: true,
        // Nodig voor het prijsniveau: dat staat alleen op de detailpagina.
        scrapePlaceDetailPage: true,
      }),
    },
  );

  if (!start.ok) {
    console.error(
      `Apify gaf ${start.status}: ${await start.text().catch(() => "")}`,
    );
    process.exit(1);
  }

  const { data: run } = (await start.json()) as {
    data: { id: string; defaultDatasetId: string };
  };
  console.log(`Run ${run.id} gestart, wachten op resultaat...`);

  let status = "RUNNING";
  while (status === "RUNNING" || status === "READY") {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    const poll = await fetch(
      `https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`,
    );
    const { data } = (await poll.json()) as { data: { status: string } };
    status = data.status;
    process.stdout.write(".");
  }
  console.log(`\nRun afgerond met status ${status}.`);

  const items = await fetch(
    `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`,
  );
  return writeCsv((await items.json()) as Place[]);
}

function writeCsv(places: Place[]) {
  console.log(`Apify leverde ${places.length} resultaten op.`);

  const seen = new Set<string>();
  const rows = places
    .filter((place) => {
      if (!place.title) return false;
      if (place.permanentlyClosed || place.temporarilyClosed) return false;
      const name = place.title.toLowerCase();
      if (excludedNames.some((chain) => name.includes(chain))) return false;
      const category = (place.categoryName ?? "").toLowerCase();
      if (!requiredCategoryHints.some((hint) => category.includes(hint))) {
        return false;
      }
      if (excludedCategoryHints.some((hint) => category.includes(hint))) {
        return false;
      }
      const key = `${name}|${place.address ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // Wijnbars eerst, dan bistro's en brasserieën, daarna op aantal reviews.
    .sort((a, b) => {
      const rank = (place: Place) => {
        const category = (place.categoryName ?? "").toLowerCase();
        if (category.includes("wijn")) return 0;
        if (category.includes("bistro") || category.includes("brasserie")) {
          return 1;
        }
        return 2;
      };
      return (
        rank(a) - rank(b) || (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0)
      );
    });

  const header = [
    "naam",
    "categorie",
    "adres",
    "google maps",
    "website",
    "email",
    "prijs",
    "telefoon",
    "rating",
    "reviews",
  ];

  const csv = [
    header.map(csvCell).join(","),
    ...rows.map((place) =>
      [
        place.title,
        place.categoryName,
        place.address,
        mapsLink(place),
        place.website,
        place.emails?.[0],
        place.price,
        place.phone,
        place.totalScore,
        place.reviewsCount,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");

  mkdirSync("tmp", { recursive: true });
  const file = `tmp/prospects-${city.toLowerCase().replace(/\s+/g, "-")}.csv`;
  writeFileSync(file, `﻿${csv}`, "utf8");

  const withEmail = rows.filter((place) => place.emails?.[0]).length;
  console.log(`\n${rows.length} zaken na filteren.`);
  console.log(`${withEmail} daarvan met e-mailadres.`);
  console.log(`Weggeschreven naar ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
