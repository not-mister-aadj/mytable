"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { jouwTafelLogInPath, jouwTafelSettingsPath, type Locale } from "@/i18n/config";

/**
 * On the confirmation page, right after paying: says once that they now
 * have an account (their first booking), and signs a new guest in on this
 * device (see /api/auth/after-booking for who that is).
 */
export function AccountAfterBooking({ locale, sessionId }: { locale: Locale; sessionId: string }) {
  const [state, setState] = useState<{ first: boolean; signedIn: boolean } | null>(null);

  useEffect(() => {
    let gone = false;
    fetch("/api/auth/after-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { first?: boolean; signedIn?: boolean } | null) => {
        if (!gone && data) setState({ first: Boolean(data.first), signedIn: Boolean(data.signedIn) });
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [sessionId]);

  if (!state?.first) return null;
  const en = locale === "en";
  const settings = jouwTafelSettingsPath(locale);
  return (
    <p className="mt-6 rounded-2xl border border-gold/30 bg-cream px-5 py-4 text-center text-[0.95rem] leading-relaxed text-wine/80">
      {en ? "You now have a MyTable account on this email address." : "Je hebt nu een MyTable-account op dit e-mailadres."}{" "}
      <Link
        href={state.signedIn ? settings : `${jouwTafelLogInPath(locale)}?naar=${encodeURIComponent(settings)}`}
        className="whitespace-nowrap font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4"
      >
        {en ? "View your booking" : "Bekijk je boeking"}
      </Link>
    </p>
  );
}
