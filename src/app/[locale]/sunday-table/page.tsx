import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SundayTableLpView } from "@/components/sunday-table-lp/SundayTableLpView";
import {
  clubmemberPath,
  isValidLocale,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSundayTableLpLabels } from "@/i18n/get-sunday-table-lp";
import { getMemberUser } from "@/lib/member-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

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

  const user = await getMemberUser();
  if (user) {
    redirect(clubmemberPath(locale));
  }

  const dict = getDictionary(locale);
  const labels = getSundayTableLpLabels(locale);

  return (
    <SundayTableLpView
      locale={locale}
      labels={labels}
      headerDict={dict.header}
      footerDict={dict.footer}
    />
  );
}
