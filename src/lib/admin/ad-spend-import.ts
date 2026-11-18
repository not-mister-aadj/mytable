import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";

/** Reads what each Meta campaign spent per day and stores it in
 * ad_spend_daily, the source of every ad number on the Board. Needs
 * META_ADS_ACCESS_TOKEN (a token with ads_read) and META_AD_ACCOUNT_ID. */

const API = "https://graph.facebook.com/v23.0";

export function isAdSpendImportConfigured(): boolean {
  return Boolean(process.env.META_ADS_ACCESS_TOKEN?.trim() && process.env.META_AD_ACCOUNT_ID?.trim());
}

type InsightRow = { campaign_id: string; campaign_name: string; spend: string; date_start: string };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Imports the days from `since` up to and including yesterday. Without
 * `since` it continues 3 days before the last stored day (Meta still corrects
 * recent days), or 90 days back on an empty table. */
export async function importAdSpend(since?: string): Promise<{ since: string; until: string; rows: number }> {
  const token = process.env.META_ADS_ACCESS_TOKEN?.trim();
  const account = process.env.META_AD_ACCOUNT_ID?.trim().replace(/^act_/, "");
  if (!token || !account) throw new Error("META_ADS_ACCESS_TOKEN of META_AD_ACCOUNT_ID ontbreekt");

  const db = getDb();
  const until = isoDay(new Date(Date.now() - 86_400_000));
  let from = since;
  if (!from) {
    const [last] = (await db.execute(sql`select max(day)::text as day from ad_spend_daily`)) as unknown as { day: string | null }[];
    const start = last?.day ? new Date(`${last.day}T12:00:00Z`).getTime() - 3 * 86_400_000 : Date.now() - 90 * 86_400_000;
    from = isoDay(new Date(start));
  }
  if (from > until) return { since: from, until, rows: 0 };

  const params = new URLSearchParams({
    level: "campaign",
    fields: "campaign_id,campaign_name,spend",
    time_increment: "1",
    time_range: JSON.stringify({ since: from, until }),
    limit: "500",
    access_token: token,
  });
  let url: string | null = `${API}/act_${account}/insights?${params}`;
  const rows: InsightRow[] = [];
  while (url) {
    const res: Response = await fetch(url);
    const json = (await res.json()) as { data?: InsightRow[]; paging?: { next?: string }; error?: { message: string } };
    if (!res.ok || json.error) throw new Error(`Meta insights: ${json.error?.message ?? res.status}`);
    rows.push(...(json.data ?? []));
    url = json.paging?.next ?? null;
  }

  for (const r of rows) {
    const cents = Math.round(Number(r.spend) * 100);
    await db.execute(sql`
      insert into ad_spend_daily (day, campaign_id, campaign_name, spend_cents, updated_at)
      values (${r.date_start}::date, ${r.campaign_id}, ${r.campaign_name}, ${cents}, now())
      on conflict (day, campaign_id) do update
        set spend_cents = excluded.spend_cents, campaign_name = excluded.campaign_name, updated_at = now()`);
  }
  return { since: from, until, rows: rows.length };
}
