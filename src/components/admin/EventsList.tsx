"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Event } from "@/db/schema";
import { adminPath } from "@/lib/admin-url";
import { EventRow } from "./EventRow";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";

type StatusFilter = "all" | "published" | "draft" | "soldOut";
type TimeFilter = "all" | "upcoming" | "past";
type KindFilter = "sundays" | "all";

const SUNDAY_TYPES: string[] = [SUNDAY_SOCIAL_TYPE, JOUW_TAFEL_TYPE];

export function EventsList({ events }: { events: Event[] }) {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [time, setTime] = useState<TimeFilter>("upcoming");
  const [kind, setKind] = useState<KindFilter>("sundays");
  const [filterNow] = useState(() => Date.now());

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (kind === "sundays" && !SUNDAY_TYPES.includes(e.experienceType)) return false;
      if (city !== "all" && e.city !== city) return false;
      if (time === "upcoming" && new Date(e.startsAt).getTime() < filterNow)
        return false;
      if (time === "past" && new Date(e.startsAt).getTime() >= filterNow)
        return false;
      if (status === "published" && e.workflowStatus !== "published") return false;
      if (status === "draft" && e.workflowStatus !== "draft") return false;
      if (status === "soldOut" && e.spotsSold < e.capacity) return false;
      if (
        q &&
        !e.nameNl.toLowerCase().includes(q) &&
        !e.nameEn.toLowerCase().includes(q) &&
        !e.city.toLowerCase().includes(q) &&
        !e.slug.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [events, search, city, status, time, kind, filterNow]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl text-burgundy">Zondagen</h1>
        <Link
          href={adminPath("/events/new")}
          className="inline-flex justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream"
        >
          + Nieuwe tafel
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Zoek op stad of naam…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        >
          <option value="all">Alle steden</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        >
          <option value="all">Elke status</option>
          <option value="published">Online</option>
          <option value="draft">Concept</option>
          <option value="soldOut">Uitverkocht</option>
        </select>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value as TimeFilter)}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        >
          <option value="upcoming">Komend</option>
          <option value="past">Geweest</option>
          <option value="all">Alle data</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
          aria-label="Soort"
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        >
          <option value="sundays">Sunday Socials</option>
          <option value="all">Alle events</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-wine/50">
        {filtered.length} {filtered.length === 1 ? "tafel" : "tafels"}
      </p>

      <div className="mt-6 space-y-2">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-subtle bg-beige/50 px-6 py-12 text-center text-wine/60">
            Geen tafels die passen bij deze filters.
          </p>
        ) : (
          filtered.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
