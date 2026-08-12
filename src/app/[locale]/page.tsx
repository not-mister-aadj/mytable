import { Footer } from "@/components/Footer";
import { BrandLandingView } from "@/components/brand/BrandLandingView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBrandLandingLabels } from "@/i18n/get-brand-landing";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getMemberUser } from "@/lib/member-auth";
import {
  readOnboardingFromMetadata,
  resolvePostAuthPath,
} from "@/lib/member-onboarding";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = getBrandLandingLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "home",
    title: `${labels.brand} · ${labels.belief}`,
    description: labels.line,
    image: "/girls-only/hero-poster.jpg",
  });
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const user = await getMemberUser();
  if (user) {
    const { completed, prefs } = readOnboardingFromMetadata(
      user.user_metadata as Record<string, unknown>,
    );
    redirect(
      resolvePostAuthPath(locale, {
        completed,
        prefs,
      }),
    );
  }

  const dict = getDictionary(locale);
  const labels = getBrandLandingLabels(locale);

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(locale)]} />
      <main>
        <BrandLandingView
          locale={locale}
          headerDict={dict.header}
          labels={labels}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} showSeoLinks />
    </>
  );
}
