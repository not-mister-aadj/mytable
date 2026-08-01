"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { AccountOnboardingLabels } from "@/i18n/account.types";
import { MemberOnboarding } from "@/components/account/MemberOnboarding";
import { saveMemberOnboardingPrefs } from "@/features/auth/save-onboarding";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import {
  EMPTY_ONBOARDING_PREFS,
  clearJoinPending,
  isJoinPending,
  isSundayTableOnboardingReady,
  postLoginPath,
  readOnboardingFromMetadata,
  readOnboardingFromSession,
  type MemberOnboardingPrefs,
} from "@/lib/member-onboarding";

type FlowStep =
  | "brand"
  | "name"
  | "birthdate"
  | "intent"
  | "story"
  | "goal"
  | "city"
  | "gender"
  | "tableType"
  | "personality"
  | "signup"
  | "tastes"
  | "done"
  | "welcomeBack";

interface MemberOnboardingGateProps {
  labels: AccountOnboardingLabels;
  locale: Locale;
  email: string;
  userMetadata?: Record<string, unknown> | null;
}

function parseStep(raw: string | null): FlowStep | null {
  if (raw === "language") return "brand";
  if (raw === "commit" || raw === "vibe") return "signup";
  if (
    raw === "brand" ||
    raw === "name" ||
    raw === "birthdate" ||
    raw === "intent" ||
    raw === "story" ||
    raw === "goal" ||
    raw === "city" ||
    raw === "gender" ||
    raw === "tableType" ||
    raw === "personality" ||
    raw === "signup" ||
    raw === "tastes" ||
    raw === "done" ||
    raw === "welcomeBack"
  ) {
    return raw;
  }
  return null;
}

function hasJoinSession(prefs: MemberOnboardingPrefs | null): boolean {
  return Boolean(prefs?.joinIntent);
}

function JoinResumeRedirect({
  prefs,
  locale,
  labels,
  email,
}: {
  prefs: MemberOnboardingPrefs;
  locale: Locale;
  labels: AccountOnboardingLabels;
  email: string;
}) {
  const router = useRouter();
  const { refreshAuthSession } = useAuthSession();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await saveMemberOnboardingPrefs(prefs);
        await refreshAuthSession();
        await syncMemberCustomerClient(locale, { recordOnboarding: true });
        clearJoinPending();
        if (cancelled) return;
        router.replace(
          postLoginPath(locale, prefs.joinIntent, {
            interests: prefs.interests,
          }),
        );
        router.refresh();
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefs, locale, refreshAuthSession, router]);

  if (failed) {
    return (
      <MemberOnboarding
        labels={labels}
        locale={locale}
        email={email}
        initialStep="done"
        initialPrefs={prefs}
        mode="account"
      />
    );
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-gradient-to-b from-beige via-cream to-cream">
      <p className="text-sm text-wine/50">…</p>
    </div>
  );
}

function MemberOnboardingInner({
  labels,
  locale,
  email,
  userMetadata,
}: MemberOnboardingGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completed, prefs: metaPrefs } =
    readOnboardingFromMetadata(userMetadata);

  const fromSession = readOnboardingFromSession();
  const joinPending = isJoinPending();
  const profileReady = isSundayTableOnboardingReady(completed, metaPrefs);
  const joinFromFunnel =
    !profileReady && joinPending && hasJoinSession(fromSession);

  const mergedPrefs: MemberOnboardingPrefs = (() => {
    const base: MemberOnboardingPrefs = {
      ...EMPTY_ONBOARDING_PREFS,
      ...metaPrefs,
      name:
        metaPrefs.name.trim() ||
        (typeof userMetadata?.full_name === "string"
          ? userMetadata.full_name
          : typeof userMetadata?.name === "string"
            ? userMetadata.name
            : ""),
    };

    if (!fromSession) return base;

    // Session fills gaps / join-funnel answers; never wipe profile fields
    // already saved in auth metadata.
    return {
      ...base,
      ...fromSession,
      name: fromSession.name.trim() || base.name,
      birthDate: fromSession.birthDate || base.birthDate,
      gender: fromSession.gender ?? base.gender,
      joinIntent: fromSession.joinIntent ?? base.joinIntent,
      company: fromSession.company ?? base.company,
      tableType: fromSession.tableType ?? base.tableType,
      personality: fromSession.personality ?? base.personality,
      cities:
        fromSession.cities.length > 0 ? fromSession.cities : base.cities,
      interests:
        fromSession.interests.length > 0
          ? fromSession.interests
          : base.interests,
      cityFlexible: fromSession.cityFlexible || base.cityFlexible,
      communityInterest:
        fromSession.communityInterest || base.communityInterest,
    };
  })();

  const resumeStep: FlowStep | undefined = (() => {
    const fromQuery = parseStep(searchParams.get("step"));
    if (fromQuery) return fromQuery;
    if (profileReady) return "welcomeBack";
    if (joinFromFunnel) {
      if (!mergedPrefs.name.trim()) return "name";
      if (!mergedPrefs.birthDate) return "birthdate";
      // Gender should already be in join session; if missing, full funnel.
      if (!mergedPrefs.gender) return "gender";
      return undefined;
    }
    return undefined;
  })();

  const canAutoFinish =
    joinFromFunnel &&
    Boolean(mergedPrefs.name.trim()) &&
    Boolean(mergedPrefs.birthDate) &&
    Boolean(mergedPrefs.gender) &&
    !searchParams.get("step");

  useEffect(() => {
    if (!searchParams.get("step")) return;
    router.replace(window.location.pathname);
  }, [router, searchParams]);

  if (canAutoFinish) {
    return (
      <JoinResumeRedirect
        prefs={mergedPrefs}
        locale={locale}
        labels={labels}
        email={email}
      />
    );
  }

  return (
    <MemberOnboarding
      labels={labels}
      locale={locale}
      email={email}
      initialStep={resumeStep}
      alreadyCompleted={profileReady && !searchParams.get("step")}
      initialPrefs={mergedPrefs}
      mode="account"
      resumeProfileOnly={
        joinFromFunnel &&
        Boolean(mergedPrefs.gender) &&
        (!mergedPrefs.name.trim() || !mergedPrefs.birthDate)
      }
    />
  );
}

export function MemberOnboardingGate(props: MemberOnboardingGateProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] bg-gradient-to-b from-beige via-cream to-cream" />
      }
    >
      <MemberOnboardingInner {...props} />
    </Suspense>
  );
}
