import Link from "next/link";
import { Logo } from "./Logo";
import {
  agendaPath,
  blogPath,
  girlsOnlyCityPath,
  girlsOnlyPath,
  localePath,
  privacyPath,
  termsPath,
  waitlistPath,
  type Locale,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { listGirlsOnlyCities } from "@/data/girls-only-cities";
import { companyLegal } from "@/lib/company-legal";

interface FooterProps {
  dict: Dictionary["footer"];
  locale: Locale;
}

export function Footer({ dict, locale }: FooterProps) {
  const home = localePath(locale);
  const year = new Date().getFullYear();
  const cities = listGirlsOnlyCities();

  const exploreLinks = [
    { label: dict.links.girlsOnly, href: girlsOnlyPath(locale) },
    { label: dict.links.experiences, href: agendaPath(locale) },
    { label: dict.links.waitlist, href: waitlistPath(locale) },
    { label: dict.links.blog, href: blogPath(locale) },
    { label: dict.links.howItWorks, href: localePath(locale, "#how-it-works") },
    { label: dict.links.faq, href: localePath(locale, "#faq") },
  ];

  const infoLinks = [
    {
      label: dict.links.contact,
      href: `mailto:${companyLegal.email}`,
    },
    {
      label: dict.links.instagram,
      href: "https://instagram.com/mytable.club",
      external: true,
    },
    { label: dict.links.terms, href: termsPath(locale) },
    { label: dict.links.privacy, href: privacyPath(locale) },
  ];

  return (
    <footer className="border-t border-border-subtle bg-gradient-to-b from-beige to-cream">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-10 xl:gap-14">
          <div className="sm:col-span-2 lg:col-span-1">
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
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-wine/60">
              {dict.description}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-wine/70">
              <li>
                <a
                  href={`mailto:${companyLegal.email}`}
                  className="transition-colors hover:text-burgundy"
                >
                  {companyLegal.email}
                </a>
              </li>
              <li className="text-wine/50">{dict.nationwide}</li>
            </ul>
          </div>

          <nav aria-label={dict.columns.explore}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-deep">
              {dict.columns.explore}
            </p>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-wine/70 transition-colors hover:text-burgundy"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.columns.info}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-deep">
              {dict.columns.info}
            </p>
            <ul className="mt-4 space-y-3">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-wine/70 transition-colors hover:text-burgundy"
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.columns.popularCities}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-deep">
              {dict.columns.popularCities}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
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
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border-subtle pt-8 text-xs text-wine/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} MyTable. {dict.copyright}
          </p>
          <p>
            KvK {companyLegal.kvk}
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
