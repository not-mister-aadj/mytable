/**
 * Creates MyTable CEO PostHog dashboards via the PostHog REST API.
 *
 * Usage:
 *   npm run posthog:setup-dashboards
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const API_HOST = (
  process.env.POSTHOG_API_HOST ?? "https://eu.posthog.com"
).replace(/\/$/, "");
const PROJECT_ID = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID ?? "195293";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();

const key = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
if (!key) {
  console.error("Missing POSTHOG_PERSONAL_API_KEY");
  process.exit(1);
}

async function phFetch(path, options = {}) {
  const res = await fetch(`${API_HOST}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return data;
}

function trendInsight(name, event, opts = {}) {
  const {
    interval = "day",
    math = "total",
    mathProperty = null,
    breakdown = null,
    days = 90,
  } = opts;
  const series = {
    kind: "EventsNode",
    event,
    math,
    custom_name: name,
  };
  if (mathProperty) series.math_property = mathProperty;

  const source = {
    kind: "TrendsQuery",
    interval,
    series: [series],
    dateRange: { date_from: `-${days}d` },
    filterTestAccounts: true,
  };
  if (breakdown) {
    source.breakdownFilter = {
      breakdown_type: "event",
      breakdown,
    };
  }
  return { name, query: { kind: "InsightVizNode", source } };
}

function funnelInsight(name, steps, days = 30) {
  return {
    name,
    query: {
      kind: "InsightVizNode",
      source: {
        kind: "FunnelsQuery",
        series: steps.map((step) => ({
          kind: "EventsNode",
          event: step.event,
          name: step.label,
          ...(step.properties
            ? {
                properties: step.properties.map((p) => ({
                  key: p.key,
                  value: p.value,
                  operator: p.operator ?? "exact",
                  type: "event",
                })),
              }
            : {}),
        })),
        dateRange: { date_from: `-${days}d` },
        funnelsFilter: {
          funnelOrderType: "ordered",
          funnelWindowInterval: 14,
          funnelWindowIntervalUnit: "day",
        },
        filterTestAccounts: true,
      },
    },
  };
}

const MAIN_FUNNEL_STEPS = [
  {
    label: "Landing",
    event: "page_viewed",
    properties: [{ key: "page_type", value: "home" }],
  },
  { label: "Agenda", event: "agenda_viewed" },
  { label: "Event card click", event: "event_card_clicked" },
  { label: "Event detail", event: "event_detail_viewed" },
  { label: "Booking started", event: "booking_started" },
  { label: "Checkout started", event: "checkout_started" },
  { label: "Payment completed", event: "payment_completed" },
  { label: "Confirmation viewed", event: "booking_confirmation_viewed" },
];

const DASHBOARDS = [
  {
    name: "MyTable Growth Dashboard",
    description: "North star funnel — traffic → intent → checkout → revenue",
    insights: [
      funnelInsight("Main growth funnel", MAIN_FUNNEL_STEPS),
      trendInsight("Paid bookings", "payment_completed", { interval: "week" }),
      trendInsight("Seats booked", "payment_completed", {
        interval: "week",
        math: "sum",
        mathProperty: "seats",
      }),
      trendInsight("Revenue (€)", "payment_completed", {
        interval: "week",
        math: "sum",
        mathProperty: "total_paid",
      }),
      trendInsight("Event detail views", "event_detail_viewed"),
      trendInsight("Checkout started", "checkout_started"),
      trendInsight("Payment failures", "payment_failed"),
    ],
  },
  {
    name: "CEO Overview",
    description: "Weekly north star metrics and breakdowns",
    insights: [
      trendInsight("Paid bookings per week", "payment_completed", {
        interval: "week",
      }),
      trendInsight("Seats per week", "payment_completed", {
        interval: "week",
        math: "sum",
        mathProperty: "seats",
      }),
      trendInsight("Revenue per week", "payment_completed", {
        interval: "week",
        math: "sum",
        mathProperty: "total_paid",
      }),
      trendInsight("Bookings by city", "payment_completed", { breakdown: "city" }),
      trendInsight("Bookings by event type", "payment_completed", {
        breakdown: "event_type",
      }),
      trendInsight("Bookings by device", "payment_completed", {
        breakdown: "device_type",
      }),
      trendInsight("Bookings by UTM source", "payment_completed", {
        breakdown: "utm_source",
      }),
      trendInsight("Agenda views", "agenda_viewed"),
      trendInsight("Email signups", "email_signup_completed"),
    ],
  },
  {
    name: "Funnel Dashboard",
    description: "Conversion funnels",
    insights: [
      funnelInsight("Full funnel", MAIN_FUNNEL_STEPS),
      funnelInsight("Checkout funnel", [
        { label: "Booking started", event: "booking_started" },
        { label: "Checkout", event: "checkout_started" },
        { label: "Paid", event: "payment_completed" },
      ]),
      funnelInsight("Discovery funnel", [
        {
          label: "Home",
          event: "page_viewed",
          properties: [{ key: "page_type", value: "home" }],
        },
        { label: "Agenda", event: "agenda_viewed" },
        { label: "Event detail", event: "event_detail_viewed" },
      ]),
    ],
  },
  {
    name: "Event Performance",
    description: "Which tables convert",
    insights: [
      trendInsight("Detail views by event", "event_detail_viewed", {
        breakdown: "event_name",
      }),
      trendInsight("Booking starts by event", "booking_started", {
        breakdown: "event_name",
      }),
      trendInsight("Paid bookings by event", "payment_completed", {
        breakdown: "event_name",
      }),
      trendInsight("Revenue by event type", "payment_completed", {
        breakdown: "event_type",
        math: "sum",
        mathProperty: "total_paid",
      }),
    ],
  },
  {
    name: "City Performance",
    description: "Demand by city",
    insights: [
      trendInsight("Event detail by city", "event_detail_viewed", {
        breakdown: "city",
      }),
      trendInsight("Bookings by city", "payment_completed", { breakdown: "city" }),
      trendInsight("Revenue by city", "payment_completed", {
        breakdown: "city",
        math: "sum",
        mathProperty: "total_paid",
      }),
      trendInsight("Payment failures by city", "payment_failed", {
        breakdown: "city",
      }),
    ],
  },
  {
    name: "Channel / Marketing",
    description: "Traffic sources that convert",
    insights: [
      trendInsight("Visitors by UTM source", "page_viewed", {
        breakdown: "utm_source",
      }),
      trendInsight("Paid bookings by UTM source", "payment_completed", {
        breakdown: "utm_source",
      }),
      trendInsight("Revenue by UTM campaign", "payment_completed", {
        breakdown: "utm_campaign",
        math: "sum",
        mathProperty: "total_paid",
      }),
    ],
  },
  {
    name: "Checkout / Payment",
    description: "Checkout issues",
    insights: [
      funnelInsight("Checkout to payment", [
        { label: "Checkout started", event: "checkout_started" },
        { label: "Payment completed", event: "payment_completed" },
      ]),
      trendInsight("Payment failures", "payment_failed"),
      trendInsight("Failures by reason", "payment_failed", {
        breakdown: "failure_reason",
      }),
      trendInsight("Avg seats selected", "seats_selected", {
        math: "avg",
        mathProperty: "seats",
      }),
    ],
  },
  {
    name: "Email / Retention",
    description: "Waitlist and repeat bookings",
    insights: [
      trendInsight("Email signups", "email_signup_completed"),
      trendInsight("Signups by city", "email_signup_completed", {
        breakdown: "city",
      }),
      trendInsight("First vs repeat booking", "payment_completed", {
        breakdown: "is_first_booking",
      }),
      trendInsight("Confirmation views", "booking_confirmation_viewed"),
    ],
  },
];

async function createInsight(definition, dashboardId) {
  return phFetch(`/api/projects/${PROJECT_ID}/insights/`, {
    method: "POST",
    body: JSON.stringify({
      name: definition.name,
      query: definition.query,
      dashboards: [dashboardId],
    }),
  });
}

async function createDashboard(def) {
  return phFetch(`/api/projects/${PROJECT_ID}/dashboards/`, {
    method: "POST",
    body: JSON.stringify({
      name: def.name,
      description: def.description,
      tags: ["mytable", "ceo"],
    }),
  });
}

async function enableSharing(dashboardId) {
  try {
    return await phFetch(
      `/api/projects/${PROJECT_ID}/dashboards/${dashboardId}/sharing/`,
      {
        method: "PATCH",
        body: JSON.stringify({ enabled: true }),
      },
    );
  } catch (err) {
    console.warn("Sharing enable failed:", err.message);
    return null;
  }
}

async function main() {
  console.log(`PostHog setup → project ${PROJECT_ID} @ ${API_HOST}\n`);

  let growthDashboardId = null;

  for (const board of DASHBOARDS) {
    console.log(`Creating dashboard: ${board.name}`);
    const dashboard = await createDashboard(board);
    const dashboardId = dashboard.id;
    console.log(`  id=${dashboardId}`);

    if (board.name === "MyTable Growth Dashboard") {
      growthDashboardId = dashboardId;
    }

    for (const insightDef of board.insights) {
      try {
        const insight = await createInsight(insightDef, dashboardId);
        console.log(`  ✓ ${insight.name}`);
      } catch (err) {
        console.warn(`  ✗ ${insightDef.name}: ${err.message}`);
      }
    }
  }

  if (growthDashboardId) {
    const sharing = await enableSharing(growthDashboardId);
    if (sharing?.access_token) {
      const embedUrl = `${API_HOST}/embedded/${sharing.access_token}`;
      console.log(`\nEmbed URL:\n${embedUrl}`);
      console.log(`\nVercel: POSTHOG_DASHBOARD_EMBED_URL=${embedUrl}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
