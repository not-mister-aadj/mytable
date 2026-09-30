import type { AdminCustomerListRow } from "@/lib/admin-customers-data";
import { WAITLIST_LANGUAGE_LABELS } from "@/lib/customers/list-answers";
import {
  AGE_LABELS,
  GENDER_LABELS,
  TICKET_PRICE_LABELS,
} from "@/lib/priority-list-labels";

const BOM = "﻿";

function formatCsvDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function formatCsvEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function label(id: string | null, labels: Record<string, string>): string {
  if (!id) return "";
  return labels[id] ?? id;
}

// Client side on purpose: the export is exactly the rows on screen, in the
// same order, so it follows every filter and the chosen sort. Semicolons and
// a BOM so Excel (Dutch locale) opens it with the right columns and accents.
export function customerRowsToCsv(rows: AdminCustomerListRow[]): string {
  const header = [
    "naam",
    "e-mail",
    "stad",
    "lid sinds",
    "eerste aankoop",
    "boekingen",
    "plekken",
    "totaal besteed",
    "status",
    "leeftijd",
    "geslacht",
    "taal",
    "ticketbudget",
  ];
  const escape = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) =>
      [
        row.displayName,
        row.email,
        row.city ?? "",
        formatCsvDate(row.memberSince),
        formatCsvDate(row.firstBookingAt),
        row.paidBookingsCount,
        row.totalSeatsBooked,
        formatCsvEuros(row.totalSpentCents),
        row.statusLabel,
        label(row.ageRange, AGE_LABELS),
        label(row.gender, GENDER_LABELS),
        label(row.waitlistLanguage, WAITLIST_LANGUAGE_LABELS),
        label(row.ticketBudget, TICKET_PRICE_LABELS),
      ]
        .map(escape)
        .join(";"),
    ),
  ];

  return BOM + lines.join("\r\n");
}
