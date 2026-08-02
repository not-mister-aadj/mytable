"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { accountPath, localePath } from "@/i18n/config";
import type {
  AccountOnboardingLabels,
  AccountSettingsLabels,
} from "@/i18n/account.types";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import {
  saveMemberLocalePreference,
  saveMemberOnboardingPrefs,
} from "@/features/auth/save-onboarding";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { trackLanguageChanged } from "@/lib/posthog/analytics";
import type { MemberOnboardingPrefs } from "@/lib/member-onboarding";

interface MemberAccountSettingsProps {
  settings: AccountSettingsLabels;
  onboarding: AccountOnboardingLabels;
  locale: Locale;
  email: string;
  initialPrefs: MemberOnboardingPrefs;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-wine/55">{label}</p>
      <p className="rounded-2xl border border-wine/10 bg-beige/50 px-4 py-3.5 text-sm text-wine/80">
        {value || "·"}
      </p>
    </div>
  );
}

function formatBirthDate(
  iso: string | null,
  locale: Locale,
  months: string[],
): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "·";
  const [year, month, day] = iso.split("-").map(Number);
  const monthLabel = months[month - 1];
  if (!monthLabel || !day || !year) return iso;
  return locale === "nl"
    ? `${day} ${monthLabel.toLowerCase()} ${year}`
    : `${monthLabel} ${day}, ${year}`;
}

function genderLabel(
  gender: MemberOnboardingPrefs["gender"],
  labels: AccountOnboardingLabels["gender"],
): string {
  if (gender === "woman") return labels.woman;
  if (gender === "man") return labels.man;
  if (gender === "non_binary") return labels.nonBinary;
  if (gender === "prefer_not") return labels.preferNot;
  return "·";
}

function personalityLabel(
  personality: MemberOnboardingPrefs["personality"],
  labels: AccountOnboardingLabels["personality"],
): string {
  if (personality === "introverted") return labels.introverted;
  if (personality === "ambivert") return labels.ambivert;
  if (personality === "extroverted") return labels.extroverted;
  return "·";
}

export function MemberAccountSettings({
  settings,
  onboarding,
  locale,
  email,
  initialPrefs,
}: MemberAccountSettingsProps) {
  const router = useRouter();
  const { signOut, refreshAuthSession } = useAuthSession();
  const [name, setName] = useState(initialPrefs.name);
  const [savedName, setSavedName] = useState(initialPrefs.name);
  const [saving, setSaving] = useState(false);
  const [switchingLocale, setSwitchingLocale] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const nameChanged = name.trim() !== savedName.trim();

  async function handleSaveName() {
    setFieldError(null);
    const nextName = name.trim();
    if (!nextName) {
      setFieldError(onboarding.name.required);
      return;
    }

    setSaving(true);
    setStatus("idle");
    try {
      await saveMemberOnboardingPrefs({
        ...initialPrefs,
        name: nextName,
      });
      setSavedName(nextName);
      setName(nextName);
      await refreshAuthSession();
      await syncMemberCustomerClient(locale, { recordOnboarding: true });
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLocaleChange(next: Locale) {
    if (next === locale || switchingLocale) return;
    setSwitchingLocale(true);
    trackLanguageChanged({
      from_language: locale,
      to_language: next,
      page_path: accountPath(locale),
    });
    try {
      await saveMemberLocalePreference(next);
      await syncMemberCustomerClient(next, { forceLanguage: true });
      router.replace(accountPath(next));
      router.refresh();
    } catch {
      setSwitchingLocale(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace(localePath(locale));
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-10 sm:px-8 sm:pt-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        MyTable
      </p>
      <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {settings.title}
      </h1>

      <div className="mt-8 space-y-3">
        <div>
          <label className="mb-1.5 block text-sm text-wine/55">
            {onboarding.name.label}
          </label>
          <input
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setStatus("idle");
            }}
            className="w-full rounded-2xl border border-wine/15 bg-white px-4 py-3.5 text-wine outline-none focus:border-wine/40"
          />
        </div>

        <ReadOnlyField label={settings.emailLabel} value={email} />
        <ReadOnlyField
          label={onboarding.birthdate.title}
          value={formatBirthDate(
            initialPrefs.birthDate,
            locale,
            onboarding.birthdate.months,
          )}
        />
        <ReadOnlyField
          label={settings.sectionGender}
          value={genderLabel(initialPrefs.gender, onboarding.gender)}
        />
        <ReadOnlyField
          label={settings.sectionPersonality}
          value={personalityLabel(
            initialPrefs.personality,
            onboarding.personality,
          )}
        />

        <div>
          <p className="mb-1.5 text-sm text-wine/55">{settings.languageLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["nl", onboarding.language.dutch],
                ["en", onboarding.language.english],
              ] as const
            ).map(([id, label]) => {
              const selected = locale === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={switchingLocale}
                  aria-pressed={selected}
                  onClick={() => void handleLocaleChange(id)}
                  className={`rounded-2xl border px-4 py-3.5 text-sm font-medium transition disabled:opacity-50 ${
                    selected
                      ? "border-wine bg-wine text-cream"
                      : "border-wine/15 bg-white text-wine hover:border-burgundy/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {fieldError ? (
        <p className="mt-6 text-center text-sm text-burgundy">{fieldError}</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-6 text-center text-sm text-burgundy">
          {settings.saveError}
        </p>
      ) : null}
      {status === "saved" ? (
        <p className="mt-6 text-center text-sm text-wine/60">{settings.saved}</p>
      ) : null}

      {nameChanged ? (
        <button
          type="button"
          onClick={() => void handleSaveName()}
          disabled={saving}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218] disabled:opacity-40"
        >
          {saving ? settings.saving : settings.save}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="mt-10 block w-full text-center text-sm text-wine/35 hover:text-wine disabled:opacity-50"
      >
        {signingOut ? settings.signingOut : settings.signOut}
      </button>
    </div>
  );
}
