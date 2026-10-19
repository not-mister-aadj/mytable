import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NO_INDEX } from "@/components/jouw-tafel/JouwTafelPage";
import { JouwTafelSettings } from "@/components/jouw-tafel/settings/JouwTafelSettings";
import { jouwTafelLogInPath, jouwTafelStartPath, type Locale } from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { getMemberBookings, getTableMailsOn } from "@/lib/jouw-tafel/account-server";
import {
  QUIZ_METADATA_KEY,
  firstNameFromMetadata,
  isQuizStepId,
  sanitizeQuizState,
} from "@/lib/jouw-tafel/quiz-logic";
import type { JouwTafelSearchParams } from "@/lib/jouw-tafel/request-city";
import { getSettingsCopy } from "@/lib/jouw-tafel/settings-copy";
import { getMembershipForUser, settingsMembership } from "@/lib/membership/data";
import { tryFulfillMembershipSession } from "@/lib/membership/fulfill";
import { tryFulfillCheckoutSessionSafe } from "@/lib/stripe/fulfill-checkout";
import { loadCustomerIntro } from "@/lib/sunday-table-intro";

export function jouwTafelSettingsMetadata(locale: Locale): Metadata {
  return { title: getSettingsCopy(locale).metaTitle, robots: NO_INDEX };
}

/**
 * /jouw-tafel/instellingen (EN /en/your-table/settings): reservations,
 * preferences, the mail switch and the account. Signed out goes to log in.
 * `?terug=<stap>` is the quiz step the back arrow returns to.
 */
export async function JouwTafelSettingsPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: JouwTafelSearchParams;
}) {
  const user = await getMemberUser();
  if (!user?.email) redirect(jouwTafelLogInPath(locale));

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const state = sanitizeQuizState(meta[QUIZ_METADATA_KEY]);
  const terugRaw = Array.isArray(searchParams.terug) ? searchParams.terug[0] : searchParams.terug;
  const terug = isQuizStepId(terugRaw) ? terugRaw : null;
  const backHref = `${jouwTafelStartPath(locale)}${terug ? `?stap=${terug}` : ""}`;

  // Back from paying for a member's guest seat: make sure it is booked even
  // when the webhook is slower than the browser.
  const sessionId = Array.isArray(searchParams.session_id) ? searchParams.session_id[0] : searchParams.session_id;
  const bookedNotice = searchParams.geboekt === "1";
  // Back from "Lid worden" in Stripe: make sure the membership is there even
  // when the webhook is slower than the browser.
  const lidSession = Array.isArray(searchParams.lid) ? searchParams.lid[0] : searchParams.lid;
  const memberNotice = Boolean(lidSession?.startsWith("cs_"));
  if (memberNotice && lidSession) await tryFulfillMembershipSession(lidSession).catch(() => null);
  const tabRaw = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const initialTab = tabRaw === "voorkeuren" || tabRaw === "account" ? tabRaw : "reserveringen";
  if (bookedNotice && sessionId?.startsWith("cs_")) {
    await tryFulfillCheckoutSessionSafe(sessionId, { deferEmail: true, deferSideEffects: true });
  }

  const [bookings, mailsOn, membershipRow, savedIntro] = await Promise.all([
    getMemberBookings(user.email).catch((error: unknown) => {
      console.error("[jouw-tafel settings] loading bookings failed:", error);
      return { upcoming: [], past: [] };
    }),
    getTableMailsOn(user.email).catch(() => true),
    getMembershipForUser(user.id).catch(() => null),
    loadCustomerIntro(user.email).catch(() => null),
  ]);
  // One answer for wine and conversation: the seating answers fill the quiz's when it has none.
  if (savedIntro?.conversationStyle && !state.answers.conversation) state.answers.conversation = savedIntro.conversationStyle;
  if (savedIntro?.wine && !state.answers.wine) state.answers.wine = savedIntro.wine;
  const intro = {
    askMeAbout: savedIntro?.askMeAbout ?? "",
    favoriteSpot: savedIntro?.favoriteSpot ?? "",
    intoNow: savedIntro?.intoNow ?? "",
  };

  const membership = settingsMembership(membershipRow);

  return (
    <JouwTafelSettings
      locale={locale}
      userId={user.id}
      email={user.email}
      accountFirstName={firstNameFromMetadata(meta)}
      initialState={state}
      bookings={bookings}
      mailsOn={mailsOn}
      backHref={backHref}
      terug={terug}
      membership={membership}
      bookedNotice={bookedNotice}
      intro={intro}
      memberNotice={memberNotice}
      initialTab={initialTab}
    />
  );
}
