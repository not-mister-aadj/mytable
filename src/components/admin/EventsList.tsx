"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Event } from "@/db/schema";
import { adminPath } from "@/lib/admin-url";
import { EventRow } from "./EventRow";

type StatusFilter = "all" | "published" | "draft" | "soldOut";
type TimeFilter = "all" | "upcoming" | "past";

export function EventsList({ events }: { events: Event[] }) {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [time, setTime] = useState<TimeFilter>("upcoming");

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return events.filter((e) => {
      if (city !== "all" && e.city !== city) return false;
      if (time === "upcoming" && new Date(e.startsAt).getTime() < now) return false;
      if (time === "past" && new Date(e.startsAt).getTime() >= now) return false;
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
  }, [events, search, city, status, time]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl text-burgundy">Experiences</h1>
        <Link
          href={adminPath("/events/new")}
          className="inline-flex justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream"
        >
          + New experience
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        >
          <option value="all">All cities</option>
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
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="soldOut">Sold out</option>
        </select>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value as TimeFilter)}
          className="rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm"
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-wine/50">
        {filtered.length} experience{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-subtle bg-beige/50 px-6 py-12 text-center text-wine/60">
            No experiences match your filters.
          </p>
        ) : (
          filtered.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
