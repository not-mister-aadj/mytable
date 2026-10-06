// Run with: npx tsx --test src/lib/stripe/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { euros, refundKind } from "./refunds-disputes-logic";

test("refund kind: full, partial, none", () => {
  assert.equal(refundKind(4900, 4900), "full");
  assert.equal(refundKind(2000, 1000), "partial");
  assert.equal(refundKind(1000, 0), "none");
});

test("euros", () => {
  assert.equal(euros(1050).replace(/\s/g, " "), "€ 10,50");
});
