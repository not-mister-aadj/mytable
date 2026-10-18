import assert from "node:assert/strict";
import test from "node:test";
import { emailKind } from "@/lib/email/email-kind";

test("subjects of our own mails get their short name", () => {
  assert.equal(emailKind("Sunday Social bevestigd: Rotterdam · zondag 25 oktober"), "Bevestiging");
  assert.equal(emailKind("Bevestigd: Sunday Social Rotterdam (MT-D2C1F624)"), "Bevestiging");
  assert.equal(emailKind("Je tafelindeling voor zondag 25 oktober"), "Vragen");
  assert.equal(emailKind("Volgende week zondag: je Sunday Social bij Juni"), "Locatie");
  assert.equal(emailKind("Morgen bij Juni: je zit in groep 2"), "Groep");
  assert.equal(emailKind("Sunday Social geannuleerd: Utrecht · zondag 22 november"), "Annulering");
  assert.equal(emailKind("Verplaatst: Sunday Social (MT-1A2B3C4D)"), "Verplaatst");
  assert.equal(emailKind("Je staat op de lijst voor Rotterdam"), "Wachtlijst");
  assert.equal(emailKind("Je uitnodiging: middag met wijn op 1 november"), "Uitnodiging");
  assert.equal(emailKind("Your invitation to a cosy Sunday afternoon with wine"), "Uitnodiging");
  assert.equal(emailKind("Zondag 25 oktober: een tafel voor je bij Juni"), "Uitnodiging");
  assert.equal(emailKind("Je inlogcode: 123456"), "Inlogcode");
  assert.equal(emailKind("Vanaf 4 november 2026 kun je weer boeken"), "Boeken open");
});

test("a preview prefix is ignored and unknown subjects stay generic", () => {
  assert.equal(emailKind("[Voorbeeld] Je tafelindeling voor zondag 1 november"), "Vragen");
  assert.equal(emailKind("Iets heel anders"), "E-mail");
});
