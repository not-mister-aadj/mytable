"use client";

import { useState, useTransition } from "react";
import { submitReportAction } from "@/app/[locale]/hoe-was-het/[token]/actions";
import type { FeedbackPage } from "@/lib/feedback";

const COPY = {
  nl: {
    kicker: "Alleen voor ons",
    title: "Laat het ons weten",
    intro: "Gebeurde er iets waar je je niet prettig bij voelde? Vertel het ons. Alleen wij lezen dit, niemand anders ziet het.",
    who: "Over wie gaat het?",
    other: "Iemand anders",
    what: "Wat gebeurde er?",
    contact: "Mogen we contact met je opnemen?",
    send: "Versturen",
    sending: "Versturen...",
    thanksTitle: "Dank je dat je het ons vertelt",
    thanksBody: "We lezen het zo snel mogelijk en nemen het serieus.",
    thanksContact: "We nemen contact met je op.",
    error: "Versturen lukte niet. Probeer het opnieuw, of mail ons op info@mytable.club.",
  },
  en: {
    kicker: "Only for us",
    title: "Let us know",
    intro: "Did something happen that didn't feel right? Tell us. Only we read this, nobody else sees it.",
    who: "Who is it about?",
    other: "Someone else",
    what: "What happened?",
    contact: "May we get in touch with you?",
    send: "Send",
    sending: "Sending...",
    thanksTitle: "Thank you for telling us",
    thanksBody: "We'll read it as soon as we can, and we take it seriously.",
    thanksContact: "We'll get in touch with you.",
    error: "Sending didn't work. Try again, or email us at info@mytable.club.",
  },
} as const;

const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
const chip = (on: boolean) => `rounded-full px-3.5 py-1.5 text-sm transition ${on ? "bg-burgundy text-cream" : "bg-white text-wine ring-1 ring-wine/15"}`;

export function ReportForm({ page, token }: { page: FeedbackPage; token: string }) {
  const t = COPY[page.locale];
  const [about, setAbout] = useState<string[]>([]);
  const [aboutOther, setAboutOther] = useState(false);
  const [body, setBody] = useState("");
  const [contactOk, setContactOk] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  const toggle = (id: string) => setAbout((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const send = () =>
    start(async () => {
      const r = await submitReportAction(token, { about, aboutOther, body, contactOk });
      if (r.ok) setSent(true);
      else setError(true);
    });

  if (sent) {
    return (
      <section className={`${card} text-center`}>
        <p className="font-serif text-2xl text-wine">{t.thanksTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-wine/70">
          {t.thanksBody} {contactOk ? t.thanksContact : null}
        </p>
      </section>
    );
  }

  return (
    <section className={card}>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-wine/45">{t.kicker}</p>
      <h1 className="mt-1 font-serif text-3xl font-medium text-wine sm:text-4xl">{t.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-wine/65">{t.intro}</p>

      <p className="mt-6 text-sm font-medium text-wine">{t.who}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {page.tablemates.map((m) => (
          <button key={m.bookingId} type="button" onClick={() => toggle(m.bookingId)} className={chip(about.includes(m.bookingId))}>
            {m.firstName}
          </button>
        ))}
        <button type="button" onClick={() => setAboutOther((v) => !v)} className={chip(aboutOther)}>
          {t.other}
        </button>
      </div>

      <label className="mt-6 block text-sm font-medium text-wine">
        {t.what}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={4000}
          className="mt-2 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 text-sm text-wine shadow-sm focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10"
        />
      </label>

      <label className="mt-4 flex items-center gap-2.5 text-sm text-wine">
        <input type="checkbox" checked={contactOk} onChange={(e) => setContactOk(e.target.checked)} className="h-4 w-4 accent-burgundy" />
        {t.contact}
      </label>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          disabled={pending || !body.trim()}
          onClick={send}
          className="rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
        >
          {pending ? t.sending : t.send}
        </button>
        {error ? <span className="text-sm text-red-800">{t.error}</span> : null}
      </div>
    </section>
  );
}
