import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConfirmAttendance } from "@/components/table-page/ConfirmAttendance";
import { getDb } from "@/db/index";
import { bookings } from "@/db/schema";
import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadTablePage, verifyTablePageToken } from "@/lib/table-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Kom je zondag? | MyTable",
  openGraph: { title: "MyTable" },
};

type Props = { params: Promise<{ locale: string; token: string }> };

/** "Ja, ik kom" from the Wednesday mail. */
export default async function ConfirmAttendanceRoute({ params }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const token = decodeURIComponent(rawToken);
  const bookingId = await verifyTablePageToken(token);
  const page = bookingId ? await loadTablePage(bookingId) : null;
  const usable = page && !page.cancelled && !page.started ? page : null;
  const [row] = usable
    ? await getDb().select({ at: bookings.attendanceConfirmedAt }).from(bookings).where(eq(bookings.id, usable.bookingId)).limit(1)
    : [];
  const lang = locale === "en" ? "en" : "nl";

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pb-16 pt-28 sm:pt-36">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          {usable ? (
            <ConfirmAttendance
              token={token}
              locale={lang}
              venue={usable.venue?.name ?? usable.city}
              confirmed={Boolean(row?.at)}
              tableHref={`${locale === "en" ? "/en" : ""}/aan-tafel/${encodeURIComponent(token)}`}
            />
          ) : (
            <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center sm:px-8">
              <h1 className="font-serif text-2xl text-wine">{lang === "en" ? "This link doesn't work anymore" : "Deze link werkt niet meer"}</h1>
              <Link href={sundayTableLpPath(locale)} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
                Sunday Social
              </Link>
            </section>
          )}
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} showFormats={false} />
    </>
  );
}
