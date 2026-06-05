import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import {
  isValidLocale,
  privacyPath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getLegalDocument,
  type LegalDocumentKind,
} from "@/i18n/get-legal-document";
import { formatLegalUpdated, companyLegal } from "@/lib/company-legal";
import { notFound } from "next/navigation";

type Props = {
  locale: Locale;
  kind: LegalDocumentKind;
};

export function LegalPage({ locale, kind }: Props) {
  const dict = getDictionary(locale);
  const document = getLegalDocument(locale, kind);

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-cream pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
            {dict.footer.legal.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-wine sm:text-5xl">
            {document.title}
          </h1>
          <p className="mt-4 text-sm text-wine/55">
            {document.updatedLabel}: {formatLegalUpdated(locale)}
          </p>

          <div className="mt-12">
            <LegalDocumentBody sections={document.sections} locale={locale} />
          </div>

          <nav
            className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-border-subtle pt-8 text-sm"
            aria-label={dict.footer.legal.relatedLabel}
          >
            {kind === "terms" ? (
              <Link
                href={privacyPath(locale)}
                className="text-wine/70 underline-offset-4 hover:text-burgundy hover:underline"
              >
                {dict.footer.links.privacy}
              </Link>
            ) : (
              <Link
                href={termsPath(locale)}
                className="text-wine/70 underline-offset-4 hover:text-burgundy hover:underline"
              >
                {dict.footer.links.terms}
              </Link>
            )}
            <Link
              href={`mailto:${companyLegal.email}`}
              className="text-wine/70 underline-offset-4 hover:text-burgundy hover:underline"
            >
              {companyLegal.email}
            </Link>
          </nav>
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}

export function guardLegalPage(
  locale: string,
  _kind: LegalDocumentKind,
): Locale {
  if (!isValidLocale(locale)) notFound();
  return locale;
}
