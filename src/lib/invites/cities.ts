import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { supportedCity } from "@/lib/jouw-tafel/logic";

/**
 * Every city this address is invited for, from every source the planner
 * reads (waitlist, tickets, "laat het me weten", quiz, account): the cities
 * the settings page lists and one-click unsubscribe turns off.
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
    `)
    .catch(() => [])) as unknown as Array<{ city: string | null }>;
  const cities = rows.map((r) => (r.city ? supportedCity(r.city) : null)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  return [...new Set(cities as string[])].sort();
}
