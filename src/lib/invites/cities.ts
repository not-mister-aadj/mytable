import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { supportedCity } from "@/lib/jouw-tafel/logic";

/**
 * Every city this address is invited for, from every source the planner
 * reads (waitlist, tickets, "laat het me weten", quiz, account) plus the
 * ones they added on the settings page: the cities it lists as followed and
 * one-click unsubscribe turns off.
 */
export async function citiesForEmail(email: string): Promise<string[]> {
  const key = email.trim().toLowerCase();
  const rows = (await getDb()
    .execute(sql`
      select city from waitlist_signups where lower(email) = ${key}
      union select e.city from bookings b join events e on e.id = b.event_id where lower(b.email) = ${key} and b.payment_status = 'paid'
      union select e.city from event_notify_signups n join events e on e.id = n.event_id where lower(n.email) = ${key}
      union select state->'answers'->>'city' from jouw_tafel_guests where lower(email) = ${key}
      union select coalesce(raw_user_meta_data->>'city', raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'city')
        from auth.users where lower(email) = ${key}
      union select c.key from invite_subscribers s, jsonb_each_text(s.city_prefs) c
        where s.email_normalized = ${key} and c.value <> 'none'
    `)
    .catch(() => [])) as unknown as Array<{ city: string | null }>;
  const cities = rows.map((r) => (r.city ? supportedCity(r.city) : null)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  return [...new Set(cities as string[])].sort();
}

/** Their first name from any signup (customer, waitlist, ticket, quiz, account), or null. */
export async function firstNameForEmail(email: string): Promise<string | null> {
  const key = email.trim().toLowerCase();
  const rows = (await getDb()
    .execute(sql`
      select first_name as name, 1 as rank from customers where email_normalized = ${key} and first_name is not null
      union all select coalesce(name, preferences->>'name'), 2 from waitlist_signups where lower(email) = ${key}
      union all select customer_name, 3 from bookings where lower(email) = ${key} and payment_status = 'paid'
      union all select state->'answers'->>'name', 4 from jouw_tafel_guests where lower(email) = ${key}
      union all select coalesce(raw_user_meta_data->>'name', raw_user_meta_data->'jouw_tafel_quiz'->'answers'->>'name'), 5
        from auth.users where lower(email) = ${key}
    `)
    .catch(() => [])) as unknown as Array<{ name: string | null; rank: number }>;
  const best = rows.filter((r) => r.name?.trim()).sort((a, b) => a.rank - b.rank)[0];
  return best ? best.name!.trim().split(/\s+/)[0]! : null;
}
