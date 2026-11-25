"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveVenueAnswersAction } from "@/app/[locale]/aan-tafel/[token]/actions";
import type { DietaryAnswer } from "@/lib/jouw-tafel/quiz-logic";
import type { LiveMusicAnswer, VenueAnswers } from "@/lib/venue-questions";

/** "16:00" as "4pm" for English. */
const enTime = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h >= 12 ? "pm" : "am"}`;
};

const DIETS: Exclude<DietaryAnswer, "none">[] = ["vegetarian", "vegan", "gluten_free", "lactose_free", "nut_allergy", "other"];

const COPY = {
  nl: {
    title: (sunday: string) => `Twee vragen voor ${sunday.charAt(0).toLowerCase()}${sunday.slice(1)}`,
    saved: "Opgeslagen. Wil je nog iets aanpassen, dan kan dat hier.",
    dietQ: "Heb je een dieetwens of allergie?",
    dietWhy: "De keuken stemt de hapjes en de inkoop af op onze groep, zodat er voor iedereen iets lekkers klaarstaat.",
    no: "Nee",
    yes: "Ja",
    diets: { vegetarian: "Vegetarisch", vegan: "Veganistisch", gluten_free: "Glutenvrij", lactose_free: "Lactosevrij", nut_allergy: "Notenallergie", other: "Iets anders" },
    other: "Wat moet de keuken weten?",
    musicQ: (from: string) => `Vanaf ${from} speelt er live jazz. Lijkt het je leuk om daarvoor te blijven?`,
    music: { yes: "Ja, leuk", maybe: "Misschien", no: "Nee" },
    save: "Opslaan",
    saving: "Even geduld...",
    done: "Dank je, we geven het door.",
    error: "Dat lukte niet. Probeer het opnieuw.",
  },
  en: {
    title: (sunday: string) => `Two questions for ${sunday}`,
    saved: "Saved. Want to change something? You can do that here.",
    dietQ: "Do you have a dietary wish or allergy?",
    dietWhy: "The kitchen plans the bites and the shopping around our group, so there's something tasty for everyone.",
    no: "No",
    yes: "Yes",
    diets: { vegetarian: "Vegetarian", vegan: "Vegan", gluten_free: "Gluten-free", lactose_free: "Lactose-free", nut_allergy: "Nut allergy", other: "Something else" },
    other: "What should the kitchen know?",
    musicQ: (from: string) => `From ${enTime(from)} there's live jazz. Would you like to stay for it?`,
    music: { yes: "Yes, sounds fun", maybe: "Maybe", no: "No" },
    save: "Save",
    saving: "One moment...",
    done: "Thanks, we'll pass it on.",
    error: "That didn't work. Please try again.",
  },
} as const;

const chip = (on: boolean) =>
  `rounded-xl border px-4 py-2.5 text-sm transition ${on ? "border-burgundy bg-burgundy/5 font-semibold text-burgundy" : "border-gold/40 bg-white text-wine hover:border-burgundy/50"}`;

/**
 * Diet (and, where the venue has live music, staying for it). A tap in the
 * mail is saved as the page opens in a real browser; the rest is a form.
 */
export function VenueQuestions({
  token,
  locale,
  sunday,
  musicFrom,
  initial,
  tapped,
}: {
  token: string;
  locale: "nl" | "en";
  /** "Zondag 6 december". */
  sunday: string;
  /** "16:00" when the venue asks about live music. */
  musicFrom: string | null;
  initial: VenueAnswers;
  /** What was tapped in the mail. */
  tapped: VenueAnswers;
}) {
  const t = COPY[locale];
  const [a, setA] = useState<VenueAnswers>({ ...initial, ...tapped });
  const [state, setState] = useState<"idle" | "saved" | "done" | "error">("idle");
  const [pending, start] = useTransition();
  const sent = useRef(false);
  const save = (patch: VenueAnswers, after: "saved" | "done") =>
    start(async () => {
      const r = await saveVenueAnswersAction(token, patch);
      setState(r.ok ? after : "error");
    });
  useEffect(() => {
    if (sent.current || Object.keys(tapped).length === 0) return;
    sent.current = true;
    save(tapped, "saved");
    // Once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (d: Exclude<DietaryAnswer, "none">) =>
    setA((s) => {
      const list = s.dietary ?? [];
      return { ...s, diet: "some", dietary: list.includes(d) ? list.filter((x) => x !== d) : [...list, d] };
    });

  if (state === "done") {
    return (
      <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center sm:px-8">
        <p className="font-serif text-3xl text-wine">{t.done}</p>
        <p className="mt-2 text-sm text-wine/70">{sunday}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8">
      {state === "saved" ? <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">{t.saved}</p> : null}
      <h1 className="font-serif text-3xl font-medium text-wine">{t.title(sunday)}</h1>

      <p className="mt-6 font-semibold text-wine">{t.dietQ}</p>
      <p className="mt-1 text-sm leading-relaxed text-wine/65">{t.dietWhy}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className={chip(a.diet === "none")} onClick={() => setA((s) => ({ ...s, diet: "none", dietary: [], dietaryOther: "" }))}>
          {t.no}
        </button>
        <button type="button" className={chip(a.diet === "some")} onClick={() => setA((s) => ({ ...s, diet: "some" }))}>
          {t.yes}
        </button>
      </div>
      {a.diet === "some" ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DIETS.map((d) => (
              <button key={d} type="button" className={chip((a.dietary ?? []).includes(d))} onClick={() => toggle(d)}>
                {t.diets[d]}
              </button>
            ))}
          </div>
          <textarea
            id="venue-diet-other"
            value={a.dietaryOther ?? ""}
            onChange={(e) => setA((s) => ({ ...s, diet: "some", dietaryOther: e.target.value }))}
            maxLength={300}
            rows={2}
            placeholder={t.other}
            className="mt-3 w-full rounded-xl border border-gold/40 bg-white px-3 py-2.5 text-sm text-wine outline-none focus:border-burgundy"
          />
        </>
      ) : null}

      {musicFrom ? (
        <>
          <p className="mt-7 font-semibold text-wine">{t.musicQ(musicFrom)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["yes", "maybe", "no"] as LiveMusicAnswer[]).map((m) => (
              <button key={m} type="button" className={chip(a.liveMusic === m)} onClick={() => setA((s) => ({ ...s, liveMusic: m }))}>
                {t.music[m]}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={() => save({ diet: a.diet, dietary: a.dietary, dietaryOther: a.dietaryOther, ...(musicFrom && a.liveMusic ? { liveMusic: a.liveMusic } : {}) }, "done")}
        className="mt-8 rounded-full bg-burgundy px-7 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
      >
        {pending ? t.saving : t.save}
      </button>
      {state === "error" ? <p className="mt-3 text-sm text-red-800">{t.error}</p> : null}
    </section>
  );
}
