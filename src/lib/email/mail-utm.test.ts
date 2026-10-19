import assert from "node:assert/strict";
import test from "node:test";
import { addMailUtm, mailCampaignSlug } from "@/lib/email/mail-utm";

test("the campaign is the kind of mail", () => {
  assert.equal(mailCampaignSlug("Welkom aan tafel, Remco"), "welkom");
  assert.equal(mailCampaignSlug("Bevestigd: Sunday Social (MT-1A2B3C4D)"), "bevestiging");
  assert.equal(mailCampaignSlug("Morgen bij Juni: je zit in groep 2"), "groep");
  assert.equal(mailCampaignSlug("Iets heel anders"), "overig");
});

test("links to our site get UTM tags, others are left alone", () => {
  const html =
    '<a href="https://www.mytable.club/jouw-tafel/start?stap=kies&amp;x=1">Kies</a>' +
    '<a href="https://instagram.com/mytable">IG</a>' +
    '<a href="mailto:info@mytable.club">Mail</a>' +
    '<a href="https://www.mytable.club/x?utm_source=mail&amp;utm_campaign=okt">Al getagd</a>';
  const { html: out } = addMailUtm({ html, subject: "Welkom aan tafel", to: "a@b.nl" });
  assert.match(out!, /stap=kies&amp;x=1&amp;utm_source=mail&amp;utm_medium=email&amp;utm_campaign=welkom&amp;r=[a-f0-9]{10}"/);
  assert.match(out!, /href="https:\/\/instagram\.com\/mytable"/);
  assert.match(out!, /href="mailto:info@mytable\.club"/);
  assert.match(out!, /utm_source=mail&amp;utm_campaign=okt"/);
});

test("the plain text version is tagged too", () => {
  const { text } = addMailUtm({ text: "Kies hier: https://mytable.club/jouw-tafel.", subject: "Welkom aan tafel", to: "a@b.nl" });
  assert.match(text!, /https:\/\/mytable\.club\/jouw-tafel\?utm_source=mail&utm_medium=email&utm_campaign=welkom&r=[a-f0-9]{10}\./);
});
