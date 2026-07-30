"use client";

import Link from "next/link";
import type { SundayTableSignupProfile } from "@/db/schema";
import type {
  SundayTableKey,
  SundayTableMemberRow,
} from "@/lib/sunday-table-signups-data";

function formatTableDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function formatSignedUpAt(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function tableTypeLabel(type: string) {
  return type === "girls_only" ? "Girls only" : "Mixed";
}

function planLabel(planId: string) {
  if (planId === "1m") return "1 maand";
  if (planId === "3m") return "3 maanden";
  if (planId === "6m") return "6 maanden";
  return planId;
}

function genderLabel(value: string | null | undefined) {
  if (value === "woman") return "Vrouw";
  if (value === "man") return "Man";
  if (value === "non_binary") return "Non-binair";
  if (value === "prefer_not") return "Liever niet";
  return value ?? "-";
}

function personalityLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function intentLabel(value: string | null | undefined) {
  if (value === "meet_new") return "Community";
  if (value === "culinary") return "Culinair";
  if (value === "both") return "Beide";
  return value ?? "-";
}

function ageFromBirthDate(birthDate: string | null | undefined): string {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return "-";
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return "-";
  const today = new Date();
  let age = today.getFullYear() - y;
  const month = today.getMonth() + 1;
  if (month < m || (month === m && today.getDate() < d)) age -= 1;
  return age >= 0 && age < 120 ? String(age) : "-";
}

function profileBits(profile: SundayTableSignupProfile | null) {
  if (!profile) return [];
  const bits: string[] = [];
  if (profile.gender) bits.push(genderLabel(profile.gender));
  const age = ageFromBirthDate(profile.birthDate);
  if (age !== "-") bits.push(`${age} jaar`);
  if (profile.personality) bits.push(personalityLabel(profile.personality));
  if (profile.joinIntent) bits.push(intentLabel(profile.joinIntent));
  if (profile.company) bits.push(profile.company.replaceAll("_", " "));
  return bits;
}

export function SundayTableDetailView({
  table,
  members,
  listHref,
  customerBasePath,
  location,
  saveLocationAction,
}: {
  table: SundayTableKey;
  members: SundayTableMemberRow[];
  listHref: string;
  customerBasePath: string;
  location: {
    venueName: string;
    address: string;
    notes: string | null;
  } | null;
  saveLocationAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href={listHref}
          className="text-sm font-medium text-burgundy hover:underline"
        >
          ← Sunday Tables
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-burgundy sm:text-4xl">
          {table.city}
        </h1>
        <p className="mt-2 text-sm text-wine/65">
          {formatTableDate(table.tableDate)} · 14:00 ·{" "}
          {tableTypeLabel(table.tableType)}
        </p>
      </div>

      <form
        action={saveLocationAction}
        className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]"
      >
        <input type="hidden" name="city" value={table.city} />
        <input type="hidden" name="tableDate" value={table.tableDate} />
        <input type="hidden" name="tableType" value={table.tableType} />
        <h2 className="font-serif text-xl text-burgundy">Locatie (24u-mail)</h2>
        <p className="mt-1 text-sm text-wine/60">
          Vul dit in vóór de zaterdag. Bevestigde gasten krijgen dan automatisch
          de exacte locatie per mail.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-wine/80 sm:col-span-2">
            Venue
            <input
              name="venueName"
              required
              defaultValue={location?.venueName ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm text-wine"
              placeholder="Restaurantnaam"
            />
          </label>
          <label className="block text-sm text-wine/80 sm:col-span-2">
            Adres
            <input
              name="address"
              required
              defaultValue={location?.address ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm text-wine"
              placeholder="Straat 1, 3011 AA Rotterdam"
            />
          </label>
          <label className="block text-sm text-wine/80 sm:col-span-2">
            Tip (optioneel)
            <input
              name="notes"
              defaultValue={location?.notes ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm text-wine"
              placeholder="Bel aan bij de zijingang"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-burgundy px-5 text-xs font-semibold uppercase tracking-[0.12em] text-cream"
        >
          Locatie opslaan
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Bevestigd
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">
            {members.filter((m) => m.status === "confirmed").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Plekken incl. +1
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">
            {members
              .filter((m) => m.status === "confirmed")
              .reduce((sum, m) => sum + 1 + (m.plusOne ? 1 : 0), 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-wine/50">
            Type
          </p>
          <p className="mt-2 font-serif text-3xl text-burgundy">
            {tableTypeLabel(table.tableType)}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-beige/40 px-6 py-16 text-center">
          <p className="font-serif text-xl text-burgundy">Nog geen aanmeldingen</p>
          <p className="mt-2 text-sm text-wine/60">
            Zodra een clubmember via de paywall doorgaat, verschijnt die hier.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-beige/50 shadow-[0_12px_40px_rgba(43,13,18,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-cream/60 text-xs font-medium uppercase tracking-[0.06em] text-wine/50">
                  <th className="px-5 py-3.5">Naam</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">+1</th>
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-5 py-3.5">Profiel</th>
                  <th className="px-5 py-3.5">Steden</th>
                  <th className="px-5 py-3.5">Aangemeld</th>
                </tr>
              </thead>
              <tbody>
                {members.map((row) => {
                  const bits = profileBits(row.profile);
                  const cities = row.profile?.cities ?? [];
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border-subtle/50 last:border-0"
                    >
                      <td className="px-5 py-4 font-medium text-wine">
                        {row.customerId ? (
                          <Link
                            href={`${customerBasePath}/${row.customerId}`}
                            className="hover:underline"
                          >
                            {row.name ?? (
                              <span className="text-wine/35">Zonder naam</span>
                            )}
                          </Link>
                        ) : (
                          (row.name ?? (
                            <span className="text-wine/35">Zonder naam</span>
                          ))
                        )}
                      </td>
                      <td className="px-5 py-4 text-wine/80">{row.email}</td>
                      <td className="px-5 py-4 text-wine/75">
                        {row.status === "confirmed"
                          ? "Bevestigd"
                          : row.status === "cancelled"
                            ? "Afgemeld"
                            : "Wacht op betaling"}
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        {row.plusOne ? "Ja" : "-"}
                      </td>
                      <td className="px-5 py-4 text-wine/75">
                        {planLabel(row.planId)}
                      </td>
                      <td className="px-5 py-4 text-wine/70">
                        {bits.length > 0 ? bits.join(" · ") : "-"}
                      </td>
                      <td className="px-5 py-4 text-wine/70">
                        {cities.length > 0 ? cities.join(", ") : "-"}
                        {row.profile?.cityFlexible ? " (flexibel)" : ""}
                      </td>
                      <td className="px-5 py-4 text-wine/65">
                        {formatSignedUpAt(row.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
