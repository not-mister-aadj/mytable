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

  const [bookings, mailsOn] = await Promise.all([
    getMemberBookings(user.email).catch((error: unknown) => {
      console.error("[jouw-tafel settings] loading bookings failed:", error);
      return { upcoming: [], past: [] };
    }),
    getTableMailsOn(user.email).catch(() => true),
  ]);

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
    />
  );
}
