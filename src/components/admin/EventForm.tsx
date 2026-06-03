import type { Event } from "@/db/schema";
import { getSiteUrl } from "@/lib/admin-url";
import {
  createEventAction,
  updateEventAction,
  publishEventAction,
  unpublishEventAction,
  deleteEventAction,
} from "@/app/admin/(dashboard)/events/actions";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EventFormProps {
  event?: Event;
}

export function EventForm({ event }: EventFormProps) {
  const isEdit = Boolean(event);
  const action = isEdit
    ? updateEventAction.bind(null, event!.id)
    : createEventAction;

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-6 rounded-2xl border border-border-subtle bg-beige p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug (URL)" name="slug" defaultValue={event?.slug} required />
          <Field label="Stad" name="city" defaultValue={event?.city} required />
          <Field
            label="Start"
            name="startsAt"
            type="datetime-local"
            defaultValue={event ? toLocalInput(new Date(event.startsAt)) : ""}
            required
          />
          <Field
            label="Einde"
            name="endsAt"
            type="datetime-local"
            defaultValue={event?.endsAt ? toLocalInput(new Date(event.endsAt)) : ""}
          />
          <Field
            label="Prijs (centen)"
            name="priceCents"
            type="number"
            defaultValue={event?.priceCents ?? 4900}
            required
          />
          <Field
            label="Capaciteit"
            name="capacity"
            type="number"
            defaultValue={event?.capacity ?? 14}
            required
          />
          <Field label="Afbeelding URL" name="imageUrl" defaultValue={event?.imageUrl} className="sm:col-span-2" />
          <Field label="Naam NL" name="nameNl" defaultValue={event?.nameNl} required />
          <Field label="Naam EN" name="nameEn" defaultValue={event?.nameEn} required />
          <Field label="Tagline NL" name="taglineNl" defaultValue={event?.taglineNl ?? ""} />
          <Field label="Tagline EN" name="taglineEn" defaultValue={event?.taglineEn ?? ""} />
          <Field label="Categorie NL" name="categoryNl" defaultValue={event?.categoryNl ?? "PROEVERIJ"} />
          <Field label="Categorie EN" name="categoryEn" defaultValue={event?.categoryEn ?? "TASTING"} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="femaleOnly"
            defaultChecked={event?.femaleOnly}
            className="rounded"
          />
          Girls only
        </label>
        {isEdit ? (
          <p className="text-sm text-wine/60">
            Status: <strong>{event!.workflowStatus}</strong> · Verkocht:{" "}
            {event!.spotsSold}/{event!.capacity}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-full bg-burgundy px-6 py-3 text-sm font-medium text-cream"
        >
          {isEdit ? "Opslaan" : "Aanmaken (concept)"}
        </button>
      </form>

      {isEdit ? (
        <div className="flex flex-wrap gap-3">
          {event!.workflowStatus !== "published" ? (
            <form action={publishEventAction.bind(null, event!.id)}>
              <button
                type="submit"
                className="rounded-full bg-burgundy px-5 py-2 text-sm text-cream"
              >
                Publiceren
              </button>
            </form>
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
          <form action={deleteEventAction.bind(null, event!.id)}>
            <button
              type="submit"
              className="rounded-full border border-red-800/30 px-5 py-2 text-sm text-red-900"
            >
              Verwijderen
            </button>
          </form>
          <a
            href={`${getSiteUrl()}/nl/agenda/${event!.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border-subtle px-5 py-2 text-sm"
          >
            Bekijk op site
          </a>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="font-medium text-wine">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2"
      />
    </label>
  );
}
