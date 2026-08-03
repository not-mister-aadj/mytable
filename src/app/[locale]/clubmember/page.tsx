import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MemberClubView } from "@/components/member-club/MemberClubView";
import { isDbConfigured } from "@/db/index";
import {
  clubmemberPath,
  isValidLocale,
  loginPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { memberClubEn } from "@/i18n/member-club-en";
import { memberClubNl } from "@/i18n/member-club-nl";
import {
  confirmPendingSignupsForMember,
  enforceOneConfirmedPerDate,
  fulfillClubCheckoutSession,
  getActiveMembershipForUser,
  getMemberSundaySignups,
  refreshMembershipFromStripe,
} from "@/lib/club/memberships";
import { getMemberUser } from "@/lib/member-auth";
import {
  ACTIVE_ONBOARDING_CITIES,
  isSundayTableOnboardingReady,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import {
  getOrCreateReferralCode,
} from "@/lib/referral";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  getSundayTableSeatStatsBatch,
} from "@/lib/sunday-table-capacity";
import {
  amsterdamDateIso,
  getUpcomingSundayWineTables,
} from "@/lib/sunday-wine-table";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    checkout?: string;
    session_id?: string;
    claim?: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = locale === "en" ? memberClubEn : memberClubNl;
  return {
    title: labels.meta.title,
    description: labels.meta.description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: clubmemberPath(locale as Locale),
    },
  };
}

export default async function ClubmemberPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const user = await getMemberUser();
  if (!user?.email) {
    redirect(loginPath(locale as Locale));
  }

  const query = await searchParams;
  const checkoutFlash =
    query.checkout === "success"
      ? "success"
      : query.checkout === "cancel"
        ? "cancel"
        : null;

  if (
    query.checkout === "success" &&
    query.session_id &&
    isDbConfigured() &&
    isStripeConfigured()
  ) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(query.session_id);
      await fulfillClubCheckoutSession(session);
    } catch (err) {
      console.error("[clubmember] fulfill", err);
    }
  }

  const dict = getDictionary(locale as Locale);
  const labels = locale === "en" ? memberClubEn : memberClubNl;
  const { prefs, completed } = readOnboardingFromMetadata(
    user.user_metadata as Record<string, unknown>,
  );
  const onboardingReady = isSundayTableOnboardingReady(completed, prefs);

  let membershipRow =
    isDbConfigured()
      ? await getActiveMembershipForUser({
          userId: user.id,
          email: user.email,
        })
      : null;
  let pendingPlanId: string | null = null;

  if (membershipRow && isDbConfigured() && isStripeConfigured()) {
    const refreshed = await refreshMembershipFromStripe(membershipRow);
    membershipRow = refreshed.membership;
    pendingPlanId = refreshed.pendingPlanId;
  }

  const isMember = Boolean(
    membershipRow &&
      (membershipRow.status === "active" ||
        membershipRow.status === "past_due"),
  );

  if (isMember && membershipRow && isDbConfigured()) {
    await confirmPendingSignupsForMember({
      membershipId: membershipRow.id,
      email: user.email,
      userId: user.id,
    });
    await enforceOneConfirmedPerDate({
      email: user.email,
      userId: user.id,
    });
  }

  const signups =
    isDbConfigured()
      ? await getMemberSundaySignups({
          userId: user.id,
          email: user.email,
        })
      : [];

  const upcoming = getUpcomingSundayWineTables(1);
  const tableDate = upcoming[0] ? amsterdamDateIso(upcoming[0]) : null;
  const seatKeys =
    tableDate != null
      ? ACTIVE_ONBOARDING_CITIES.flatMap((city) => [
          { city, tableDate, tableType: "girls_only" as const },
          { city, tableDate, tableType: "mixed" as const },
        ])
      : [];
  const seatMap = await getSundayTableSeatStatsBatch(seatKeys);
  const seatStats: Record<string, { seatsLeft: number; capacity: number }> = {};
  for (const [key, stats] of seatMap) {
    seatStats[key] = {
      seatsLeft: stats.seatsLeft,
      capacity: stats.capacity,
    };
  }

  let invite: { shareUrl: string } | null = null;
  if (isMember && membershipRow && isDbConfigured()) {
    const referral = await getOrCreateReferralCode({
      email: user.email,
      userId: user.id,
      membershipId: membershipRow.id,
      locale: locale as Locale,
    });
    if (referral) {
      invite = {
        shareUrl: referral.shareUrl,
      };
    }
  }

  return (
    <>
      <Header dict={dict.header} locale={locale as Locale} />
      <MemberClubView
        labels={labels}
        locale={locale as Locale}
        preferredCities={prefs.cities}
        preferredLanguages={prefs.languages}
        gender={prefs.gender}
        preferredTableType={prefs.tableType}
        onboardingReady={onboardingReady}
        isMember={isMember}
        membership={{
          active: isMember,
          planId: membershipRow?.planId ?? null,
          currentPeriodEnd:
            membershipRow?.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: membershipRow?.cancelAtPeriodEnd ?? false,
          pendingPlanId,
          canManageBilling: Boolean(
            membershipRow?.stripeCustomerId &&
              membershipRow?.stripeSubscriptionId,
          ),
        }}
        signups={signups}
        checkoutFlash={checkoutFlash}
        seatStats={seatStats}
        claimSeat={query.claim === "1" || checkoutFlash === "success"}
        invite={invite}
      />
      <Footer dict={dict.footer} locale={locale as Locale} showSeoLinks={false} />
    </>
  );
}
