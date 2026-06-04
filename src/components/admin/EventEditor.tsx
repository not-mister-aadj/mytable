"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { Event, Venue } from "@/db/schema";
import { adminPath, getSiteUrl } from "@/lib/admin-url";
import {
  DEFAULT_EXPERIENCE_TYPE,
  type ExperienceTypeSlug,
  isValidExperienceType,
} from "@/lib/experience-type-definitions";
import { getEventFormDefaults } from "@/lib/experience-template-defaults";
import {
  createEventAction,
  updateEventAction,
  publishEventAction,
  unpublishEventAction,
  deleteEventAction,
  type EventFormState,
} from "@/app/admin/(dashboard)/events/actions";
import { validateEventForm } from "@/lib/event-form-validation";
import {
  emptyEventExtras,
  GIRLS_ONLY_ATMOSPHERE_TAG,
  parseEventExtras,
  resolveFemaleOnly,
  serializeEventExtras,
  type EventExtras,
} from "@/lib/event-extras";
import { AtmosphereTags } from "./AtmosphereTags";
import { EventTypePicker } from "./EventTypePicker";
import { AdminEditorSplit } from "./AdminEditorSplit";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { MediaPicker } from "./MediaPicker";
import { OccupancyBar } from "./OccupancyBar";
import { VenuePicker } from "./VenuePicker";
import type { PreviewEventData } from "./event-preview";
import { coerceImageSettings, isUsableImageUrl } from "@/lib/image-settings";

function loadInitialExtras(event?: Event): EventExtras {
  if (!event) return emptyEventExtras();
  const e = parseEventExtras(event.extras);
  if (!e.heroImage && isUsableImageUrl(event.imageUrl)) {
    e.heroImage = coerceImageSettings(event.imageUrl, "hero");
  }
  if (!e.cardImage && e.cardImageUrl) {
    e.cardImage = coerceImageSettings(e.cardImageUrl, "agenda-card");
  }
  return e;
}

const STEPS = [
  "Type",
  "Basis",
  "Agendakaart",
  "Hero",
  "Venues",
  "Overrides",
] as const;

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

function applyTypeDefaults(
  slug: ExperienceTypeSlug,
  setters: {
    setCategoryNl: (v: string) => void;
    setCategoryEn: (v: string) => void;
    setTaglineNl: (v: string) => void;
    setTaglineEn: (v: string) => void;
    setExtras: (fn: (p: EventExtras) => EventExtras) => void;
  },
) {
  const d = getEventFormDefaults(slug);
  setters.setCategoryNl(d.categoryNl);
  setters.setCategoryEn(d.categoryEn);
  setters.setTaglineNl(d.taglineNl);
  setters.setTaglineEn(d.taglineEn);
  setters.setExtras((prev) => ({
    ...prev,
    cardCategoryNl: d.cardCategoryNl,
    cardCategoryEn: d.cardCategoryEn,
    cardTextNl: d.cardTextNl,
    cardTextEn: d.cardTextEn,
  }));
}

export function EventEditor({
  event,
  allVenues = [],
  initialType,
}: {
  event?: Event;
  allVenues?: Venue[];
  initialType?: string;
}) {
  const isEdit = Boolean(event);
  const initialExtras = loadInitialExtras(event);

  const startType: ExperienceTypeSlug =
    event && isValidExperienceType(event.experienceType)
      ? event.experienceType
      : initialType && isValidExperienceType(initialType)
        ? initialType
        : DEFAULT_EXPERIENCE_TYPE;

  const [step, setStep] = useState<number>(isEdit || initialType ? 1 : 0);
  const [experienceType, setExperienceType] =
    useState<ExperienceTypeSlug>(startType);
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
  const [femaleOnly, setFemaleOnly] = useState(() =>
    resolveFemaleOnly(event?.femaleOnly, initialExtras.atmosphereTags),
  );
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? "");
  const [taglineNl, setTaglineNl] = useState(event?.taglineNl ?? "");
  const [taglineEn, setTaglineEn] = useState(event?.taglineEn ?? "");
  const [categoryNl, setCategoryNl] = useState(
    event?.categoryNl ?? getEventFormDefaults(startType).categoryNl,
  );
  const [categoryEn, setCategoryEn] = useState(
    event?.categoryEn ?? getEventFormDefaults(startType).categoryEn,
  );
  const [extras, setExtras] = useState<EventExtras>(initialExtras);
  const [previewLocale, setPreviewLocale] = useState<"nl" | "en">("nl");

  const [saveState, submitAction, isSaving] = useActionState(
    isEdit
      ? updateEventAction.bind(null, event!.id)
      : createEventAction,
    { error: null },
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const saveError = localError ?? saveState.error;

  function buildFormSnapshot(): EventFormState {
    return {
      slug,
      city,
      startsAt,
      endsAt,
      priceEuros,
      capacity,
      femaleOnly,
      imageUrl,
      nameNl,
      nameEn,
      taglineNl,
      taglineEn,
      categoryNl,
      categoryEn,
      experienceType,
      extras,
    };
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    const validationError = validateEventForm(buildFormSnapshot());
    if (validationError) {
      e.preventDefault();
      setLocalError(validationError);
      setStep(1);
      return;
    }
    setLocalError(null);
  }

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
      categoryEn,
      femaleOnly,
      experienceType,
      workflowStatus: event?.workflowStatus,
      extras,
      previewLocale,
      eventId: event?.id,
      previewRevision: event?.updatedAt
        ? new Date(event.updatedAt).getTime()
        : 0,
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
      event?.updatedAt,
      imageUrl,
      categoryNl,
      categoryEn,
      femaleOnly,
      experienceType,
      extras,
      previewLocale,
    ],
  );

  const publicUrl = slug ? `${getSiteUrl()}/nl/agenda/${slug}` : null;

  function updateExtras(patch: Partial<EventExtras>) {
    setExtras((prev) => ({ ...prev, ...patch }));
  }

  function updateSectionOverride(
    patch: Partial<NonNullable<EventExtras["sectionOverrides"]>>,
  ) {
    setExtras((prev) => ({
      ...prev,
      sectionOverrides: { ...prev.sectionOverrides, ...patch },
    }));
  }

  function pickType(slug: ExperienceTypeSlug) {
    setExperienceType(slug);
    applyTypeDefaults(slug, {
      setCategoryNl,
      setCategoryEn,
      setTaglineNl,
      setTaglineEn,
      setExtras,
    });
    setStep(1);
  }

  if (!isEdit && step === 0) {
    return (
      <div className="grid gap-10 xl:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-serif text-2xl text-burgundy">
            Stap 1 — Kies experience type
          </h2>
          <p className="mt-2 text-sm text-wine/60">
            Het type bepaalt vaste teksten, FAQ en standaard secties op de
            eventpagina.
          </p>
          <div className="mt-8">
            <EventTypePicker onSelect={pickType} />
          </div>
        </div>
      </div>
    );
  }

  const previewColumn = (
    <>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setPreviewLocale("nl")}
          className={`rounded-full px-3 py-1 text-xs ${previewLocale === "nl" ? "bg-burgundy text-cream" : "text-wine/60"}`}
        >
          NL
        </button>
        <button
          type="button"
          onClick={() => setPreviewLocale("en")}
          className={`rounded-full px-3 py-1 text-xs ${previewLocale === "en" ? "bg-burgundy text-cream" : "text-wine/60"}`}
        >
          EN
        </button>
      </div>
      <LivePreviewPanel data={previewData} allVenues={allVenues} />
    </>
  );

  return (
    <AdminEditorSplit
      preview={previewColumn}
      form={
      <div className="space-y-8">
        <nav className="flex flex-wrap gap-2">
          {STEPS.slice(isEdit ? 1 : 0).map((label, i) => {
            const idx = isEdit ? i + 1 : i;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(idx)}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  step === idx
                    ? "bg-burgundy text-cream"
                    : "border border-border-subtle text-wine/70"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <form action={submitAction} onSubmit={handleFormSubmit} className="space-y-8">
          <textarea
            name="extras"
            readOnly
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            value={serializeEventExtras(extras)}
          />
          <input type="hidden" name="experienceType" value={experienceType} />
          <input type="hidden" name="nameNl" value={nameNl} />
          <input type="hidden" name="nameEn" value={nameEn} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="startsAt" value={startsAt} />
          <input type="hidden" name="endsAt" value={endsAt} />
          <input type="hidden" name="priceEuros" value={priceEuros} />
          <input type="hidden" name="capacity" value={capacity} />
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="categoryNl" value={categoryNl} />
          <input type="hidden" name="categoryEn" value={categoryEn} />
          <input type="hidden" name="taglineNl" value={taglineNl} />
          <input type="hidden" name="taglineEn" value={taglineEn} />
          {femaleOnly ? <input type="hidden" name="femaleOnly" value="on" /> : null}

          {step === 1 ? (
            <Section title="Basis — tafelgegevens">
              {!isEdit ? (
                <p className="text-sm text-wine/60">
                  Type:{" "}
                  <strong className="text-burgundy">
                    {getEventFormDefaults(experienceType).categoryNl}
                  </strong>{" "}
                  <button
                    type="button"
                    className="text-burgundy underline"
                    onClick={() => setStep(0)}
                  >
                    wijzig type
                  </button>
                </p>
              ) : (
                <label className="block text-sm">
                  <span className="font-medium text-wine">Type</span>
                  <select
                    value={experienceType}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (isValidExperienceType(v)) pickType(v);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5"
                  >
                    <option value="wine-tasting">Wijnproeverij</option>
                    <option value="wine-walk">Wijnwalk</option>
                    <option value="chefs-special">Chef&apos;s Special</option>
                  </select>
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Eventnaam (NL)" value={nameNl} onChange={setNameNl} name="nameNl" required />
                <Field label="Eventnaam (EN)" value={nameEn} onChange={setNameEn} name="nameEn" required />
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
                <Field label="Start" type="datetime-local" value={startsAt} onChange={setStartsAt} name="startsAt" required />
                <Field label="Einde" type="datetime-local" value={endsAt} onChange={setEndsAt} name="endsAt" />
                <Field label="Prijs (€)" type="number" step="0.01" value={priceEuros} onChange={setPriceEuros} name="priceEuros" required />
                <Field label="Capaciteit" type="number" value={capacity} onChange={setCapacity} name="capacity" required />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="femaleOnly"
                  value="on"
                  checked={femaleOnly}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFemaleOnly(checked);
                    const tags = extras.atmosphereTags ?? [];
                    if (checked && !tags.includes(GIRLS_ONLY_ATMOSPHERE_TAG)) {
                      updateExtras({
                        atmosphereTags: [...tags, GIRLS_ONLY_ATMOSPHERE_TAG],
                      });
                    } else if (!checked) {
                      updateExtras({
                        atmosphereTags: tags.filter(
                          (t) => t !== GIRLS_ONLY_ATMOSPHERE_TAG,
                        ),
                      });
                    }
                  }}
                  className="rounded"
                />
                Girls only
              </label>
              <div>
                <label className="block text-sm font-medium text-wine">Sfeer-tags</label>
                <div className="mt-2">
                  <AtmosphereTags
                    selected={extras.atmosphereTags ?? []}
                    onChange={(tags) => {
                      setFemaleOnly(tags.includes(GIRLS_ONLY_ATMOSPHERE_TAG));
                      updateExtras({ atmosphereTags: tags });
                    }}
                  />
                </div>
              </div>
            </Section>
          ) : null}

          {step === 2 ? (
            <Section title="Agendakaart">
              <p className="text-sm text-wine/60">
                Hoe de tafel op de agenda verschijnt (kan afwijken van de
                detailpagina).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Kaarttitel (NL)"
                  value={extras.cardTitleNl ?? ""}
                  onChange={(v) => updateExtras({ cardTitleNl: v || undefined })}
                  name="_cardTitleNl"
                />
                <Field
                  label="Kaarttitel (EN)"
                  value={extras.cardTitleEn ?? ""}
                  onChange={(v) => updateExtras({ cardTitleEn: v || undefined })}
                  name="_cardTitleEn"
                />
                <Field
                  label="Categorie label (NL)"
                  value={extras.cardCategoryNl ?? categoryNl}
                  onChange={(v) => updateExtras({ cardCategoryNl: v })}
                  name="_cardCatNl"
                />
                <Field
                  label="Categorie label (EN)"
                  value={extras.cardCategoryEn ?? categoryEn}
                  onChange={(v) => updateExtras({ cardCategoryEn: v })}
                  name="_cardCatEn"
                />
              </div>
              <TextArea
                label="Korte tekst kaart (NL)"
                value={extras.cardTextNl ?? ""}
                onChange={(v) => updateExtras({ cardTextNl: v || undefined })}
              />
              <TextArea
                label="Korte tekst kaart (EN)"
                value={extras.cardTextEn ?? ""}
                onChange={(v) => updateExtras({ cardTextEn: v || undefined })}
              />
              <MediaPicker
                usage="agenda-card"
                value={extras.cardImage}
                onChange={(v) =>
                  updateExtras({
                    cardImage: v,
                    cardImageUrl: v?.url,
                  })
                }
                label="Kaartafbeelding"
              />
            </Section>
          ) : null}

          {step === 3 ? (
            <Section title="Detailpagina — hero">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Hero titel (NL)"
                  value={extras.heroTitleNl ?? nameNl}
                  onChange={(v) => updateExtras({ heroTitleNl: v || undefined })}
                  name="_heroNl"
                />
                <Field
                  label="Hero titel (EN)"
                  value={extras.heroTitleEn ?? nameEn}
                  onChange={(v) => updateExtras({ heroTitleEn: v || undefined })}
                  name="_heroEn"
                />
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
              <MediaPicker
                usage="hero"
                value={extras.heroImage}
                onChange={(v) => {
                  updateExtras({ heroImage: v });
                  setImageUrl(v?.url ?? "");
                }}
                label="Hero-afbeelding"
              />
              <input type="hidden" name="imageUrl" value={imageUrl} />
              <MediaPicker
                usage="gallery"
                value={extras.galleryImageSettings?.[0]}
                onChange={(v) => {
                  const rest = extras.galleryImageSettings?.slice(1) ?? [];
                  const next = v ? [v, ...rest] : rest;
                  updateExtras({
                    galleryImageSettings: next.length ? next : undefined,
                    galleryImages: next.map((g) => g.url),
                  });
                }}
                label="Sfeerimpressie (eerste afbeelding)"
              />
              {(extras.galleryImageSettings?.length ?? 0) > 1 ? (
                <p className="text-xs text-wine/50">
                  {extras.galleryImageSettings!.length} afbeeldingen in galerij
                </p>
              ) : null}
            </Section>
          ) : null}

          {step === 4 ? (
            <Section title="Venues">
              <VenuePicker
                allVenues={allVenues}
                selectedIds={extras.venueIds ?? []}
                onChange={(ids) => updateExtras({ venueIds: ids })}
                eventCity={city}
                locale={previewLocale}
              />
            </Section>
          ) : null}

          {step === 5 ? (
            <Section title="Optionele overrides">
              <p className="text-sm text-wine/60">
                Leeg laten = template-tekst van het type. Ingevuld = alleen voor
                deze tafel.
              </p>
              <TextArea
                label="Venues intro (NL)"
                value={extras.sectionOverrides?.venuesIntroNl ?? ""}
                onChange={(v) => updateSectionOverride({ venuesIntroNl: v || undefined })}
              />
              <TextArea
                label="Over deze ervaring (NL)"
                value={extras.sectionOverrides?.aboutNl ?? ""}
                onChange={(v) => updateSectionOverride({ aboutNl: v || undefined })}
              />
              <TextArea
                label="Venues intro (EN)"
                value={extras.sectionOverrides?.venuesIntroEn ?? ""}
                onChange={(v) => updateSectionOverride({ venuesIntroEn: v || undefined })}
              />
              <TextArea
                label="Over deze ervaring (EN)"
                value={extras.sectionOverrides?.aboutEn ?? ""}
                onChange={(v) => updateSectionOverride({ aboutEn: v || undefined })}
              />
            </Section>
          ) : null}

          {saveError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {saveError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {step > (isEdit ? 1 : 0) ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full border border-border-subtle px-6 py-2.5 text-sm"
              >
                Vorige
              </button>
            ) : null}
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full border border-burgundy px-6 py-2.5 text-sm text-burgundy"
              >
                Volgende
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-burgundy px-8 py-3 text-sm font-medium text-cream disabled:opacity-60"
            >
              {isSaving ? "Opslaan…" : isEdit ? "Opslaan" : "Concept opslaan"}
            </button>
          </div>
        </form>

        {isEdit ? (
          <div className="flex flex-wrap gap-3 border-t border-border-subtle pt-6">
            {event!.workflowStatus !== "published" ? (
              <form action={publishEventAction.bind(null, event!.id)}>
                <button type="submit" className="rounded-full bg-burgundy px-5 py-2 text-sm text-cream">
                  Publiceren
                </button>
              </form>
            ) : (
              <form action={unpublishEventAction.bind(null, event!.id)}>
                <button type="submit" className="rounded-full border border-burgundy px-5 py-2 text-sm text-burgundy">
                  Depubliceren
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
                  Open publieke pagina
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                  className="rounded-full border border-border-subtle px-5 py-2 text-sm"
                >
                  Kopieer URL
                </button>
              </>
            ) : null}
            <form
              action={deleteEventAction.bind(null, event!.id)}
              onSubmit={(e) => {
                const bookingNote =
                  event!.spotsSold > 0
                    ? `\n\nLet op: ${event!.spotsSold} boeking(en) worden ook verwijderd.`
                    : "";
                if (
                  !confirm(
                    `Weet je zeker dat je "${event!.nameNl}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.${bookingNote}`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <button type="submit" className="rounded-full border border-red-800/30 px-5 py-2 text-sm text-red-900">
                Verwijderen
              </button>
            </form>
          </div>
        ) : null}

        {isEdit ? (
          <Section title="Boekingen">
            <OccupancyBar sold={event!.spotsSold} capacity={event!.capacity} />
          </Section>
        ) : null}
      </div>
      }
    />
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
