import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";

/** Admin "Financiën": ad spend next to income, per day, week or month.
 *
 * Income is what guests paid through the app (bookings with payment status
 * "paid", gross, by booking date). Editions sold outside the app are not in
 * the database and so not in these numbers.
 *
 * Ad spend comes from the Meta Marketing API. That needs a token with the
 * ads_read permission in META_ADS_ACCESS_TOKEN; the Conversions API token
 * (META_CAPI_ACCESS_TOKEN) cannot read spend. */

export type FinanceGranularity = "dag" | "week" | "maand";

export const FINANCE_GRANULARITIES: FinanceGranularity[] = ["dag", "week", "maand"];

export type FinancePeriod = {
  key: string;
  label: string;
  /** Longer label for the tooltip and the table, e.g. "week van 21 sep". */
  longLabel: string;
  revenue: number;
  adSpend: number;
  tickets: number;
};

export type AdSpendStatus = "ok" | "not_configured" | "error";

export type FinanceData = {
  granularity: FinanceGranularity;
  periods: FinancePeriod[];
  totals: { revenue: number; adSpend: number; tickets: number };
  adSpendStatus: AdSpendStatus;
  adSpendError?: string;
  since: string;
  until: string;
};

const DEFAULT_AD_ACCOUNT_ID = "act_1008507215426183";
const GRAPH_VERSION = "v21.0";
const TIME_ZONE = "Europe/Amsterdam";

/** How far back each view looks: enough bars to see a trend, few enough to
 * read them. */
const LOOKBACK: Record<FinanceGranularity, number> = {
  dag: 30,
  week: 13,
  maand: 12,
};

function amsterdamToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the week containing this date. */
function mondayOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(iso, -offset);
}

function bucketKey(iso: string, granularity: FinanceGranularity): string {
  if (granularity === "dag") return iso;
  if (granularity === "week") return mondayOf(iso);
  return iso.slice(0, 7);
}

const shortDate = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function labelsFor(key: string, granularity: FinanceGranularity): { label: string; longLabel: string } {
  if (granularity === "maand") {
    const date = new Date(`${key}-01T12:00:00Z`);
    return { label: monthName.format(date).replace(".", ""), longLabel: monthYear.format(date) };
  }
  const date = new Date(`${key}T12:00:00Z`);
  if (granularity === "week") {
    return { label: shortDate.format(date).replace(".", ""), longLabel: `week van ${shortDate.format(date)}` };
  }
  return { label: String(date.getUTCDate()), longLabel: weekday.format(date) };
}

/** Every bucket in the window, oldest first, so empty periods still show. */
function bucketsBetween(since: string, until: string, granularity: FinanceGranularity): string[] {
  const keys: string[] = [];
  let day = since;
  while (day <= until) {
    const key = bucketKey(day, granularity);
    if (keys[keys.length - 1] !== key) keys.push(key);
    day = addDays(day, 1);
  }
  return keys;
}

function windowFor(granularity: FinanceGranularity): { since: string; until: string } {
  const until = amsterdamToday();
  if (granularity === "dag") return { since: addDays(until, -(LOOKBACK.dag - 1)), until };
  if (granularity === "week") return { since: addDays(mondayOf(until), -7 * (LOOKBACK.week - 1)), until };
  const start = new Date(`${until.slice(0, 7)}-01T12:00:00Z`);
  start.setUTCMonth(start.getUTCMonth() - (LOOKBACK.maand - 1));
  return { since: start.toISOString().slice(0, 10), until };
}

async function revenueByDay(
  since: string,
  until: string,
): Promise<Map<string, { revenue: number; tickets: number }>> {
  const byDay = new Map<string, { revenue: number; tickets: number }>();
  if (!isDbConfigured()) return byDay;
  const rows = await getDb().execute<{ day: string; cents: string | number; seats: string | number }>(sql`
    select to_char((created_at at time zone ${TIME_ZONE})::date, 'YYYY-MM-DD') as day,
           sum(amount_cents) as cents,
           sum(seats) as seats
    from bookings
    where payment_status = 'paid'
      and (created_at at time zone ${TIME_ZONE})::date between ${since}::date and ${until}::date
    group by 1
  `);
  for (const row of rows) {
    byDay.set(row.day, { revenue: Number(row.cents) / 100, tickets: Number(row.seats) });
  }
  return byDay;
}

async function adSpendByDay(
  since: string,
  until: string,
): Promise<{ status: AdSpendStatus; byDay: Map<string, number>; error?: string }> {
  const byDay = new Map<string, number>();
  const token = process.env.META_ADS_ACCESS_TOKEN?.trim();
  if (!token) return { status: "not_configured", byDay };
  const account = process.env.META_AD_ACCOUNT_ID?.trim() || DEFAULT_AD_ACCOUNT_ID;

  const params = new URLSearchParams({
    fields: "spend",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
    access_token: token,
  });
  let url: string | null = `https://graph.facebook.com/${GRAPH_VERSION}/${account}/insights?${params}`;
  try {
    // Meta finalises a day's spend over a few hours, so an hour-old number
    // is as good as a live one.
    for (let page = 0; url && page < 10; page++) {
      const response: Response = await fetch(url, { next: { revalidate: 3600 } });
      const json = (await response.json()) as {
        data?: { date_start: string; spend: string }[];
        paging?: { next?: string };
        error?: { message?: string };
      };
      if (!response.ok || json.error) {
        return { status: "error", byDay, error: json.error?.message ?? `HTTP ${response.status}` };
      }
      for (const row of json.data ?? []) {
        byDay.set(row.date_start, (byDay.get(row.date_start) ?? 0) + Number(row.spend));
      }
      url = json.paging?.next ?? null;
    }
    return { status: "ok", byDay };
  } catch (error) {
    return { status: "error", byDay, error: error instanceof Error ? error.message : String(error) };
  }
}

export function parseFinanceGranularity(raw: string | undefined): FinanceGranularity {
  return FINANCE_GRANULARITIES.includes(raw as FinanceGranularity)
    ? (raw as FinanceGranularity)
    : "week";
}

export async function getFinanceData(granularity: FinanceGranularity): Promise<FinanceData> {
  const { since, until } = windowFor(granularity);
  const [revenue, ads] = await Promise.all([revenueByDay(since, until), adSpendByDay(since, until)]);

  const buckets = new Map<string, FinancePeriod>();
  for (const key of bucketsBetween(since, until, granularity)) {
    buckets.set(key, { key, ...labelsFor(key, granularity), revenue: 0, adSpend: 0, tickets: 0 });
  }
  for (const [day, value] of revenue) {
    const bucket = buckets.get(bucketKey(day, granularity));
    if (!bucket) continue;
    bucket.revenue += value.revenue;
    bucket.tickets += value.tickets;
  }
  for (const [day, spend] of ads.byDay) {
    const bucket = buckets.get(bucketKey(day, granularity));
    if (bucket) bucket.adSpend += spend;
  }

  const periods = [...buckets.values()];
  const totals = periods.reduce(
    (sum, p) => ({
      revenue: sum.revenue + p.revenue,
      adSpend: sum.adSpend + p.adSpend,
      tickets: sum.tickets + p.tickets,
    }),
    { revenue: 0, adSpend: 0, tickets: 0 },
  );

  return {
    granularity,
    periods,
    totals,
    adSpendStatus: ads.status,
    adSpendError: ads.error,
    since,
    until,
  };
}
