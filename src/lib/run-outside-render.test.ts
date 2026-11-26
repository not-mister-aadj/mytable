// Run with: npx tsx --test src/lib/run-outside-render.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { runOutsideRender } from "./run-outside-render";

test("runs at once where that is allowed, and defers nothing", () => {
  let ran = 0;
  const deferred: Array<() => void> = [];
  const outcome = runOutsideRender(
    () => {
      ran += 1;
    },
    (callback) => deferred.push(callback),
  );
  assert.equal(outcome, "now");
  assert.equal(ran, 1);
  assert.equal(deferred.length, 0);
});

test("refused during a render: deferred, and it runs once after the response", () => {
  let rendering = true;
  let ran = 0;
  const deferred: Array<() => void> = [];
  const work = () => {
    if (rendering) throw new Error('used "revalidateTag published-events" during render');
    ran += 1;
  };

  // The caller goes on: nothing is thrown at it.
  const outcome = runOutsideRender(work, (callback) => deferred.push(callback));
  assert.equal(outcome, "deferred");
  assert.equal(ran, 0);
  assert.equal(deferred.length, 1);

  rendering = false;
  deferred[0]();
  assert.equal(ran, 1);
});

test("nowhere to defer to: the first error is the one thrown", () => {
  assert.throws(
    () =>
      runOutsideRender(
        () => {
          throw new Error("static generation store missing");
        },
        () => {
          throw new Error("after() outside a request");
        },
      ),
    /static generation store missing/,
  );
});
