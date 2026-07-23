import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaitlistLandingView } from "@/components/waitlist/WaitlistLandingView";
import { getDictionary } from "@/i18n/get-dictionary";
import { getWaitlistPageLabels } from "@/i18n/get-waitlist-page";
import { localePath, waitlistPath } from "@/i18n/config";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  siteNavigationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, getSeoSiteUrl } from "@/lib/seo/site";
import { getWaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp.server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  const labels = getWaitlistPageLabels("en");
  return buildPageMetadata({
    locale: "en",
    kind: "waitlist",
    title: `${labels.meta.title} | MyTable`,
    description: labels.meta.description,
  });
}

export default async function WaitlistEnPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();

  const dict = getDictionary("en");
  const labels = getWaitlistPageLabels("en");
  const whatsappLinks = await getWaitlistWhatsappLinks();
  const pageUrl = absoluteUrl(waitlistPath("en"));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd("en"),
          siteNavigationJsonLd("en"),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: labels.meta.title,
            description: labels.meta.description,
            inLanguage: "en",
            isPartOf: { "@id": `${getSeoSiteUrl()}/#website` },
          },
          breadcrumbJsonLd(pageUrl, [
            { name: labels.breadcrumbHome, path: localePath("en") },
            {
              name: labels.breadcrumbWaitlist,
              path: waitlistPath("en"),
            },
          ]),
        ]}
      />
      <Header dict={dict.header} locale="en" />
      <main>
        <WaitlistLandingView
          labels={labels}
          locale="en"
          whatsappLinks={whatsappLinks}
        />
      </main>
    </>
  );
}
