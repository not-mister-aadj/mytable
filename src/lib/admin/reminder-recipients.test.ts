import assert from "node:assert/strict";
import test from "node:test";
import { mailRecipients, type SundayMailContext } from "./sunday-mails";

const guest = (name: string, over: Record<string, unknown>) => ({ firstName: name, noShow: false, feedbackGiven: false, feedbackCompleted: false, reported: false, ...over });
const ctx = (feedbackByHand: boolean) =>
  ({
    feedbackByHand,
    guests: [guest("Naomi", { feedbackGiven: true }), guest("Tim", {}), guest("Haby", { feedbackGiven: true, feedbackCompleted: true })],
  }) as unknown as SundayMailContext;

test("reminder: normally whoever answered the first question is left alone", () => {
  assert.deepEqual(mailRecipients(ctx(false), "reminder").map((g) => g.firstName), ["Tim"]);
});

test("reminder after a new feedback mail by hand: only a finished form counts as done", () => {
  assert.deepEqual(mailRecipients(ctx(true), "reminder").map((g) => g.firstName), ["Naomi", "Tim"]);
});
