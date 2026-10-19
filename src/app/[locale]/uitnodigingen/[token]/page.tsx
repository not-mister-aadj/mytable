import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";
import { isValidLocale, jouwTafelPath, type Locale } from "@/i18n/config";
import type { CityPref } from "@/lib/invites/logic";
import { citiesForEmail, firstNameForEmail } from "@/lib/invites/cities";
import { QUIZ_CITIES } from "@/lib/jouw-tafel/logic";
import { saveInvitePrefs } from "./actions";

type Props = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ opgeslagen?: string; bevestigd?: string }>;
};

export const metadata: Metadata = { title: "Uitnodigingen | MyTable", robots: { index: false, follow: false } };

const COPY = {
  nl: {
    title: "Je uitnodigingen",
    hi: "Hoi",
    intro: "Kies per stad hoe vaak je een uitnodiging wilt voor een zondagmiddag met wijn.",
    options: { all: "Elke keer", less: "Minder vaak", none: "Niet" } as Record<CityPref, string>,
    more: "Ook uitnodigingen voor",
    save: "Opslaan",
    saved: "Opgeslagen. Je krijgt alleen nog uitnodigingen zoals je hier kiest.",
    confirmed: "Dank je! Je blijft uitnodigingen krijgen.",
    none: "Je volgt nog geen steden.",
  },
  en: {
    title: "Your invites",
    hi: "Hi",
    intro: "Choose per city how often you'd like an invite for a Sunday afternoon with wine.",
    options: { all: "Every time", less: "Less often", none: "No" } as Record<CityPref, string>,
    more: "Also invites for",
    save: "Save",
    saved: "Saved. You'll only get invites the way you chose here.",
    confirmed: "Thank you! You'll keep getting our invites.",
    none: "You don't follow any cities yet.",
  },
};

function CityChoice({ name, city, checked, labels }: { name: string; city: string; checked: CityPref; labels: Record<CityPref, string> }) {
  return (
    <fieldset>
      <legend className="font-medium text-wine">{city}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(["all", "less", "none"] as CityPref[]).map((pref) => (
          <label key={pref} className="cursor-pointer">
            <input type="radio" name={name} value={pref} defaultChecked={checked === pref} className="peer sr-only" />
            <span className="block rounded-full border border-wine/15 px-2 py-2 text-center text-sm text-wine/70 peer-checked:border-burgundy peer-checked:bg-burgundy peer-checked:text-cream">
              {labels[pref]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** /uitnodigingen/{token}: the link in every invite, no login needed. */
export default async function InvitePrefsPage({ params, searchParams }: Props) {
  const { locale, token } = await params;
  if (!isValidLocale(locale) || !isDbConfigured()) notFound();
  const db = getDb();
  const [sub] = await db.select().from(inviteSubscribers).where(eq(inviteSubscribers.token, token)).limit(1);
  if (!sub) notFound();
  const [cities, name] = await Promise.all([citiesForEmail(sub.emailNormalized), firstNameForEmail(sub.emailNormalized)]);
  const others = QUIZ_CITIES.filter((c) => !cities.includes(c));
  const prefs = (sub.cityPrefs ?? {}) as Record<string, CityPref>;
  const copy = COPY[locale as Locale];
  const query = await searchParams;

  return (
    <div className="flex min-h-[100svh] flex-col bg-cream text-wine">
      <header className="flex h-16 items-center px-5 sm:px-8">
        <Link href={jouwTafelPath(locale as Locale)} aria-label="MyTable">
          <Logo priority />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-16 pt-4 sm:items-center">
        <div className="h-fit w-full max-w-md rounded-[1.75rem] border border-wine/8 bg-white/70 px-6 py-8 shadow-[0_24px_60px_rgba(43,13,18,0.1)] sm:px-8">
          <span aria-hidden className="block h-px w-12 bg-gold" />
          <h1 className="mt-6 font-serif text-3xl text-burgundy">{name ? `${copy.hi} ${name},` : copy.title}</h1>
          <p className="mt-2 text-sm text-wine/70">{copy.intro}</p>
          {query.bevestigd ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{copy.confirmed}</p> : null}
          {query.opgeslagen ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{copy.saved}</p> : null}
          <form action={saveInvitePrefs} className="mt-6 space-y-5">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="locale" value={locale} />
            {cities.length === 0 ? <p className="text-sm text-wine/60">{copy.none}</p> : null}
            {cities.map((city) => (
              <CityChoice key={city} name={`city:${city}`} city={city} checked={prefs[city] ?? "all"} labels={copy.options} />
            ))}
            {others.length > 0 ? (
              <div className="space-y-5 border-t border-wine/10 pt-5">
                <p className="text-sm font-medium text-wine/70">{copy.more}</p>
                {others.map((city) => (
                  <CityChoice key={city} name={`add:${city}`} city={city} checked="none" labels={copy.options} />
                ))}
              </div>
            ) : null}
            <button type="submit" className="w-full rounded-full bg-burgundy px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream">
              {copy.save}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
