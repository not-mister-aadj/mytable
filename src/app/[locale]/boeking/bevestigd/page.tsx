import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getBookingSummaryFromSession } from "@/lib/booking-outcome-data";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BookingConfirmedPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const summary = sessionId
    ? await getBookingSummaryFromSession(sessionId, locale as Locale)
    : null;

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <BookingOutcomeContent
        variant="success"
        dict={dict.bookingOutcome}
        locale={locale}
        summary={summary}
      />
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
