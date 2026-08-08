"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type {
  AccountAuthLabels,
  AccountOnboardingLabels,
} from "@/i18n/account.types";
import { MemberOnboarding } from "@/components/account/MemberOnboarding";
import {
  EMPTY_ONBOARDING_PREFS,
  readOnboardingFromSession,
  readPreferredCity,
  rememberPreferredCity,
  type MemberOnboardingPrefs,
} from "@/lib/member-onboarding";
import { parseSundayTableLpCityParam } from "@/data/sunday-table-lp-cities";

type FlowStep =
  | "language"
  | "brand"
  | "intent"
  | "city"
  | "gender"
  | "tableType"
  | "signup"
  | "tastes";

function parseStep(raw: string | null): FlowStep | null {
  if (raw === "commit" || raw === "vibe") return "signup";
  // Legacy deep-links from the longer funnel
  if (raw === "story" || raw === "goal") return "intent";
  if (raw === "personality") return "gender";
  if (
    raw === "language" ||
    raw === "brand" ||
    raw === "intent" ||
    raw === "city" ||
    raw === "gender" ||
    raw === "tableType" ||
    raw === "signup" ||
    raw === "tastes"
  ) {
    return raw;
  }
  return null;
}

function JoinFunnelInner({
  labels,
  authLabels,
  locale,
  authenticated,
}: {
  labels: AccountOnboardingLabels;
  authLabels: AccountAuthLabels;
  locale: Locale;
  authenticated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [initialStep] = useState<FlowStep>(() => {
    const fromQuery = parseStep(searchParams.get("step"));

    // Login first for anonymous users — unless they just picked a language.
    if (!authenticated) {
      if (fromQuery === "signup") return "signup";
      return "language";
    }

    if (
      !fromQuery ||
      fromQuery === "brand" ||
      fromQuery === "signup"
    ) {
      return "language";
    }
    return fromQuery;
  });

  const [initialPrefs] = useState<MemberOnboardingPrefs>(() => {
    const stored = readOnboardingFromSession() ?? { ...EMPTY_ONBOARDING_PREFS };
    const cityFromQuery = parseSundayTableLpCityParam(searchParams.get("city"));
    if (cityFromQuery) {
      rememberPreferredCity(cityFromQuery);
    }
    const preferredCity = cityFromQuery ?? readPreferredCity();
    const citiesFromLp = preferredCity ? [preferredCity] : [];

    const step = authenticated
      ? parseStep(searchParams.get("step"))
      : "signup";

    // Choice steps always start empty — never restore a pre-selected option.
    // City from the Sunday Table LP is kept so the city step can stay prefilled.
    if (
      !step ||
      step === "language" ||
      step === "brand" ||
      step === "intent" ||
      step === "signup"
    ) {
      return {
        ...stored,
        joinIntent: null,
        gender: null,
        tableType: null,
        personality: null,
        interests: [],
        cities: citiesFromLp,
        cityFlexible: false,
        company: null,
      };
    }
    if (step === "gender") {
      return { ...stored, gender: null, tableType: null, personality: null };
    }
    if (step === "tableType") {
      return { ...stored, tableType: null };
    }
    if (step === "tastes") {
      return { ...stored, interests: [] };
    }
    if (step === "city") {
      return {
        ...stored,
        cities: citiesFromLp,
        cityFlexible: false,
      };
    }
    return {
      ...stored,
      cities:
        stored.cities.length > 0 ? stored.cities : citiesFromLp,
    };
  });

  useEffect(() => {
    const cityFromQuery = parseSundayTableLpCityParam(searchParams.get("city"));
    if (cityFromQuery) {
      rememberPreferredCity(cityFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try {
        sessionStorage.setItem("mytable_ref", ref.trim().toUpperCase());
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authenticated) return;
    let code: string | null = null;
    try {
      code = sessionStorage.getItem("mytable_ref");
    } catch {
      return;
    }
    if (!code) return;
    void fetch("/api/referral/attribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then((res) => {
      if (res.ok) {
        try {
          sessionStorage.removeItem("mytable_ref");
        } catch {
          // ignore
        }
      }
    });
  }, [authenticated]);

  useEffect(() => {
    if (
      !searchParams.get("step") &&
      !searchParams.get("ref") &&
      !searchParams.get("city")
    ) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("step");
    url.searchParams.delete("ref");
    url.searchParams.delete("city");
    router.replace(url.pathname);
  }, [router, searchParams]);

  return (
    <MemberOnboarding
      labels={labels}
      authLabels={authLabels}
      locale={locale}
      email=""
      mode="join"
      initialStep={initialStep}
      initialPrefs={initialPrefs}
    />
  );
}

export function JoinFunnel(props: {
  labels: AccountOnboardingLabels;
  authLabels: AccountAuthLabels;
  locale: Locale;
  /** Logged in but onboarding incomplete — skip signup, start prefs. */
  authenticated?: boolean;
}) {
  const { authenticated = false, ...rest } = props;
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] bg-gradient-to-b from-beige via-cream to-cream" />
      }
    >
      <JoinFunnelInner {...rest} authenticated={authenticated} />
    </Suspense>
  );
}
