import { Footer } from "@/components/Footer";
import { GirlsOnlyAgendaSection } from "@/components/girls-only/GirlsOnlyAgendaSection";
import { GirlsOnlyLandingSkeleton } from "@/components/girls-only/GirlsOnlyLandingSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { girlsOnlyPageEn } from "@/i18n/girls-only-page-en";
import { girlsOnlyPageNl } from "@/i18n/girls-only-page-nl";
import { girlsOnlyPath, isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

function getGirlsOnlyLabels(locale: Locale) {
  return locale === "en" ? girlsOnlyPageEn : girlsOnlyPageNl;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = getGirlsOnlyLabels(locale);
  return buildPageMetadata({
    locale,
    kind: "girlsOnly",
    title: `${labels.meta.title} | MyTable`,
    description: labels.meta.description,
    image: "/girls-only/hero-poster.jpg",
  });
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function GirlsOnlyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const labels = getGirlsOnlyLabels(locale);
  const pageUrl = absoluteUrl(girlsOnlyPath(locale));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          faqPageJsonLd(labels.faq.items, pageUrl),
          breadcrumbJsonLd([
            {
              name: "MyTable",
              path: locale === "en" ? "/en" : "/",
            },
            {
              name: labels.meta.title,
              path: girlsOnlyPath(locale),
            },
          ]),
        ]}
      />
      <main className="bg-cream pb-20 lg:pb-0">
        <Suspense fallback={<GirlsOnlyLandingSkeleton />}>
          <GirlsOnlyAgendaSection
            locale={locale}
            labels={labels}
            headerDict={dict.header}
          />
        </Suspense>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
