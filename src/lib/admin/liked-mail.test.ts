import assert from "node:assert/strict";
import test from "node:test";
import { defaultScheduleAt, likedMail } from "./sunday-mails";

const url = "https://www.mytable.club/jouw-tafel/instellingen?tab=vrienden";

test("after a Sunday: reminder Tuesday 08:00, 'Ze vonden je gezellig' Wednesday 19:00 (Amsterdam)", () => {
  const sunday = new Date("2026-11-08T13:00:00Z");
  assert.equal(defaultScheduleAt(sunday, "reminder").toISOString(), "2026-11-10T07:00:00.000Z");
  assert.equal(defaultScheduleAt(sunday, "liked").toISOString(), "2026-11-11T18:00:00.000Z");
});

test("liked mail: no names, no count, no booking button, two variants", () => {
  const fresh = likedMail({ locale: "nl", firstName: "Sophie", venueName: "Vino Victoria", pickedSomeone: false, url });
  assert.match(fresh.text, /^Hoi Sophie,\n\nZondag in Vino Victoria heb je indruk gemaakt\. Aan je tafel gaven ze aan dat ze je gezellig vonden en je vaker aan tafel willen hebben\./);
  assert.match(fresh.text, /Met wie had jij het gezellig\? Laat het ons weten\. Dan zorgen we dat je op een volgende zondag vaker bekende gezichten tegenkomt\./);
  assert.match(fresh.text, /Kan tot zondag 18:00\.\n\nDj$/);
  assert.match(fresh.html, />Laat weten met wie het gezellig was</);

  const picked = likedMail({ locale: "nl", firstName: "Sophie", venueName: "Vino Victoria", pickedSomeone: true, url });
  assert.match(picked.text, /Jij liet ook al weten met wie je het gezellig had\./);
  assert.match(picked.text, /Twijfelde je nog over iemand\? Tot zondag 18:00 kun je het aanpassen\./);
  assert.match(picked.html, />Bekijk met wie je het gezellig had</);

  const en = likedMail({ locale: "en", firstName: "", venueName: "Vino Victoria", pickedSomeone: false, url });
  assert.match(en.text, /^Hi,\n\nOn Sunday at Vino Victoria you made an impression\./);

  for (const m of [fresh, picked, en]) {
    assert.doesNotMatch(m.text, /hartje|heart|reserveer|book|\d+ (mensen|people)/i);
    assert.ok(!m.text.includes("\u2014"));
  }
});
