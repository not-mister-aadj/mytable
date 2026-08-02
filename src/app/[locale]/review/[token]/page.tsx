import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SundayTableReviewForm } from "@/components/sunday-table/SundayTableReviewForm";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { resolveSundayTableReviewAccess } from "@/lib/sunday-table-reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Sunday Table review | MyTable",
};

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function SundayTableReviewPage({ params }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    // keep raw
  }

  const access = await resolveSundayTableReviewAccess(token);
  const dict = getDictionary(locale);

  if (!access.ok) {
    return (
      <>
        <Header dict={dict.header} locale={locale} />
        <main className="relative min-h-[70vh] overflow-hidden bg-[#f7f1e8]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(90,15,27,0.06),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(197,154,91,0.12),transparent_45%)]"
          />
          <div className="relative mx-auto max-w-lg px-5 py-20 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-rose-deep/80">
              Sunday Table
            </p>
            <h1 className="mt-4 font-serif text-4xl text-burgundy sm:text-5xl">
              {locale === "en"
                ? "This link is not available"
                : "Deze link is niet beschikbaar"}
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-wine/70">
              {access.reason === "not_eligible"
                ? locale === "en"
                  ? "Reviews are only open to guests who were at the table."
                  : "Reviews zijn alleen voor gasten die aan tafel zaten."
                : locale === "en"
                  ? "The link is invalid or has expired."
                  : "De link is ongeldig of verlopen."}
            </p>
          </div>
        </main>
        <Footer dict={dict.footer} locale={locale} />
      </>
    );
  }

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="relative min-h-[70vh] overflow-hidden bg-[#f7f1e8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(90,15,27,0.06),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(197,154,91,0.12),transparent_45%)]"
        />
        <SundayTableReviewForm
          locale={locale}
          token={token}
          city={access.signup.city}
          firstName={access.signup.name?.split(" ")[0] ?? null}
          alreadySubmitted={Boolean(access.existing)}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
