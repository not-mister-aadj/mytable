// Run with: npx tsx --test src/lib/customers/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { FROZEN_TAG, frozenMessage, hasFrozenTag, withFrozenTag } from "./freeze-logic";

test("frozen tag: on, off, and other tags kept", () => {
  assert.equal(hasFrozenTag(["afgemeld"]), false);
  assert.equal(hasFrozenTag(["afgemeld", " OP_SLOT "]), true);
  assert.equal(hasFrozenTag(null), false);
  assert.deepEqual(withFrozenTag(["afgemeld"], true), ["afgemeld", FROZEN_TAG]);
  assert.deepEqual(withFrozenTag(["afgemeld", FROZEN_TAG], true), ["afgemeld", FROZEN_TAG]);
  assert.deepEqual(withFrozenTag(["afgemeld", FROZEN_TAG], false), ["afgemeld"]);
  assert.deepEqual(withFrozenTag(null, false), []);
});

test("the message names our address", () => {
  assert.match(frozenMessage("nl"), /info@mytable\.club/);
  assert.match(frozenMessage("en"), /info@mytable\.club/);
});
