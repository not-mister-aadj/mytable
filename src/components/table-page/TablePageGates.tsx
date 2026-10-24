"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { shareTableIntroAction } from "@/app/[locale]/aan-tafel/[token]/actions";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import type { Locale } from "@/i18n/config";

/** Not filled in yet: the intro form first, the table right after saving. */
export function TableIntroGate({
  locale,
  city,
  introToken,
  bookingCode,
  seats,
  lead,
}: {
  locale: Locale;
  city: string;
  introToken: string;
  bookingCode: string;
  seats: number;
  lead: string;
}) {
  const router = useRouter();
  return (
    <section>
      <p className="mb-3 px-1 text-sm text-wine/70">{lead}</p>
      <SundayTableIntroForm
        locale={locale}
        city={city}
        auth={{ token: introToken }}
        bookingCode={bookingCode}
        seats={seats}
        initial={null}
        onSaved={() => router.refresh()}
      />
    </section>
  );
}

/** Filled in but not shared: one button, then the table shows. */
export function TableShareGate({
  token,
  copy,
}: {
  token: string;
  copy: { lead: string; note: string; button: string; error: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="mt-5 rounded-2xl border border-wine/10 bg-white/60 p-5 text-center">
      <p className="text-sm text-wine">{copy.lead}</p>
      <p className="mt-1 text-xs text-wine/55">{copy.note}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await shareTableIntroAction(token);
            if (result.ok) router.refresh();
            else setError(true);
          })
        }
        className="mt-4 rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
      >
        {copy.button}
      </button>
      {error ? <p className="mt-3 text-sm text-red-800">{copy.error}</p> : null}
    </div>
  );
}
