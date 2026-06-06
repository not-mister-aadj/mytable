import { PostHog } from "posthog-node";
import {
  getPostHogIngestHost,
  isPostHogConfigured,
} from "@/lib/posthog/config";
import type { PostHogEventName } from "@/lib/posthog/events";

export async function captureServerEvent(
  distinctId: string,
  event: PostHogEventName | string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key || !isPostHogConfigured()) return;

  const client = new PostHog(key, {
    host: getPostHogIngestHost(),
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId,
      event,
      properties,
    });
    await client.shutdown();
  } catch (err) {
    console.error("[posthog] capture failed", err);
  }
}
