/**
 * Fills email_log with the mails Resend still has in its history (sent before
 * the log existed). Reads with RESEND_READ_API_KEY, writes to the database in
 * TARGET_DATABASE_URL (or DATABASE_URL). Skips mails already in the log.
 *
 *   npx tsx scripts/import-resend-email-log.ts            # dry run: counts only
 *   npx tsx scripts/import-resend-email-log.ts --write    # writes
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env.production.local" });

const KEY = process.env.RESEND_READ_API_KEY?.trim();
const DB_URL = process.env.TARGET_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
const WRITE = process.argv.includes("--write");

type ListedEmail = { id: string; to: string[] | string; subject: string; created_at: string; from?: string };

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

  const listed: ListedEmail[] = [];
  let after: string | undefined;
  for (;;) {
    const page = await resend<{ data: ListedEmail[]; has_more?: boolean }>(
      `/emails?limit=100${after ? `&after=${after}` : ""}`,
    );
    listed.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    after = page.data[page.data.length - 1]!.id;
  }
  const oldest = listed.map((m) => m.created_at).sort()[0];
  console.log(`Resend history: ${listed.length} mails, oldest ${oldest ?? "none"}`);

  const known = new Set(
    (await sql<{ resend_id: string }[]>`select distinct resend_id from email_log where resend_id is not null`).map(
      (r) => r.resend_id,
    ),
  );
  const todo = listed.filter((m) => !known.has(m.id));
  console.log(`Not yet in email_log: ${todo.length}`);
  if (!WRITE) {
    await sql.end();
    return;
  }

  let written = 0;
  for (const mail of todo) {
    const full = await resend<{ html?: string | null; to: string[] | string; subject: string; created_at: string }>(
      `/emails/${mail.id}`,
    );
    const recipients = (Array.isArray(full.to) ? full.to : [full.to]).map((a) => a.trim()).filter(Boolean);
    for (const to of recipients) {
      await sql`
        insert into email_log (to_email, email_normalized, subject, html, resend_id, source, sent_at)
        values (${to}, ${to.toLowerCase()}, ${full.subject ?? ""}, ${full.html ?? null}, ${mail.id}, 'resend_import', ${full.created_at})
        on conflict (resend_id, email_normalized) do nothing`;
    }
    written++;
    if (written % 25 === 0) console.log(`  ${written}/${todo.length}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`Imported ${written} mails`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
