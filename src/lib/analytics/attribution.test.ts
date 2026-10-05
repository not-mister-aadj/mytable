import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignFromSearch,
  describeTouch,
  externalReferrerHost,
  parseTouchCookie,
  sanitizeTouch,
} from "./attribution";

test("campaign from the query: utm tags and click ids", () => {
  assert.deepEqual(
    campaignFromSearch("?utm_source=fb&utm_medium=paid&utm_campaign=123&utm_content=456&utm_term=789&fbclid=abc&x=1"),
    { source: "fb", medium: "paid", campaign: "123", content: "456", term: "789", fbclid: "abc" },
  );
  assert.deepEqual(campaignFromSearch(""), {});
});

test("external referrer: other sites only, without www", () => {
  assert.equal(externalReferrerHost("https://www.google.com/search?q=x", "www.mytable.club"), "google.com");
  assert.equal(externalReferrerHost("https://www.mytable.club/agenda", "www.mytable.club"), null);
  assert.equal(externalReferrerHost("https://login.mytable.club/x", "mytable.club"), null);
  assert.equal(externalReferrerHost("", "mytable.club"), null);
  assert.equal(externalReferrerHost("not a url", "mytable.club"), null);
});

test("sanitize: known keys, short strings, nothing else", () => {
  assert.deepEqual(sanitizeTouch({ source: " fb ", evil: "x", campaign: 5, landing: "/" }), { source: "fb", landing: "/" });
  assert.equal(sanitizeTouch({}), null);
  assert.equal(sanitizeTouch("x"), null);
  assert.equal(sanitizeTouch({ source: "a".repeat(500) })?.source?.length, 100);
});

test("cookie round trip and junk", () => {
  const value = encodeURIComponent(JSON.stringify({ source: "ig", at: "2026-10-05T10:00:00Z" }));
  assert.deepEqual(parseTouchCookie(value), { source: "ig", at: "2026-10-05T10:00:00Z" });
  assert.equal(parseTouchCookie("%7Bnope"), null);
  assert.equal(parseTouchCookie(undefined), null);
});

test("describe: Meta ad, organic referrer, direct", () => {
  assert.equal(
    describeTouch({ source: "fb", medium: "paid", campaign: "Sales", content: "NL_07", landing: "/jouw-tafel" }),
    "Meta advertentie · campagne Sales · advertentie NL_07 · via /jouw-tafel",
  );
  assert.equal(describeTouch({ source: "ig", medium: "paid" }), "Meta advertentie (Instagram)");
  assert.equal(describeTouch({ referrer: "google.com", landing: "/" }), "google.com (geen campagne) · via /");
  assert.equal(describeTouch({ landing: "/agenda" }), "Direct · via /agenda");
  assert.equal(describeTouch(null), "Onbekend");
});
