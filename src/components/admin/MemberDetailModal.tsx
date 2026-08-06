"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { getAdminMemberDetailAction } from "@/app/admin/(dashboard)/members/actions";
import type {
  AdminMemberDetail,
  AdminMemberListRow,
  AdminMemberSubscriptionStatus,
} from "@/lib/admin-members-data";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function subscriptionPillClass(status: AdminMemberSubscriptionStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-900 ring-emerald-600/15";
    case "pending":
      return "bg-amber-100 text-amber-900 ring-amber-600/15";
    case "past_due":
      return "bg-red-100 text-red-900 ring-red-600/15";
    case "canceled":
      return "bg-wine/10 text-wine/55 ring-wine/10";
    default:
      return "bg-wine/5 text-wine/50 ring-wine/10";
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-wine/40">
        {label}
      </p>
      <p className="mt-1 text-sm text-wine">{value}</p>
    </div>
  );
}

export function MemberDetailModal({
  member,
  onClose,
}: {
  member: AdminMemberListRow;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const result = await getAdminMemberDetailAction(member.id);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDetail(result.detail);
    });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  const profile = detail?.member ?? member;
  const memberships = detail?.memberships ?? [];
  const sundayTables = detail?.sundayTables ?? [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-wine/35 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border-subtle bg-cream shadow-[0_24px_80px_rgba(43,13,18,0.28)] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle/80 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-xs text-wine/45">{profile.shortId}</p>
            <h2
              id={titleId}
              className="mt-1 truncate font-serif text-2xl text-burgundy"
            >
              {profile.name}
            </h2>
            <p className="mt-1 truncate text-sm text-wine/60">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${subscriptionPillClass(profile.subscriptionStatus)}`}
              >
                {profile.subscriptionStatusLabel}
              </span>
              <span className="text-xs text-wine/50">
                Joined {formatDate(profile.joinedAt)}
              </span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-subtle bg-beige/60 px-3 py-1.5 text-sm text-wine/70 transition hover:bg-beige hover:text-wine"
          >
            Sluiten
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-wine/45">
              Profiel
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Gender" value={profile.genderLabel} />
              <Field
                label="Leeftijd"
                value={
                  profile.age != null
                    ? `${profile.age}${profile.birthDate ? ` (${profile.birthDate})` : ""}`
                    : "—"
                }
              />
              <Field label="Stad" value={profile.citiesLabel} />
              <Field label="Intent" value={profile.joinIntentLabel} />
              <Field label="Tafel" value={profile.tableTypeLabel} />
              <Field label="Personality" value={profile.personalityLabel} />
              <Field label="Talen" value={profile.languagesLabel} />
              <Field label="Interesses" value={profile.interestsLabel} />
              <Field
                label="Community"
                value={profile.communityInterest ? "Ja" : "Nee"}
              />
              <Field
                label="Onboarding"
                value={profile.onboardingCompleted ? "Klaar" : "Open"}
              />
              <Field
                label="Laatste login"
                value={formatDateTime(profile.lastSignInAt)}
              />
              <Field label="User ID" value={profile.id} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-wine/45">
              Abonnementen
            </h3>
            {pending && !detail ? (
              <p className="mt-3 text-sm text-wine/55">Laden…</p>
            ) : error ? (
              <p className="mt-3 text-sm text-red-800">{error}</p>
            ) : memberships.length === 0 ? (
              <p className="mt-3 text-sm text-wine/55">Geen abonnementen.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border-subtle/70 overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/40">
                {memberships.map((row) => (
                  <li key={row.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-wine">{row.statusLabel}</p>
                      <p className="text-xs text-wine/45">
                        {formatDateTime(row.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-wine/55">
                      {row.currentPeriodEnd
                        ? `Tot ${formatDate(row.currentPeriodEnd)}`
                        : "Geen period-end"}
                      {row.cancelAtPeriodEnd ? " · zegt op" : ""}
                      {row.stripeSubscriptionId
                        ? ` · ${row.stripeSubscriptionId.slice(0, 18)}…`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-wine/45">
              Sunday Tables
            </h3>
            {pending && !detail ? (
              <p className="mt-3 text-sm text-wine/55">Laden…</p>
            ) : sundayTables.length === 0 ? (
              <p className="mt-3 text-sm text-wine/55">
                Nog geen Sunday Table-aanmeldingen.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border-subtle/70 overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/40">
                {sundayTables.map((row) => (
                  <li key={row.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-wine">
                        {row.city} · {row.tableDate}
                      </p>
                      <p className="text-xs uppercase tracking-[0.08em] text-wine/45">
                        {row.status}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-wine/55">
                      {row.tableTypeLabel}
                      {row.plusOne ? " · plus-one" : ""}
                      {` · aangemeld ${formatDate(row.createdAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
