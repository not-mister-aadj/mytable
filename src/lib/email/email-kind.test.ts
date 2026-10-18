import assert from "node:assert/strict";
import test from "node:test";
import { emailKind } from "@/lib/email/email-kind";

test("subjects of our own mails get their short name", () => {
  assert.equal(emailKind("Sunday Social bevestigd: Rotterdam · zondag 25 oktober"), "Bevestiging");
  assert.equal(emailKind("Bevestigd: Sunday Social Rotterdam (MT-D2C1F624)"), "Bevestiging");
  assert.equal(emailKind("Je tafelindeling voor zondag 25 oktober"), "Vragen");
  assert.equal(emailKind("Volgende week zondag: je Sunday Social bij Juni"), "Locatie");
  assert.equal(emailKind("Sunday Social geannuleerd: Utrecht · zondag 22 november"), "Annulering");
  assert.equal(emailKind("Verplaatst: Sunday Social (MT-1A2B3C4D)"), "Verplaatst");
  assert.equal(emailKind("Je staat op de lijst voor Rotterdam"), "Wachtlijst");
});

test("a preview prefix is ignored and unknown subjects stay generic", () => {
  assert.equal(emailKind("[Voorbeeld] Je tafelindeling voor zondag 1 november"), "Vragen");
  assert.equal(emailKind("Iets heel anders"), "E-mail");
});
