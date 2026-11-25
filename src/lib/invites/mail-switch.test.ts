import assert from "node:assert/strict";
import test from "node:test";
import { invitesOff, switchedPrefs } from "./mail-switch";

test("switching off sets every followed city to none and keeps the rest", () => {
  assert.deepEqual(switchedPrefs({ Utrecht: "less" }, ["Rotterdam", "Utrecht"], false), { Utrecht: "none", Rotterdam: "none" });
});

test("switching on turns every none back to all and keeps less", () => {
  assert.deepEqual(switchedPrefs({ Rotterdam: "none", Utrecht: "less", Breda: "none" }, ["Rotterdam"], true), {
    Rotterdam: "all",
    Utrecht: "less",
    Breda: "all",
  });
});

test("off only when every followed city is none", () => {
  assert.equal(invitesOff({ Rotterdam: "none", Utrecht: "none" }, ["Rotterdam", "Utrecht"]), true);
  assert.equal(invitesOff({ Rotterdam: "none" }, ["Rotterdam", "Utrecht"]), false);
  assert.equal(invitesOff({}, []), false);
});
