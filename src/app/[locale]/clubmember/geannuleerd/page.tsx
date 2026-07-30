import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
import { abandonPendingCheckoutSession } from "@/lib/club/memberships";
import { getMemberUser } from "@/lib/member-auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Checkout geannuleerd | MyTable",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ClubmemberCancelledPage({
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
  if (sessionId && isDbConfigured()) {
    try {
      await abandonPendingCheckoutSession(sessionId);
    } catch (err) {
      console.error("[clubmember cancelled] abandon pending", err);
    }
  }

  const labels = locale === "en" ? memberClubEn : memberClubNl;
  const dict = getDictionary(locale);

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="min-h-[70svh] bg-gradient-to-b from-beige via-cream to-cream">
        <div className="mx-auto flex max-w-lg flex-col px-5 pb-16 pt-28 sm:px-6 sm:pt-32">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {labels.membership.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-wine">
            {labels.checkoutOutcome.cancelledTitle}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wine/60">
            {labels.checkoutOutcome.cancelledBody}
          </p>
          <Link
            href={clubmemberPath(locale)}
            className="mt-10 inline-flex min-h-12 items-center justify-center rounded-full bg-wine px-6 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a1218]"
          >
            {labels.checkoutOutcome.cancelledCta}
          </Link>
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} showSeoLinks={false} />
    </>
  );
}
