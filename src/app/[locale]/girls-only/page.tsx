import { Footer } from "@/components/Footer";
import { GirlsOnlyHeader } from "@/components/girls-only/GirlsOnlyHeader";
import { GirlsOnlyLanding } from "@/components/girls-only/GirlsOnlyLanding";
import { girlsOnlyPageEn } from "@/i18n/girls-only-page-en";
import { girlsOnlyPageNl } from "@/i18n/girls-only-page-nl";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary, getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
  return {
    title: `${labels.meta.title} | MyTable`,
    description: labels.meta.description,
  };
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function GirlsOnlyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const agendaDict = await getDictionaryWithAgenda(locale);
  const labels = getGirlsOnlyLabels(locale);

  return (
    <>
      <GirlsOnlyHeader
        headerDict={dict.header}
        nav={labels.headerNav}
        ctaLabel={labels.finalCta.button}
        locale={locale}
      />
      <main className="bg-cream pb-20 lg:pb-0">
        <GirlsOnlyLanding
          labels={labels}
          locale={locale}
          agendaItems={agendaDict.agenda.items}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
