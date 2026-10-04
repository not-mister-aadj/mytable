import assert from "node:assert/strict";
import test from "node:test";
import { addDays, datesToCreate, isIsoDate, isPaused, seriesDates, seriesWindow, weekday } from "./series-logic";

const BREAK = [{ startsOn: "2026-12-20", endsOn: "2027-01-10" }];
const ROTTERDAM = { firstDate: "2026-11-01", intervalWeeks: 4, active: true };

test("addDays and weekday cross months and years", () => {
  assert.equal(addDays("2026-11-29", 28), "2026-12-27");
  assert.equal(addDays("2026-12-27", 28), "2027-01-24");
  assert.equal(weekday("2026-11-01"), 0);
  assert.equal(weekday("2027-01-24"), 0);
});

test("isIsoDate rejects impossible dates", () => {
  assert.ok(isIsoDate("2026-11-01"));
  assert.ok(!isIsoDate("2026-02-30"));
  assert.ok(!isIsoDate("1-11-2026"));
});

test("a series is every 4 weeks; the break skips a date, the rhythm runs on", () => {
  const dates = seriesDates(ROTTERDAM, { from: "2026-10-04", to: "2027-03-31" }, BREAK);
  assert.deepEqual(dates, ["2026-11-01", "2026-11-29", "2027-01-24", "2027-02-21", "2027-03-21"]);
});

test("the agreed plan: two cities a Sunday, neighbours a week apart", () => {
  const window = { from: "2026-10-04", to: "2027-02-14" };
  const plan = (firstDate: string) => seriesDates({ firstDate, intervalWeeks: 4, active: true }, window, BREAK);
  assert.deepEqual(plan("2026-11-08"), ["2026-11-08", "2026-12-06", "2027-01-31"]); // Den Haag, Eindhoven
  assert.deepEqual(plan("2026-11-15"), ["2026-11-15", "2026-12-13", "2027-02-07"]); // Amsterdam, Breda
  assert.deepEqual(plan("2026-11-22"), ["2026-11-22", "2027-01-17", "2027-02-14"]); // Utrecht, Groningen
});

test("the window starts mid-series without walking from the first date", () => {
  const dates = seriesDates({ firstDate: "2020-01-05", intervalWeeks: 4, active: true }, { from: "2026-10-04", to: "2026-11-30" });
  assert.ok(dates.length >= 2);
  for (const d of dates) assert.equal(weekday(d), 0);
  assert.equal(addDays(dates[0]!, 28), dates[1]);
});

test("skipped dates and inactive series give no tables", () => {
  const window = { from: "2026-10-04", to: "2026-12-31" };
  assert.deepEqual(seriesDates(ROTTERDAM, window, [], new Set(["2026-11-29"])), ["2026-11-01", "2026-12-27"]);
  assert.deepEqual(seriesDates({ ...ROTTERDAM, active: false }, window), []);
});

test("the cron window is today plus 10 weeks", () => {
  assert.deepEqual(seriesWindow("2026-10-04"), { from: "2026-10-04", to: "2026-12-13" });
  assert.ok(isPaused("2026-12-27", BREAK));
  assert.ok(!isPaused("2027-01-17", BREAK));
});

test("datesToCreate: always the next two dates, also past a break", () => {
  const window = seriesWindow("2026-10-04");
  const utrecht = { firstDate: "2026-11-22", intervalWeeks: 4, active: true };
  assert.deepEqual(datesToCreate(utrecht, window, BREAK), ["2026-11-22", "2027-01-17"]);
  const denHaag = { firstDate: "2026-11-08", intervalWeeks: 4, active: true };
  assert.deepEqual(datesToCreate(denHaag, window, BREAK), ["2026-11-08", "2026-12-06"]);
  assert.deepEqual(datesToCreate({ ...denHaag, active: false }, window, BREAK), []);
});
