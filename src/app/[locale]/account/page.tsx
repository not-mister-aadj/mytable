import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { MemberAccountSettings } from "@/components/account/MemberAccountSettings";
import { MemberOnboardingGate } from "@/components/account/MemberOnboardingGate";
import { PostPurchaseEnrichment } from "@/components/account/PostPurchaseEnrichment";
import { getAccountPageLabels } from "@/i18n/get-account-page";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  isValidLocale,
  localePath,
  type Locale,
} from "@/i18n/config";
import { getMemberUser, syncMemberCustomer } from "@/lib/member-auth";
import {
  canStartClubCheckout,
  isSundayTableOnboardingReady,
  needsPostPurchaseEnrichment,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ enrich?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = getAccountPageLabels(locale);
  return buildPageMetadata({
    locale,
    kind: "home",
    title: labels.meta.title,
    description: labels.meta.description,
  });
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const user = await getMemberUser();
  if (!user) {
    redirect(`${localePath(locale)}?signin=1`);
  }

  try {
    await syncMemberCustomer(user, locale);
  } catch {
    // non-blocking
  }

  const labels = getAccountPageLabels(locale);
  const dict = getDictionary(locale);
  const meta = user.user_metadata as Record<string, unknown> | null;
  const { completed, prefs } = readOnboardingFromMetadata(meta);
  const needsOnboarding = !isSundayTableOnboardingReady(completed, prefs);
  const query = await searchParams;
  const enrichRequested = query.enrich === "1";

  // After payment (or explicit enrich): name, birthdate, stories, personality
  if (enrichRequested && needsPostPurchaseEnrichment(prefs)) {
    return (
      <main className="min-h-[100svh] bg-cream">
        <PostPurchaseEnrichment
          labels={labels.onboarding}
          locale={locale}
          initialPrefs={prefs}
        />
      </main>
    );
  }

  // Incomplete quiz → continue onboarding. Quiz done (checkout-ready) but
  // name/birth still missing is fine: those come after purchase — don't
  // hijack Account into the Sunday Table claim sheet.
  if (needsOnboarding && !canStartClubCheckout(prefs)) {
    return (
      <main className="min-h-[100svh] bg-cream">
        <MemberOnboardingGate
          labels={labels.onboarding}
          locale={locale}
          email={user.email ?? ""}
          userMetadata={meta}
        />
      </main>
    );
  }

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="min-h-[100svh] bg-gradient-to-b from-beige via-cream to-cream pt-[4.5rem]">
        <MemberAccountSettings
          settings={labels.settings}
          onboarding={labels.onboarding}
          locale={locale}
          email={user.email ?? ""}
          initialPrefs={prefs}
        />
      </main>
    </>
  );
}
