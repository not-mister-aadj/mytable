import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale, localePath } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = isValidLocale(locale) && locale === "en";
  return {
    title: isEn ? "Coming soon · MyTable" : "Binnenkort · MyTable",
    robots: { index: false, follow: false },
  };
}

/** Accounts aren't open yet — everything here points people back to the waitlist. */
export default async function LoginComingSoonPage({ params }: Props) {
  const { locale } = await params;
  const isEn = isValidLocale(locale) && locale === "en";
  const home = localePath(isEn ? "en" : "nl");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-24">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          {isEn ? "Coming soon" : "Binnenkort"}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-wine">
          {isEn ? "Not live yet" : "Nog niet live"}
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-wine/60">
          {isEn
            ? "Accounts aren't open yet. Join the waitlist instead — we'll email you as soon as there's a table for you."
            : "Accounts zijn nog niet open. Zet je liever op de wachtlijst, we mailen je zodra er een tafel voor je is."}
        </p>
        <Link
          href={home}
          className="cta-lift cta-lift-burgundy mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition"
        >
          {isEn ? "Join the waitlist" : "Zet me op de lijst"}
        </Link>
      </div>
    </main>
  );
}
