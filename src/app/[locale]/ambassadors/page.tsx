import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { AmbassadorsView } from "@/components/ambassadors/AmbassadorsView";
import { ambassadorsPath, isValidLocale, localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { ambassadorCopy } from "@/lib/ambassadors/copy";
import { breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = ambassadorCopy(locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "ambassadors",
    title: t.metaTitle,
    description: t.metaDescription,
    image: "/girls-only/group-bar.jpg",
  });
}

export default async function AmbassadorsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const pageUrl = absoluteUrl(ambassadorsPath(locale));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: "Ambassadors", path: ambassadorsPath(locale) },
          ]),
        ]}
      />
      <AmbassadorsView locale={locale} headerDict={dict.header} footerDict={dict.footer} />
    </>
  );
}
