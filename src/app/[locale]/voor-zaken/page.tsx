import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { VoorZakenView } from "@/components/voor-zaken/VoorZakenView";
import { isValidLocale, localePath, voorZakenPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  breadcrumbJsonLd,
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
  const title = "Een volle zaak op je rustigste moment | MyTable voor zaken";
  const description =
    "Wij vullen een rustig moment in jouw wijnbar of restaurant met volle tafels. Jouw prijzen, geen korting, geen contract, geen kosten om mee te doen.";
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "voorZaken",
    title,
    description,
    image: "/girls-only/table-wine-laughing.jpg",
  });
}

export default async function VoorZakenPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const dict = getDictionary(locale);
  const pageUrl = absoluteUrl(voorZakenPath(locale));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: "Voor zaken", path: voorZakenPath(locale) },
          ]),
        ]}
      />
      <VoorZakenView
        locale={locale}
        headerDict={dict.header}
        footerDict={dict.footer}
      />
    </>
  );
}
