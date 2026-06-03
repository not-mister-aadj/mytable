import Link from "next/link";
import { Logo } from "./Logo";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

interface FooterProps {
  dict: Dictionary["footer"];
  locale: Locale;
}

export function Footer({ dict, locale }: FooterProps) {
  const home = localePath(locale);
  const banner = localePath(locale, "#banner");
  const year = new Date().getFullYear();

  const footerLinks = [
    { label: dict.links.experiences, href: "#experiences" },
    { label: dict.links.howItWorks, href: "#how-it-works" },
    { label: dict.links.forVenues, href: "#for-venues" },
    { label: dict.links.faq, href: "#faq" },
    { label: dict.links.instagram, href: "https://instagram.com" },
    { label: dict.links.contact, href: "mailto:hello@mytable.nl" },
  ];

  return (
    <footer className="border-t border-border-subtle bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href={banner}
              scroll
              className="inline-block transition-opacity hover:opacity-90"
              aria-label="MyTable"
            >
              <Logo variant="footer" />
            </Link>
            <p className="mt-3 font-serif text-lg italic text-wine/80">
              {dict.tagline}
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={
                      link.href.startsWith("http") || link.href.startsWith("mailto")
                        ? link.href
                        : `${home}${link.href}`
                    }
                    className="text-sm text-wine/70 transition-colors hover:text-burgundy"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-border-subtle pt-8 text-center text-xs text-wine/50 sm:text-left">
          © {year} MyTable. {dict.copyright}
        </p>
      </div>
    </footer>
  );
}
