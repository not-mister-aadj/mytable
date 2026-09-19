"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_TABLE_LANGUAGE_PREFERENCE,
  type TableLanguagePreference,
} from "@/lib/booking-table-language";

interface SundayTableBookingCardProps {
  eventId: string;
  locale: Locale;
  pricePerSeatEuros: number;
  spotsLeft: number;
  emailLabel: string;
  nameLabel: string;
  seatsLabel: string;
  seatOneLabel: string;
  seatTwoLabel: string;
  languageLabel: string;
  languageDutchLabel: string;
  languageEnglishLabel: string;
  languageBothLabel: string;
  ctaLabel: string;
  ctaLabelPlural: string;
  soldOutLabel: string;
  guarantees: string[];
  genericErrorLabel: string;
}

export function SundayTableBookingCard({
  eventId,
  locale,
  pricePerSeatEuros,
  spotsLeft,
  emailLabel,
  nameLabel,
  seatsLabel,
  seatOneLabel,
  seatTwoLabel,
  languageLabel,
  languageDutchLabel,
  languageEnglishLabel,
  languageBothLabel,
  ctaLabel,
  ctaLabelPlural,
  soldOutLabel,
  guarantees,
  genericErrorLabel,
}: SundayTableBookingCardProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [seats, setSeats] = useState<1 | 2>(1);
  const [tableLanguagePreference, setTableLanguagePreference] =
    useState<TableLanguagePreference>(DEFAULT_TABLE_LANGUAGE_PREFERENCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = spotsLeft <= 0;
  const maxSeats = Math.min(2, spotsLeft);
  const total = pricePerSeatEuros * seats;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (soldOut || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          email,
          name,
          seats,
          locale,
          tableLanguagePreference,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? genericErrorLabel);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(genericErrorLabel);
      setLoading(false);
    }
  }

  if (soldOut) {
    return (
      <div className="mt-6 rounded-full bg-wine/10 px-4 py-3 text-center text-sm font-medium text-wine/70">
        {soldOutLabel}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium text-wine">
        {emailLabel}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 shadow-sm transition focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10"
        />
      </label>
      <label className="block text-sm font-medium text-wine">
        {nameLabel}
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 shadow-sm transition focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10"
        />
      </label>

      <div>
        <span className="block text-sm font-medium text-wine">{languageLabel}</span>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {(
            [
              ["prefer_dutch", languageDutchLabel],
              ["both_fine", languageBothLabel],
              ["prefer_english", languageEnglishLabel],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTableLanguagePreference(value)}
              className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                tableLanguagePreference === value
                  ? "border-burgundy bg-burgundy text-cream"
                  : "border-wine/15 bg-white text-wine/70 hover:border-wine/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-wine">{seatsLabel}</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSeats(1)}
            className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
              seats === 1
                ? "border-burgundy bg-burgundy text-cream"
                : "border-wine/15 bg-white text-wine/70 hover:border-wine/30"
            }`}
          >
            {seatOneLabel}
          </button>
          <button
            type="button"
            onClick={() => setSeats(2)}
            disabled={maxSeats < 2}
            className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              seats === 2
                ? "border-burgundy bg-burgundy text-cream"
                : "border-wine/15 bg-white text-wine/70 hover:border-wine/30"
            }`}
          >
            {seatTwoLabel}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}

      <Button
        type="submit"
        className="w-full justify-center bg-burgundy px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-cream hover:bg-wine"
      >
        {loading ? "…" : `${seats > 1 ? ctaLabelPlural : ctaLabel} · €${total}`}
      </Button>
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-wine/50">
        {guarantees.map((item) => (
          <span key={item} className="inline-flex items-center gap-1">
            <span aria-hidden className="text-wine/40">
              ✓
            </span>
            {item}
          </span>
        ))}
      </p>
    </form>
  );
}
