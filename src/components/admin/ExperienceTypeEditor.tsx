"use client";

import { useState } from "react";
import type { ExperienceType, Venue } from "@/db/schema";
import { updateExperienceTypeAction } from "@/app/admin/(dashboard)/experience-types/actions";
import {
  parseTypeContent,
  type ExperienceTypeContent,
  type TypeRoutePoint,
} from "@/lib/experience-type-content.types";
import type { EventFaqItem } from "@/lib/event-extras";
import { AtmosphereTags } from "./AtmosphereTags";
import { MediaLibrary } from "./MediaLibrary";
import { VenuePicker } from "./VenuePicker";

export function ExperienceTypeEditor({
  experienceType,
  allVenues,
}: {
  experienceType: ExperienceType;
  allVenues: Venue[];
}) {
  const initial = parseTypeContent(experienceType.content);
  const [venueIds, setVenueIds] = useState<string[]>(experienceType.venueIds ?? []);
  const [content, setContent] = useState<ExperienceTypeContent>(initial);
  const [galleryOpen, setGalleryOpen] = useState(false);

  function patch(patch: Partial<ExperienceTypeContent>) {
    setContent((prev) => ({ ...prev, ...patch }));
  }

  function updateFaq(
    lang: "faqNl" | "faqEn",
    index: number,
    field: "question" | "answer",
    value: string,
  ) {
    const list = [...(content[lang] ?? [{ question: "", answer: "" }])];
    list[index] = { ...list[index], [field]: value };
    patch({ [lang]: list });
  }

  function addFaq(lang: "faqNl" | "faqEn") {
    const list = [...(content[lang] ?? []), { question: "", answer: "" }];
    patch({ [lang]: list });
  }

  function updateRoute(index: number, field: keyof TypeRoutePoint, value: string) {
    const list = [...(content.routePoints ?? [])];
    const row = list[index] ?? { label: "", lat: 0, lng: 0 };
    if (field === "lat" || field === "lng") {
      row[field] = Number.parseFloat(value) || 0;
    } else {
      row[field] = value;
    }
    list[index] = row;
    patch({ routePoints: list });
  }

  return (
    <form
      action={updateExperienceTypeAction.bind(null, experienceType.slug)}
      className="max-w-2xl space-y-8"
    >
      <input type="hidden" name="payload" value={JSON.stringify({ venueIds, content })} />

      <section className="rounded-2xl border border-border-subtle bg-beige p-6">
        <h2 className="font-serif text-xl text-burgundy">Venues</h2>
        <p className="mt-2 text-sm text-wine/70">
          Restaurants/locaties op elke {experienceType.nameNl}.
        </p>
        <div className="mt-4">
          <VenuePicker
            allVenues={allVenues}
            selectedIds={venueIds}
            onChange={setVenueIds}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-beige p-6">
        <h2 className="font-serif text-xl text-burgundy">Paginatekst</h2>
        <p className="mt-2 text-sm text-wine/70">
          Over de ervaring, gallery en FAQ. Zelfde tekst op elke {experienceType.nameNl}.
        </p>
        <div className="mt-4">
          <label className="text-sm font-medium text-wine">Standaard sfeer-tags</label>
          <div className="mt-2">
            <AtmosphereTags
              selected={content.defaultAtmosphereTags ?? []}
              onChange={(tags) => patch({ defaultAtmosphereTags: tags })}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextArea
            label="Over de ervaring (NL)"
            value={content.atmosphereTextNl ?? ""}
            onChange={(v) => patch({ atmosphereTextNl: v })}
          />
          <TextArea
            label="Over de ervaring (EN)"
            value={content.atmosphereTextEn ?? ""}
            onChange={(v) => patch({ atmosphereTextEn: v })}
          />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-wine">Gallery</span>
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="text-sm text-burgundy underline"
            >
              Afbeeldingen toevoegen
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(content.galleryImages ?? []).map((url) => (
              <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      galleryImages: content.galleryImages?.filter((u) => u !== url),
                    })
                  }
                  className="absolute right-0 top-0 bg-red-900/80 px-1 text-xs text-cream"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <FaqBlock
          title="FAQ (NL)"
          items={content.faqNl ?? []}
          onChange={(i, f, v) => updateFaq("faqNl", i, f, v)}
          onAdd={() => addFaq("faqNl")}
        />
        <FaqBlock
          title="FAQ (EN)"
          items={content.faqEn ?? []}
          onChange={(i, f, v) => updateFaq("faqEn", i, f, v)}
          onAdd={() => addFaq("faqEn")}
        />
      </section>

      <section className="rounded-2xl border border-border-subtle bg-beige p-6">
        <h2 className="font-serif text-xl text-burgundy">Kaart / route</h2>
        <p className="mt-2 text-sm text-wine/70">
          Optioneel voor wine walks. Laat leeg bij één restaurant (wijnproeverij). Zonder
          punten: automatisch rond venues in de event-stad.
        </p>
        <div className="mt-4 space-y-3">
          {(content.routePoints ?? []).map((point, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-border-subtle bg-cream p-3 sm:grid-cols-4"
            >
              <input
                placeholder="Label"
                value={point.label}
                onChange={(e) => updateRoute(index, "label", e.target.value)}
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                placeholder="Lat"
                type="number"
                step="any"
                value={point.lat || ""}
                onChange={(e) => updateRoute(index, "lat", e.target.value)}
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm"
              />
              <input
                placeholder="Lng"
                type="number"
                step="any"
                value={point.lng || ""}
                onChange={(e) => updateRoute(index, "lng", e.target.value)}
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({
                routePoints: [
                  ...(content.routePoints ?? []),
                  { label: "", lat: 0, lng: 0 },
                ],
              })
            }
            className="text-sm text-burgundy underline"
          >
            + Routepunt
          </button>
        </div>
      </section>

      <button
        type="submit"
        className="rounded-full bg-burgundy px-8 py-3 text-sm font-medium text-cream"
      >
        Opslaan (alle {experienceType.nameNl})
      </button>

      <MediaLibrary
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        multi
        selected={content.galleryImages ?? []}
        onSelect={(url) => {
          const current = content.galleryImages ?? [];
          if (!current.includes(url)) {
            patch({ galleryImages: [...current, url] });
          }
        }}
      />
    </form>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-wine">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5"
      />
    </label>
  );
}

function FaqBlock({
  title,
  items,
  onChange,
  onAdd,
}: {
  title: string;
  items: EventFaqItem[];
  onChange: (index: number, field: "question" | "answer", value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-6">
      <span className="text-sm font-medium text-wine">{title}</span>
      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-border-subtle bg-cream p-3">
            <input
              placeholder="Vraag"
              value={item.question}
              onChange={(e) => onChange(index, "question", e.target.value)}
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Antwoord"
              value={item.answer}
              onChange={(e) => onChange(index, "answer", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button type="button" onClick={onAdd} className="text-sm text-burgundy underline">
          + FAQ-item
        </button>
      </div>
    </div>
  );
}
