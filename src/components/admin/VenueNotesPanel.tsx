import { addVenueNoteAction, deleteVenueNoteAction } from "@/app/admin/(dashboard)/venues/note-actions";
import type { VenueNote } from "@/lib/admin/venue-notes";

const when = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));

const sunday = (e: NonNullable<VenueNote["event"]>) =>
  `${e.city} ${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(e.startsAt))}`;

/** Notes on a bar: for one Sunday (eventId) or for the bar across Sundays (venueId). */
export function VenueNotesPanel({
  notes,
  eventId = null,
  venues,
  show,
}: {
  notes: VenueNote[];
  eventId?: string | null;
  /** Bars a new note can be about; a choice appears when there are several. */
  venues: { id: string; name: string }[];
  /** What each note shows next to its date. */
  show: "venue" | "sunday";
}) {
  const add = addVenueNoteAction.bind(null, eventId, venues.length === 1 ? venues[0]!.id : null);
  return (
    <section className="rounded-xl border border-border-subtle bg-beige/60 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">Notities</h2>
      <form action={add} className="mt-3 space-y-2">
        <textarea
          name="body"
          required
          rows={2}
          maxLength={2000}
          placeholder="Wat is er afgesproken of gecommuniceerd?"
          className="w-full rounded-lg border border-border-subtle bg-cream px-3 py-2 text-sm text-wine"
        />
        <div className="flex flex-wrap items-center gap-2">
          {venues.length > 1 ? (
            <select name="venueId" defaultValue={venues[0]!.id} className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine">
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          ) : null}
          <button type="submit" className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream hover:bg-burgundy/90">
            Notitie toevoegen
          </button>
        </div>
      </form>
      {notes.length > 0 ? (
        <ul className="mt-4 divide-y divide-border-subtle/60">
          {notes.map((n) => {
            const label = show === "venue" ? n.venueName : n.event ? sunday(n.event) : null;
            return (
              <li key={n.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-wine/50">
                    {when(n.createdAt)}
                    {label ? ` · ${label}` : ""}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-wine">{n.body}</p>
                </div>
                <form action={deleteVenueNoteAction.bind(null, n.id)}>
                  <button type="submit" aria-label="Notitie verwijderen" className="px-1 text-wine/35 hover:text-burgundy">
                    ×
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
