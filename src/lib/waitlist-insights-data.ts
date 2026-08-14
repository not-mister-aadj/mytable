import {
  getPriorityListSignups,
  type PriorityListSignupRow,
} from "@/lib/priority-list-data";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";

export type CountBucket = { id: string; label: string; count: number };

export type WaitlistInsights = {
  totalSignups: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  avgCitiesPerSignup: number;
  completionRate: number;
  /** Last 30 days, oldest first. */
  dailySignups: Array<{ date: string; count: number }>;
  /** Monday .. Sunday. */
  weekdaySignups: CountBucket[];
  funnel: CountBucket[];
  breakdowns: {
    city: CountBucket[];
    format: CountBucket[];
    gender: CountBucket[];
    ageRange: CountBucket[];
    why: CountBucket[];
    company: CountBucket[];
    tableType: CountBucket[];
    vibe: CountBucket[];
    budget: CountBucket[];
    experience: CountBucket[];
  };
  cityFormatMatrix: {
    cities: string[];
    formats: string[];
    counts: number[][];
  };
};

const WEEKDAY_LABELS_NL = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];

function toBuckets(counts: Map<string, number>, topN?: number): CountBucket[] {
  const sorted = [...counts.entries()]
    .map(([id, count]) => ({ id, label: id, count }))
    .sort((a, b) => b.count - a.count);

  if (!topN || sorted.length <= topN) return sorted;

  const head = sorted.slice(0, topN);
  const tailCount = sorted.slice(topN).reduce((sum, b) => sum + b.count, 0);
  if (tailCount > 0) {
    head.push({ id: "__other__", label: "Overig", count: tailCount });
  }
  return head;
}

function countField<K extends keyof WaitlistPreferences>(
  rows: PriorityListSignupRow[],
  field: K,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const values = (row.preferences?.[field] as unknown as string[] | undefined) ?? [];
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

/** How many of the 8 enrichment questions someone answered — the funnel
 * from "just captured" to "fully profiled". */
function answeredFieldCount(prefs: WaitlistPreferences | null): number {
  if (!prefs) return 0;
  const fields: Array<keyof WaitlistPreferences> = [
    "gender",
    "ageRange",
    "why",
    "company",
    "tableType",
    "vibe",
    "budget",
    "experience",
  ];
  return fields.filter((f) => {
    const v = prefs[f];
    return Array.isArray(v) && v.length > 0;
  }).length;
}

export async function getWaitlistInsights(): Promise<WaitlistInsights> {
  const rows = await getPriorityListSignups();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const thisWeekStart = now - 7 * day;
  const lastWeekStart = now - 14 * day;
  const thisMonthStart = now - 30 * day;

  const totalSignups = rows.length;
  const thisWeek = rows.filter(
    (r) => new Date(r.createdAt).getTime() >= thisWeekStart,
  ).length;
  const lastWeek = rows.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= lastWeekStart && t < thisWeekStart;
  }).length;
  const thisMonth = rows.filter(
    (r) => new Date(r.createdAt).getTime() >= thisMonthStart,
  ).length;

  const avgCitiesPerSignup =
    totalSignups > 0
      ? rows.reduce((sum, r) => sum + r.cities.length, 0) / totalSignups
      : 0;

  const answeredCounts = rows.map((r) => answeredFieldCount(r.preferences));
  const completionRate =
    totalSignups > 0
      ? (answeredCounts.filter((n) => n > 0).length / totalSignups) * 100
      : 0;

  // Daily signups, last 30 days.
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * day);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = new Date(row.createdAt).toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const dailySignups = [...dailyMap.entries()].map(([date, count]) => ({
    date,
    count,
  }));

  // Weekday pattern (Europe/Amsterdam-ish — server local time is fine for
  // this internal dashboard).
  const weekdayCounts = new Array(7).fill(0) as number[];
  for (const row of rows) {
    const jsDay = new Date(row.createdAt).getDay(); // 0 = Sunday
    const mondayFirst = (jsDay + 6) % 7;
    weekdayCounts[mondayFirst]! += 1;
  }
  const weekdaySignups = WEEKDAY_LABELS_NL.map((label, i) => ({
    id: label,
    label,
    count: weekdayCounts[i]!,
  }));

  // Funnel: how deep people go past capture.
  const bucketNone = answeredCounts.filter((n) => n === 0).length;
  const bucketPartial = answeredCounts.filter((n) => n >= 1 && n <= 4).length;
  const bucketFull = answeredCounts.filter((n) => n >= 5).length;
  const funnel: CountBucket[] = [
    { id: "none", label: "Alleen aangemeld", count: bucketNone },
    { id: "partial", label: "Deels ingevuld", count: bucketPartial },
    { id: "full", label: "Grotendeels/volledig ingevuld", count: bucketFull },
  ];

  const cityCounts = new Map<string, number>();
  for (const row of rows) {
    for (const city of row.cities) {
      cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    }
  }

  const breakdowns = {
    city: toBuckets(cityCounts, 8),
    format: toBuckets(countField(rows, "interests")),
    gender: toBuckets(countField(rows, "gender")),
    ageRange: toBuckets(countField(rows, "ageRange")),
    why: toBuckets(countField(rows, "why")),
    company: toBuckets(countField(rows, "company")),
    tableType: toBuckets(countField(rows, "tableType")),
    vibe: toBuckets(countField(rows, "vibe")),
    budget: toBuckets(countField(rows, "budget")),
    experience: toBuckets(countField(rows, "experience")),
  };

  // City × format matrix — top cities/formats by volume, for cross-comparison.
  const topCities = toBuckets(cityCounts, 6).map((b) => b.id).filter((c) => c !== "__other__");
  const formatCounts = countField(rows, "interests");
  const topFormats = toBuckets(formatCounts, 6).map((b) => b.id).filter((f) => f !== "__other__");

  const matrixCounts = topCities.map((city) =>
    topFormats.map((format) =>
      rows.reduce((sum, row) => {
        if (!row.cities.includes(city)) return sum;
        if (!(row.preferences?.interests ?? []).includes(format as never)) return sum;
        return sum + 1;
      }, 0),
    ),
  );

  return {
    totalSignups,
    thisWeek,
    lastWeek,
    thisMonth,
    avgCitiesPerSignup,
    completionRate,
    dailySignups,
    weekdaySignups,
    funnel,
    breakdowns,
    cityFormatMatrix: {
      cities: topCities,
      formats: topFormats,
      counts: matrixCounts,
    },
  };
}
