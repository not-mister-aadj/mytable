import type { ImportProspectInput } from "@/lib/outreach/prospects-data";

/** Minimal RFC4180 parser — the same shape scripts/prospects-to-html.ts reads. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Header aliases, so a Dutch or an English export both land in the right column. */
const COLUMN_ALIASES: Record<keyof ImportProspectInput, string[]> = {
  name: ["naam", "name", "zaak", "title"],
  city: ["stad", "city", "plaats"],
  category: ["categorie", "category", "type", "soort"],
  address: ["adres", "address", "straat"],
  website: ["website", "site", "url"],
  email: ["email", "e-mail", "mail", "emailadres"],
  phone: ["telefoon", "phone", "tel", "telefoonnummer"],
  mapsUrl: ["google maps", "maps", "google_maps", "mapsurl", "maps url"],
  rating: ["rating", "score", "beoordeling"],
  reviewsCount: ["reviews", "aantal reviews", "reviews_count", "recensies"],
  priceLevel: ["prijs", "price", "prijsniveau"],
  source: ["bron", "source"],
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase();
}

function findColumn(headers: string[], field: keyof ImportProspectInput): number {
  const aliases = COLUMN_ALIASES[field];
  return headers.findIndex((header) => aliases.includes(header));
}

export type ParsedProspectCsv = {
  rows: ImportProspectInput[];
  /** Rows dropped because they had no name. */
  skipped: number;
  error: string | null;
};

/**
 * Turn a prospect CSV into import rows. `fallbackCity` fills in the city when
 * the file has no city column — which the Google Maps scrape output does not.
 */
export function parseProspectsCsv(
  text: string,
  fallbackCity: string,
): ParsedProspectCsv {
  const table = parseCsv(text).filter((row) => row.some((cell) => cell.trim()));
  if (table.length < 2) {
    return { rows: [], skipped: 0, error: "Geen rijen gevonden in de CSV." };
  }

  const headers = table[0].map(normalizeHeader);
  const nameColumn = findColumn(headers, "name");
  if (nameColumn === -1) {
    return {
      rows: [],
      skipped: 0,
      error: 'Geen kolom "naam" gevonden in de eerste regel.',
    };
  }

  const columns = {
    name: nameColumn,
    city: findColumn(headers, "city"),
    category: findColumn(headers, "category"),
    address: findColumn(headers, "address"),
    website: findColumn(headers, "website"),
    email: findColumn(headers, "email"),
    phone: findColumn(headers, "phone"),
    mapsUrl: findColumn(headers, "mapsUrl"),
    rating: findColumn(headers, "rating"),
    reviewsCount: findColumn(headers, "reviewsCount"),
    priceLevel: findColumn(headers, "priceLevel"),
  };

  const cell = (row: string[], index: number): string | null => {
    if (index === -1) return null;
    return row[index]?.trim() || null;
  };

  const rows: ImportProspectInput[] = [];
  let skipped = 0;

  for (const row of table.slice(1)) {
    const name = cell(row, columns.name);
    if (!name) {
      skipped += 1;
      continue;
    }
    const reviews = cell(row, columns.reviewsCount);
    rows.push({
      name,
      city: cell(row, columns.city) ?? fallbackCity,
      category: cell(row, columns.category),
      address: cell(row, columns.address),
      website: cell(row, columns.website),
      email: cell(row, columns.email),
      phone: cell(row, columns.phone),
      mapsUrl: cell(row, columns.mapsUrl),
      rating: cell(row, columns.rating),
      reviewsCount: reviews ? Number(reviews.replace(/\D/g, "")) || null : null,
      priceLevel: cell(row, columns.priceLevel),
    });
  }

  return { rows, skipped, error: null };
}
