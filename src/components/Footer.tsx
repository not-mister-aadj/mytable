import Link from "next/link";
import { Logo } from "./Logo";
import {
  blogPath,
  chefsSpecialLpPath,
  girlsOnlyCityPath,
  localePath,
  privacyPath,
  sundayTableLpPath,
  termsPath,
  wineTastingLpPath,
  wineWalkLpPath,
  type Locale,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { listGirlsOnlyCities } from "@/data/girls-only-cities";
import { companyLegal } from "@/lib/company-legal";

interface FooterProps {
  dict: Dictionary["footer"];
  locale: Locale;
  /** Blog + city links for SEO (landing, blog, and city pages). */
  showSeoLinks?: boolean;
}

export function Footer({
  dict,
  locale,
  showSeoLinks = false,
}: FooterProps) {
  const home = localePath(locale);
  const year = new Date().getFullYear();
  const isEn = locale === "en";
  const cities = showSeoLinks ? listGirlsOnlyCities() : [];

  const formats = [
    { href: sundayTableLpPath(locale), label: "Sunday Table" },
    { href: wineTastingLpPath(locale), label: isEn ? "Wine Tasting" : "Wijnproeverij" },
    { href: wineWalkLpPath(locale), label: isEn ? "Wine Walk" : "Wijnwalk" },
    { href: chefsSpecialLpPath(locale), label: "Chef's Table" },
  ];

  return (
    <footer className="border-t border-border-subtle bg-gradient-to-b from-beige to-cream">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="text-center">
          <Link
            href={home}
            className="inline-block transition-opacity hover:opacity-90"
            aria-label="MyTable"
          >
            <Logo variant="footer" />
          </Link>
          <p className="mt-3 font-serif text-xl italic text-wine/80">
            {dict.tagline}
          </p>
        </div>

        <nav
          aria-label={isEn ? "Formats" : "Formats"}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {formats.map((format) => (
            <Link
              key={format.href}
              href={format.href}
              className="cta-lift cta-lift-outline text-sm font-medium text-wine/70 transition-colors hover:text-burgundy"
            >
              {format.label}
            </Link>
          ))}
        </nav>

        <p className="mt-6 text-center text-sm text-wine/60">
          <a
            href={`mailto:${companyLegal.email}`}
            className="transition-colors hover:text-burgundy"
          >
            {companyLegal.email}
          </a>
          <span className="mx-2 text-wine/25">·</span>
          <a
            href="https://instagram.com/mytable.club"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-burgundy"
          >
            Instagram
          </a>
        </p>

        {showSeoLinks && cities.length > 0 ? (
          <nav
            aria-label={dict.columns.popularCities}
            className="mt-6 border-t border-border-subtle pt-4 text-center"
          >
            <ul className="mx-auto flex max-w-xl flex-wrap justify-center gap-x-3 gap-y-1">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={girlsOnlyCityPath(locale, city.slug)}
                    className="text-xs text-wine/40 transition-colors hover:text-burgundy"
                  >
                    {city.cityName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-6 border-t border-border-subtle pt-5 text-center text-xs text-wine/45">
          <p>
            © {year} MyTable. {dict.copyright}
            <span className="mx-2 text-wine/25">·</span>
            <Link
              href={blogPath(locale)}
              className="transition-colors hover:text-wine/70"
            >
              {dict.links.blog}
            </Link>
            <span className="mx-2 text-wine/25">·</span>
            <Link
              href={privacyPath(locale)}
              className="transition-colors hover:text-wine/70"
            >
              {dict.links.privacy}
            </Link>
            <span className="mx-2 text-wine/25">·</span>
            <Link
              href={termsPath(locale)}
              className="transition-colors hover:text-wine/70"
            >
              {dict.links.terms}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
