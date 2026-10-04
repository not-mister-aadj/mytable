/**
 * Builds src/lib/jouw-tafel/nl-places.json: every Dutch woonplaats with its
 * province and centre, from the PDOK Locatieserver (free, no key).
 *
 *   npx tsx scripts/build-nl-places.ts
 *
 * Output: [{ n: name, p: province abbreviation, g?: municipality, lat, lon }],
 * sorted by name, coordinates rounded to 3 decimals (about 100 m). `g` is
 * only there for names that exist twice in one province ("Beek"). Commit the
 * result; the quiz loads it lazily in the browser, the server imports it
 * directly.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
const PAGE = 100;

type Doc = {
  woonplaatsnaam?: string;
  provincieafkorting?: string;
  gemeentenaam?: string;
  centroide_ll?: string;
};

type Place = { n: string; p: string; g?: string; lat: number; lon: number };

async function page(start: number): Promise<{ total: number; docs: Doc[] }> {
  const params = new URLSearchParams({
    q: "*:*",
    fq: "type:woonplaats",
    fl: "woonplaatsnaam,provincieafkorting,gemeentenaam,centroide_ll",
    rows: String(PAGE),
    start: String(start),
    sort: "woonplaatsnaam asc",
  });
  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`PDOK ${res.status} at start=${start}`);
  const body = (await res.json()) as { response: { numFound: number; docs: Doc[] } };
  return { total: body.response.numFound, docs: body.response.docs };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

async function main() {
  const places: Place[] = [];
  let start = 0;
  let total = Infinity;
  while (start < total) {
    const result = await page(start);
    total = result.total;
    for (const doc of result.docs) {
      const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(doc.centroide_ll ?? "");
      if (!doc.woonplaatsnaam || !doc.provincieafkorting || !match) continue;
      places.push({
        n: doc.woonplaatsnaam,
        p: doc.provincieafkorting,
        g: doc.gemeentenaam,
        lat: round(Number(match[2])),
        lon: round(Number(match[1])),
      });
    }
    start += PAGE;
  }
  if (places.length < 2000) throw new Error(`Only ${places.length} places from PDOK, expected about 2500`);
  places.sort((a, b) => a.n.localeCompare(b.n, "nl") || a.p.localeCompare(b.p) || (a.g ?? "").localeCompare(b.g ?? ""));

  // Keep the municipality only where name and province are not enough.
  const perProvince = new Map<string, number>();
  for (const p of places) perProvince.set(`${p.n}|${p.p}`, (perProvince.get(`${p.n}|${p.p}`) ?? 0) + 1);
  const out = places.map(({ n, p, g, lat, lon }) =>
    (perProvince.get(`${n}|${p}`) ?? 0) > 1 && g ? { n, p, g, lat, lon } : { n, p, lat, lon },
  );

  const file = join(process.cwd(), "src/lib/jouw-tafel/nl-places.json");
  writeFileSync(file, JSON.stringify(out) + "\n");
  console.log(`Wrote ${out.length} places (of ${total}) to ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
