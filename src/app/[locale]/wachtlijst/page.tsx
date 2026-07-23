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
  if (locale !== "nl") return {};
  const labels = getWaitlistPageLabels("nl");
  return buildPageMetadata({
    locale: "nl",
    kind: "waitlist",
    title: `${labels.meta.title} | MyTable`,
    description: labels.meta.description,
  });
}

export default async function WaitlistNlPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "nl") notFound();

  const dict = getDictionary("nl");
  const labels = getWaitlistPageLabels("nl");
  const whatsappLinks = await getWaitlistWhatsappLinks();
  const pageUrl = absoluteUrl(waitlistPath("nl"));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd("nl"),
          siteNavigationJsonLd("nl"),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: labels.meta.title,
            description: labels.meta.description,
            inLanguage: "nl",
            isPartOf: { "@id": `${getSeoSiteUrl()}/#website` },
          },
          breadcrumbJsonLd(pageUrl, [
            { name: labels.breadcrumbHome, path: localePath("nl") },
            {
              name: labels.breadcrumbWaitlist,
              path: waitlistPath("nl"),
            },
          ]),
        ]}
      />
      <Header dict={dict.header} locale="nl" />
      <main>
        <WaitlistLandingView
          labels={labels}
          locale="nl"
          whatsappLinks={whatsappLinks}
        />
      </main>
    </>
  );
}
