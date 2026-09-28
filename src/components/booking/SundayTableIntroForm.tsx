"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type {
  IntroConversationStyle,
  IntroWine,
  SundayTableIntro,
} from "@/lib/sunday-table-intro";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";

const copy = {
  nl: {
    eyebrow: "Meet your table",
    title: "Help ons met je tafelindeling",
    lead: "We verdelen iedereen over tafels van 4 tot 6. Bij het indelen houden we rekening met je antwoorden, en twee dagen van tevoren stellen we je tafel aan elkaar voor. Vul je niets in, dan delen we je willekeurig in.",
    style: "Aan tafel ben jij meer…",
    styles: { talker: "🗣️ De prater", listener: "👂 De luisteraar", both: "⚖️ Allebei" },
    askMeAbout: "Waar mogen mensen je naar vragen?",
    askMeAboutPlaceholder: "bijv. mijn reis naar Japan",
    favoriteSpot: "Wat is jouw favoriete plek in {city}?",
    favoriteSpotPlaceholder: "bijv. een café, restaurant of park",
    wine: "Rood, wit of bubbels?",
    wines: { red: "Rood", white: "Wit", bubbles: "Bubbels" },
    intoNow: "Waar ben je nu helemaal into?",
    intoNowPlaceholder: "bijv. padel, een serie, Spaans leren",
    privacy: "Je voornaam en antwoorden delen we alleen met je tafelgenoten.",
    save: "Opslaan",
    saving: "Opslaan…",
    savedTitle: "Top, opgeslagen!",
    savedBody: "We gebruiken je antwoorden voor de tafelindeling. Twee dagen van tevoren krijg je een mail waarin we je tafel aan elkaar voorstellen.",
    edit: "Aanpassen",
    empty: "Vul minstens één vraag in.",
    error: "Er ging iets mis. Probeer het opnieuw.",
    previewNote: "Voorbeeld: zo ziet de vragenlijst eruit na een boeking. Er wordt niets opgeslagen.",
    bookingCode: "Boekingsnummer",
    bookingCodeHint: "Staat in je bevestigingsmail, bijv. MT-5B5230E1",
    bookingEmail: "E-mailadres waarmee je boekte",
    bookingEmailPlaceholder: "jij@email.nl",
    bookingNotFound: "We vinden geen boeking met dit nummer en e-mailadres. Check je bevestigingsmail.",
    bookingMissing: "Vul je boekingsnummer en e-mailadres in.",
    bookingFound: "Boeking gevonden",
    plusOneTitle: "Je komt met z'n tweeën",
    plusOneName: "Voornaam van je +1",
    plusOnePlaceholder: "bijv. Sophie",
    plusOneHint: "Jullie zitten samen aan tafel.",
    plusOneManualHint: "Alleen invullen als je 2 tickets hebt gekocht. Jullie zitten samen aan tafel.",
  },
  en: {
    eyebrow: "Meet your table",
    title: "Help us seat you",
    lead: "We split everyone into tables of 4 to 6. We take your answers into account when we do, and two days before, we introduce your table to each other. Skip it, and we seat you at random.",
    style: "At the table, you are more…",
    styles: { talker: "🗣️ The talker", listener: "👂 The listener", both: "⚖️ Both" },
    askMeAbout: "What can people ask you about?",
    askMeAboutPlaceholder: "e.g. my trip to Japan",
    favoriteSpot: "What's your favourite spot in {city}?",
    favoriteSpotPlaceholder: "e.g. a café, restaurant or park",
    wine: "Red, white or bubbles?",
    wines: { red: "Red", white: "White", bubbles: "Bubbles" },
    intoNow: "What are you really into right now?",
    intoNowPlaceholder: "e.g. padel, a series, learning Spanish",
    privacy: "We only share your first name and answers with your tablemates.",
    save: "Save",
    saving: "Saving…",
    savedTitle: "Great, saved!",
    savedBody: "We use your answers for the seating. Two days before, you'll get an email introducing your table to each other.",
    edit: "Edit",
    empty: "Fill in at least one question.",
    error: "Something went wrong. Please try again.",
    previewNote: "Preview: this is what the questions look like after booking. Nothing is saved.",
    bookingCode: "Booking number",
    bookingCodeHint: "It's in your confirmation email, e.g. MT-5B5230E1",
    bookingEmail: "Email address you booked with",
    bookingEmailPlaceholder: "you@email.com",
    bookingNotFound: "We can't find a booking with this number and email. Check your confirmation email.",
    bookingMissing: "Fill in your booking number and email.",
    bookingFound: "Booking found",
    plusOneTitle: "You're coming as two",
    plusOneName: "First name of your +1",
    plusOnePlaceholder: "e.g. Sophie",
    plusOneHint: "You'll sit at the same table.",
    plusOneManualHint: "Only if you bought 2 tickets. You'll sit at the same table.",
  },
} as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 text-sm text-wine shadow-sm transition placeholder:text-wine/35 focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10";

/** A row of three toggle buttons; clicking the selected one clears it. */
function ChoiceRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T | null) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-wine">{label}</span>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={() => onSelect(selected === option.value ? null : option.value)}
            className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
              selected === option.value
                ? "border-burgundy bg-burgundy text-cream"
                : "border-wine/15 bg-white text-wine/70 hover:border-wine/30"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Meet your table" questions for a Sunday Table guest. Shown right after
 * payment (identified by the checkout session) and on the page the reminder
 * email links to (identified by a signed token). When the link does not
 * identify a booking, the guest fills in their booking number and email. */
export function SundayTableIntroForm({
  locale,
  city,
  auth,
  bookingCode,
  seats,
  initial,
}: {
  locale: Locale;
  city: string;
  /** `preview` shows the real form but saves nothing, for looking at it
   * without a booking (the `?voorbeeld=1` page and test emails). `manual`
   * asks for the booking number and email instead of trusting the link. */
  auth: { sessionId: string } | { token: string } | { preview: true } | { manual: true };
  /** "MT-5B5230E1", shown at the top so guest and admin see the same code. */
  bookingCode?: string | null;
  /** Tickets on the booking; with 2, the buyer can name their +1. */
  seats?: number | null;
  initial?: Partial<SundayTableIntro> | null;
}) {
  const t = copy[locale === "en" ? "en" : "nl"];
  const manual = "manual" in auth;
  const [manualCode, setManualCode] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [conversationStyle, setConversationStyle] = useState<IntroConversationStyle | null>(
    initial?.conversationStyle ?? null,
  );
  const [askMeAbout, setAskMeAbout] = useState(initial?.askMeAbout ?? "");
  const [favoriteSpot, setFavoriteSpot] = useState(initial?.favoriteSpot ?? "");
  const [wine, setWine] = useState<IntroWine | null>(initial?.wine ?? null);
  const [intoNow, setIntoNow] = useState(initial?.intoNow ?? "");
  const [plusOneName, setPlusOneName] = useState(initial?.plusOneName ?? "");
  // Manual version: the booking typed in by the guest, once it is found.
  const [found, setFound] = useState<{
    reservationCode: string;
    city: string;
    seats: number;
  } | null>(null);
  const [lookupMissed, setLookupMissed] = useState(false);
  const lastLookup = useRef("");
  // Unknown until a manually entered booking is found, so offer it there too.
  const showPlusOne = seats === 2 || (manual && (found ? found.seats === 2 : true));
  const cityLabel = found?.city ?? city;

  /** Manual version: once both fields are filled in, find the booking and
   * show what was saved before. Only fills fields that are still empty, so
   * nothing the guest already typed on this page is replaced. */
  async function lookupBooking() {
    const code = manualCode.trim();
    const email = manualEmail.trim();
    if (!manual || !code || !email.includes("@")) return;
    const key = `${code.toLowerCase()}|${email.toLowerCase()}`;
    if (key === lastLookup.current) return;
    lastLookup.current = key;
    try {
      const res = await fetch("/api/sunday-table/intro/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationCode: code, email }),
      });
      if (!res.ok) {
        setFound(null);
        setLookupMissed(res.status === 404);
        return;
      }
      const data = (await res.json()) as {
        reservationCode: string;
        city: string;
        seats: number;
        intro: SundayTableIntro;
      };
      setFound({ reservationCode: data.reservationCode, city: data.city, seats: data.seats });
      setLookupMissed(false);
      setError(null);
      const saved = data.intro;
      setConversationStyle((v) => v ?? saved.conversationStyle);
      setWine((v) => v ?? saved.wine);
      setAskMeAbout((v) => v || saved.askMeAbout);
      setFavoriteSpot((v) => v || saved.favoriteSpot);
      setIntoNow((v) => v || saved.intoNow);
      setPlusOneName((v) => v || saved.plusOneName);
    } catch {
      // Not critical: saving still checks the number and email itself.
    }
  }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (
      !conversationStyle &&
      !askMeAbout.trim() &&
      !favoriteSpot.trim() &&
      !wine &&
      !intoNow.trim() &&
      !plusOneName.trim()
    ) {
      setError(t.empty);
      return;
    }
    if ("preview" in auth) {
      setError(null);
      setSaved(true);
      return;
    }
    if (manual && (!manualCode.trim() || !manualEmail.trim())) {
      setError(t.bookingMissing);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sunday-table/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(manual
            ? { reservationCode: manualCode, email: manualEmail }
            : auth),
          // Filling in this optional form after reading the privacy line is
          // the consent to share it with the table.
          intro: {
            conversationStyle,
            askMeAbout,
            favoriteSpot,
            wine,
            intoNow,
            plusOneName,
            shareConsent: true,
          },
        }),
      });
      if (!res.ok) {
        setError(res.status === 404 && manual ? t.bookingNotFound : t.error);
        return;
      }
      trackSundayTableCtaClicked({
        cta: "intro_saved",
        source:
          "sessionId" in auth ? "booking_confirmation" : manual ? "intro_manual" : "intro_email",
        locale,
      });
      setSaved(true);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pb-12 sm:pb-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8 sm:py-8">
        {"preview" in auth ? (
          <p className="mb-4 rounded-xl bg-gold/15 px-3.5 py-2 text-xs font-medium text-wine/75">
            {t.previewNote}
          </p>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t.eyebrow}
        </p>
        {saved ? (
          <div className="mt-2">
            <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
              {t.savedTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/65">{t.savedBody}</p>
            <button
              type="button"
              onClick={() => setSaved(false)}
              className="mt-4 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
            >
              {t.edit}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2">
            <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
              {t.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/65">{t.lead}</p>

            {manual ? (
              <div className="mt-6 grid gap-4 rounded-2xl border border-wine/10 bg-white/60 p-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-wine">
                  {t.bookingCode}
                  <input
                    type="text"
                    required
                    autoCapitalize="characters"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onBlur={lookupBooking}
                    placeholder="MT-5B5230E1"
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs font-normal text-wine/50">
                    {t.bookingCodeHint}
                  </span>
                </label>
                <label className="block text-sm font-medium text-wine">
                  {t.bookingEmail}
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onBlur={lookupBooking}
                    placeholder={t.bookingEmailPlaceholder}
                    className={inputClass}
                  />
                </label>
                {found ? (
                  <p className="text-sm text-wine sm:col-span-2">
                    <span aria-hidden className="text-emerald-700">✓</span> {t.bookingFound}:{" "}
                    <span className="font-mono font-semibold tracking-wide">
                      {found.reservationCode}
                    </span>
                  </p>
                ) : lookupMissed ? (
                  <p className="text-sm text-red-800 sm:col-span-2">{t.bookingNotFound}</p>
                ) : null}
              </div>
            ) : bookingCode ? (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-sm text-wine">
                <span className="text-wine/55">{t.bookingCode}:</span>
                <span className="font-mono font-semibold tracking-wide">{bookingCode}</span>
                <span aria-hidden className="text-emerald-700">✓</span>
              </p>
            ) : null}

            <div className="mt-6 space-y-4">
              <ChoiceRow
                label={t.style}
                options={(["talker", "listener", "both"] as const).map((value) => ({
                  value,
                  label: t.styles[value],
                }))}
                selected={conversationStyle}
                onSelect={setConversationStyle}
              />
              <ChoiceRow
                label={t.wine}
                options={(["red", "white", "bubbles"] as const).map((value) => ({
                  value,
                  label: t.wines[value],
                }))}
                selected={wine}
                onSelect={setWine}
              />
              <label className="block text-sm font-medium text-wine">
                {t.askMeAbout}
                <input
                  type="text"
                  maxLength={140}
                  value={askMeAbout}
                  onChange={(e) => setAskMeAbout(e.target.value)}
                  placeholder={t.askMeAboutPlaceholder}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-wine">
                {t.favoriteSpot.replace("{city}", cityLabel)}
                <input
                  type="text"
                  maxLength={140}
                  value={favoriteSpot}
                  onChange={(e) => setFavoriteSpot(e.target.value)}
                  placeholder={t.favoriteSpotPlaceholder}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-wine">
                {t.intoNow}
                <input
                  type="text"
                  maxLength={140}
                  value={intoNow}
                  onChange={(e) => setIntoNow(e.target.value)}
                  placeholder={t.intoNowPlaceholder}
                  className={inputClass}
                />
              </label>
            </div>

            {showPlusOne ? (
              <div className="mt-6 rounded-2xl border border-wine/10 bg-white/60 p-4">
                <p className="font-serif text-lg text-wine">{t.plusOneTitle}</p>
                <label className="mt-2 block text-sm font-medium text-wine">
                  {t.plusOneName}
                  <input
                    type="text"
                    maxLength={60}
                    autoComplete="off"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    placeholder={t.plusOnePlaceholder}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs font-normal text-wine/50">
                    {manual && !found ? t.plusOneManualHint : t.plusOneHint}
                  </span>
                </label>
              </div>
            ) : null}

            <p className="mt-4 text-xs text-wine/50">{t.privacy}</p>
            {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="cta-lift cta-lift-burgundy mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-cream hover:bg-wine disabled:opacity-60 sm:w-auto"
            >
              {saving ? t.saving : t.save}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
