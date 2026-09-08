import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SundayTableLpView } from "@/components/sunday-table-lp/SundayTableLpView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  isValidLocale,
  localePath,
  sundayTableLpPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSundayTableLpLabels } from "@/i18n/get-sunday-table-lp";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = getSundayTableLpLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "sundayTableLp",
    title: labels.meta.title,
    description: labels.meta.description,
    image: "/girls-only/table-group.jpg",
  });
}

export default async function SundayTableLpPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  // Keeping this page free of cookies()/auth reads is what lets it stay
  // statically prerendered (ISR) instead of rendering on every request.
  const dict = getDictionary(locale);
  const labels = getSundayTableLpLabels(locale);
  const pageUrl = absoluteUrl(sundayTableLpPath(locale));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          faqPageJsonLd(labels.faq.items, pageUrl),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: labels.meta.title, path: sundayTableLpPath(locale) },
          ]),
        ]}
      />
      <SundayTableLpView
        locale={locale}
        labels={labels}
        headerDict={dict.header}
        footerDict={dict.footer}
      />
    </>
  );
}
