import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { ensureAuthUserForEmail, type SilentSource } from "@/lib/auth/ensure-auth-user-for-email";
import { isTestAddress } from "@/lib/invites/logic";

type Missing = { email: string; source: SilentSource | "guest_checkout"; city: string | null; locale: string | null; name: string | null };

/** Everyone on the list (waitlist, tickets, "laat het me weten", quiz) without an account, oldest signup first. */
async function missingAccounts(limit: number): Promise<Missing[]> {
  const rows = (await getDb().execute(sql`
    select distinct on (email) email, source, city, locale, name from (
      select lower(email) as email, 'waitlist' as source, city, locale, coalesce(name, preferences->>'name') as name, created_at
      from waitlist_signups
      union all
      select lower(b.email), 'guest_checkout', e.city, b.locale, b.customer_name, b.created_at
      from bookings b join events e on e.id = b.event_id where b.payment_status = 'paid'
      union all
      select lower(n.email), 'notify', e.city, n.locale, null, n.created_at
      from event_notify_signups n join events e on e.id = n.event_id
      union all
      select lower(email), 'quiz', state->'answers'->>'city', locale, null, created_at
      from jouw_tafel_guests where email is not null
    ) s
    where not exists (select 1 from auth.users u where lower(u.email) = s.email)
    order by email, created_at
    limit ${limit}
  `)) as unknown as Missing[];
  return rows.filter((r) => !isTestAddress(r.email));
}

/**
 * Makes the background account for everyone on the list who has none yet
 * (people from before signups made one, or a signup where it failed).
 * Confirmed right away, no mail. With dryRun it only counts.
 */
export async function ensureAccountsForEveryone(options: { dryRun?: boolean; limit?: number } = {}): Promise<{ missing: number; created: number }> {
  const missing = await missingAccounts(options.limit ?? 400);
  if (options.dryRun) return { missing: missing.length, created: 0 };
  let created = 0;
  for (const m of missing) {
    const result = await ensureAuthUserForEmail(m).catch(() => ({ created: false }));
    if (result.created) created++;
  }
  return { missing: missing.length, created };
}
