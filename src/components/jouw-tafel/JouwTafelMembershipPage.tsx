import type { Metadata } from "next";
import { NO_INDEX } from "@/components/jouw-tafel/JouwTafelPage";
import { JouwTafelMembership, type MembershipPageState } from "@/components/jouw-tafel/membership/JouwTafelMembership";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import type { Locale } from "@/i18n/config";
import { getJouwTafelEvents } from "@/lib/jouw-tafel/data";
import { spotsLeft } from "@/lib/jouw-tafel/logic";
import type { JouwTafelSearchParams } from "@/lib/jouw-tafel/request-city";
import { getMemberUser } from "@/lib/member-auth";
import { getMembershipForUser } from "@/lib/membership/data";
import { tryFulfillMembershipSession } from "@/lib/membership/fulfill";
import { isActiveMember } from "@/lib/membership/logic";
import { membershipSnapshot } from "@/lib/membership/data";
import { DEFAULT_MEMBERSHIP_PLAN, getMembershipPlan, isMembershipPlanId } from "@/lib/membership/plans";
import { getMembershipPageCopy } from "@/lib/membership/page-copy";
import { mailSunday } from "@/lib/membership/mail-copy";

/** Same three guests as the landing page and the quiz's review screen. */
const TESTIMONIAL_NAMES = ["Carmen", "Mark", "Sophie"];

export function jouwTafelMembershipMetadata(locale: Locale): Metadata {
  const copy = getMembershipPageCopy(locale);
  return { title: copy.metaTitle, description: copy.metaDescription, robots: NO_INDEX };
}

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value)?.trim() || null;
}

/**
 * The single seat price for the page: the price of the open tables when
 * they all cost the same, else null (the page then says "een losse plek"
 * without a number). Never a price that is not in the database.
 */
function singleSeatCents(events: Awaited<ReturnType<typeof getJouwTafelEvents>>["events"], now: number): number | null {
  const prices = new Set(
    events
      .filter((e) => !e.comingSoon && spotsLeft(e) > 0 && new Date(e.startsAt).getTime() > now)
      .map((e) => e.priceCents),
  );
  return prices.size === 1 ? [...prices][0]! : null;
}

/**
 * /jouw-tafel/lid (EN /en/your-table/membership): the membership page.
 * Open to everyone; "Word lid" goes through sign up when signed out, or
 * straight to Stripe Checkout. Back from Checkout (?welkom=1&session_id=)
 * it shows the welcome state, fulfilling the session as a fallback for a
 * webhook that has not arrived yet.
 */
export async function JouwTafelMembershipPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: JouwTafelSearchParams;
}) {
  const user = await getMemberUser();
  const sessionId = firstParam(searchParams.session_id);
  const welcome = firstParam(searchParams.welkom) === "1";

  let bookedSunday: string | null = null;
  if (user && welcome && sessionId?.startsWith("cs_")) {
    const result = await tryFulfillMembershipSession(sessionId);
    if (result?.ok && result.bookedEventStartsAt) bookedSunday = mailSunday(result.bookedEventStartsAt, locale);
  }

  const [{ events, now }, membership] = await Promise.all([
    getJouwTafelEvents(),
    user ? getMembershipForUser(user.id) : Promise.resolve(null),
  ]);
  const snapshot = membershipSnapshot(membership);
  const active = isActiveMember(snapshot, now);
  const member = active || membership?.status === "past_due";

  let state: MembershipPageState = { kind: "visitor" };
  if (user && member && membership && snapshot) {
    const plan = getMembershipPlan(snapshot.plan);
    const fresh = now - membership.createdAt.getTime() < 24 * 60 * 60 * 1000;
    state = {
      kind: "member",
      plan: snapshot.plan,
      welcome: welcome && fresh,
      bookedSunday,
      subscribe:
        welcome && fresh && membership.stripeSubscriptionId
          ? { subscriptionId: membership.stripeSubscriptionId, value: plan.initialCents / 100 }
          : null,
    };
  } else if (user && welcome) {
    state = { kind: "pending" };
  } else if (user) {
    state = { kind: "signed_in" };
  }

  const { culinary, people } = getBrandLandingTestimonialRows(locale);
  const testimonials = TESTIMONIAL_NAMES.map((name) => [...culinary, ...people].find((t) => t.name === name))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({ name: t.name, city: t.detail.split("·")[0]!.trim(), quote: t.quote }));

  const planParam = firstParam(searchParams.plan);
  return (
    <JouwTafelMembership
      locale={locale}
      state={state}
      initialPlan={
        state.kind === "member" ? state.plan : isMembershipPlanId(planParam) ? planParam : DEFAULT_MEMBERSHIP_PLAN
      }
      singleSeatCents={singleSeatCents(events, now)}
      testimonials={testimonials}
    />
  );
}
