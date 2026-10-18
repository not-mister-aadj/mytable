/**
 * Fills email_log.from_email for logged mails that have a Resend id, from the
 * sender Resend still has in its history. Reads with RESEND_READ_API_KEY,
 * writes to TARGET_DATABASE_URL (or DATABASE_URL).
 *
 *   npx tsx scripts/backfill-email-log-from.ts            # dry run: counts only
 *   npx tsx scripts/backfill-email-log-from.ts --write    # writes
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env.production.local" });

const KEY = process.env.RESEND_READ_API_KEY?.trim();
const DB_URL = process.env.TARGET_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
const WRITE = process.argv.includes("--write");

type ListedEmail = { id: string; from?: string };

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

  const fromById = new Map<string, string>();
  let after: string | undefined;
  for (;;) {
    const page = await resend<{ data: ListedEmail[]; has_more?: boolean }>(
      `/emails?limit=100${after ? `&after=${after}` : ""}`,
    );
    for (const mail of page.data) if (mail.from) fromById.set(mail.id, mail.from);
    if (!page.has_more || page.data.length === 0) break;
    after = page.data[page.data.length - 1]!.id;
  }

  const rows = await sql<{ resend_id: string }[]>`
    select distinct resend_id from email_log where resend_id is not null and from_email is null`;
  const found = rows.filter((r) => fromById.has(r.resend_id));
  const senders = new Map<string, number>();
  for (const r of found) senders.set(fromById.get(r.resend_id)!, (senders.get(fromById.get(r.resend_id)!) ?? 0) + 1);
  console.log(`Mails without sender: ${rows.length}, found in Resend: ${found.length}`);
  for (const [from, n] of senders) console.log(`  ${n}x ${from}`);

  if (WRITE) {
    for (const r of found) {
      await sql`update email_log set from_email = ${fromById.get(r.resend_id)!} where resend_id = ${r.resend_id} and from_email is null`;
    }
    console.log(`Updated ${found.length} mails`);
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
