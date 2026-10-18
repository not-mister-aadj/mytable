/**
 * Sets email_log.last_event for logged mails without one, from the last event
 * Resend still has for them (delivered, suppressed, bounced, ...). Reads with
 * RESEND_READ_API_KEY, writes to TARGET_DATABASE_URL (or DATABASE_URL).
 *
 *   npx tsx scripts/backfill-email-log-events.ts            # dry run: counts only
 *   npx tsx scripts/backfill-email-log-events.ts --write    # writes
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env.production.local" });

const KEY = process.env.RESEND_READ_API_KEY?.trim();
const DB_URL = process.env.TARGET_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
const WRITE = process.argv.includes("--write");
const KNOWN = new Set(["delivered", "opened", "clicked", "suppressed", "bounced", "complained"]);

async function resend<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }
  throw new Error(`${path}: rate limited`);
}

async function main() {
  if (!KEY) throw new Error("RESEND_READ_API_KEY missing");
  if (!DB_URL) throw new Error("TARGET_DATABASE_URL or DATABASE_URL missing");
  const sql = postgres(DB_URL, { prepare: false, max: 2 });

  const eventById = new Map<string, string>();
  let after: string | undefined;
  for (;;) {
    const page = await resend<{ data: { id: string; last_event?: string }[]; has_more?: boolean }>(
      `/emails?limit=100${after ? `&after=${after}` : ""}`,
    );
    for (const mail of page.data) if (mail.last_event && KNOWN.has(mail.last_event)) eventById.set(mail.id, mail.last_event);
    if (!page.has_more || page.data.length === 0) break;
    after = page.data[page.data.length - 1]!.id;
  }

  const rows = await sql<{ resend_id: string }[]>`
    select distinct resend_id from email_log where resend_id is not null and last_event is null`;
  const found = rows.filter((r) => eventById.has(r.resend_id));
  const counts = new Map<string, number>();
  for (const r of found) counts.set(eventById.get(r.resend_id)!, (counts.get(eventById.get(r.resend_id)!) ?? 0) + 1);
  console.log(`Mails without status: ${rows.length}, found in Resend: ${found.length}`);
  for (const [event, n] of counts) console.log(`  ${n}x ${event}`);

  if (WRITE) {
    for (const r of found) {
      await sql`update email_log set last_event = ${eventById.get(r.resend_id)!} where resend_id = ${r.resend_id} and last_event is null`;
    }
    console.log(`Updated ${found.length} mails`);
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
