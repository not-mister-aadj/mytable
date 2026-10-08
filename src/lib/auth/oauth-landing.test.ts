// Run with: npx tsx --test src/lib/auth/oauth-landing.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { oauthStateErrorLocale } from "./oauth-landing";

const params = (query: string) => new URLSearchParams(query);

test("homepage with a Supabase state error", () => {
  assert.equal(
    oauthStateErrorLocale(
      "/",
      params("error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+not+found+or+expired"),
    ),
    "nl",
  );
  assert.equal(oauthStateErrorLocale("/en", params("error_code=flow_state_expired")), "en");
});

test("older Supabase without an error code", () => {
  assert.equal(
    oauthStateErrorLocale("/", params("error=invalid_request&error_description=OAuth+state+not+found+or+expired")),
    "nl",
  );
});

test("leaves everything else alone", () => {
  assert.equal(oauthStateErrorLocale("/", params("")), null);
  assert.equal(oauthStateErrorLocale("/", params("error=access_denied&error_description=User+cancelled")), null);
  assert.equal(oauthStateErrorLocale("/agenda", params("error_code=bad_oauth_state")), null);
});
