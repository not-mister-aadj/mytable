import assert from "node:assert/strict";
import test from "node:test";
import { declinedAfter, nextAfterDecline } from "./declines";
import { inviteMail, nudgeMail, type MailEvent } from "./logic";

const DAY = 24 * 60 * 60 * 1000;
const sent = { id: "s1", sentAt: new Date("2026-11-10T10:00:00Z") };

test("a 'kan niet' through the mail's link is a reaction to that mail", () => {
  assert.equal(declinedAfter([{ eventId: "e", at: new Date("2026-12-01T10:00:00Z"), sendId: "s1" }], sent, 7 * DAY), true);
  assert.equal(declinedAfter([{ eventId: "e", at: new Date("2026-11-11T10:00:00Z"), sendId: "other" }], sent, 7 * DAY), false);
});

test("a 'kan niet' set by us counts for the mail before it, within the window", () => {
  assert.equal(declinedAfter([{ eventId: "e", at: new Date("2026-11-12T10:00:00Z"), sendId: null }], sent, 7 * DAY), true);
  assert.equal(declinedAfter([{ eventId: "e", at: new Date("2026-11-20T10:00:00Z"), sendId: null }], sent, 7 * DAY), false);
  assert.equal(declinedAfter([{ eventId: "e", at: new Date("2026-11-09T10:00:00Z"), sendId: null }], sent, 7 * DAY), false);
});

test("the next invite may come two weeks after the latest 'kan niet'", () => {
  assert.equal(nextAfterDecline([]), null);
  const next = nextAfterDecline([
    { eventId: "a", at: new Date("2026-11-01T10:00:00Z"), sendId: null },
    { eventId: "b", at: new Date("2026-11-05T10:00:00Z"), sendId: null },
  ]);
  assert.equal(next?.toISOString(), "2026-11-19T10:00:00.000Z");
});

const event: MailEvent = {
  city: "Amsterdam",
  startsAt: "2026-12-13T13:00:00.000Z",
  priceCents: 1000,
  scarcity: null,
  url: "https://www.mytable.club/r/ABCDEFGH1",
  declineUrl: "https://www.mytable.club/niet/ABCDEFGH1",
};

test("the invite has the 'kan niet' line under each Sunday", () => {
  const nl = inviteMail({ name: "Sam", cities: ["Amsterdam"], events: [event], member: false, manageUrl: "https://x", locale: "nl" }).body;
  assert.match(nl, /ABCDEFGH1\nDeze zondag kan ik niet: https:\/\/www\.mytable\.club\/niet\/ABCDEFGH1/);
  const en = inviteMail({ name: "Sam", cities: ["Amsterdam"], events: [event], member: false, manageUrl: "https://x", locale: "en" }).body;
  assert.match(en, /I can't make this Sunday: https:\/\/www\.mytable\.club\/niet\/ABCDEFGH1/);
  const without = inviteMail({ name: "Sam", cities: ["Amsterdam"], events: [{ ...event, declineUrl: undefined }], member: false, manageUrl: "https://x", locale: "nl" }).body;
  assert.doesNotMatch(without, /kan ik niet/);
});

test("the reminder has the 'kan niet' line under the booking link", () => {
  const body = nudgeMail({ name: "Sam", cities: ["Amsterdam"], event, soldOut: null, sentAt: new Date("2026-11-22T13:00:00Z"), manageUrl: "https://x", locale: "nl" }).body;
  assert.match(body, /Reserveer je plek: \S+\nDeze zondag kan ik niet: /);
});
