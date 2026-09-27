import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  findSundayTableIntroBooking,
  isIntroConversationStyle,
  saveSundayTableIntroConversationStyle,
  verifySundayTableIntroToken,
} from "@/lib/sunday-table-intro";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Meet your table | MyTable",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; style?: string; voorbeeld?: string }>;
};

/** Where the "introduce yourself" reminder email links to. A button in the
 * email already carries the answer (`?style=talker`), so that one click is
 * saved on arrival and the rest of the questions are right there. */
export default async function SundayTableIntroPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const { token, style, voorbeeld } = await searchParams;
  const dict = getDictionary(locale);

  // `?voorbeeld=1`: the real form with nothing behind it, so the questions can
  // be shown to anyone without a booking or a signed link.
  if (voorbeeld === "1") {
    return (
      <IntroShell locale={locale} dict={dict}>
        <SundayTableIntroForm
          locale={locale}
          city="Rotterdam"
          auth={{ preview: true }}
          initial={isIntroConversationStyle(style) ? { conversationStyle: style } : null}
        />
      </IntroShell>
    );
  }

  const bookingId = token ? await verifySundayTableIntroToken(token) : null;
  if (!token || !bookingId) notFound();

  if (isIntroConversationStyle(style)) {
    await saveSundayTableIntroConversationStyle(bookingId, style);
  }
  const booking = await findSundayTableIntroBooking({ bookingId });
  if (!booking) notFound();

  return (
    <IntroShell locale={locale} dict={dict}>
      <SundayTableIntroForm
        locale={locale}
        city={booking.city}
        auth={{ token }}
        initial={booking.intro}
      />
    </IntroShell>
  );
}

function IntroShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: ReturnType<typeof getDictionary>;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pt-28 sm:pt-36">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">{children}</div>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
