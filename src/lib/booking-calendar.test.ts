import assert from "node:assert/strict";
import test from "node:test";
import { bookingIcsUid, buildBookingIcs } from "@/lib/booking-calendar";

const BASE = {
  bookingId: "d2c1f624-7d5d-4ee8-8ea6-af379ab9c5d6",
  bookingCode: "MT-D2C1F6",
  eventName: "Sunday Social Rotterdam",
  city: "Rotterdam",
  startsAt: new Date("2026-11-01T13:00:00Z"),
  attendeeEmail: "chris@example.com",
  attendeeName: "Chris",
  isSundayTable: true,
};

const unfold = (ics: string) => ics.replace(/\r\n /g, "");
const line = (ics: string, name: string) => unfold(ics).split("\r\n").find((l) => l.startsWith(`${name}:`) || l.startsWith(`${name};`));

test("confirmation: an invite without the venue yet", () => {
  const ics = buildBookingIcs(BASE);
  assert.equal(line(ics, "METHOD"), "METHOD:REQUEST");
  assert.equal(line(ics, "UID"), `UID:${bookingIcsUid(BASE.bookingId)}`);
  assert.equal(line(ics, "SEQUENCE"), "SEQUENCE:0");
  assert.equal(line(ics, "DTSTART"), "DTSTART:20261101T130000Z");
  assert.equal(line(ics, "DTEND"), "DTEND:20261101T160000Z");
  assert.equal(line(ics, "LOCATION"), "LOCATION:Een wijnbar in Rotterdam\\, adres volgt 7 dagen van tevoren");
  assert.match(line(ics, "ATTENDEE")!, /^ATTENDEE;CN="Chris";.*:mailto:chris@example\.com$/);
  assert.ok(ics.split("\r\n").every((l) => l.length <= 75));
});

test("update: same UID, higher sequence, the address", () => {
  const ics = buildBookingIcs({ ...BASE, sequence: 1, location: "Juni, Oostzeedijk 340A, 3063 CC Rotterdam" });
  assert.equal(line(ics, "UID"), `UID:${bookingIcsUid(BASE.bookingId)}`);
  assert.equal(line(ics, "SEQUENCE"), "SEQUENCE:1");
  assert.equal(line(ics, "LOCATION"), "LOCATION:Juni\\, Oostzeedijk 340A\\, 3063 CC Rotterdam");
  assert.doesNotMatch(unfold(ics), /7 dagen/);
});

test("English, and other events keep their own name and end time", () => {
  const en = buildBookingIcs({ ...BASE, locale: "en" });
  assert.equal(line(en, "LOCATION"), "LOCATION:A wine bar in Rotterdam\\, address follows 7 days before");
  const dinner = buildBookingIcs({ ...BASE, isSundayTable: false, eventName: "Diner", endsAt: new Date("2026-11-01T20:00:00Z") });
  assert.equal(line(dinner, "SUMMARY"), "SUMMARY:MyTable · Diner");
  assert.equal(line(dinner, "LOCATION"), "LOCATION:Rotterdam");
  assert.equal(line(dinner, "DTEND"), "DTEND:20261101T200000Z");
});
