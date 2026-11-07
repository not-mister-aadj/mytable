import assert from "node:assert/strict";
import test from "node:test";
import { abandonedCheckoutButton, abandonedCheckoutSubject, abandonedCheckoutText } from "./abandoned-checkout-text";

const base = {
  locale: "nl" as const,
  firstName: "Desiree",
  city: "Den Haag",
  dateLabel: "zondag 6 december",
  open: true,
  next: null,
  url: "https://www.mytable.club/sunday-social/den-haag/2026-12-06",
};

test("open Sunday: asks what went wrong, offers the seat, and the url on its own line", () => {
  const text = abandonedCheckoutText(base);
  assert.match(text, /^Hoi Desiree,/);
  assert.match(text, /Sunday Social in Den Haag op zondag 6 december/);
  assert.match(text, /Er is nog plek\. Wil je het opnieuw proberen\?/);
  assert.ok(text.includes(`\n${base.url}\n`));
  assert.match(text, /Bedacht je je gewoon\? Dan is alles goed/);
  assert.equal(abandonedCheckoutSubject(base), "Ging er iets mis met je boeking voor zondag 6 december?");
  assert.equal(abandonedCheckoutButton(base), "Boek je plek");
});

test("full Sunday: points to the next date, or the other dates", () => {
  const withNext = abandonedCheckoutText({ ...base, open: false, next: { dateLabel: "zondag 31 januari" } });
  assert.match(withNext, /inmiddels vol, maar op zondag 31 januari is er nog plek/);
  assert.equal(abandonedCheckoutButton({ ...base, open: false, next: { dateLabel: "x" } }), "Boek de volgende datum");
  const none = abandonedCheckoutText({ ...base, open: false, next: null });
  assert.match(none, /Kijk gerust naar de andere data/);
});

test("English, and no name", () => {
  const text = abandonedCheckoutText({ ...base, locale: "en", firstName: null, dateLabel: "Sunday 6 December" });
  assert.match(text, /^Hi,/);
  assert.match(text, /Did something go wrong\?/);
  assert.equal(abandonedCheckoutSubject({ locale: "en", dateLabel: "Sunday 6 December" }), "Did something go wrong with your booking for Sunday 6 December?");
});

test("no em dashes", () => {
  for (const t of [abandonedCheckoutText(base), abandonedCheckoutText({ ...base, locale: "en" })]) assert.ok(!t.includes("—"));
});
