import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NO_INDEX } from "@/components/jouw-tafel/JouwTafelPage";
import { JouwTafelReserve } from "@/components/jouw-tafel/table/JouwTafelReserve";
import { JouwTafelTable } from "@/components/jouw-tafel/table/JouwTafelTable";
import {
  jouwTafelReservePath,
  jouwTafelSignUpPath,
  jouwTafelStartPath,
  jouwTafelTablePath,
  type Locale,
} from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { QUIZ_METADATA_KEY, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import { getFunnelTable, tableNow } from "@/lib/jouw-tafel/table-data";
import { tableState } from "@/lib/jouw-tafel/table-logic";

export function jouwTafelTableMetadata(locale: Locale): Metadata {
  return { title: getTableCopy(locale).metaTitle, robots: NO_INDEX };
}

export function jouwTafelReserveMetadata(locale: Locale): Metadata {
  return { title: getTableCopy(locale).reserve.metaTitle, robots: NO_INDEX };
}

/** Signed in, or off to sign up. */
async function requireUser(locale: Locale) {
  const user = await getMemberUser();
  if (!user?.email) redirect(jouwTafelSignUpPath(locale));
  return { ...user, email: user.email };
}

function kiesHref(locale: Locale): string {
  return `${jouwTafelStartPath(locale)}?stap=kies`;
}

/** /jouw-tafel/tafel/{slug} (EN /en/your-table/table/{slug}). */
export async function JouwTafelTablePage({ locale, slug }: { locale: Locale; slug: string }) {
  const user = await requireUser(locale);
  const event = await getFunnelTable(slug);
  if (!event) notFound();
  const now = tableNow();
  return (
    <JouwTafelTable
      locale={locale}
      event={event}
      state={tableState(event, now)}
      email={user.email}
      kiesHref={kiesHref(locale)}
      reserveHref={jouwTafelReservePath(locale, slug)}
    />
  );
}

/** /jouw-tafel/tafel/{slug}/reserveren: only while the table is open. */
export async function JouwTafelReservePage({ locale, slug }: { locale: Locale; slug: string }) {
  const user = await requireUser(locale);
  const event = await getFunnelTable(slug);
  if (!event) notFound();
  if (tableState(event, tableNow()) !== "open") redirect(jouwTafelTablePath(locale, slug));
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { answers } = sanitizeQuizState(meta[QUIZ_METADATA_KEY]);
  return (
    <JouwTafelReserve
      locale={locale}
      event={event}
      guest={{ email: user.email, answers }}
      tableHref={jouwTafelTablePath(locale, slug)}
    />
  );
}
