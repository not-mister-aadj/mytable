import type { WaitlistSignupRow } from "@/lib/waitlist-data";
import {
  COMPANY_LABELS,
  INTEREST_LABELS,
  TABLE_TYPE_LABELS,
  WHY_LABELS,
  formatWaitlistPreferenceLabels,
} from "@/lib/waitlist-preference-labels";

export type WaitlistPerson = {
  email: string;
  name: string | null;
  locale: string;
  createdAt: string;
  cities: string[];
  preferences: WaitlistSignupRow["preferences"];
  hasQuiz: boolean;
  rowCount: number;
};

export type WaitlistCountItem = {
  id: string;
  label: string;
  count: number;
  share: number;
};

export type WaitlistAdminStats = {
  people: number;
  withQuiz: number;
  withoutQuiz: number;
  last7d: number;
  last30d: number;
  regionFlexible: number;
  interests: WaitlistCountItem[];
  why: WaitlistCountItem[];
  company: WaitlistCountItem[];
  tableType: WaitlistCountItem[];
  cities: WaitlistCountItem[];
  insights: string[];
};

function daysAgo(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  return t >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function groupWaitlistPeople(
  signups: WaitlistSignupRow[],
): WaitlistPerson[] {
  const byEmail = new Map<string, WaitlistSignupRow[]>();
  for (const row of signups) {
    const key = row.email.toLowerCase();
    const list = byEmail.get(key) ?? [];
    list.push(row);
    byEmail.set(key, list);
  }

  return [...byEmail.values()]
    .map((rows) => {
      const sorted = [...rows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const withPrefs =
        sorted.find((row) => row.preferences != null) ?? sorted[0]!;
      const labels = formatWaitlistPreferenceLabels(withPrefs.preferences);
      const citySet = new Set<string>();
      for (const row of sorted) {
        if (row.city) citySet.add(row.city);
        for (const city of row.preferences?.cities ?? []) citySet.add(city);
      }
      for (const city of labels.cities) citySet.add(city);

      return {
        email: withPrefs.email,
        name: sorted.find((row) => row.name?.trim())?.name ?? null,
        locale: withPrefs.locale,
        createdAt: sorted[0]!.createdAt,
        cities: [...citySet].sort((a, b) => a.localeCompare(b, "nl")),
        preferences: withPrefs.preferences,
        hasQuiz: Boolean(
          withPrefs.preferences &&
            ((withPrefs.preferences.interests?.length ?? 0) > 0 ||
              (withPrefs.preferences.why?.length ?? 0) > 0 ||
              (withPrefs.preferences.company?.length ?? 0) > 0 ||
              (withPrefs.preferences.tableType?.length ?? 0) > 0),
        ),
        rowCount: sorted.length,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function toCounts(
  tally: Map<string, { label: string; count: number }>,
  totalPeople: number,
): WaitlistCountItem[] {
  return [...tally.entries()]
    .map(([id, item]) => ({
      id,
      label: item.label,
      count: item.count,
      share: totalPeople > 0 ? item.count / totalPeople : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "nl"));
}

function bump(
  map: Map<string, { label: string; count: number }>,
  id: string,
  label: string,
) {
  const current = map.get(id);
  if (current) {
    current.count += 1;
  } else {
    map.set(id, { label, count: 1 });
  }
}

export function computeWaitlistAdminStats(
  people: WaitlistPerson[],
): WaitlistAdminStats {
  const interests = new Map<string, { label: string; count: number }>();
  const why = new Map<string, { label: string; count: number }>();
  const company = new Map<string, { label: string; count: number }>();
  const tableType = new Map<string, { label: string; count: number }>();
  const cities = new Map<string, { label: string; count: number }>();

  let withQuiz = 0;
  let withoutQuiz = 0;
  let last7d = 0;
  let last30d = 0;
  let regionFlexible = 0;

  for (const person of people) {
    if (person.hasQuiz) withQuiz += 1;
    else withoutQuiz += 1;
    if (daysAgo(person.createdAt, 7)) last7d += 1;
    if (daysAgo(person.createdAt, 30)) last30d += 1;
    if (person.preferences?.regionFlexible) regionFlexible += 1;

    for (const id of person.preferences?.interests ?? []) {
      bump(interests, id, INTEREST_LABELS[id] ?? id);
    }
    for (const id of person.preferences?.why ?? []) {
      bump(why, id, WHY_LABELS[id] ?? id);
    }
    for (const id of person.preferences?.company ?? []) {
      bump(company, id, COMPANY_LABELS[id] ?? id);
    }
    for (const id of person.preferences?.tableType ?? []) {
      bump(tableType, id, TABLE_TYPE_LABELS[id] ?? id);
    }
    for (const city of person.cities) {
      bump(cities, city, city);
    }
  }

  const quizBase = Math.max(withQuiz, 1);
  const interestCounts = toCounts(interests, quizBase);
  const whyCounts = toCounts(why, quizBase);
  const companyCounts = toCounts(company, quizBase);
  const tableCounts = toCounts(tableType, quizBase);
  const cityCounts = toCounts(cities, people.length);

  const insights: string[] = [];
  if (interestCounts[0]) {
    insights.push(
      `Meest gevraagd: ${interestCounts[0].label} (${Math.round(interestCounts[0].share * 100)}% van quiz-aanmeldingen).`,
    );
  }
  if (cityCounts[0]) {
    insights.push(
      `Sterkste stad: ${cityCounts[0].label} (${cityCounts[0].count} mensen).`,
    );
  }
  if (tableCounts[0] && tableCounts[1]) {
    insights.push(
      `Tafelmix: ${tableCounts.map((t) => `${t.label} ${Math.round(t.share * 100)}%`).join(" · ")}.`,
    );
  } else if (tableCounts[0]) {
    insights.push(
      `Tafelvoorkeur: vooral ${tableCounts[0].label} (${Math.round(tableCounts[0].share * 100)}%).`,
    );
  }
  if (companyCounts[0]) {
    insights.push(
      `Hoe komen: vooral ${companyCounts[0].label} (${Math.round(companyCounts[0].share * 100)}%).`,
    );
  }
  if (regionFlexible > 0 && withQuiz > 0) {
    insights.push(
      `${Math.round((regionFlexible / withQuiz) * 100)}% is flexibel in de regio — handig voor nearby launches.`,
    );
  }

  return {
    people: people.length,
    withQuiz,
    withoutQuiz,
    last7d,
    last30d,
    regionFlexible,
    interests: interestCounts,
    why: whyCounts,
    company: companyCounts,
    tableType: tableCounts,
    cities: cityCounts.slice(0, 12),
    insights,
  };
}
