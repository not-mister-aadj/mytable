import assert from "node:assert/strict";
import test from "node:test";
import { communicationLocale } from "@/lib/booking-table-language";

test("communicationLocale: the table-language answer decides, both fine keeps the site", () => {
  assert.equal(communicationLocale("prefer_english", "nl"), "en");
  assert.equal(communicationLocale("prefer_dutch", "en"), "nl");
  assert.equal(communicationLocale("both_fine", "en"), "en");
  assert.equal(communicationLocale("both_fine", "nl"), "nl");
  assert.equal(communicationLocale(undefined, "en"), "en");
});
