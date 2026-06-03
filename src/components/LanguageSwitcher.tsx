import Link from "next/link";
import { switchLocalePath, type Locale } from "@/i18n/config";

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
}

export function LanguageSwitcher({ locale, label }: LanguageSwitcherProps) {
  return (
    <Link
      href={switchLocalePath(locale)}
      className="rounded-full border border-border-subtle bg-beige px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-burgundy transition-colors hover:border-burgundy/30 hover:bg-cream"
      aria-label={locale === "nl" ? "Switch to English" : "Schakel naar Nederlands"}
    >
      {label}
    </Link>
  );
}
