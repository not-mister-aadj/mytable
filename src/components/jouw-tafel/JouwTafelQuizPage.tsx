import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NO_INDEX } from "@/components/jouw-tafel/JouwTafelPage";
import { JouwTafelQuiz, type QuizTestimonial } from "@/components/jouw-tafel/quiz/JouwTafelQuiz";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { jouwTafelPath, jouwTafelSignUpPath, type Locale } from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { devCountOverride, getJouwTafelEvents, getSignupSubsetCounts, getWaitlistCityCounts } from "@/lib/jouw-tafel/data";
import { getQuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  QUIZ_METADATA_KEY,
  firstNameFromMetadata,
  resolveStep,
  sanitizeQuizState,
} from "@/lib/jouw-tafel/quiz-logic";
import { requestCity, type JouwTafelSearchParams } from "@/lib/jouw-tafel/request-city";
import { getMembershipForUser, membershipSnapshot } from "@/lib/membership/data";
import { toClientMembership } from "@/lib/membership/logic";
import { getBookedSeats } from "@/lib/jouw-tafel/account-server";

/** Same three guests as on the landing page. */
const TESTIMONIAL_NAMES = ["Carmen", "Mark", "Sophie"];

export function jouwTafelQuizMetadata(locale: Locale): Metadata {
  return { title: getQuizCopy(locale).metaTitle, robots: NO_INDEX };
}

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/**
 * /jouw-tafel/start (EN /en/your-table/start): the quiz after signing up or
 * logging in, ending at "Kies je zondag". Signed out goes to sign up. The
 * answers live in the account (user metadata), so the quiz resumes where
 * it was left, on any device.
 */
export async function JouwTafelQuizPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: JouwTafelSearchParams;
}) {
  const user = await getMemberUser();
  if (!user?.email) redirect(jouwTafelSignUpPath(locale));

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const state = sanitizeQuizState(meta[QUIZ_METADATA_KEY]);
  const requested = firstParam(searchParams.stap);
  const initialStep = resolveStep(requested, state.answers);

  const [{ events, now }, geoCity, cityCounts, subsetCounts, membership, booked] = await Promise.all([
    getJouwTafelEvents(),
    requestCity(searchParams),
    getWaitlistCityCounts(devCountOverride(searchParams.aantal)),
    getSignupSubsetCounts(devCountOverride(searchParams.aantal)),
    getMembershipForUser(user.id).catch((error: unknown) => {
      console.error("[jouw-tafel quiz] loading membership failed", error);
      return null;
    }),
    getBookedSeats(user.email).catch((error: unknown) => {
      console.error("[jouw-tafel quiz] loading bookings failed", error);
      return {};
    }),
  ]);

  const { culinary, people } = getBrandLandingTestimonialRows(locale);
  const testimonials: QuizTestimonial[] = TESTIMONIAL_NAMES.map((name) =>
    [...culinary, ...people].find((t) => t.name === name),
  )
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({ name: t.name, city: t.detail.split("·")[0]!.trim(), quote: t.quote }));

  return (
    <JouwTafelQuiz
      locale={locale}
      userId={user.id}
      storageKey={`mytable_jt_quiz_${user.id}`}
      initialState={state}
      initialStep={initialStep}
      requestedStep={requested}
      accountFirstName={firstNameFromMetadata(meta)}
      geoCity={geoCity}
      events={events}
      now={now}
      cityCounts={cityCounts}
      subsetCounts={subsetCounts}
      testimonials={testimonials}
      landingPath={jouwTafelPath(locale)}
      membership={toClientMembership(membershipSnapshot(membership))}
      booked={booked}
    />
  );
}
