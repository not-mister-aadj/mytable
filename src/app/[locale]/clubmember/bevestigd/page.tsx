import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MetaClubConfirmationPurchase } from "@/components/member-club/MetaClubConfirmationPurchase";
import { isDbConfigured } from "@/db/index";
import {
  accountPath,
  clubmemberPath,
  isValidLocale,
  loginPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { memberClubEn } from "@/i18n/member-club-en";
import { memberClubNl } from "@/i18n/member-club-nl";
import { getClubConfirmationPurchase } from "@/lib/analytics/clubConfirmationPurchase";
import { sendMetaCapiClubPurchaseForSession } from "@/lib/analytics/metaCapi";
import {
  confirmPendingSignupsForMember,
  fulfillClubCheckoutSession,
  getActiveMembershipForUser,
  getMemberSundaySignups,
} from "@/lib/club/memberships";
import { getMemberUser } from "@/lib/member-auth";
import {
  needsPostPurchaseEnrichment,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { sundayTableGoogleCalendarUrl } from "@/lib/sunday-table-calendar";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { notFound, redirect } from "next/navigation";
import type { ClubConfirmationPurchaseData } from "@/lib/analytics/clubConfirmationPurchase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Clubmember bevestigd | MyTable",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ClubmemberConfirmedPage({
  params,
  searchParams,
}: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const user = await getMemberUser();
  if (!user?.email) {
    redirect(loginPath(locale));
  }

  const { session_id: sessionId } = await searchParams;
  const labels = locale === "en" ? memberClubEn : memberClubNl;
  const dict = getDictionary(locale);

  let confirmed = false;
  let purchase: ClubConfirmationPurchaseData | null = null;
  let calendarUrl: string | null = null;

  if (sessionId && isDbConfigured() && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      await fulfillClubCheckoutSession(session);
    } catch (err) {
      console.error("[clubmember confirmed] fulfill", err);
    }

    purchase = await getClubConfirmationPurchase(sessionId, locale);
    if (purchase) {
      void sendMetaCapiClubPurchaseForSession(
        sessionId,
        await headers(),
      ).catch((err) => {
        console.error("[clubmember confirmed] meta capi", err);
      });
    }
  }

  if (isDbConfigured()) {
    const membership = await getActiveMembershipForUser({
      userId: user.id,
      email: user.email,
    });
    confirmed = Boolean(
      membership &&
        (membership.status === "active" || membership.status === "past_due"),
    );
    if (confirmed && membership) {
      await confirmPendingSignupsForMember({
        membershipId: membership.id,
        email: user.email,
        userId: user.id,
      });
    }

    const signups = await getMemberSundaySignups({
      userId: user.id,
      email: user.email,
    });
    const nextConfirmed = signups.find((s) => s.status === "confirmed");
    if (nextConfirmed) {
      calendarUrl = sundayTableGoogleCalendarUrl({
        city: nextConfirmed.city,
        tableDate: nextConfirmed.tableDate,
        tableType: nextConfirmed.tableType,
        locale,
        signupId: nextConfirmed.id,
      });
    }
  }

  const { prefs } = readOnboardingFromMetadata(
    user.user_metadata as Record<string, unknown>,
  );
  if (confirmed && needsPostPurchaseEnrichment(prefs)) {
    redirect(`${accountPath(locale)}?enrich=1`);
  }

  const title = confirmed
    ? labels.checkoutOutcome.confirmedTitle
    : labels.checkoutOutcome.pendingTitle;
  const body = confirmed
    ? labels.checkoutOutcome.confirmedBody
    : labels.checkoutOutcome.pendingBody;

  return (
    <>
      <MetaClubConfirmationPurchase initial={purchase} locale={locale} />
      <Header dict={dict.header} locale={locale} />
      <main className="min-h-[70svh] bg-gradient-to-b from-beige via-cream to-cream">
        <div className="mx-auto flex max-w-lg flex-col px-5 pb-16 pt-28 sm:px-6 sm:pt-32">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {labels.membership.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-wine">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wine/60">{body}</p>
          <div className="mt-10 flex flex-col gap-3">
            {calendarUrl ? (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-wine px-6 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a1218]"
              >
                {labels.checkoutOutcome.calendarCta}
              </a>
            ) : null}
            <Link
              href={`${clubmemberPath(locale)}?claim=1#happening`}
              className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                calendarUrl
                  ? "border border-wine/15 text-wine hover:border-wine/30"
                  : "bg-wine text-cream hover:bg-[#3a1218]"
              }`}
            >
              {labels.checkoutOutcome.confirmedCta}
            </Link>
          </div>
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} showSeoLinks={false} />
    </>
  );
}
