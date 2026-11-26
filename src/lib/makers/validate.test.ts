import assert from "node:assert/strict";
import test from "node:test";
import { parseMakerForm } from "./validate";

const base = { name: "Sanne", email: "Sanne@Example.com ", city: "Utrecht", instagram: "@sanne.eet", privacy: true };

test("a complete form passes, email lower case, style defaults to either", () => {
  const r = parseMakerForm(base);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.input.email, "sanne@example.com");
    assert.equal(r.input.workStyle, "either");
    assert.equal(r.input.tiktok, null);
  }
});

test("instagram or tiktok is needed", () => {
  assert.deepEqual(parseMakerForm({ ...base, instagram: "" }), { ok: false, error: "handle" });
  assert.equal(parseMakerForm({ ...base, instagram: "", tiktok: "@sanne" }).ok, true);
});

test("missing fields are named", () => {
  assert.deepEqual(parseMakerForm({ ...base, name: " " }), { ok: false, error: "name" });
  assert.deepEqual(parseMakerForm({ ...base, email: "x" }), { ok: false, error: "email" });
  assert.deepEqual(parseMakerForm({ ...base, city: "" }), { ok: false, error: "city" });
  assert.deepEqual(parseMakerForm({ ...base, privacy: false }), { ok: false, error: "privacy" });
});

test("an unknown work style falls back to either", () => {
  const r = parseMakerForm({ ...base, workStyle: "hack" });
  assert.equal(r.ok && r.input.workStyle, "either");
});
