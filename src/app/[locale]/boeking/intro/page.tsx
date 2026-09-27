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
  searchParams: Promise<{
    token?: string;
    style?: string;
    voorbeeld?: string;
    /** Preview only: `tickets=2` shows the +1 question. */
    tickets?: string;
  }>;
};

/** Where the "introduce yourself" reminder email links to. A button in the
 * email already carries the answer (`?style=talker`), so that one click is
 * saved on arrival and the rest of the questions are right there. */
export default async function SundayTableIntroPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const { token, style, voorbeeld, tickets } = await searchParams;
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
          bookingCode="MT-1A2B3C4D"
          seats={tickets === "2" ? 2 : 1}
          initial={isIntroConversationStyle(style) ? { conversationStyle: style } : null}
        />
      </IntroShell>
    );
  }

  const bookingId = token ? await verifySundayTableIntroToken(token) : null;
  const booking = bookingId ? await findSundayTableIntroBooking({ bookingId }) : null;

  // No (valid) token, e.g. the link was cut off or edited: ask for the booking
  // number and email instead of showing "page not found".
  if (!token || !booking) {
    return (
      <IntroShell locale={locale} dict={dict}>
        <SundayTableIntroForm
          locale={locale}
          // City unknown until the booking is found.
          city={locale === "en" ? "your city" : "de stad"}
          auth={{ manual: true }}
          initial={isIntroConversationStyle(style) ? { conversationStyle: style } : null}
        />
      </IntroShell>
    );
  }

  if (isIntroConversationStyle(style)) {
    await saveSundayTableIntroConversationStyle(booking.id, style);
    if (!booking.intro.conversationStyle) booking.intro.conversationStyle = style;
  }

  return (
    <IntroShell locale={locale} dict={dict}>
      <SundayTableIntroForm
        locale={locale}
        city={booking.city}
        auth={{ token }}
        bookingCode={booking.reservationCode}
        seats={booking.seats}
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
