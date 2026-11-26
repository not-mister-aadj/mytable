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

test("a seat can be shared only when fixed, paid, active, not a member's, before the start", () => {
  const event = { startsAt: new Date("2026-11-29T13:00:00Z") } as Parameters<typeof canShareSeat>[1];
  const booking = { paymentStatus: "paid", lifecycleStatus: "active", cancelledLateAt: null, noShowAt: null, membershipId: null } as unknown as Parameters<typeof canShareSeat>[0];
  const threeDaysBefore = Date.parse("2026-11-26T10:00:00Z");
  assert.equal(canShareSeat(booking, event, threeDaysBefore), true);
  assert.equal(canShareSeat(booking, event, Date.parse("2026-11-15T10:00:00Z")), false); // still movable
  assert.equal(canShareSeat(booking, event, Date.parse("2026-11-29T13:30:00Z")), false); // started
  assert.equal(canShareSeat({ ...booking, membershipId: "m" }, event, threeDaysBefore), false);
  assert.equal(canShareSeat({ ...booking, cancelledLateAt: new Date() }, event, threeDaysBefore), false);
});

test("reminder for an open link: Friday 10:00 before the Sunday, Amsterdam time", async () => {
  const { reminderAt, handOverReminderMail } = await import("./seat-handover-link");
  assert.equal(reminderAt(new Date("2026-11-29T13:00:00Z")).toISOString(), "2026-11-27T09:00:00.000Z");
  assert.equal(reminderAt(new Date("2027-06-13T12:00:00Z")).toISOString(), "2027-06-11T08:00:00.000Z"); // summer time
  const m = handOverReminderMail({ locale: "nl", firstName: "Sophie", startsAt: new Date("2026-11-29T13:00:00Z"), tableUrl: "https://www.mytable.club/aan-tafel/x" });
  assert.equal(m.subject, "Nog niemand heeft je plek overgenomen");
  assert.match(m.text, /^Hoi Sophie,\n\nJe link voor zondag 29 november staat nog open/);
  assert.match(m.html, />Naar je tafelpagina</);
  assert.ok(!m.text.includes("—"));
});
