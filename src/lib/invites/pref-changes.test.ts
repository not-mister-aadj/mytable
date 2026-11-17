import assert from "node:assert/strict";
import test from "node:test";
import { prefChanges, unsubscribedAfter } from "@/lib/invites/pref-changes";

test("a followed city without a setting counts as all; unsubscribing turns each off", () => {
  const changes = prefChanges({}, { Utrecht: "none", Rotterdam: "none" }, ["Rotterdam", "Utrecht"]);
  assert.deepEqual(changes, [
    { city: "Rotterdam", from: "all", to: "none" },
    { city: "Utrecht", from: "all", to: "none" },
  ]);
  assert.equal(unsubscribedAfter({}, { Utrecht: "none", Rotterdam: "none" }, ["Rotterdam", "Utrecht"]), true);
});

test("adding a city they did not follow is a change from none", () => {
  assert.deepEqual(prefChanges({}, { Utrecht: "all", Eindhoven: "less" }, ["Utrecht"]), [{ city: "Eindhoven", from: "none", to: "less" }]);
  assert.equal(unsubscribedAfter({}, { Utrecht: "all", Eindhoven: "less" }, ["Utrecht"]), false);
});

test("saving the same settings is no change", () => {
  assert.deepEqual(prefChanges({ Utrecht: "less" }, { Utrecht: "less" }, ["Utrecht"]), []);
});

test("one city off while another stays is not unsubscribed", () => {
  assert.deepEqual(prefChanges({}, { Utrecht: "none", Rotterdam: "all" }, ["Rotterdam", "Utrecht"]), [{ city: "Utrecht", from: "all", to: "none" }]);
  assert.equal(unsubscribedAfter({}, { Utrecht: "none", Rotterdam: "all" }, ["Rotterdam", "Utrecht"]), false);
});

test("coming back after unsubscribing", () => {
  assert.deepEqual(prefChanges({ Utrecht: "none" }, { Utrecht: "all" }, []), [{ city: "Utrecht", from: "none", to: "all" }]);
});
