import Link from "next/link";
import { Logo } from "./Logo";
import {
  blogPath,
  girlsOnlyCityPath,
  localePath,
  privacyPath,
  termsPath,
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
  const cities = showSeoLinks ? listGirlsOnlyCities() : [];

  return (
    <footer className="border-t border-border-subtle bg-gradient-to-b from-beige to-cream">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="text-center">
          <Link
            href={home}
            className="inline-block transition-opacity hover:opacity-90"
            aria-label="MyTable"
          >
            <Logo variant="footer" />
          </Link>
          <p className="mt-4 font-serif text-xl italic text-wine/80">
            {dict.tagline}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-wine/55">
            {dict.description}
          </p>
          <p className="mt-6 text-sm text-wine/60">
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
        </div>

        {showSeoLinks && cities.length > 0 ? (
          <nav
            aria-label={dict.columns.popularCities}
            className="mt-8 border-t border-border-subtle pt-6 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-wine/40">
              {dict.columns.popularCities}
            </p>
            <ul className="mx-auto mt-3 flex max-w-xl flex-wrap justify-center gap-x-4 gap-y-1.5">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={girlsOnlyCityPath(locale, city.slug)}
                    className="text-sm text-wine/70 transition-colors hover:text-burgundy"
                  >
                    {city.cityName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-8 border-t border-border-subtle pt-5 text-center text-xs text-wine/45">
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
