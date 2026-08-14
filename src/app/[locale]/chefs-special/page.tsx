import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormatLandingView } from "@/components/format-lp/FormatLandingView";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getChefsSpecialLpLabels } from "@/i18n/get-format-lp";

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
  const labels = getChefsSpecialLpLabels(locale as Locale);
  return {
    title: labels.meta.title,
    description: labels.meta.description,
  };
}

export default async function ChefsSpecialLpPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const dict = getDictionary(locale);
  const labels = getChefsSpecialLpLabels(locale);

  return (
    <FormatLandingView
      locale={locale}
      labels={labels}
      headerDict={dict.header}
      footerDict={dict.footer}
      waitlistInterest="chefs_special"
    />
  );
}
