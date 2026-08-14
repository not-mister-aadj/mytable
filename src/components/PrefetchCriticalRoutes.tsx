"use client";

import { agendaPath, sundayTableLpPath, type Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PrefetchCriticalRoutesProps {
  locale: Locale;
  /** Extra hrefs to prefetch (e.g. visible experience cards). */
  hrefs?: string[];
}

export function PrefetchCriticalRoutes({
  locale,
  hrefs = [],
}: PrefetchCriticalRoutesProps) {
  const router = useRouter();

  useEffect(() => {
    const routes = [agendaPath(locale), sundayTableLpPath(locale), ...hrefs];
    for (const href of routes) {
      router.prefetch(href);
    }
  }, [router, locale, hrefs.join("|")]);

  return null;
}
