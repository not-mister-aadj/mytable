"use client";

import type { Venue } from "@/db/schema";
import {
  createVenueAction,
  updateVenueAction,
  deleteVenueAction,
} from "@/app/admin/(dashboard)/venues/actions";
import { MediaPicker } from "./MediaPicker";
import { useState } from "react";
import {
  coerceImageSettings,
  parseImageSettings,
} from "@/lib/image-settings";
import type { ImageSettings } from "@/lib/image-settings";

export function VenueForm({ venue }: { venue?: Venue }) {
  const isEdit = Boolean(venue);
  const action = isEdit
    ? updateVenueAction.bind(null, venue!.id)
    : createVenueAction;

  const [imageSettings, setImageSettings] = useState<ImageSettings | undefined>(
    () =>
      parseImageSettings(venue?.imageMeta) ??
      coerceImageSettings(venue?.imageUrl, "venue"),
  );

  return (
    <div className="max-w-2xl space-y-8">
      <form action={action} className="space-y-6 rounded-2xl border border-border-subtle bg-beige p-6">
        <Field label="Naam" name="name" defaultValue={venue?.name} required />
        <Field label="Stad" name="city" defaultValue={venue?.city ?? "Den Haag"} required />
        <Field label="Wijk / gebied" name="area" defaultValue={venue?.area ?? ""} />
        <Field
          label="Korte sfeer (op de kaart)"
          name="atmosphere"
          defaultValue={venue?.atmosphere ?? ""}
          hint="Bijv. Chef's special, Wijnbar"
        />
        <Field label="Adres" name="address" defaultValue={venue?.address ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Latitude (kaart)"
            name="latitude"
            defaultValue={venue?.latitude ?? ""}
            hint="Optioneel, voor route op Wijnwalk"
          />
          <Field
            label="Longitude (kaart)"
            name="longitude"
            defaultValue={venue?.longitude ?? ""}
          />
        </div>
        <MediaPicker
          usage="venue"
          label="Foto"
          value={imageSettings}
          onChange={setImageSettings}
        />
        <input type="hidden" name="imageUrl" value={imageSettings?.url ?? ""} />
        <input
          type="hidden"
          name="imageMeta"
          value={imageSettings ? JSON.stringify(imageSettings) : ""}
        />
        <TextArea
          label="Beschrijving (NL)"
          name="descriptionNl"
          defaultValue={venue?.descriptionNl ?? ""}
          required
        />
        <TextArea
          label="Beschrijving (EN)"
          name="descriptionEn"
          defaultValue={venue?.descriptionEn ?? ""}
        />
        <button
          type="submit"
          className="rounded-full bg-burgundy px-8 py-3 text-sm font-medium text-cream"
        >
          {isEdit ? "Opslaan" : "Venue aanmaken"}
        </button>
      </form>

      {isEdit ? (
        <form action={deleteVenueAction.bind(null, venue!.id)}>
          <button
            type="submit"
            className="rounded-full border border-red-800/30 px-5 py-2 text-sm text-red-900"
          >
            Venue verwijderen
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-wine">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5"
      />
      {hint ? <span className="mt-1 block text-xs text-wine/50">{hint}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-wine">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        rows={4}
        className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5"
      />
    </label>
  );
}
