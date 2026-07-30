import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getAccountPageLabels } from "@/i18n/get-account-page";
import { getMemberUser } from "@/lib/member-auth";
import {
  isSundayTableOnboardingReady,
  postLoginPath,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { JoinFunnel } from "@/components/join/JoinFunnel";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function JoinPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const user = await getMemberUser();
  if (user) {
    const { completed, prefs } = readOnboardingFromMetadata(
      user.user_metadata as Record<string, unknown>,
    );
    if (isSundayTableOnboardingReady(completed, prefs)) {
      redirect(postLoginPath(locale, prefs.joinIntent));
    }
  }

  const labels = getAccountPageLabels(locale);

  return (
    <main className="min-h-[100svh] bg-cream">
      <JoinFunnel
        labels={labels.onboarding}
        authLabels={labels.auth}
        locale={locale}
        authenticated={Boolean(user)}
      />
    </main>
  );
}
