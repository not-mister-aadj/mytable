"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { Event, Venue } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import {
  DEFAULT_EXPERIENCE_TYPE,
  type ExperienceTypeSlug,
  isValidExperienceType,
} from "@/lib/experience-type-definitions";
import { getEventFormDefaults } from "@/lib/experience-template-defaults";
import {
  createEventDirectAction,
  saveEventAction,
  saveAndPublishEventAction,
  unpublishEventAction,
  deleteEventAction,
  type EventFormState,
} from "@/app/admin/(dashboard)/events/actions";
import {
  formatEventSaveError,
  validateEventForm,
  validateEventForPublish,
} from "@/lib/event-form-validation";
import {
  detectEditorUiFlags,
  effectiveImageUrl,
  effectiveTaglines,
  normalizeEventExtras,
  type EventEditorUiFlags,
} from "@/lib/event-editor-helpers";
import {
  emptyEventExtras,
  GIRLS_ONLY_ATMOSPHERE_TAG,
  parseEventExtras,
  resolveFemaleOnly,
  serializeEventExtras,
  type EventExtras,
} from "@/lib/event-extras";
import { AtmosphereTags } from "./AtmosphereTags";
import { AdminEditorSplit } from "./AdminEditorSplit";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { VenueImagePicker } from "./VenueImagePicker";
import { VenuePicker } from "./VenuePicker";
import type { PreviewEventData } from "./event-preview";
import {
  resolveEventImagesFromVenues,
  stripVenueImageRefs,
} from "@/lib/venue-images";
import type { VenueImageRef } from "@/lib/venue-images";
import {
  coerceImageSettings,
  isUsableImageUrl,
} from "@/lib/image-settings";
import {
  formatEventDateTimeLocal,
  parseEventDateTimeLocal,
} from "@/lib/event-datetime-local";

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

const STEPS = ["Basis", "Venues", "Content", "Overrides"] as const;
const LAST_STEP = STEPS.length - 1;

function toLocalInput(d: Date | string | null): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return formatEventDateTimeLocal(date);
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

  const templateDefaults = getEventFormDefaults(startType);

  const [step, setStep] = useState(0);
  const [venueLibrary, setVenueLibrary] = useState(allVenues);
  const [experienceType, setExperienceType] =
    useState<ExperienceTypeSlug>(startType);
  const [nameNl, setNameNl] = useState(event?.nameNl ?? "");
  const [nameEn, setNameEn] = useState(event?.nameEn ?? "");
  const [city, setCity] = useState(event?.city ?? "Den Haag");
  const [startsAt, setStartsAt] = useState(
    event ? toLocalInput(event.startsAt) : "",
  );
  const [endsAt, setEndsAt] = useState(
    event?.endsAt ? toLocalInput(event.endsAt) : "",
  );
  const [priceEuros, setPriceEuros] = useState(
    event ? String(event.priceCents / 100) : "49",
  );
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 14));
  const [femaleOnly, setFemaleOnly] = useState(() =>
    resolveFemaleOnly(event?.femaleOnly, initialExtras.atmosphereTags),
  );
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? "");
  const [taglineNl, setTaglineNl] = useState(
    event?.taglineNl ?? templateDefaults.taglineNl,
  );
  const [taglineEn, setTaglineEn] = useState(
    event?.taglineEn ?? templateDefaults.taglineEn,
  );
  const [categoryNl, setCategoryNl] = useState(
    event?.categoryNl ?? templateDefaults.categoryNl,
  );
  const [categoryEn, setCategoryEn] = useState(
    event?.categoryEn ?? templateDefaults.categoryEn,
  );
  const [extras, setExtras] = useState<EventExtras>(initialExtras);
  const [previewLocale, setPreviewLocale] = useState<"nl" | "en">("nl");

  useEffect(() => {
    setVenueLibrary(allVenues);
  }, [allVenues]);

  const refreshVenueLibrary = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/venues", { cache: "no-store" });
      const data = (await res.json()) as { venues?: Venue[] };
      if (Array.isArray(data.venues)) {
        setVenueLibrary(data.venues);
      }
    } catch {
      // keep current library
    }
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    void refreshVenueLibrary();
  }, [step, refreshVenueLibrary]);

  const initialFlags = detectEditorUiFlags(
    initialExtras,
    event,
    startType,
    event?.taglineNl ?? templateDefaults.taglineNl,
    event?.taglineEn ?? templateDefaults.taglineEn,
  );
  const [customTagline, setCustomTagline] = useState(initialFlags.customTagline);
  const [customCardText, setCustomCardText] = useState(
    initialFlags.customCardText,
  );

  const uiFlags: EventEditorUiFlags = useMemo(
    () => ({
      customCardTitle: false,
      customHeroTitle: false,
      separateHeroImage: false,
      customTagline,
      customCardText,
    }),
    [customTagline, customCardText],
  );

  const normalizedExtras = useMemo(
    () => normalizeEventExtras(extras, uiFlags),
    [extras, uiFlags],
  );

  const resolvedTaglines = useMemo(
    () => effectiveTaglines(experienceType, taglineNl, taglineEn, customTagline),
    [experienceType, taglineNl, taglineEn, customTagline],
  );

  const effectiveVenueIds = useMemo(() => {
    const ids = extras.venueIds ?? [];
    if (ids.length > 0) return ids;
    if (event?.venueId) return [event.venueId];
    return [];
  }, [extras.venueIds, event?.venueId]);

  const eventVenues = useMemo(
    () =>
      venueLibrary.filter((v) =>
        effectiveVenueIds.includes(v.id),
      ),
    [venueLibrary, effectiveVenueIds],
  );

  const resolvedImages = useMemo(
    () => resolveEventImagesFromVenues(normalizedExtras, eventVenues),
    [normalizedExtras, eventVenues],
  );

  const previewExtras = useMemo(
    () => ({
      ...normalizedExtras,
      cardImage: resolvedImages.cardImage,
      heroImage: resolvedImages.heroImage,
      galleryImageSettings: resolvedImages.galleryImageSettings,
      galleryImages: resolvedImages.galleryImageSettings?.map((g) => g.url),
    }),
    [normalizedExtras, resolvedImages],
  );

  const resolvedImageUrl = useMemo(() => {
    if (uiFlags.separateHeroImage && resolvedImages.heroImage?.url) {
      return resolvedImages.heroImage.url;
    }
    return (
      resolvedImages.cardImage?.url ??
      effectiveImageUrl(normalizedExtras, uiFlags, imageUrl, eventVenues)
    );
  }, [
    resolvedImages,
    uiFlags,
    normalizedExtras,
    imageUrl,
    eventVenues,
  ]);

  const [isSaving, startSaveTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const saveError = localError;

  function buildFormDataFromState(): FormData {
    const formData = new FormData();
    formData.set("extras", serializeEventExtras(normalizedExtras));
    formData.set("experienceType", experienceType);
    formData.set("nameNl", nameNl);
    formData.set("nameEn", nameEn);
    formData.set("city", city);
    formData.set("startsAt", startsAt);
    formData.set("endsAt", endsAt);
    formData.set("priceEuros", priceEuros);
    formData.set("capacity", capacity);
    formData.set("imageUrl", resolvedImageUrl);
    formData.set("categoryNl", categoryNl);
    formData.set("categoryEn", categoryEn);
    formData.set("taglineNl", resolvedTaglines.taglineNl);
    formData.set("taglineEn", resolvedTaglines.taglineEn);
    if (femaleOnly) {
      formData.set("femaleOnly", "on");
    }
    return formData;
  }

  useEffect(() => {
    if (!event) {
      applyTypeDefaults(experienceType, {
        setCategoryNl,
        setCategoryEn,
        setTaglineNl,
        setTaglineEn,
        setExtras,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildFormSnapshot(): EventFormState {
    return {
      city,
      startsAt,
      endsAt,
      priceEuros,
      capacity,
      femaleOnly,
      imageUrl: resolvedImageUrl,
      nameNl,
      nameEn,
      taglineNl: resolvedTaglines.taglineNl,
      taglineEn: resolvedTaglines.taglineEn,
      categoryNl,
      categoryEn,
      experienceType,
      extras: normalizedExtras,
    };
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validateEventForm(buildFormSnapshot());
    if (validationError) {
      setLocalError(validationError);
      setStep(0);
      return;
    }
    setLocalError(null);
    const formData = buildFormDataFromState();
    startSaveTransition(async () => {
      try {
        if (isEdit) {
          await saveEventAction(event!.id, formData);
        } else {
          await createEventDirectAction(formData);
        }
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setLocalError(formatEventSaveError(error));
      }
    });
  }

  function handlePublish() {
    const validationError = validateEventForPublish(buildFormSnapshot());
    if (validationError) {
      setLocalError(validationError);
      if (validationError.includes("Basis")) {
        setStep(0);
      }
      return;
    }
    setLocalError(null);
    const formData = buildFormDataFromState();
    startPublishTransition(async () => {
      try {
        await saveAndPublishEventAction(event!.id, formData);
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setLocalError(formatEventSaveError(error));
      }
    });
  }

  const previewData: PreviewEventData = useMemo(
    () => ({
      nameNl,
      nameEn,
      taglineNl: resolvedTaglines.taglineNl,
      taglineEn: resolvedTaglines.taglineEn,
      city,
      startsAt,
      endsAt,
      priceEuros: Number.parseFloat(priceEuros) || 0,
      capacity: (() => {
        const parsed = Number.parseInt(capacity, 10);
        return Number.isFinite(parsed) ? parsed : 14;
      })(),
      spotsSold: event?.spotsSold ?? 0,
      imageUrl: resolvedImageUrl,
      categoryNl,
      categoryEn,
      femaleOnly,
      experienceType,
      workflowStatus: event?.workflowStatus,
      extras: previewExtras,
      previewLocale,
      eventId: event?.id,
      previewRevision: event?.updatedAt
        ? new Date(event.updatedAt).getTime()
        : 0,
    }),
    [
      nameNl,
      nameEn,
      resolvedTaglines,
      city,
      startsAt,
      endsAt,
      priceEuros,
      capacity,
      event,
      resolvedImageUrl,
      categoryNl,
      categoryEn,
      femaleOnly,
      experienceType,
      previewExtras,
      previewLocale,
    ],
  );

  const publicUrl =
    isEdit && event?.slug
      ? `${getSiteUrl()}/nl/agenda/${event.slug}`
      : null;
  const typeDefaults = getEventFormDefaults(experienceType);

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
    if (!customTagline) {
      const d = getEventFormDefaults(slug);
      setTaglineNl(d.taglineNl);
      setTaglineEn(d.taglineEn);
    }
  }

  function setVenueCardRef(ref: VenueImageRef | undefined) {
    updateExtras({
      venueCardRef: ref,
      venueHeroRef: ref,
      cardImage: undefined,
      cardImageUrl: undefined,
      heroImage: undefined,
    });
  }

  function setVenueGalleryRefs(refs: VenueImageRef[] | undefined) {
    updateExtras({
      venueGalleryRefs: refs,
      galleryImageSettings: undefined,
      galleryImages: undefined,
    });
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
      <LivePreviewPanel data={previewData} allVenues={venueLibrary} />
    </>
  );

  return (
    <AdminEditorSplit
      preview={previewColumn}
      form={
        <div className="space-y-8">
          <nav className="flex flex-wrap gap-2">
            {STEPS.map((label, idx) => (
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
            ))}
          </nav>

          <form
            onSubmit={handleFormSubmit}
            className="space-y-8"
          >
            <textarea
              name="extras"
              readOnly
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              value={serializeEventExtras(normalizedExtras)}
            />
            <input type="hidden" name="experienceType" value={experienceType} />
            <input type="hidden" name="nameNl" value={nameNl} />
            <input type="hidden" name="nameEn" value={nameEn} />
            <input type="hidden" name="city" value={city} />
            <input type="hidden" name="startsAt" value={startsAt} />
            <input type="hidden" name="endsAt" value={endsAt} />
            <input type="hidden" name="priceEuros" value={priceEuros} />
            <input type="hidden" name="capacity" value={capacity} />
            <input type="hidden" name="imageUrl" value={resolvedImageUrl} />
            <input type="hidden" name="categoryNl" value={categoryNl} />
            <input type="hidden" name="categoryEn" value={categoryEn} />
            <input type="hidden" name="taglineNl" value={resolvedTaglines.taglineNl} />
            <input type="hidden" name="taglineEn" value={resolvedTaglines.taglineEn} />
            {femaleOnly ? (
              <input type="hidden" name="femaleOnly" value="on" />
            ) : null}

            {step === 0 ? (
              <Section title="Basis">
                <p className="text-sm text-wine/60">
                  De tafelnaam (NL/EN) is leidend voor agenda en detailpagina.
                </p>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Tafelnaam (NL)"
                    value={nameNl}
                    onChange={setNameNl}
                    name="nameNl"
                    required
                  />
                  <Field
                    label="Tafelnaam (EN)"
                    value={nameEn}
                    onChange={setNameEn}
                    name="nameEn"
                    required
                  />
                  <Field
                    label="Stad"
                    value={city}
                    onChange={setCity}
                    name="city"
                    required
                  />
                  <Field
                    label="Start"
                    type="datetime-local"
                    value={startsAt}
                    onChange={setStartsAt}
                    required
                  />
                  <Field
                    label="Einde"
                    type="datetime-local"
                    value={endsAt}
                    onChange={setEndsAt}
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
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
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
                  <label className="block text-sm font-medium text-wine">
                    Sfeer-tags
                  </label>
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

            {step === 1 ? (
              <Section title="Venues">
                <p className="text-sm text-wine/60">
                  Kies de locatie(s) voor deze tafel. Alle afbeeldingen voor het
                  event komen uit de venue-bibliotheek in de volgende stap.
                </p>
                <VenuePicker
                  allVenues={venueLibrary}
                  selectedIds={extras.venueIds ?? []}
                  onChange={(ids) => {
                    const removed = (extras.venueIds ?? []).filter(
                      (id) => !ids.includes(id),
                    );
                    let nextExtras = { ...extras, venueIds: ids };
                    for (const venueId of removed) {
                      nextExtras = stripVenueImageRefs(nextExtras, venueId);
                    }
                    setExtras(nextExtras);
                  }}
                  eventCity={city}
                  locale={previewLocale}
                />
              </Section>
            ) : null}

            {step === 2 ? (
              <Section title="Content">
                <VenueImagePicker
                  allVenues={venueLibrary}
                  venueIds={effectiveVenueIds}
                  galleryRefs={extras.venueGalleryRefs ?? []}
                  heroRef={extras.venueHeroRef}
                  cardRef={extras.venueCardRef}
                  separateHero={false}
                  onGalleryChange={setVenueGalleryRefs}
                  onHeroChange={() => {}}
                  onCardChange={setVenueCardRef}
                  onRequestVenuesStep={() => setStep(1)}
                  onRefresh={refreshVenueLibrary}
                />

                <p className="text-sm text-wine/60">
                  Hieronder pas je tagline en kaarttekst aan. Sfeerfoto&apos;s kies
                  je hierboven via de knop <strong>Sfeerimpressie</strong>.
                </p>

                <div className="rounded-xl border border-border-subtle bg-cream/60 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-wine/50">
                    Tagline (template)
                  </p>
                  <p className="mt-2 text-sm text-wine/80">
                    {previewLocale === "nl"
                      ? typeDefaults.taglineNl
                      : typeDefaults.taglineEn}
                  </p>
                  {!customTagline ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTagline(true);
                        setTaglineNl(typeDefaults.taglineNl);
                        setTaglineEn(typeDefaults.taglineEn);
                      }}
                      className="mt-3 text-sm text-burgundy underline"
                    >
                      Tagline aanpassen
                    </button>
                  ) : (
                    <div className="mt-4 space-y-3">
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
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTagline(false);
                          setTaglineNl(typeDefaults.taglineNl);
                          setTaglineEn(typeDefaults.taglineEn);
                        }}
                        className="text-sm text-wine/50 underline hover:text-burgundy"
                      >
                        Template-tagline herstellen
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border-subtle bg-cream/60 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-wine/50">
                    Korte kaarttekst (template)
                  </p>
                  <p className="mt-2 text-sm text-wine/80">
                    {previewLocale === "nl"
                      ? extras.cardTextNl ?? typeDefaults.cardTextNl
                      : extras.cardTextEn ?? typeDefaults.cardTextEn}
                  </p>
                  {!customCardText ? (
                    <button
                      type="button"
                      onClick={() => setCustomCardText(true)}
                      className="mt-3 text-sm text-burgundy underline"
                    >
                      Tekst aanpassen
                    </button>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <TextArea
                        label="Korte tekst kaart (NL)"
                        value={extras.cardTextNl ?? ""}
                        onChange={(v) =>
                          updateExtras({ cardTextNl: v || undefined })
                        }
                      />
                      <TextArea
                        label="Korte tekst kaart (EN)"
                        value={extras.cardTextEn ?? ""}
                        onChange={(v) =>
                          updateExtras({ cardTextEn: v || undefined })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCardText(false);
                          updateExtras({
                            cardTextNl: typeDefaults.cardTextNl,
                            cardTextEn: typeDefaults.cardTextEn,
                          });
                        }}
                        className="text-sm text-wine/50 underline hover:text-burgundy"
                      >
                        Template-tekst herstellen
                      </button>
                    </div>
                  )}
                </div>
              </Section>
            ) : null}

            {step === 3 ? (
              <Section title="Overrides (optioneel)">
                <p className="text-sm text-wine/60">
                  Alleen invullen als deze tafel afwijkt van de vaste
                  template-teksten. Leeg = standaard van het type.
                </p>
                <TextArea
                  label="Venues intro (NL)"
                  value={extras.sectionOverrides?.venuesIntroNl ?? ""}
                  onChange={(v) =>
                    updateSectionOverride({ venuesIntroNl: v || undefined })
                  }
                />
                <TextArea
                  label="Over deze ervaring (NL)"
                  value={extras.sectionOverrides?.aboutNl ?? ""}
                  onChange={(v) =>
                    updateSectionOverride({ aboutNl: v || undefined })
                  }
                />
                <TextArea
                  label="Venues intro (EN)"
                  value={extras.sectionOverrides?.venuesIntroEn ?? ""}
                  onChange={(v) =>
                    updateSectionOverride({ venuesIntroEn: v || undefined })
                  }
                />
                <TextArea
                  label="Over deze ervaring (EN)"
                  value={extras.sectionOverrides?.aboutEn ?? ""}
                  onChange={(v) =>
                    updateSectionOverride({ aboutEn: v || undefined })
                  }
                />
              </Section>
            ) : null}

            {saveError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {saveError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border border-border-subtle px-6 py-2.5 text-sm"
                >
                  Vorige
                </button>
              ) : null}
              {step < LAST_STEP ? (
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
                disabled={isSaving || isPublishing}
                className="rounded-full bg-burgundy px-8 py-3 text-sm font-medium text-cream disabled:opacity-60"
              >
                {isSaving ? "Opslaan…" : isEdit ? "Opslaan" : "Concept opslaan"}
              </button>
            </div>
          </form>

          {isEdit ? (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              {saveError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {saveError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
              {event!.workflowStatus !== "published" ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || isSaving}
                  className="rounded-full bg-burgundy px-5 py-2 text-sm text-cream disabled:opacity-60"
                >
                  {isPublishing ? "Publiceren…" : "Publiceren"}
                </button>
              ) : (
                <form action={unpublishEventAction.bind(null, event!.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-burgundy px-5 py-2 text-sm text-burgundy"
                  >
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
                <button
                  type="submit"
                  className="rounded-full border border-red-800/30 px-5 py-2 text-sm text-red-900"
                >
                  Verwijderen
                </button>
              </form>
              </div>
            </div>
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
  name?: string;
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
      {hint ? (
        <span className="mt-1 block text-xs text-wine/50">{hint}</span>
      ) : null}
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
