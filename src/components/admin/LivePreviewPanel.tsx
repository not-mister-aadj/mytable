"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import type { PreviewEventData } from "./event-preview";
import {
  buildCardPreviewExperience,
  buildDetailPreviewExperience,
} from "./event-preview";
import { OccupancyBar } from "./OccupancyBar";
import { StatusPill, getEventListStatus } from "./StatusPill";
import type { Event } from "@/db/schema";
import { experiencePageNl } from "@/i18n/experience-page-nl";
import { getExperienceTypeDefinition } from "@/lib/experience-type-definitions";

export function LivePreviewPanel({ data }: { data: PreviewEventData }) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [mode, setMode] = useState<"card" | "detail">("card");

  const card = buildCardPreviewExperience(data);
  const detail = buildDetailPreviewExperience(data);
  const typeDef = getExperienceTypeDefinition(data.experienceType);
  const mood =
    experiencePageNl.moods[typeDef?.mood ?? "tastings"];

  const mockEvent = {
    workflowStatus: data.workflowStatus ?? "draft",
    spotsSold: data.spotsSold ?? 0,
    capacity: data.capacity ?? 14,
  } as Event;
  const status = getEventListStatus(mockEvent);

  const widthClass = viewport === "mobile" ? "w-[320px]" : "w-full";

  return (
    <div className="sticky top-24 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg text-burgundy">Live preview</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("card")}
              className={`rounded-full px-3 py-1 ${mode === "card" ? "bg-burgundy text-cream" : "text-wine/70"}`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setMode("detail")}
              className={`rounded-full px-3 py-1 ${mode === "detail" ? "bg-burgundy text-cream" : "text-wine/70"}`}
            >
              Detail
            </button>
          </div>
          <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`rounded-full px-3 py-1 ${viewport === "desktop" ? "bg-burgundy text-cream" : "text-wine/70"}`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`rounded-full px-3 py-1 ${viewport === "mobile" ? "bg-burgundy text-cream" : "text-wine/70"}`}
            >
              Mobile
            </button>
          </div>
        </div>
      </div>

      <motion.div
        layout
        className={`mx-auto max-h-[80vh] overflow-y-auto rounded-2xl border border-border-subtle bg-cream shadow-lg ${widthClass}`}
      >
        {mode === "card" ? (
          <CardPreview
            experience={card}
            status={status}
            data={data}
          />
        ) : (
          <DetailPreview
            experience={detail}
            mood={mood}
            status={status}
            data={data}
          />
        )}
      </motion.div>
    </div>
  );
}

function CardPreview({
  experience,
  status,
  data,
}: {
  experience: ReturnType<typeof buildCardPreviewExperience>;
  status: ReturnType<typeof getEventListStatus>;
  data: PreviewEventData;
}) {
  const img = experience.cardImage ?? experience.image;
  return (
    <>
      <div className="relative aspect-[16/10] w-full">
        {img ? (
          <Image
            src={img}
            alt={experience.experienceName}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-wine/10 text-sm text-wine/40">
            Card image
          </div>
        )}
        <span className="absolute right-3 top-3">
          <StatusPill status={status} />
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">
          {experience.category}
        </p>
        <h4 className="font-serif text-2xl text-wine">{experience.city}</h4>
        <p className="font-medium text-wine/90">
          {experience.cardTitle ?? experience.experienceName}
        </p>
        {experience.cardText ? (
          <p className="text-xs leading-relaxed text-wine/65 line-clamp-3">
            {experience.cardText}
          </p>
        ) : null}
        <p className="text-xs text-wine/60">{experience.dateTime}</p>
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg text-burgundy">
            €{experience.price}
          </span>
        </div>
        <OccupancyBar
          sold={data.spotsSold ?? 0}
          capacity={data.capacity ?? 14}
          compact
        />
      </div>
    </>
  );
}

function DetailPreview({
  experience,
  mood,
  status,
  data,
}: {
  experience: ReturnType<typeof buildDetailPreviewExperience>;
  mood: (typeof experiencePageNl.moods)["tastings"];
  status: ReturnType<typeof getEventListStatus>;
  data: PreviewEventData;
}) {
  return (
    <>
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={experience.image}
          alt={experience.experienceName}
          fill
          className="object-cover"
          sizes="400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine/90 via-wine/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">
            {experience.category}
          </p>
          <h4 className="font-serif text-xl text-cream leading-tight">
            {experience.experienceName}
          </h4>
          <p className="text-sm text-cream/80">
            {experience.city} · {experience.dateTime}
          </p>
          {experience.tagline ? (
            <p className="mt-1 text-xs text-cream/70 line-clamp-2">
              {experience.tagline}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-4 text-sm">
        <div className="flex items-center justify-between">
          <StatusPill status={status} />
          <span className="font-serif text-lg text-burgundy">
            €{experience.price}
          </span>
        </div>
        <OccupancyBar
          sold={data.spotsSold ?? 0}
          capacity={data.capacity ?? 14}
          compact
        />
        {experience.pageSections ? (
          <section>
            <h5 className="font-serif text-base text-burgundy">
              {experience.pageSections.venuesTitle}
            </h5>
            <p className="mt-1 text-xs text-wine/70 line-clamp-4">
              {experience.pageSections.venuesSubtitle}
            </p>
            <p className="mt-2 text-xs text-wine/50">
              {data.extras.venueIds?.length ?? 0} venue(s) geselecteerd
            </p>
          </section>
        ) : null}
        <section>
          <h5 className="font-serif text-base text-burgundy">Over deze ervaring</h5>
          <p className="mt-1 text-xs text-wine/70 line-clamp-5">
            {experience.customDescription ?? mood.description}
          </p>
        </section>
        <section>
          <h5 className="font-serif text-base text-burgundy">
            Hoe verloopt de ervaring
          </h5>
          <ul className="mt-2 space-y-2">
            {mood.experienceFlow.slice(0, 4).map((step) => (
              <li key={step.title} className="text-xs text-wine/70">
                <strong className="text-wine">{step.title}</strong>
                <span className="block">{step.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
