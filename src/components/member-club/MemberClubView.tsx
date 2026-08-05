"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { accountPath } from "@/i18n/config";
import type { MemberClubLabels } from "@/i18n/member-club.types";
import {
  canChooseGirlsOnly,
  ACTIVE_ONBOARDING_CITIES,
  VISIBLE_ONBOARDING_CITIES,
  choiceToLanguages,
  isActiveOnboardingCity,
  isComingSoonOnboardingCity,
  languagesToChoice,
  parseOnboardingLanguages,
  type CommunicationLanguageChoice,
  type OnboardingCityId,
  type OnboardingGenderId,
  type OnboardingLanguageId,
  type OnboardingTableTypeId,
} from "@/lib/member-onboarding";
import { saveMemberLanguages } from "@/features/auth/save-onboarding";
import {
  amsterdamDateIso,
  formatSundayTableCardDate,
  formatSundayTableCardDateTime,
  formatSundayTableRsvpDeadline,
  formatSundayTableTime,
  getSundayTableRsvpWindow,
  getUpcomingSundayWineTables,
  type SundayTableRsvpWindow,
} from "@/lib/sunday-wine-table";
import {
  trackInviteShareClicked,
  trackSundayRsvp,
} from "@/lib/posthog/analytics";
import { seatStatsKey } from "@/lib/sunday-table-seat-key";
import { MemberClubPaywall } from "./MemberClubPaywall";
import { MemberClubConfirmDialog } from "./MemberClubConfirmDialog";
import {
  MemberClubMembershipPanel,
  type MembershipSummary,
} from "./MemberClubMembershipPanel";
import type { MemberSundaySignup } from "@/lib/club/memberships";

const HERO_IMAGE = "/girls-only/table-wine-laughing.jpg";

const EVENT_IMAGES = [
  "/girls-only/table-wine-laughing.jpg",
  "/girls-only/table-group.jpg",
  "/girls-only/smiling-glasses.jpg",
  "/girls-only/wine-moment.jpg",
] as const;

const EXPLAIN_IMAGES = [
  "/girls-only/table-wine-laughing.jpg",
  "/girls-only/table-group.jpg",
  "/girls-only/smiling-glasses.jpg",
] as const;

const BENEFIT_IMAGES = [
  "/girls-only/connecting.jpg",
  "/girls-only/table-group.jpg",
  "/girls-only/wine-moment.jpg",
  "/girls-only/smiling-glasses.jpg",
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

type CityId = OnboardingCityId;
type TableFilterId = "girls_only" | "mixed";

type ClubEvent = {
  id: string;
  city: CityId;
  date: Date;
  image: string;
  tableType: TableFilterId;
};

function signupForEvent(
  signups: MemberSundaySignup[],
  event: { city: string; date: Date; tableType: string },
): MemberSundaySignup | undefined {
  const dateIso = amsterdamDateIso(event.date);
  return signups.find(
    (s) =>
      s.city === event.city &&
      s.tableDate === dateIso &&
      s.tableType === event.tableType,
  );
}

/** Other confirmed RSVP on the same Sunday (would be released on reserve). */
function conflictingConfirmedSignup(
  signups: MemberSundaySignup[],
  event: { city: string; date: Date; tableType: string },
): MemberSundaySignup | undefined {
  const dateIso = amsterdamDateIso(event.date);
  return signups.find(
    (s) =>
      s.status === "confirmed" &&
      s.tableDate === dateIso &&
      !(s.city === event.city && s.tableType === event.tableType),
  );
}

function tableTypeLabel(
  tableType: string,
  labels: MemberClubLabels["rsvp"],
): string {
  return tableType === "girls_only" ? labels.girlsOnly : labels.mixed;
}

type ConfirmState =
  | { kind: "plusOne"; signupId: string; nextValue: boolean }
  | { kind: "cancelGoing"; signupId: string }
  | { kind: "reserve"; event: ClubEvent }
  | { kind: "replaceSeat"; event: ClubEvent; conflicting: MemberSundaySignup };

interface MemberClubViewProps {
  labels: MemberClubLabels;
  locale: Locale;
  preferredCities: string[];
  preferredLanguages?: OnboardingLanguageId[];
  gender: OnboardingGenderId | null;
  preferredTableType: OnboardingTableTypeId | null;
  /** Name + birth date + gender collected via onboarding */
  onboardingReady: boolean;
  membership: MembershipSummary;
  signups: MemberSundaySignup[];
  checkoutFlash: "success" | "cancel" | null;
  isMember: boolean;
  /** city__date__type -> seats left */
  seatStats?: Record<string, { seatsLeft: number; capacity: number }>;
  /** After checkout: scroll to tables and claim */
  claimSeat?: boolean;
  invite?: {
    shareUrl: string;
  } | null;
}

function initialSelectedCities(preferredCities: string[]): CityId[] {
  const preferred = preferredCities.filter((c): c is CityId =>
    isActiveOnboardingCity(c),
  );
  if (preferred.length > 0) return preferred;
  return [ACTIVE_ONBOARDING_CITIES[0]!];
}

function initialTableFilters(
  preferredTableType: OnboardingTableTypeId | null,
): TableFilterId[] {
  if (preferredTableType === "girls_only") return ["girls_only"];
  if (preferredTableType === "mixed") return ["mixed"];
  return ["girls_only", "mixed"];
}

function rsvpDeadlineLabel(
  window: SundayTableRsvpWindow,
  labels: MemberClubLabels["rsvp"],
  tableSunday: Date,
  locale: Locale,
): string {
  if (window === "closed") return labels.signupClosed;
  const deadline = formatSundayTableRsvpDeadline(tableSunday, locale);
  const template =
    window === "urgent" ? labels.signupUrgent : labels.signupOpen;
  return template.replace("{deadline}", deadline);
}

function rsvpDeadlineTextClass(window: SundayTableRsvpWindow): string {
  if (window === "closed") return "text-wine/45";
  if (window === "urgent") return "font-medium text-burgundy";
  return "text-wine/55";
}

export function MemberClubView({
  labels,
  locale,
  preferredCities,
  preferredLanguages = ["nl"],
  gender,
  preferredTableType,
  onboardingReady,
  membership,
  signups,
  checkoutFlash,
  isMember,
  seatStats = {},
  claimSeat = false,
  invite = null,
}: MemberClubViewProps) {
  const router = useRouter();
  const showTableFilter = canChooseGirlsOnly(gender);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [localSignups, setLocalSignups] = useState(signups);

  useEffect(() => {
    setLocalSignups(signups);
  }, [signups]);

  const [selectedCities, setSelectedCities] = useState<CityId[]>(() =>
    initialSelectedCities(preferredCities),
  );
  const [selectedTables, setSelectedTables] = useState<TableFilterId[]>(() =>
    initialTableFilters(preferredTableType),
  );
  const [selectedLanguages, setSelectedLanguages] = useState<
    OnboardingLanguageId[]
  >(() => parseOnboardingLanguages(preferredLanguages));
  const selectedLanguageChoice = languagesToChoice(selectedLanguages);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ClubEvent | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    if (!claimSeat) return;
    const el = document.getElementById("happening");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [claimSeat]);

  const upcomingDates = useMemo(() => getUpcomingSundayWineTables(1), []);
  const timeLabel = formatSundayTableTime(locale);

  const events = useMemo(() => {
    if (upcomingDates.length === 0) return [];

    const tableTypes: TableFilterId[] = showTableFilter
      ? selectedTables
      : ["mixed"];

    const out: ClubEvent[] = [];
    let imageIndex = 0;
    for (const date of upcomingDates) {
      for (const city of selectedCities) {
        for (const tableType of tableTypes) {
          out.push({
            id: `${city}-${tableType}-${date.toISOString()}`,
            city,
            date,
            image: EVENT_IMAGES[imageIndex % EVENT_IMAGES.length]!,
            tableType,
          });
          imageIndex += 1;
        }
      }
    }
    return out;
  }, [selectedCities, selectedTables, upcomingDates, showTableFilter]);

  useEffect(() => {
    if (!activeEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveEvent(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [activeEvent]);

  function toggleCity(city: CityId) {
    if (!isActiveOnboardingCity(city)) return;
    setSelectedCities((prev) => {
      if (prev.includes(city)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== city);
      }
      return [...prev, city];
    });
  }

  function toggleTable(table: TableFilterId) {
    setSelectedTables((prev) => {
      if (prev.includes(table)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== table);
      }
      return [...prev, table];
    });
  }

  async function selectLanguageChoice(choice: CommunicationLanguageChoice) {
    if (languageBusy) return;
    if (choice === selectedLanguageChoice) return;
    const next = choiceToLanguages(choice);
    setSelectedLanguages(next);
    setLanguageBusy(true);
    try {
      await saveMemberLanguages(next);
    } catch {
      setSelectedLanguages(selectedLanguages);
    } finally {
      setLanguageBusy(false);
    }
  }

  function requireOnboardingForTable(tableType: TableFilterId): boolean {
    if (!onboardingReady) {
      router.push(accountPath(locale));
      return false;
    }
    if (tableType === "girls_only" && !canChooseGirlsOnly(gender)) {
      setRsvpError(labels.rsvp.girlsOnlyRestricted);
      return false;
    }
    return true;
  }

  async function patchRsvp(
    signupId: string,
    body: { plusOne?: boolean; cancel?: boolean; reactivate?: boolean },
  ) {
    const previous = localSignups;
    // Optimistic UI: flip state immediately, sync with server in the background.
    setLocalSignups((prev) =>
      prev.map((s) => {
        if (s.id !== signupId) {
          if (body.reactivate && s.status === "confirmed") {
            // Same-date conflict may be released server-side; leave for refresh.
            return s;
          }
          return s;
        }
        if (typeof body.plusOne === "boolean") {
          return { ...s, plusOne: body.plusOne };
        }
        if (body.cancel) {
          return {
            ...s,
            status: "cancelled",
            plusOne: false,
            cancelledAt: new Date().toISOString(),
          };
        }
        if (body.reactivate) {
          return {
            ...s,
            status: "confirmed",
            cancelledAt: null,
          };
        }
        return s;
      }),
    );

    setRsvpBusy(true);
    setRsvpError(null);
    try {
      const res = await fetch("/api/clubmember/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupId, ...body }),
      });
      if (!res.ok) {
        setLocalSignups(previous);
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setRsvpError(
          data?.error === "Signup closed"
            ? labels.rsvp.signupClosedError
            : data?.error === "Onboarding required"
              ? labels.rsvp.onboardingRequired
              : data?.error === "Girls only"
                ? labels.rsvp.girlsOnlyRestricted
                : (data?.error ?? labels.paywall.errorGeneric),
        );
        return;
      }
      // Soft refresh; UI already updated.
      void router.refresh();
    } catch {
      setLocalSignups(previous);
      setRsvpError(labels.paywall.errorGeneric);
    } finally {
      setRsvpBusy(false);
    }
  }

  async function runReserveSeat(event: ClubEvent) {
    const signup = signupForEvent(localSignups, event);
    const cancelled = signup?.status === "cancelled";
    const pending = signup?.status === "pending_payment";
    if (signup && (cancelled || pending)) {
      await patchRsvp(signup.id, { reactivate: true });
      return;
    }
    setRsvpBusy(true);
    setRsvpError(null);
    try {
      const res = await fetch("/api/clubmember/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: event.city,
          tableDate: amsterdamDateIso(event.date),
          tableType: event.tableType,
          planId: membership.planId ?? "12m",
          locale,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (data?.error === "Onboarding required") {
          router.push(accountPath(locale));
          return;
        }
        setRsvpError(
          data?.error === "Signup closed"
            ? labels.rsvp.signupClosedError
            : data?.error === "Girls only"
              ? labels.rsvp.girlsOnlyRestricted
              : (data?.error ?? labels.paywall.errorGeneric),
        );
        return;
      }
      trackSundayRsvp({
        city: event.city,
        table_type: event.tableType,
        locale,
      });
      void router.refresh();
    } catch {
      setRsvpError(labels.paywall.errorGeneric);
    } finally {
      setRsvpBusy(false);
    }
  }

  function requestReserveSeat(event: ClubEvent) {
    const rsvpWindow = getSundayTableRsvpWindow(event.date);
    const rsvpOpen = rsvpWindow !== "closed";
    const signup = signupForEvent(localSignups, event);
    const confirmed = signup?.status === "confirmed";
    const statsKey = seatStatsKey(
      event.city,
      amsterdamDateIso(event.date),
      event.tableType,
    );
    const seatsLeft = seatStats[statsKey]?.seatsLeft;
    const soldOut =
      typeof seatsLeft === "number" && seatsLeft <= 0 && !confirmed;
    if (rsvpBusy || !rsvpOpen || soldOut) return;
    if (!requireOnboardingForTable(event.tableType)) return;

    const conflicting = conflictingConfirmedSignup(localSignups, event);
    if (conflicting) {
      setConfirm({ kind: "replaceSeat", event, conflicting });
      return;
    }
    setConfirm({ kind: "reserve", event });
  }

  async function handleConfirmAction() {
    if (!confirm || rsvpBusy) return;
    const action = confirm;
    setConfirm(null);
    if (action.kind === "plusOne") {
      await patchRsvp(action.signupId, { plusOne: action.nextValue });
      return;
    }
    if (action.kind === "cancelGoing") {
      await patchRsvp(action.signupId, { cancel: true });
      return;
    }
    await runReserveSeat(action.event);
  }

  const confirmCopy = (() => {
    if (!confirm) return null;
    if (confirm.kind === "plusOne") {
      const adding = confirm.nextValue;
      return {
        title: adding
          ? labels.rsvp.confirmPlusOneAddTitle
          : labels.rsvp.confirmPlusOneRemoveTitle,
        body: adding
          ? labels.rsvp.confirmPlusOneAddBody
          : labels.rsvp.confirmPlusOneRemoveBody,
        confirmLabel: adding
          ? labels.rsvp.confirmPlusOneAddCta
          : labels.rsvp.confirmPlusOneRemoveCta,
      };
    }
    if (confirm.kind === "cancelGoing") {
      return {
        title: labels.rsvp.confirmCancelGoingTitle,
        body: labels.rsvp.confirmCancelGoingBody,
        confirmLabel: labels.rsvp.confirmCancelGoingCta,
      };
    }
    if (confirm.kind === "reserve") {
      return {
        title: labels.rsvp.confirmReserveTitle,
        body: labels.rsvp.confirmReserveBody,
        confirmLabel: labels.rsvp.confirmReserveCta,
      };
    }
    const fromTable = tableTypeLabel(confirm.conflicting.tableType, labels.rsvp);
    const toTable = tableTypeLabel(confirm.event.tableType, labels.rsvp);
    return {
      title: labels.rsvp.confirmReplaceSeatTitle,
      body: labels.rsvp.confirmReplaceSeatBody
        .replace("{fromCity}", confirm.conflicting.city)
        .replace("{fromTable}", fromTable)
        .replace("{toCity}", confirm.event.city)
        .replace("{toTable}", toTable),
      confirmLabel: labels.rsvp.confirmReplaceSeatCta,
    };
  })();

  const explainCopy =
    activeEvent?.tableType === "girls_only"
      ? labels.explain.girlsOnly
      : labels.explain.mixed;

  return (
    <main className="min-h-[100svh] bg-cream">
      {/* Hero — same scale/style as AgendaHero */}
      <section className="relative isolate min-h-[min(48vh,440px)] overflow-hidden bg-wine text-cream">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-[#14060a]/70 sm:bg-[#14060a]/58" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14060a]/90 via-[#14060a]/55 to-[#14060a]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14060a]/85 via-transparent to-[#14060a]/30" />

        <div className="relative mx-auto flex min-h-[min(48vh,440px)] max-w-lg flex-col justify-end px-5 pb-12 pt-24 sm:px-6 sm:pb-14 lg:max-w-5xl xl:max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {labels.hero.brand}
            </p>
            <h1 className="mt-3 font-serif text-[2.15rem] font-medium leading-[1.05] tracking-tight text-cream text-balance sm:text-[2.65rem] lg:text-[3rem]">
              {labels.hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/90 sm:text-lg">
              {labels.hero.line}
            </p>

            {!isMember ? (
              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Button
                  href="#sunday-tables"
                  className="bg-gold px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-wine hover:bg-cream sm:text-sm"
                >
                  {labels.hero.cta}
                </Button>
                <a
                  href="#clubmember"
                  className="inline-flex min-h-12 items-center text-xs font-semibold uppercase tracking-[0.16em] text-cream/70 transition hover:text-cream"
                >
                  {labels.hero.secondaryCta}
                </a>
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto max-w-lg px-5 pb-20 sm:px-6 lg:max-w-5xl xl:max-w-6xl">
        <MemberClubMembershipPanel
          labels={labels}
          locale={locale}
          membership={membership}
          checkoutFlash={checkoutFlash}
        />

        {/* Tables */}
        <section id="happening" className="scroll-mt-24 pt-12 sm:pt-16">
          <div id="sunday-tables" className="sr-only">
            {labels.happening.title}
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-wine/40">
                {labels.happening.filterCities}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {VISIBLE_ONBOARDING_CITIES.map((city) => {
                  const comingSoon = isComingSoonOnboardingCity(city);
                  if (comingSoon) {
                    return (
                      <span
                        key={city}
                        className="inline-flex items-center gap-1.5 rounded-full border border-wine/10 bg-wine/[0.03] px-3.5 py-1.5 text-sm text-wine/35"
                      >
                        {city}
                        <span className="text-[10px] font-semibold uppercase tracking-wide">
                          {labels.happening.comingSoon}
                        </span>
                      </span>
                    );
                  }
                  return (
                    <FilterChip
                      key={city}
                      label={city}
                      selected={selectedCities.includes(city)}
                      onClick={() => toggleCity(city)}
                    />
                  );
                })}
              </div>
            </div>

            {showTableFilter ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-wine/40">
                  {labels.happening.filterTables}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <FilterChip
                    label={labels.tableFilter.girlsOnly}
                    selected={selectedTables.includes("girls_only")}
                    onClick={() => toggleTable("girls_only")}
                  />
                  <FilterChip
                    label={labels.tableFilter.mixed}
                    selected={selectedTables.includes("mixed")}
                    onClick={() => toggleTable("mixed")}
                  />
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-wine/40">
                {labels.languageFilter.label}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <FilterChip
                  label={labels.languageFilter.nl}
                  selected={selectedLanguageChoice === "nl"}
                  onClick={() => void selectLanguageChoice("nl")}
                />
                <FilterChip
                  label={labels.languageFilter.en}
                  selected={selectedLanguageChoice === "en"}
                  onClick={() => void selectLanguageChoice("en")}
                />
                <FilterChip
                  label={labels.languageFilter.both}
                  selected={selectedLanguageChoice === "both"}
                  onClick={() => void selectLanguageChoice("both")}
                />
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <p className="mt-8 text-sm text-wine/55">{labels.happening.empty}</p>
          ) : (
            <div className="-mx-5 mt-8 min-w-0 overflow-x-auto overscroll-x-contain px-5 pb-2 [touch-action:pan-x_pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6">
              <div className="flex w-max snap-x snap-mandatory gap-4 lg:gap-5">
                {events.map((event, index) => {
                  const signup = signupForEvent(localSignups, event);
                  const confirmed = signup?.status === "confirmed";
                  const pending = signup?.status === "pending_payment";
                  const rsvpWindow = getSundayTableRsvpWindow(event.date);
                  const rsvpOpen = rsvpWindow !== "closed";
                  const dateTimeLabel = formatSundayTableCardDateTime(
                    event.date,
                    locale,
                  );
                  const statsKey = seatStatsKey(
                    event.city,
                    amsterdamDateIso(event.date),
                    event.tableType,
                  );
                  const seatsLeft = seatStats[statsKey]?.seatsLeft;
                  const soldOut =
                    typeof seatsLeft === "number" && seatsLeft <= 0 && !confirmed;

                  async function reserveSeat() {
                    requestReserveSeat(event);
                  }

                  return (
                    <motion.article
                      key={event.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{
                        duration: 0.45,
                        delay: Math.min(index * 0.05, 0.2),
                        ease,
                      }}
                      className="group flex w-[min(78vw,19rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_16px_40px_rgba(43,13,18,0.08)] sm:w-[17.5rem] lg:w-[18.5rem]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={event.image}
                          alt=""
                          fill
                          sizes="300px"
                          className="object-cover transition duration-700 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-wine/50 via-transparent to-transparent" />
                        {event.tableType === "girls_only" ? (
                          <span className="absolute left-3 top-3 rounded-full bg-rose px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream shadow-[0_6px_16px_rgba(122,61,74,0.35)]">
                            {labels.tableFilter.girlsOnly}
                          </span>
                        ) : showTableFilter ? (
                          <span className="absolute left-3 top-3 rounded-full bg-wine/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream backdrop-blur-sm">
                            {labels.tableFilter.mixed}
                          </span>
                        ) : null}
                        <p className="absolute bottom-3 left-3 right-3 font-serif text-xl font-medium tracking-tight text-cream">
                          {event.city}
                        </p>
                      </div>

                      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                          {labels.happening.eventTitle}
                        </p>
                        <p className="mt-2 text-[15px] font-medium leading-snug text-wine">
                          {dateTimeLabel}
                        </p>
                        {typeof seatsLeft === "number" ? (
                          <p
                            className={`mt-1.5 text-xs font-semibold tracking-wide ${
                              soldOut ? "text-wine/55" : "text-[#c2410c]"
                            }`}
                          >
                            {soldOut
                              ? labels.rsvp.soldOut
                              : seatsLeft <= 5
                                ? labels.happening.seatsLeftFew.replace(
                                    "{count}",
                                    String(seatsLeft),
                                  )
                                : labels.happening.seatsGoingFast}
                          </p>
                        ) : null}

                        {!confirmed ? (
                          <p
                            className={`mt-3 text-xs leading-snug ${rsvpDeadlineTextClass(rsvpWindow)}`}
                          >
                            {rsvpDeadlineLabel(
                              rsvpWindow,
                              labels.rsvp,
                              event.date,
                              locale,
                            )}
                          </p>
                        ) : (
                          <p className="mt-3 text-xs font-medium text-[#2f5c2a]">
                            {labels.rsvp.confirmed}
                          </p>
                        )}

                        <div className="mt-auto flex flex-col gap-2 pt-5">
                          {confirmed && signup ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={rsvpBusy || !rsvpOpen}
                                title={labels.rsvp.plusOneHint}
                                aria-pressed={signup.plusOne}
                                onClick={() =>
                                  setConfirm({
                                    kind: "plusOne",
                                    signupId: signup.id,
                                    nextValue: !signup.plusOne,
                                  })
                                }
                                className={`min-h-11 flex-1 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.1em] transition disabled:opacity-60 ${
                                  signup.plusOne
                                    ? "bg-wine text-cream"
                                    : "border border-wine/15 text-wine/70 hover:border-wine/30 hover:text-wine"
                                }`}
                              >
                                {labels.rsvp.plusOne}
                              </button>
                              <button
                                type="button"
                                disabled={rsvpBusy}
                                onClick={() =>
                                  setConfirm({
                                    kind: "cancelGoing",
                                    signupId: signup.id,
                                  })
                                }
                                className="min-h-11 flex-1 rounded-full border border-wine/15 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-wine/65 transition hover:border-wine/30 hover:text-wine disabled:opacity-60"
                              >
                                {labels.rsvp.cancelGoing}
                              </button>
                            </div>
                          ) : null}

                          {pending && signup && !isMember ? (
                            <p className="text-center text-xs font-medium text-[#7a5a12]">
                              {labels.rsvp.pending}
                            </p>
                          ) : null}

                          {!confirmed && rsvpOpen ? (
                            isMember ? (
                              <button
                                type="button"
                                disabled={rsvpBusy || soldOut}
                                onClick={() => void reserveSeat()}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-4 text-xs font-semibold uppercase tracking-[0.12em] text-cream shadow-[0_10px_24px_rgba(90,15,27,0.18)] transition hover:bg-wine disabled:opacity-60"
                              >
                                {soldOut
                                  ? labels.rsvp.soldOut
                                  : labels.rsvp.bookSeat}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!requireOnboardingForTable(event.tableType)) {
                                    return;
                                  }
                                  setActiveEvent(event);
                                }}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-4 text-xs font-semibold uppercase tracking-[0.12em] text-cream shadow-[0_10px_24px_rgba(90,15,27,0.18)] transition hover:bg-wine"
                              >
                                {labels.rsvp.viewTable}
                              </button>
                            )
                          ) : null}

                          {!confirmed && !rsvpOpen ? (
                            <div className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-wine/10 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-wine/40">
                              {labels.rsvp.signupClosed}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          )}
          {rsvpError ? (
            <p className="mt-4 text-sm text-red-800">{rsvpError}</p>
          ) : null}
        </section>

        {isMember && invite ? (
          <section className="mt-12 rounded-[1.5rem] border border-wine/10 bg-white px-5 py-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {labels.invite.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-wine">
              {labels.invite.title}
            </h2>
            <p className="mt-1.5 text-sm text-wine/55">{labels.invite.body}</p>
            <div className="mt-5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(invite.shareUrl);
                    setInviteCopied(true);
                    trackInviteShareClicked({ channel: "copy", locale });
                    window.setTimeout(() => setInviteCopied(false), 2000);
                  } catch {
                    // ignore
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-burgundy px-5 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition hover:bg-wine"
              >
                {inviteCopied ? labels.invite.copied : labels.invite.copyLink}
              </button>
            </div>
          </section>
        ) : null}

        {/* Benefits — non-members: sfeer + uitleg in één, compact */}
        {!isMember ? (
          <section id="clubmember" className="mt-14 scroll-mt-24 sm:mt-16">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {labels.benefits.eyebrow}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                {labels.benefits.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-wine/55">
                {labels.benefits.subtitle}
              </p>
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {labels.benefits.items.map((item, i) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease }}
                  className="group relative aspect-[5/3] overflow-hidden rounded-2xl sm:aspect-[4/5] lg:aspect-[5/4]"
                >
                  <Image
                    src={BENEFIT_IMAGES[i % BENEFIT_IMAGES.length]!}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover object-top transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine/92 via-wine/45 to-wine/10" />
                  <div className="absolute inset-x-0 bottom-0 flex h-[7.5rem] flex-col justify-start p-4 sm:h-[8.25rem] sm:p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/90">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-1 font-serif text-lg font-medium tracking-tight text-cream sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-cream/70 sm:text-[13px]">
                      {item.body}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-wine/45">
              {labels.benefits.note}
            </p>
          </section>
        ) : null}

        {/* FAQ */}
        <section className="mt-20 sm:mt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {labels.faq.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
            {labels.faq.title}
          </h2>

          <ul className="mt-8 max-w-3xl divide-y divide-wine/10 border-y border-wine/10">
            {labels.faq.items.map((item, index) => {
              const open = openFaq === index;
              return (
                <li key={item.question}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left transition hover:text-wine"
                  >
                    <span className="font-serif text-lg font-medium leading-snug text-wine sm:text-xl">
                      {item.question}
                    </span>
                    <span
                      aria-hidden
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-wine/15 text-wine/45 transition ${
                        open ? "rotate-45 border-wine/30 text-wine" : ""
                      }`}
                    >
                      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none">
                        <path
                          d="M10 4v12M4 10h12"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 pr-10 text-sm leading-relaxed text-wine/60 sm:text-[15px]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {!isMember ? (
          <section className="mt-16 border-t border-wine/10 pt-10 pb-4 sm:mt-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-wine/35">
              {labels.roadmap.eyebrow}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-wine/45">
              {labels.roadmap.subtitle}
            </p>
            <ul className="mt-5 max-w-lg space-y-2.5">
              {labels.roadmap.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-snug text-wine/50"
                >
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-gold/70"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {activeEvent && !paywallOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-wine/60 p-5 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setActiveEvent(null)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sunday-table-explain-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className={`relative w-full max-w-sm rounded-[1.75rem] px-6 pb-6 pt-8 text-center shadow-[0_28px_60px_rgba(43,13,18,0.28)] ${
              activeEvent.tableType === "girls_only"
                ? "bg-[#f7e4ea]"
                : "bg-[#f8f4ef]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveEvent(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-wine/40 transition hover:bg-wine/5 hover:text-wine"
              aria-label={labels.explain.closeAria}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="relative mx-auto flex h-24 w-[11.5rem] items-center justify-center">
              {EXPLAIN_IMAGES.map((src, i) => (
                <div
                  key={src}
                  className="absolute h-20 w-20 overflow-hidden rounded-2xl border-2 border-cream shadow-md"
                  style={{
                    left: `${i * 2.4}rem`,
                    zIndex: i + 1,
                    transform: `rotate(${(i - 1) * 6}deg)`,
                  }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <h2
              id="sunday-table-explain-title"
              className="mt-6 font-serif text-2xl font-medium tracking-tight text-wine"
            >
              {explainCopy.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-wine/60">
              {explainCopy.body}
            </p>
            <p className="mt-4 text-xs text-wine/40">
              {activeEvent.city} ·{" "}
              {formatSundayTableCardDate(activeEvent.date, locale)} ·{" "}
              {timeLabel}
            </p>
            {(() => {
              const window = getSundayTableRsvpWindow(activeEvent.date);
              const closed = window === "closed";
              return (
                <>
                  <p
                    className={`mt-3 text-xs leading-snug ${rsvpDeadlineTextClass(window)}`}
                  >
                    {rsvpDeadlineLabel(
                      window,
                      labels.rsvp,
                      activeEvent.date,
                      locale,
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-snug text-wine/40">
                    {labels.explain.locationNote}
                  </p>

                  <button
                    type="button"
                    disabled={rsvpBusy || closed}
                    onClick={() => {
                      if (closed) return;
                      if (!requireOnboardingForTable(activeEvent.tableType)) {
                        setActiveEvent(null);
                        return;
                      }
                      if (!isMember) {
                        setPaywallOpen(true);
                        return;
                      }
                      setActiveEvent(null);
                      requestReserveSeat(activeEvent);
                    }}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-6 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-wine disabled:opacity-60"
                  >
                    {closed
                      ? labels.rsvp.signupClosed
                      : isMember
                        ? labels.rsvp.bookSeat
                        : labels.explain.cta}
                  </button>
                </>
              );
            })()}
          </motion.div>
        </div>
      ) : null}

      {paywallOpen && activeEvent ? (
        <MemberClubPaywall
          labels={labels.paywall}
          locale={locale}
          city={activeEvent.city}
          tableDate={amsterdamDateIso(activeEvent.date)}
          dateLabel={formatSundayTableCardDate(activeEvent.date, locale)}
          timeLabel={timeLabel}
          tableType={activeEvent.tableType}
          onClose={() => {
            setPaywallOpen(false);
            setActiveEvent(null);
          }}
          onJoinedWithoutCheckout={() => {
            router.refresh();
          }}
        />
      ) : null}

      {confirmCopy ? (
        <MemberClubConfirmDialog
          open
          title={confirmCopy.title}
          body={confirmCopy.body}
          confirmLabel={confirmCopy.confirmLabel}
          cancelLabel={labels.rsvp.confirmDismiss}
          busy={rsvpBusy}
          onCancel={() => {
            if (!rsvpBusy) setConfirm(null);
          }}
          onConfirm={() => {
            void handleConfirmAction();
          }}
        />
      ) : null}
    </main>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        selected
          ? "bg-wine text-cream"
          : "bg-transparent text-wine/55 ring-1 ring-wine/15 hover:text-wine hover:ring-wine/30"
      }`}
    >
      {label}
    </button>
  );
}
