"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { BookingOutcomeLabels } from "@/i18n/types";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { BookingOutcomeTracker } from "@/components/booking/BookingOutcomeTracker";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";

const POLL_MS = 2000;
const POLL_MAX = 45;

type Props = {
  sessionId: string | null;
  locale: Locale;
  dict: BookingOutcomeLabels;
  initialSummary: BookingOutcomeSummary | null;
};

export function BookingConfirmationView({
  sessionId,
  locale,
  dict,
  initialSummary,
}: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!sessionId || summary) return;

    let cancelled = false;

    async function poll(attempt = 0): Promise<void> {
      if (cancelled) return;

      try {
        const params = new URLSearchParams({ session_id: sessionId!, locale });
        const res = await fetch(`/api/booking/confirmation?${params.toString()}`);
        if (res.ok) {
          const body = (await res.json()) as {
            summary?: BookingOutcomeSummary | null;
            pending?: boolean;
          };
          if (body.summary) {
            setSummary(body.summary);
            setTimedOut(false);
            return;
          }
        }
      } catch {
        // retry
      }

      if (attempt >= POLL_MAX) {
        setTimedOut(true);
        return;
      }

      window.setTimeout(() => void poll(attempt + 1), POLL_MS);
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId, locale, summary]);

  const showPending = Boolean(sessionId && !summary);

  return (
    <>
      <BookingOutcomeTracker
        variant="success"
        locale={locale}
        summary={summary}
      />
      <BookingOutcomeContent
        variant={showPending ? "pending" : "success"}
        dict={dict}
        locale={locale}
        summary={summary}
        timedOut={timedOut}
      />
    </>
  );
}
