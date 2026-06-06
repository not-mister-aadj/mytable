import { AgendaHero } from "@/components/agenda/AgendaHero";
import { NewsletterCTA } from "@/components/agenda/NewsletterCTA";
import { AgendaPageContent } from "@/components/AgendaPageContent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isValidLocale } from "@/i18n/config";
import { getDictionary, getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.agenda.hero.title} | MyTable`,
    description: dict.agenda.hero.subtitle,
  };
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function AgendaPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionaryWithAgenda(locale);

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-cream">
        <AgendaHero hero={dict.agenda.hero} />
        <div className="pb-8 pt-10 sm:pb-12 sm:pt-12">
          <AgendaPageContent
            dict={dict.agenda}
            pageLabels={dict.experiencePage}
            locale={locale}
            items={dict.agenda.items}
          />
        </div>
        <NewsletterCTA dict={dict.newsletter} locale={locale} />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
