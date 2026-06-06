import {
  getPostHogApiHost,
  getPostHogProjectId,
  isPostHogAdminConfigured,
} from "@/lib/posthog/config";

export type AnalyticsSummary = {
  pageviews7d: number;
  eventDetailViews7d: number;
  checkoutStarted7d: number;
  paymentsCompleted7d: number;
  seatsBooked7d: number;
  revenue7d: number;
  waitlistSignups7d: number;
};

async function hogqlCount(event: string, days = 7): Promise<number> {
  const projectId = getPostHogProjectId();
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!projectId || !apiKey) return 0;

  const response = await fetch(
    `${getPostHogApiHost()}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: `SELECT count() AS c FROM events WHERE event = '${event}' AND timestamp > now() - INTERVAL ${days} DAY`,
        },
      }),
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    console.error("[posthog] query failed", event, response.status);
    return 0;
  }

  const data = (await response.json()) as {
    results?: Array<Array<number | string>>;
  };
  const raw = data.results?.[0]?.[0];
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

async function hogqlSum(
  event: string,
  property: string,
  days = 7,
): Promise<number> {
  const projectId = getPostHogProjectId();
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!projectId || !apiKey) return 0;

  const response = await fetch(
    `${getPostHogApiHost()}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: `SELECT sum(toFloat(properties.${property})) AS s FROM events WHERE event = '${event}' AND timestamp > now() - INTERVAL ${days} DAY`,
        },
      }),
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) return 0;

  const data = (await response.json()) as {
    results?: Array<Array<number | string | null>>;
  };
  const raw = data.results?.[0]?.[0];
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  if (!isPostHogAdminConfigured()) return null;

  const [
    pageviews7d,
    eventDetailViews7d,
    checkoutStarted7d,
    paymentsCompleted7d,
    seatsBooked7d,
    revenue7d,
    waitlistSignups7d,
  ] = await Promise.all([
    hogqlCount("page_viewed"),
    hogqlCount("event_detail_viewed"),
    hogqlCount("checkout_started"),
    hogqlCount("payment_completed"),
    hogqlSum("payment_completed", "seats"),
    hogqlSum("payment_completed", "total_paid"),
    hogqlCount("email_signup_completed"),
  ]);

  return {
    pageviews7d,
    eventDetailViews7d,
    checkoutStarted7d,
    paymentsCompleted7d,
    seatsBooked7d,
    revenue7d,
    waitlistSignups7d,
  };
}
