"use server";

import { completeFeedback, saveFeedback, verifyFeedbackToken, type FeedbackState } from "@/lib/feedback";
import { bookFreeSeatAfterFeedback, type FreeSeatResult } from "@/lib/feedback-free-seat";
import { saveFeedbackReport, type ReportInput } from "@/lib/feedback-report";

/** Saves the answers given so far, only for the booking in the link. */
export async function saveFeedbackAction(token: string, input: Partial<FeedbackState>): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  await saveFeedback(bookingId, input);
  return { ok: true };
}

/** The last screen: everything saved, and marked as complete. */
export async function completeFeedbackAction(token: string, input: Partial<FeedbackState>): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  await completeFeedback(bookingId, input);
  return { ok: true };
}

/** "De volgende is op ons": the free seat after Matig or Niet leuk. */
export async function bookFreeSeatAction(token: string, eventId: string): Promise<FreeSeatResult> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false, error: "not_allowed" };
  return bookFreeSeatAfterFeedback(bookingId, eventId);
}

/** "Laat het ons weten": something that wasn't okay, only for us. */
export async function submitReportAction(token: string, input: ReportInput): Promise<{ ok: boolean }> {
  const bookingId = await verifyFeedbackToken(token);
  if (!bookingId) return { ok: false };
  return { ok: await saveFeedbackReport(bookingId, input) };
}
