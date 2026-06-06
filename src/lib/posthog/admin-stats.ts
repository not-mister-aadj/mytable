import {
  getPostHogApiHost,
  getPostHogProjectId,
  isPostHogAdminConfigured,
} from "@/lib/posthog/config";

export type FunnelStep = {
  label: string;
  count: number;
};

export type AnalyticsSummary = {
  pageviews7d: number;
  eventDetailViews7d: number;
  checkoutStarted7d: number;
  paymentsCompleted7d: number;
  seatsBooked7d: number;
  revenue7d: number;
  waitlistSignups7d: number;
  funnel7d: FunnelStep[];
};

async function hogqlQuery<T = number>(
  query: string,
  parse: (raw: unknown) => T,
): Promise<T> {
  const projectId = getPostHogProjectId();
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!projectId || !apiKey) return parse(0);

  const response = await fetch(
    `${getPostHogApiHost()}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query },
      }),
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    console.error("[posthog] query failed", response.status);
    return parse(0);
  }

  const data = (await response.json()) as {
    results?: Array<Array<number | string | null>>;
  };
  return parse(data.results?.[0]?.[0]);
}

function parseCount(raw: unknown): number {
  const n =
    typeof raw === "number" ? raw : Number.parseInt(String(raw ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

function parseFloatSum(raw: unknown): number {
  const n =
    typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function eventInList(events: string[]): string {
  return events.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(", ");
}

async function hogqlCountEvents(events: string[], days = 7): Promise<number> {
  return hogqlQuery(
    `SELECT count() AS c FROM events WHERE event IN (${eventInList(events)}) AND timestamp > now() - INTERVAL ${days} DAY`,
    parseCount,
  );
}

async function hogqlCountEvent(
  event: string,
  days = 7,
  propertyFilter?: { key: string; value: string },
): Promise<number> {
  const filter = propertyFilter
    ? ` AND properties.${propertyFilter.key} = '${propertyFilter.value.replace(/'/g, "\\'")}'`
    : "";
  return hogqlQuery(
    `SELECT count() AS c FROM events WHERE event = '${event.replace(/'/g, "\\'")}'${filter} AND timestamp > now() - INTERVAL ${days} DAY`,
    parseCount,
  );
}

async function hogqlSumProperty(
  events: string[],
  property: string,
  days = 7,
  divideBy = 1,
): Promise<number> {
  const sum = await hogqlQuery(
    `SELECT sum(toFloat(properties.${property})) AS s FROM events WHERE event IN (${eventInList(events)}) AND timestamp > now() - INTERVAL ${days} DAY`,
    parseFloatSum,
  );
  return divideBy === 1 ? sum : sum / divideBy;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  if (!isPostHogAdminConfigured()) return null;

  const [
    pageviews7d,
    eventDetailViews7d,
    checkoutStarted7d,
    paymentsCompleted7d,
    seatsFromNew,
    seatsFromLegacy,
    revenueFromNew,
    revenueFromLegacy,
    waitlistSignups7d,
    landing7d,
    agenda7d,
    cardClicks7d,
    bookingStarted7d,
    confirmations7d,
  ] = await Promise.all([
    hogqlCountEvents(["page_viewed", "$pageview"]),
    hogqlCountEvents(["event_detail_viewed", "event_page_viewed"]),
    hogqlCountEvents(["checkout_started"]),
    hogqlCountEvents(["payment_completed", "booking_paid"]),
    hogqlSumProperty(["payment_completed"], "seats"),
    hogqlSumProperty(["booking_paid"], "seats"),
    hogqlSumProperty(["payment_completed"], "total_paid"),
    hogqlSumProperty(["booking_paid"], "amount_cents", 7, 100),
    hogqlCountEvents(["email_signup_completed", "waitlist_signup"]),
    hogqlCountEvent("page_viewed", 7, { key: "page_type", value: "home" }),
    hogqlCountEvent("agenda_viewed"),
    hogqlCountEvent("event_card_clicked"),
    hogqlCountEvent("booking_started"),
    hogqlCountEvent("booking_confirmation_viewed"),
  ]);

  const seatsBooked7d = seatsFromNew + seatsFromLegacy;
  const revenue7d = revenueFromNew + revenueFromLegacy;

  const funnel7d: FunnelStep[] = [
    { label: "Landing", count: landing7d || pageviews7d },
    { label: "Agenda", count: agenda7d },
    { label: "Event card", count: cardClicks7d },
    { label: "Event detail", count: eventDetailViews7d },
    { label: "Booking start", count: bookingStarted7d },
    { label: "Checkout", count: checkoutStarted7d },
    { label: "Betaald", count: paymentsCompleted7d },
    { label: "Bevestiging", count: confirmations7d },
  ];

  return {
    pageviews7d,
    eventDetailViews7d,
    checkoutStarted7d,
    paymentsCompleted7d,
    seatsBooked7d,
    revenue7d,
    waitlistSignups7d,
    funnel7d,
  };
}
