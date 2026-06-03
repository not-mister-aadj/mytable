import { ExperiencePageContent } from "@/components/experience/ExperiencePageContent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterCTA } from "@/components/agenda/NewsletterCTA";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getAllExperienceSlugs,
  getExperienceBySlug,
  getRelatedExperiences,
} from "@/lib/experiences";
import {
  getExperienceTagline,
  getMoodContent,
} from "@/lib/experience-detail";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const experience = getExperienceBySlug(locale, slug);
  if (!experience) return {};
  const dict = getDictionary(locale);
  const mood = getMoodContent(dict, experience.mood);
  return {
    title: `${experience.experienceName}, ${experience.city} | MyTable`,
    description: getExperienceTagline(experience, mood),
  };
}

export async function generateStaticParams() {
  const locales: Locale[] = ["nl", "en"];
  return locales.flatMap((locale) =>
    getAllExperienceSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const experience = getExperienceBySlug(locale, slug);
  if (!experience) notFound();

  const dict = getDictionary(locale);
  const related = getRelatedExperiences(locale, experience);

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-cream">
        <ExperiencePageContent
          experience={experience}
          related={related}
          dict={dict}
          locale={locale}
        />
        <NewsletterCTA dict={dict.newsletter} />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
