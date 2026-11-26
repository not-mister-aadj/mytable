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
  assert.equal(emailKind("Welkom bij Sunday Social, zo werkt het"), "Wachtlijst");
  assert.equal(emailKind("Welcome to Sunday Social, here's how it works"), "Wachtlijst");
  assert.equal(emailKind("Je uitnodiging: middag met wijn op 1 november"), "Uitnodiging");
  assert.equal(emailKind("Your invitation to a cosy Sunday afternoon with wine"), "Uitnodiging");
  assert.equal(emailKind("Zondag 25 oktober: een tafel voor je bij Juni"), "Uitnodiging");
  assert.equal(emailKind("Je inlogcode: 123456"), "Inlogcode");
  assert.equal(emailKind("Vanaf 4 november 2026 kun je weer boeken"), "Boeken open");
});

test("the mails around a Sunday each get their own name", () => {
  assert.equal(emailKind("Kom je zondag 13 december? · Utrecht"), "Kom je zondag?");
  assert.equal(emailKind("Nog even: kom je zondag 13 december?"), "Kom je zondag, herinnering");
  assert.equal(emailKind("Volgende week zondag bij Concours Wine & Foodbar · zo 22 nov"), "Locatie");
  assert.equal(emailKind("This Sunday at Juni · Sun 22 Nov"), "Locatie");
  assert.equal(emailKind("Bevestigd: je Sunday Social bij Juni · zo 22 nov"), "Bevestiging");
  assert.equal(emailKind("Morgen bij Juni: je zit in groep 2 · zo 22 nov"), "Groep");
  assert.equal(emailKind("Vanmiddag bij Wijnbar Paulus · zo 15 nov"), "Vanmiddag");
  assert.equal(emailKind("Hoe was het vanmiddag bij Wijnbar Vindinct? · zo 8 nov"), "Review");
  assert.equal(emailKind("How was this afternoon at Juni? · Sun 8 Nov"), "Review");
  assert.equal(emailKind("Wie wil je terugzien? · zo 8 nov"), "Terugzien");
  assert.equal(emailKind("Ze vonden je gezellig zondag"), "Gezellig");
  assert.equal(emailKind("We hebben je gemist zondag"), "Niet gekomen");
  assert.equal(emailKind("Over afgelopen zondag"), "Niet gekomen");
});

test("booking, invite and internal mails", () => {
  assert.equal(emailKind("Ging er iets mis met je boeking voor zondag 6 december?"), "Betaling afgebroken");
  assert.equal(emailKind("Er is een plek vrij: zo 6 dec in Den Haag"), "Plek vrij");
  assert.equal(emailKind("Verzet: je schuift aan op zondag 31 januari in Den Haag"), "Verplaatst");
  assert.equal(emailKind("Sanne heeft je een plek gegeven: zondag 6 december in Utrecht"), "Plek doorgegeven");
  assert.equal(emailKind("Zondag 22 november, 14:00"), "Uitnodiging");
  assert.equal(emailKind("Bekende gezichten op zondag 6 december in Den Haag"), "Bekende gezichten");
  assert.equal(emailKind("Wil je nog uitnodigingen van ons?"), "Nog uitnodigingen?");
  assert.equal(emailKind("tafels reserveren zondag 29 november, 20 personen"), "Venue");
  assert.equal(emailKind("Reservering zondag 6 december, 20 personen"), "Venue");
  assert.equal(emailKind("Je sollicitatie als MyTable Ambassador"), "Sollicitatie");
  assert.equal(emailKind("[afmelding] Sanne · Utrecht zo 22 nov"), "Intern");
  assert.equal(emailKind("Nieuwe ambassador-aanmelding: Joel, Rotterdam"), "Intern");
  assert.equal(emailKind("[kopie] Bevestigd: di 17 nov bij Bar Cava · je zit in groep 2"), "Bevestiging");
});

test("a preview prefix is ignored and unknown subjects stay generic", () => {
  assert.equal(emailKind("[Voorbeeld] Je tafelindeling voor zondag 1 november"), "Vragen");
  assert.equal(emailKind("Iets heel anders"), "E-mail");
});
