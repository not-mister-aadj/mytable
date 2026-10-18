import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { monthlyTargetCents } from "@/lib/admin/monthly-target";
import { MEMBERSHIP_PLANS } from "@/lib/membership/plans";
import { getFunnelPeople } from "@/lib/posthog/admin-stats";
import type { FunnelStep } from "@/lib/posthog/admin-stats";

/** Everything on the Board page for one month. Money in cents. Revenue has
 * two streams, always shown apart: tickets count by the month the Sunday
 * takes place (like the target in the founder's doc), memberships by the
 * month the invoice was paid. Ad cost per ticket and ROAS count by booking
 * date, the same days the ad money was spent. */

const SUNDAYS = `('${SUNDAY_SOCIAL_TYPE}', '${JOUW_TAFEL_TYPE}')`;
const PAID = `b.payment_status = 'paid' and b.lifecycle_status in ('active', 'transferred')`;
/** Unit economics and cohorts start with the Sunday Socials (August 2026);
 * the June and July tastings were a different product at €49. */
const SINCE = "2026-08-01";

/** future: a month still to come; its bar is what is already sold. */
export type MonthPoint = {
  month: string;
  /** Tickets plus memberships. */
  revenueCents: number;
  ticketCents: number;
  membershipCents: number;
  seats: number;
  targetCents: number | null;
  future: boolean;
};
export type Kpi = { value: number | null; previous: number | null };
export type ChannelRow = { channel: string; bookings: number; seats: number; revenueCents: number; spendCents: number | null };
export type CityRow = {
  city: string;
  held: number;
  seats: number;
  fill: number | null;
  revenueCents: number;
  waitlist: number;
  next: { date: string; sold: number; capacity: number } | null;
};
export type CohortRow = { month: string; guests: number; back30: number; back60: number; back90: number; matured: number };
export type Share = { label: string; count: number };

export type BoardData = {
  month: string;
  previousMonth: string;
  isCurrentMonth: boolean;
  kpis: {
    /** Tickets plus memberships; the target counts against this. */
    revenueCents: Kpi;
    ticketRevenueCents: Kpi;
    membershipRevenueCents: Kpi;
    targetCents: number | null;
    /** Monthly recurring revenue at the end of the month (today for the running month). */
    mrrCents: Kpi;
    members: { active: Kpi; new: number; churned: number };
    seats: Kpi;
    projectedSeats: number | null;
    guests: Kpi;
    repeatRate: Kpi;
    fillRate: Kpi;
    costPerTicketCents: Kpi;
    roas: Kpi;
    waitlistTotal: number;
    waitlistNew: Kpi;
    cities: { planned: number; held: number };
    noShowRate: Kpi;
    answeredRate: Kpi;
  };
  hasAdSpend: boolean;
  months: MonthPoint[];
  unit: {
    avgPriceCents: number;
    costPerTicketCents: number | null;
    contributionCents: number | null;
    ticketsPerGuest: number;
    ltvCents: number;
    cacCents: number | null;
  };
  funnel: { posthog: FunnelStep[] | null; waitlistNew: number; waitlistBooked: number };
  channels: ChannelRow[];
  cities: CityRow[];
  cohorts: CohortRow[];
  guests: { age: Share[]; company: Share[]; language: Share[]; newVsReturning: Share[] };
};

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function currentMonth(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date()).slice(0, 7);
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

export async function getBoardData(month: string): Promise<BoardData> {
  const db = getDb();
  const prev = shiftMonth(month, -1);
  const isCurrentMonth = month === currentMonth();
  const elevenBack = shiftMonth(month, -11);
  const first = elevenBack > SINCE.slice(0, 7) ? elevenBack : SINCE.slice(0, 7);
  const last = isCurrentMonth ? shiftMonth(month, 2) : month;
  const monthCount = (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(last.slice(5)) - Number(first.slice(5)) + 1;
  const monthStart = `${month}-01`;
  const nextStart = `${shiftMonth(month, 1)}-01`;
  const prevStart = `${prev}-01`;
  const q = async <T>(query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as T[];
  const tz = sql.raw(`'Europe/Amsterdam'`);

  // ---- revenue and seats by event month, last 12 months
  const monthRows = await q<{ month: string; revenue: number; seats: number }>(sql`
    select to_char(e.starts_at at time zone ${tz}, 'YYYY-MM') as month,
           coalesce(sum(b.amount_cents), 0)::int as revenue, coalesce(sum(b.seats), 0)::int as seats
    from bookings b join events e on e.id = b.event_id
    where ${sql.raw(PAID)} and e.starts_at >= ${`${first}-01`}::date and e.starts_at < ${`${shiftMonth(last, 1)}-01`}::date
    group by 1`);
  const byMonth = new Map(monthRows.map((r) => [r.month, r]));

  // ---- membership revenue by the month it was paid (table may not exist yet)
  const paymentRows = await q<{ month: string; cents: number }>(sql`
    select to_char(paid_at at time zone ${tz}, 'YYYY-MM') as month, sum(amount_cents)::int as cents
    from membership_payments group by 1`).catch(() => [] as { month: string; cents: number }[]);
  const membershipByMonth = new Map(paymentRows.map((r) => [r.month, r.cents]));

  const months: MonthPoint[] = Array.from({ length: monthCount }, (_, i) => {
    const key = shiftMonth(first, i);
    const r = byMonth.get(key);
    const ticketCents = r?.revenue ?? 0;
    const membershipCents = membershipByMonth.get(key) ?? 0;
    return {
      month: key,
      revenueCents: ticketCents + membershipCents,
      ticketCents,
      membershipCents,
      seats: r?.seats ?? 0,
      targetCents: monthlyTargetCents(key),
      future: key > month,
    };
  });
  const cur = byMonth.get(month);
  const before = byMonth.get(prev);
  const curMembership = membershipByMonth.get(month) ?? 0;
  const prevMembership = membershipByMonth.get(prev) ?? 0;

  // ---- members and MRR. A membership counts from created_at until it is
  // canceled (updated_at of a canceled row); MRR is each plan's monthly price.
  const mrrCase = sql.raw(
    `case plan ${Object.values(MEMBERSHIP_PLANS)
      .map((p) => `when '${p.id}' then ${p.monthlyCents}`)
      .join(" ")} else 0 end`,
  );
  const membersAt = async (at: string) => {
    const [row] = await q<{ active: number; mrr: number }>(sql`
      select count(*)::int as active, coalesce(sum(${mrrCase}), 0)::int as mrr
      from memberships
      where created_at < ${at}::timestamptz and (status <> 'canceled' or updated_at >= ${at}::timestamptz)`);
    return row ?? { active: 0, mrr: 0 };
  };
  const membersEnd = await membersAt(isCurrentMonth ? new Date().toISOString() : `${nextStart} 00:00 Europe/Amsterdam`);
  const membersStart = await membersAt(`${monthStart} 00:00 Europe/Amsterdam`);
  const [memberMoves] = await q<{ new_members: number; churned: number }>(sql`
    select count(*) filter (where created_at >= ${`${monthStart} 00:00 Europe/Amsterdam`}::timestamptz and created_at < ${`${nextStart} 00:00 Europe/Amsterdam`}::timestamptz)::int as new_members,
           count(*) filter (where status = 'canceled' and updated_at >= ${`${monthStart} 00:00 Europe/Amsterdam`}::timestamptz and updated_at < ${`${nextStart} 00:00 Europe/Amsterdam`}::timestamptz)::int as churned
    from memberships`);

  // ---- per-month facts for this month and the one before
  const facts = async (start: string, end: string) => {
    const [row] = await q<{
      guests: number;
      returning: number;
      held_sold: number;
      held_capacity: number;
      held_seats: number;
      no_shows: number;
      bookings: number;
      answered: number;
      planned_cities: number;
      held_cities: number;
      open_capacity: number;
    }>(sql`
      with m as (
        select b.*, e.starts_at, e.city, e.capacity
        from bookings b join events e on e.id = b.event_id
        where ${sql.raw(PAID)} and e.starts_at >= ${start}::date and e.starts_at < ${end}::date
      )
      select
        (select count(distinct lower(email)) from m)::int as guests,
        (select count(distinct lower(m.email)) from m where exists (
          select 1 from bookings p join events pe on pe.id = p.event_id
          where lower(p.email) = lower(m.email) and p.payment_status = 'paid' and pe.starts_at < m.starts_at and p.event_id <> m.event_id))::int as returning,
        (select coalesce(sum(spots_sold), 0) from events where workflow_status = 'published' and experience_type in ${sql.raw(SUNDAYS)}
          and starts_at >= ${start}::date and starts_at < ${end}::date and starts_at < now())::int as held_sold,
        (select coalesce(sum(capacity), 0) from events where workflow_status = 'published' and experience_type in ${sql.raw(SUNDAYS)}
          and starts_at >= ${start}::date and starts_at < ${end}::date and starts_at < now())::int as held_capacity,
        (select coalesce(sum(seats), 0) from m where starts_at < now())::int as held_seats,
        (select coalesce(sum(seats), 0) from m where no_show_at is not null)::int as no_shows,
        (select count(*) from m where amount_cents > 0 or membership_id is not null)::int as bookings,
        (select count(*) from m where coalesce(nullif(trim(intro_ask_me_about), ''), nullif(trim(intro_favorite_spot), ''), nullif(trim(intro_into_now), '')) is not null)::int as answered,
        (select count(distinct city) from events where workflow_status = 'published' and experience_type in ${sql.raw(SUNDAYS)}
          and starts_at >= ${start}::date and starts_at < ${end}::date)::int as planned_cities,
        (select count(distinct city) from events where workflow_status = 'published' and experience_type in ${sql.raw(SUNDAYS)}
          and starts_at >= ${start}::date and starts_at < ${end}::date and starts_at < now())::int as held_cities,
        (select coalesce(sum(greatest(capacity - spots_sold, 0)), 0) from events where workflow_status = 'published' and experience_type in ${sql.raw(SUNDAYS)}
          and starts_at >= greatest(now(), ${start}::date) and starts_at < ${end}::date)::int as open_capacity`);
    return row!;
  };
  const [f, fp] = await Promise.all([facts(monthStart, nextStart), facts(prevStart, monthStart)]);

  // ---- repeat rate: all guests up to the end of the month, 2+ different Sundays
  const repeat = async (end: string) => {
    const [r] = await q<{ total: number; repeaters: number }>(sql`
      select count(*)::int as total, count(*) filter (where n >= 2)::int as repeaters
      from (select lower(b.email), count(distinct b.event_id) as n
            from bookings b join events e on e.id = b.event_id
            where ${sql.raw(PAID)} and e.starts_at < ${end}::date group by 1) t`);
    return r ? ratio(r.repeaters, r.total) : null;
  };

  // ---- waitlist
  const [wl] = await q<{ total: number; new_month: number; new_prev: number }>(sql`
    select count(distinct lower(email))::int as total,
           count(distinct lower(email)) filter (where created_at >= ${monthStart}::date and created_at < ${nextStart}::date)::int as new_month,
           count(distinct lower(email)) filter (where created_at >= ${prevStart}::date and created_at < least(${monthStart}::date,
             ${prevStart}::date + (now() - ${monthStart}::date)))::int as new_prev
    from waitlist_signups where created_at < ${nextStart}::date`);

  // ---- ad spend (by spend date) vs tickets booked (by booking date)
  const spendRows = await q<{ month: string; spend: number }>(sql`
    select to_char(day, 'YYYY-MM') as month, sum(spend_cents)::int as spend from ad_spend_daily group by 1`).catch(() => []);
  const spendByMonth = new Map(spendRows.map((r) => [r.month, r.spend]));
  const hasAdSpend = spendRows.length > 0;
  const booked = await q<{ month: string; seats: number; revenue: number }>(sql`
    select to_char(b.created_at at time zone ${tz}, 'YYYY-MM') as month, sum(b.seats)::int as seats, sum(b.amount_cents)::int as revenue
    from bookings b where b.payment_status = 'paid' and b.amount_cents > 0 group by 1`);
  const bookedByMonth = new Map(booked.map((r) => [r.month, r]));
  const cpt = (m: string) => {
    const s = spendByMonth.get(m);
    const t = bookedByMonth.get(m)?.seats ?? 0;
    return hasAdSpend && s !== undefined && t > 0 ? s / t : null;
  };
  const roas = (m: string) => {
    const s = spendByMonth.get(m);
    return hasAdSpend && s ? (bookedByMonth.get(m)?.revenue ?? 0) / s : null;
  };

  // ---- unit economics, all time
  const [u] = await q<{ seats: number; revenue: number; guests: number }>(sql`
    select coalesce(sum(b.seats), 0)::int as seats, coalesce(sum(b.amount_cents), 0)::int as revenue, count(distinct lower(b.email))::int as guests
    from bookings b where b.payment_status = 'paid' and b.amount_cents > 0 and b.created_at >= ${SINCE}::date`);
  const totalSpend = spendRows.reduce((sum, r) => sum + r.spend, 0);
  const firstSpendMonth = spendRows.map((r) => r.month).sort()[0];
  const [acquired] = firstSpendMonth
    ? await q<{ n: number }>(sql`
        select count(*)::int as n from (
          select lower(email), min(created_at) as first_at from bookings where payment_status = 'paid' and amount_cents > 0 group by 1
        ) t where first_at >= ${`${firstSpendMonth}-01`}::date`)
    : [{ n: 0 }];
  const avgPrice = u && u.seats > 0 ? u.revenue / u.seats : 1000;
  const ticketsPerGuest = u && u.guests > 0 ? u.seats / u.guests : 0;
  const curCpt = cpt(month);

  // ---- funnel: PostHog (30 days) and waitlist -> first booking
  const until = new Date();
  const since = new Date(until.getTime() - 30 * 86_400_000);
  const [posthog, [wf]] = await Promise.all([
    getFunnelPeople(since.toISOString().slice(0, 19).replace("T", " "), until.toISOString().slice(0, 19).replace("T", " ")).catch(() => null),
    q<{ signups: number; booked: number }>(sql`
      select count(distinct lower(w.email))::int as signups,
             count(distinct lower(w.email)) filter (where exists (
               select 1 from bookings b where lower(b.email) = lower(w.email) and b.payment_status = 'paid' and b.amount_cents > 0 and b.created_at >= w.created_at))::int as booked
      from waitlist_signups w where w.created_at > now() - interval '30 days'`),
  ]);

  // ---- channels this month (by booking date), from the stored attribution
  const channelRows = await q<{ channel: string; campaign: string | null; bookings: number; seats: number; revenue: number }>(sql`
    with t as (
      select b.id, b.seats, b.amount_cents,
        coalesce(u.payload->'attribution'->'last', c.attribution->'last') as last,
        u.payload->>'utm_campaign' as utm_campaign, u.payload->>'utm_source' as utm_source, u.payload->>'utm_medium' as utm_medium
      from bookings b
      left join customers c on lower(c.email) = lower(b.email)
      left join lateral (select payload from booking_events be where be.booking_id = b.id and be.type = 'checkout_utm' limit 1) u on true
      where b.payment_status = 'paid' and b.amount_cents > 0
        and b.created_at >= ${monthStart}::date and b.created_at < ${nextStart}::date
    )
    select
      case
        when coalesce(utm_medium, last->>'medium') = 'paid' or coalesce(utm_source, last->>'source') in ('fb', 'ig', 'facebook', 'instagram') then 'meta'
        when coalesce(utm_medium, last->>'medium') = 'email' then 'E-mail'
        when last->>'referrer' is not null and last->>'referrer' not ilike '%accounts.google%' then 'Organisch'
        else 'Direct of onbekend'
      end as channel,
      coalesce(utm_campaign, last->>'campaign') as campaign,
      count(*)::int as bookings, sum(seats)::int as seats, sum(amount_cents)::int as revenue
    from t group by 1, 2`);
  const campaignSpend = await q<{ campaign_id: string; campaign_name: string; spend: number }>(sql`
    select campaign_id, campaign_name, sum(spend_cents)::int as spend from ad_spend_daily
    where day >= ${monthStart}::date and day < ${nextStart}::date group by 1, 2`).catch(() => []);
  const spendFor = (campaign: string | null) => {
    if (!campaign) return undefined;
    const hit = campaignSpend.find((c) => c.campaign_id === campaign || c.campaign_name === campaign);
    return hit ? { name: hit.campaign_name, spend: hit.spend } : undefined;
  };
  const channelMap = new Map<string, ChannelRow>();
  for (const r of channelRows) {
    const meta = r.channel === "meta";
    const hit = meta ? spendFor(r.campaign) : undefined;
    const label = meta ? `Meta: ${hit?.name ?? r.campaign ?? "onbekende campagne"}` : r.channel;
    const row = channelMap.get(label) ?? { channel: label, bookings: 0, seats: 0, revenueCents: 0, spendCents: meta ? (hit?.spend ?? null) : null };
    row.bookings += r.bookings;
    row.seats += r.seats;
    row.revenueCents += r.revenue;
    channelMap.set(label, row);
  }
  // Campaigns that spent but sold nothing this month still belong on the list.
  for (const c of campaignSpend) {
    const label = `Meta: ${c.campaign_name}`;
    if (!channelMap.has(label) && c.spend > 0) channelMap.set(label, { channel: label, bookings: 0, seats: 0, revenueCents: 0, spendCents: c.spend });
  }
  const channels = [...channelMap.values()].sort((a, b) => b.seats - a.seats || (b.spendCents ?? 0) - (a.spendCents ?? 0));

  // ---- cities
  const cityRows = await q<{
    city: string;
    held: number;
    held_sold: number;
    held_capacity: number;
    seats: number;
    revenue: number;
    waitlist: number;
    next_at: Date | null;
    next_sold: number | null;
    next_capacity: number | null;
  }>(sql`
    with cities as (select distinct city from events where workflow_status = 'published' and experience_type in ${sql.raw(SUNDAYS)})
    select ci.city,
      (select count(*) from events e where e.city = ci.city and e.workflow_status = 'published' and e.experience_type in ${sql.raw(SUNDAYS)} and e.starts_at < now())::int as held,
      (select coalesce(sum(spots_sold), 0) from events e where e.city = ci.city and e.workflow_status = 'published' and e.experience_type in ${sql.raw(SUNDAYS)} and e.starts_at < now())::int as held_sold,
      (select coalesce(sum(capacity), 0) from events e where e.city = ci.city and e.workflow_status = 'published' and e.experience_type in ${sql.raw(SUNDAYS)} and e.starts_at < now())::int as held_capacity,
      (select coalesce(sum(b.seats), 0) from bookings b join events e on e.id = b.event_id where e.city = ci.city and e.experience_type in ${sql.raw(SUNDAYS)} and ${sql.raw(PAID)})::int as seats,
      (select coalesce(sum(b.amount_cents), 0) from bookings b join events e on e.id = b.event_id where e.city = ci.city and e.experience_type in ${sql.raw(SUNDAYS)} and ${sql.raw(PAID)})::int as revenue,
      (select count(distinct lower(w.email)) from waitlist_signups w where lower(w.city) = lower(ci.city))::int as waitlist,
      n.starts_at as next_at, n.spots_sold as next_sold, n.capacity as next_capacity
    from cities ci
    left join lateral (select starts_at, spots_sold, capacity from events e where e.city = ci.city and e.workflow_status = 'published'
      and e.experience_type in ${sql.raw(SUNDAYS)} and e.starts_at > now() order by e.starts_at limit 1) n on true
    order by seats desc`);
  const cities: CityRow[] = cityRows.map((r) => ({
    city: r.city,
    held: r.held,
    seats: r.seats,
    fill: ratio(r.held_sold, r.held_capacity),
    revenueCents: r.revenue,
    waitlist: r.waitlist,
    next: r.next_at ? { date: new Date(r.next_at).toISOString(), sold: r.next_sold ?? 0, capacity: r.next_capacity ?? 0 } : null,
  }));

  // ---- cohorts: first paid booking month, back within 30/60/90 days
  const cohorts = (
    await q<{ month: string; guests: number; back30: number; back60: number; back90: number; matured: number }>(sql`
      with firsts as (
        select lower(email) as email, min(created_at) as first_at from bookings
        where payment_status = 'paid' and amount_cents > 0 and created_at >= ${SINCE}::date group by 1
      ), nexts as (
        select f.email, f.first_at,
          (select min(b.created_at) from bookings b where lower(b.email) = f.email and b.payment_status = 'paid' and b.created_at > f.first_at + interval '1 hour') as again_at
        from firsts f
      )
      select to_char(first_at at time zone ${tz}, 'YYYY-MM') as month, count(*)::int as guests,
        count(*) filter (where again_at <= first_at + interval '30 days')::int as back30,
        count(*) filter (where again_at <= first_at + interval '60 days')::int as back60,
        count(*) filter (where again_at <= first_at + interval '90 days')::int as back90,
        max(extract(day from now() - first_at))::int as matured
      from nexts group by 1 order by 1 desc limit 6`)
  ).reverse();

  // ---- who our guest is (last 90 days)
  const [g] = await q<{
    a_lt30: number;
    a_30s: number;
    a_40s: number;
    a_50p: number;
    a_unknown: number;
    solo: number;
    plus: number;
    l_nl: number;
    l_en: number;
    l_both: number;
    l_unknown: number;
    new_guests: number;
    returning: number;
  }>(sql`
    with r as (
      select b.*, e.starts_at,
        coalesce(date_part('year', age(e.starts_at, b.birth_date)),
          case (select w.preferences->'ageRange'->>0 from waitlist_signups w where lower(w.email) = lower(b.email) order by w.created_at desc limit 1)
            when '25_34' then 30 when '35_44' then 40 when '45_plus' then 50 when '18_24' then 22 else null end) as age_years,
        exists (select 1 from bookings p join events pe on pe.id = p.event_id where lower(p.email) = lower(b.email)
          and p.payment_status = 'paid' and pe.starts_at < e.starts_at and p.event_id <> b.event_id) as returning_guest
      from bookings b join events e on e.id = b.event_id
      where ${sql.raw(PAID)} and b.amount_cents > 0 and b.created_at > now() - interval '90 days'
    )
    select
      count(*) filter (where age_years < 30)::int as a_lt30,
      count(*) filter (where age_years >= 30 and age_years < 40)::int as a_30s,
      count(*) filter (where age_years >= 40 and age_years < 50)::int as a_40s,
      count(*) filter (where age_years >= 50)::int as a_50p,
      count(*) filter (where age_years is null)::int as a_unknown,
      count(*) filter (where seats = 1)::int as solo,
      count(*) filter (where seats >= 2)::int as plus,
      count(*) filter (where table_language_preference = 'prefer_dutch')::int as l_nl,
      count(*) filter (where table_language_preference = 'prefer_english')::int as l_en,
      count(*) filter (where table_language_preference = 'both_fine')::int as l_both,
      count(*) filter (where table_language_preference is null)::int as l_unknown,
      count(*) filter (where not returning_guest)::int as new_guests,
      count(*) filter (where returning_guest)::int as returning
    from r`);

  const isCurrent = isCurrentMonth;
  const fillNow = ratio(f.held_sold, f.held_capacity);
  const fillPrev = ratio(fp.held_sold, fp.held_capacity);
  // Expected seats for the month: what's sold, plus the open seats filled
  // at the average fill of every Sunday held so far.
  const heldSold = cityRows.reduce((sum, r) => sum + r.held_sold, 0);
  const heldCapacity = cityRows.reduce((sum, r) => sum + r.held_capacity, 0);
  const overallFill = ratio(heldSold, heldCapacity);
  const projected = isCurrent && overallFill !== null ? Math.round((cur?.seats ?? 0) + f.open_capacity * overallFill) : null;

  return {
    month,
    previousMonth: prev,
    isCurrentMonth: isCurrent,
    kpis: {
      revenueCents: { value: (cur?.revenue ?? 0) + curMembership, previous: (before?.revenue ?? 0) + prevMembership },
      ticketRevenueCents: { value: cur?.revenue ?? 0, previous: before?.revenue ?? 0 },
      membershipRevenueCents: { value: curMembership, previous: prevMembership },
      targetCents: monthlyTargetCents(month),
      mrrCents: { value: membersEnd.mrr, previous: membersStart.mrr },
      members: {
        active: { value: membersEnd.active, previous: membersStart.active },
        new: memberMoves?.new_members ?? 0,
        churned: memberMoves?.churned ?? 0,
      },
      seats: { value: cur?.seats ?? 0, previous: before?.seats ?? 0 },
      projectedSeats: projected,
      guests: { value: f.guests, previous: fp.guests },
      repeatRate: { value: await repeat(nextStart), previous: await repeat(monthStart) },
      fillRate: { value: fillNow, previous: fillPrev },
      costPerTicketCents: { value: curCpt, previous: cpt(prev) },
      roas: { value: roas(month), previous: roas(prev) },
      waitlistTotal: wl?.total ?? 0,
      waitlistNew: { value: wl?.new_month ?? 0, previous: wl?.new_prev ?? 0 },
      cities: { planned: f.planned_cities, held: f.held_cities },
      noShowRate: { value: ratio(f.no_shows, f.held_seats), previous: ratio(fp.no_shows, fp.held_seats) },
      answeredRate: { value: ratio(f.answered, f.bookings), previous: ratio(fp.answered, fp.bookings) },
    },
    hasAdSpend,
    months,
    unit: {
      avgPriceCents: Math.round(avgPrice),
      costPerTicketCents: curCpt,
      contributionCents: curCpt !== null ? Math.round(avgPrice - curCpt) : null,
      ticketsPerGuest,
      ltvCents: Math.round(ticketsPerGuest * avgPrice),
      cacCents: hasAdSpend && acquired && acquired.n > 0 ? Math.round(totalSpend / acquired.n) : null,
    },
    funnel: { posthog, waitlistNew: wf?.signups ?? 0, waitlistBooked: wf?.booked ?? 0 },
    channels,
    cities,
    cohorts,
    guests: {
      age: [
        { label: "Onder 30", count: g?.a_lt30 ?? 0 },
        { label: "30-39", count: g?.a_30s ?? 0 },
        { label: "40-49", count: g?.a_40s ?? 0 },
        { label: "50+", count: g?.a_50p ?? 0 },
        { label: "Onbekend", count: g?.a_unknown ?? 0 },
      ],
      company: [
        { label: "Alleen", count: g?.solo ?? 0 },
        { label: "Met een +1", count: g?.plus ?? 0 },
      ],
      language: [
        { label: "Liever Nederlands", count: g?.l_nl ?? 0 },
        { label: "Liever Engels", count: g?.l_en ?? 0 },
        { label: "Allebei prima", count: g?.l_both ?? 0 },
        { label: "Niet gevraagd", count: g?.l_unknown ?? 0 },
      ],
      newVsReturning: [
        { label: "Nieuw", count: g?.new_guests ?? 0 },
        { label: "Terugkerend", count: g?.returning ?? 0 },
      ],
    },
  };
}
