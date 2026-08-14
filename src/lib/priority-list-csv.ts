import type { PriorityListSignupRow } from "@/lib/priority-list-data";
import {
  FORMAT_LABELS,
  GENDER_LABELS,
  AGE_LABELS,
  WHY_LABELS,
  COMPANY_LABELS,
  TABLE_TYPE_LABELS,
  VIBE_LABELS,
  BUDGET_LABELS,
  EXPERIENCE_LABELS,
  labelList,
} from "@/lib/priority-list-labels";

const BOM = "﻿";

// Client-safe on purpose (no drizzle/db imports) — used both by the export
// API route and, so the download always matches what's on screen, directly
// in the browser from the currently filtered rows.
export function priorityListRowsToExcelCsv(rows: PriorityListSignupRow[]): string {
  const header = [
    "Naam",
    "E-mail",
    "Steden",
    "Taal",
    "Formats",
    "Gender",
    "Leeftijd",
    "Waarom",
    "Waarom (anders)",
    "Met wie",
    "Type tafel",
    "Sfeer",
    "Budget",
    "Ervaring",
    "Aangemeld op",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) => {
      const prefs = row.preferences;
      return [
        row.name ?? "",
        row.email,
        row.cities.join(", "),
        row.locale.toUpperCase(),
        labelList(prefs?.interests ?? [], FORMAT_LABELS).join(", "),
        labelList(prefs?.gender ?? [], GENDER_LABELS).join(", "),
        labelList(prefs?.ageRange ?? [], AGE_LABELS).join(", "),
        labelList(prefs?.why ?? [], WHY_LABELS).join(", "),
        prefs?.whyOther ?? "",
        labelList(prefs?.company ?? [], COMPANY_LABELS).join(", "),
        labelList(prefs?.tableType ?? [], TABLE_TYPE_LABELS).join(", "),
        labelList(prefs?.vibe ?? [], VIBE_LABELS).join(", "),
        labelList(prefs?.budget ?? [], BUDGET_LABELS).join(", "),
        labelList(prefs?.experience ?? [], EXPERIENCE_LABELS).join(", "),
        new Intl.DateTimeFormat("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(row.createdAt)),
      ]
        .map(escape)
        .join(";");
    }),
  ];

  return `${BOM}${lines.join("\r\n")}`;
}
