"use client";

import { useMemo, useState } from "react";
import type { Event } from "@/db/schema";
import {
  createEventAction,
  updateEventAction,
  publishEventAction,
  unpublishEventAction,
  deleteEventAction,
} from "@/app/admin/(dashboard)/events/actions";
import { getSiteUrl } from "@/lib/admin-url";
import {
  emptyEventExtras,
  parseEventExtras,
  serializeEventExtras,
  type EventExtras,
} from "@/lib/event-extras";
import { AtmosphereTags } from "./AtmosphereTags";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { MediaPicker } from "./MediaPicker";
import { MediaLibrary } from "./MediaLibrary";
import { OccupancyBar } from "./OccupancyBar";
import type { PreviewEventData } from "./event-preview";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function EventEditor({ event }: { event?: Event }) {
  const isEdit = Boolean(event);
  const initialExtras = event
    ? parseEventExtras(event.extras)
    : emptyEventExtras();

  const [nameNl, setNameNl] = useState(event?.nameNl ?? "");
  const [nameEn, setNameEn] = useState(event?.nameEn ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [city, setCity] = useState(event?.city ?? "Den Haag");
  const [startsAt, setStartsAt] = useState(
    event ? toLocalInput(new Date(event.startsAt)) : "",
  );
  const [endsAt, setEndsAt] = useState(
    event?.endsAt ? toLocalInput(new Date(event.endsAt)) : "",
  );
  const [priceEuros, setPriceEuros] = useState(
    event ? String(event.priceCents / 100) : "49",
  );
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 14));
  const [femaleOnly, setFemaleOnly] = useState(event?.femaleOnly ?? false);
  const [imageUrl, setImageUrl] = useState(
    event?.imageUrl ?? "/images/wine-bar.jpg",
  );
  const [taglineNl, setTaglineNl] = useState(event?.taglineNl ?? "");
  const [taglineEn, setTaglineEn] = useState(event?.taglineEn ?? "");
  const [categoryNl, setCategoryNl] = useState(event?.categoryNl ?? "PROEVERIJ");
  const [extras, setExtras] = useState<EventExtras>(initialExtras);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<"nl" | "en">("nl");

  const action = isEdit
    ? updateEventAction.bind(null, event!.id)
    : createEventAction;

  const previewData: PreviewEventData = useMemo(
    () => ({
      nameNl,
      nameEn,
      taglineNl,
      taglineEn,
      city,
      startsAt,
      endsAt,
      priceEuros: Number.parseFloat(priceEuros) || 0,
      capacity: Number.parseInt(capacity, 10) || 14,
      spotsSold: event?.spotsSold ?? 0,
      imageUrl,
      categoryNl,
      femaleOnly,
      workflowStatus: event?.workflowStatus,
      extras,
      previewLocale,
    }),
    [
      nameNl,
      nameEn,
      taglineNl,
      taglineEn,
      city,
      startsAt,
      endsAt,
      priceEuros,
      capacity,
      event,
      imageUrl,
      categoryNl,
      femaleOnly,
      extras,
      previewLocale,
    ],
  );

  const publicUrl = slug
    ? `${getSiteUrl()}/nl/agenda/${slug}`
    : null;

  function updateExtras(patch: Partial<EventExtras>) {
    setExtras((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <form action={action} className="space-y-10">
          <input type="hidden" name="extras" value={serializeEventExtras(extras)} />

          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Naam (NL)" value={nameNl} onChange={setNameNl} name="nameNl" required />
              <Field
                label="Naam (EN)"
                value={nameEn}
                onChange={setNameEn}
                name="nameEn"
                required
              />
              <Field
                label="Slug"
                value={slug}
                onChange={setSlug}
                name="slug"
                required
                hint="URL: /agenda/jouw-slug"
                onBlur={() => {
                  if (!slug && nameNl) setSlug(slugify(nameNl));
                }}
              />
              <Field label="Stad" value={city} onChange={setCity} name="city" required />
              <Field
                label="Start"
                type="datetime-local"
                value={startsAt}
                onChange={setStartsAt}
                name="startsAt"
                required
              />
              <Field
                label="Einde"
                type="datetime-local"
                value={endsAt}
                onChange={setEndsAt}
                name="endsAt"
              />
              <Field
                label="Prijs (€)"
                type="number"
                step="0.01"
                value={priceEuros}
                onChange={setPriceEuros}
                name="priceEuros"
                required
              />
              <Field
                label="Capaciteit"
                type="number"
                value={capacity}
                onChange={setCapacity}
                name="capacity"
                required
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Tagline (NL)"
                value={taglineNl}
                onChange={setTaglineNl}
                name="taglineNl"
              />
              <Field
                label="Tagline (EN)"
                value={taglineEn}
                onChange={setTaglineEn}
                name="taglineEn"
              />
            </div>
          </Section>

          <Section title="Atmosphere">
            <label className="block text-sm font-medium text-wine">Sfeer-tags</label>
            <div className="mt-2">
              <AtmosphereTags
                selected={extras.atmosphereTags ?? []}
                onChange={(tags) => updateExtras({ atmosphereTags: tags })}
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="femaleOnly"
                value="on"
                checked={femaleOnly}
                onChange={(e) => setFemaleOnly(e.target.checked)}
                className="rounded"
              />
              Girls only
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextArea
                label="Sfeertekst (NL)"
                value={extras.atmosphereTextNl ?? ""}
                onChange={(v) => updateExtras({ atmosphereTextNl: v })}
                rows={4}
              />
              <TextArea
                label="Sfeertekst (EN)"
                value={extras.atmosphereTextEn ?? ""}
                onChange={(v) => updateExtras({ atmosphereTextEn: v })}
                rows={4}
              />
            </div>
          </Section>

          <Section title="Visuals">
            <MediaPicker value={imageUrl} onChange={setImageUrl} label="Hero image" />
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-wine">Gallery</span>
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="text-sm text-burgundy underline"
                >
                  Add images
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(extras.galleryImages ?? []).map((url) => (
                  <div
                    key={url}
                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-border-subtle"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        updateExtras({
                          galleryImages: extras.galleryImages?.filter((u) => u !== url),
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
          </Section>

          <Section title="Booking">
            {isEdit ? (
              <OccupancyBar
                sold={event!.spotsSold}
                capacity={event!.capacity}
              />
            ) : (
              <p className="text-sm text-wine/60">
                Bezetting verschijnt na de eerste boekingen.
              </p>
            )}
          </Section>

          <Section title="Settings">
            <Field
              label="Categorie (NL)"
              value={categoryNl}
              onChange={setCategoryNl}
              name="categoryNl"
            />
            <input type="hidden" name="categoryEn" value={categoryNl === "PROEVERIJ" ? "TASTING" : categoryNl} />
            {isEdit ? (
              <p className="mt-2 text-sm text-wine/60">
                Status: <strong className="text-burgundy">{event!.workflowStatus}</strong>
              </p>
            ) : null}
          </Section>

          <button
            type="submit"
            className="rounded-full bg-burgundy px-8 py-3 text-sm font-medium text-cream"
          >
            {isEdit ? "Save experience" : "Create draft"}
          </button>
        </form>

        {isEdit ? (
          <div className="flex flex-wrap gap-3 border-t border-border-subtle pt-6">
            {event!.workflowStatus !== "published" ? (
              <form action={publishEventAction.bind(null, event!.id)}>
                <button
                  type="submit"
                  className="rounded-full bg-burgundy px-5 py-2 text-sm text-cream"
                >
                  Publish
                </button>
              </form>
            ) : (
              <form action={unpublishEventAction.bind(null, event!.id)}>
                <button
                  type="submit"
                  className="rounded-full border border-burgundy px-5 py-2 text-sm text-burgundy"
                >
                  Unpublish
                </button>
              </form>
            )}
            {publicUrl ? (
              <>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border-subtle px-5 py-2 text-sm"
                >
                  Open public page
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                  className="rounded-full border border-border-subtle px-5 py-2 text-sm"
                >
                  Copy link
                </button>
              </>
            ) : null}
            <form action={deleteEventAction.bind(null, event!.id)}>
              <button
                type="submit"
                className="rounded-full border border-red-800/30 px-5 py-2 text-sm text-red-900"
              >
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setPreviewLocale("nl")}
            className={`rounded-full px-3 py-1 text-xs ${previewLocale === "nl" ? "bg-burgundy text-cream" : "text-wine/60"}`}
          >
            NL preview
          </button>
          <button
            type="button"
            onClick={() => setPreviewLocale("en")}
            className={`rounded-full px-3 py-1 text-xs ${previewLocale === "en" ? "bg-burgundy text-cream" : "text-wine/60"}`}
          >
            EN preview
          </button>
        </div>
        <LivePreviewPanel data={previewData} />
      </div>

      <MediaLibrary
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        multi
        selected={extras.galleryImages ?? []}
        onSelect={(url) => {
          const current = extras.galleryImages ?? [];
          if (!current.includes(url)) {
            updateExtras({ galleryImages: [...current, url] });
          }
        }}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-beige p-6">
      <h2 className="font-serif text-xl text-burgundy">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
  required,
  hint,
  onBlur,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  required?: boolean;
  hint?: string;
  onBlur?: () => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-wine">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5 text-base"
      />
      {hint ? <span className="mt-1 block text-xs text-wine/50">{hint}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-wine">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5 text-base"
      />
    </label>
  );
}
