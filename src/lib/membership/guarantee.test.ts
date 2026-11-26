import { test } from "node:test";
import assert from "node:assert/strict";
import { guaranteeApplies } from "@/lib/membership/guarantee";

test("the guarantee applies when the member picked nobody and liked nobody there before", () => {
  const likedBefore = new Set(["anna@example.com"]);
  assert.equal(guaranteeApplies({ pickedNow: [], mateEmails: ["bob@example.com", "cas@example.com"], likedBefore }), true);
  assert.equal(guaranteeApplies({ pickedNow: ["b1"], mateEmails: ["bob@example.com"], likedBefore }), false);
  assert.equal(guaranteeApplies({ pickedNow: [], mateEmails: ["bob@example.com", " Anna@Example.com "], likedBefore }), false);
  assert.equal(guaranteeApplies({ pickedNow: [], mateEmails: [], likedBefore }), false);
});
