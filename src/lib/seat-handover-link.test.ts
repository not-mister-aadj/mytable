import assert from "node:assert/strict";
import test from "node:test";
import { adultOn, canShareSeat } from "./seat-handover-link";

test("18 or older on the day of the Sunday", () => {
  const sunday = new Date("2026-11-29T13:00:00Z");
  assert.equal(adultOn("2008-11-29", sunday), true);
  assert.equal(adultOn("2008-11-30", sunday), false);
  assert.equal(adultOn("1990-05-05", sunday), true);
  assert.equal(adultOn("not a date", sunday), false);
  assert.equal(adultOn("2030-01-01", sunday), false);
});

test("a seat can be shared only when fixed, paid, active, before the start (a member's too)", () => {
  const event = { startsAt: new Date("2026-11-29T13:00:00Z") } as Parameters<typeof canShareSeat>[1];
  const booking = { paymentStatus: "paid", lifecycleStatus: "active", cancelledLateAt: null, noShowAt: null, membershipId: null } as unknown as Parameters<typeof canShareSeat>[0];
  const threeDaysBefore = Date.parse("2026-11-26T10:00:00Z");
  assert.equal(canShareSeat(booking, event, threeDaysBefore), true);
  assert.equal(canShareSeat(booking, event, Date.parse("2026-11-15T10:00:00Z")), false); // still movable
  assert.equal(canShareSeat(booking, event, Date.parse("2026-11-29T13:30:00Z")), false); // started
  assert.equal(canShareSeat({ ...booking, membershipId: "m" }, event, threeDaysBefore), true);
  assert.equal(canShareSeat({ ...booking, cancelledLateAt: new Date() }, event, threeDaysBefore), false);
});

test("reminder: two days after sharing, at the latest Friday 10:00, never at night (Amsterdam)", async () => {
  const { reminderAt, handOverReminderMail } = await import("./seat-handover-link");
  const sunday = new Date("2026-11-29T13:00:00Z");
  const at = (shared: string) => reminderAt(sunday, new Date(shared))?.toISOString() ?? null;
  // Shared Monday 15:00 -> Wednesday 15:00
  assert.equal(at("2026-11-23T14:00:00Z"), "2026-11-25T14:00:00.000Z");
  // Shared Wednesday 18:00 -> would be Friday 18:00 -> capped at Friday 10:00
  assert.equal(at("2026-11-25T17:00:00Z"), "2026-11-27T09:00:00.000Z");
  // Shared Monday 23:30 -> Wednesday 23:30 is night -> Thursday 08:00
  assert.equal(at("2026-11-23T22:30:00Z"), "2026-11-26T07:00:00.000Z");
  // Shared Tuesday 05:00 -> Thursday 05:00 is night -> Thursday 08:00
  assert.equal(at("2026-11-24T04:00:00Z"), "2026-11-26T07:00:00.000Z");
  // Shared from Friday 10:00 on: no reminder
  assert.equal(at("2026-11-27T09:00:00Z"), null);
  assert.equal(at("2026-11-28T12:00:00Z"), null);
  // Summer time: Friday 10:00 is 08:00 UTC
  assert.equal(reminderAt(new Date("2027-06-13T12:00:00Z"), new Date("2027-06-10T12:00:00Z"))?.toISOString(), "2027-06-11T08:00:00.000Z");

  const m = handOverReminderMail({ locale: "nl", firstName: "Sophie", startsAt: sunday, tableUrl: "https://www.mytable.club/aan-tafel/x" });
  assert.equal(m.subject, "Nog niemand heeft je plek overgenomen");
  assert.match(m.text, /^Hoi Sophie,\n\nJe link voor zondag 29 november staat nog open/);
  assert.match(m.html, />Naar je tafelpagina</);
  assert.ok(!m.text.includes("\u2014"));
});
