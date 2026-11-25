import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { emailHash } from "./deleted-accounts";

test("hash is a sha256 of the trimmed, lowercased email", () => {
  const expected = createHash("sha256").update("anna@example.com").digest("hex");
  assert.equal(emailHash(" Anna@Example.com "), expected);
});
