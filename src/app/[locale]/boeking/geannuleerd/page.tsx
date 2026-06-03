import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isValidLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BookingCancelledPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-burgundy">
          {locale === "nl" ? "Betaling geannuleerd" : "Payment cancelled"}
        </h1>
        <p className="mt-4 text-wine/80">
          {locale === "nl"
            ? "Je hebt geen plek gereserveerd. Probeer het opnieuw wanneer je wilt."
            : "No seat was reserved. Try again whenever you are ready."}
        </p>
        <a
          href={`/${locale}/agenda`}
          className="mt-8 inline-block rounded-full bg-burgundy px-6 py-3 text-sm text-cream"
        >
          {locale === "nl" ? "Naar agenda" : "View agenda"}
        </a>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
