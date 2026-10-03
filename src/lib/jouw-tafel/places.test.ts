// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import rawPlaces from "./nl-places.json";
import { QUIZ_CITIES, QUIZ_CITY_COORDS, haversineKm, supportedCity } from "./logic";
import { buildPlaceIndex, findPlace, placeKey, searchPlaces, type RawPlace } from "./places";
import { placeLabel } from "./places-server";

const raw = rawPlaces as RawPlace[];
const index = buildPlaceIndex(raw);

test("the place list: every woonplaats, inside the Netherlands", () => {
  assert.ok(raw.length > 2400, `only ${raw.length} places`);
  for (const p of raw) {
    assert.ok(p.lat > 50.7 && p.lat < 53.6 && p.lon > 3.3 && p.lon < 7.3, `${p.n} outside NL`);
  }
  // Labels are unique, so a picked label always means one place.
  const labels = new Set(index.places.map((p) => p.label));
  assert.equal(labels.size, index.places.length);
});

test("our cities are on the list and their centres match it", () => {
  for (const city of QUIZ_CITIES) {
    const place = findPlace(index, city);
    assert.ok(place, `${city} missing`);
    assert.equal(supportedCity(place.label), city);
    assert.ok(haversineKm(place, QUIZ_CITY_COORDS[city]) < 0.2, `${city} centre differs`);
  }
});

test("matching ignores case, accents, apostrophes and hyphens; aliases", () => {
  assert.equal(placeKey("'s-Hertogenbosch"), placeKey("s Hertogenbosch"));
  assert.equal(findPlace(index, "den bosch")?.label, "Den Bosch");
  assert.equal(findPlace(index, "'s-Hertogenbosch")?.label, "Den Bosch");
  assert.equal(findPlace(index, "s-hertogenbosch")?.label, "Den Bosch");
  assert.equal(findPlace(index, "'s-Gravenhage")?.label, "Den Haag");
  assert.equal(findPlace(index, "the hague")?.label, "Den Haag");
  assert.equal(findPlace(index, "ETTEN LEUR")?.label, "Etten-Leur");
  assert.equal(findPlace(index, "Nergenshuizen"), null);
});

test("names that exist more than once get the province (or municipality)", () => {
  assert.equal(findPlace(index, "Oosterhout (Noord-Brabant)")?.p, "NB");
  assert.equal(findPlace(index, "Oosterhout (Gelderland)")?.p, "GD");
  const beek = index.places.filter((p) => p.n === "Beek").map((p) => p.label).sort();
  assert.deepEqual(beek, ["Beek (Berg en Dal)", "Beek (Limburg)", "Beek (Montferland)"]);
  // A unique name has no suffix.
  assert.equal(findPlace(index, "Zwolle")?.label, "Zwolle");
  assert.equal(findPlace(index, "Delft")?.label, "Delft");
});

test("searchPlaces: at most 6, names starting with the query first", () => {
  const ams = searchPlaces(index, "ams").map((p) => p.label);
  assert.equal(ams.length, 6);
  assert.equal(ams[0], "Amsterdam");
  assert.ok(ams.every((l) => placeKey(l).startsWith("ams")));
  // Prefix matches before names that only contain it.
  const dam = searchPlaces(index, "dam", 50).map((p) => placeKey(p.label));
  const firstContains = dam.findIndex((k) => !k.startsWith("dam"));
  assert.ok(firstContains > 0);
  assert.ok(dam.slice(firstContains).every((k) => !k.startsWith("dam")));
  // Aliases are searchable.
  assert.ok(searchPlaces(index, "den bo").some((p) => p.label === "Den Bosch"));
  assert.deepEqual(searchPlaces(index, "  "), []);
});

test("placeLabel (server): the list's name for any spelling, null when not on it", () => {
  assert.equal(placeLabel("zwolle"), "Zwolle");
  assert.equal(placeLabel("den bosch"), "Den Bosch");
  assert.equal(placeLabel("Delft"), "Delft");
  assert.equal(placeLabel("Atlantis"), null);
});
