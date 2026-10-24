import assert from "node:assert/strict";
import test from "node:test";
import { MAX_PICKS, parseVenuePicks, pickLine, pickTags, picksVisible } from "@/lib/venue-picks";

test("parse: drops picks without a name, unknown kinds become white, caps the list", () => {
  const raw = [
    { kind: "bubbles", name: " Crémant ", why: "Fris" },
    { kind: "beer", name: "Iets" },
    { kind: "red", name: "" },
    "nonsense",
    ...Array.from({ length: 10 }, (_, i) => ({ kind: "red", name: `Rood ${i}` })),
  ];
  const picks = parseVenuePicks(raw);
  assert.equal(picks.length, MAX_PICKS);
  assert.deepEqual(picks[0], { kind: "bubbles", moment: "", name: "Crémant", tags: "", why: "Fris", goesWith: "" });
  assert.equal(picks[1]!.kind, "white");
  assert.deepEqual(parseVenuePicks(null), []);
});

test("tags and mail line", () => {
  const p = { kind: "white" as const, moment: "", name: "Grüner Veltliner", tags: "Oostenrijk · per glas, fles", why: "", goesWith: "Kaasplank" };
  assert.deepEqual(pickTags(p), ["Oostenrijk", "per glas", "fles"]);
  assert.equal(pickLine(p), "Grüner Veltliner, bij kaasplank");
});

test("picks show from 08:00 Amsterdam on the day itself", () => {
  const sunday = new Date("2026-10-25T13:00:00Z"); // 14:00 winter time
  assert.equal(picksVisible(sunday, Date.parse("2026-10-24T20:00:00Z")), false); // Saturday evening
  assert.equal(picksVisible(sunday, Date.parse("2026-10-25T06:59:00Z")), false); // 07:59
  assert.equal(picksVisible(sunday, Date.parse("2026-10-25T07:00:00Z")), true); // 08:00
  assert.equal(picksVisible(sunday, Date.parse("2026-10-26T08:00:00Z")), true); // after
});
