"use client";

import { useState } from "react";
import { addVenueNoteAction, deleteVenueNoteAction, updateVenueNoteAction } from "@/app/admin/(dashboard)/venues/note-actions";

const when = (iso: string) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(new Date(iso));

const field = "w-full rounded-lg border border-border-subtle bg-cream px-3 py-2 text-sm text-wine";

/** Every note on a Sunday card on "Vandaag": read, add, change, remove. */
export function SundayNotes({
  eventId,
  venueId,
  notes,
}: {
  eventId: string;
  venueId: string | null;
  notes: Array<{ id: string; body: string; createdAt: string }>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const add = addVenueNoteAction.bind(null, eventId, venueId);

  return (
    <div className="mt-auto border-t border-border-subtle/70 px-4 py-3">
      {notes.length > 0 ? (
        <ul className="space-y-2.5">
          {notes.map((n) =>
            editing === n.id ? (
              <li key={n.id}>
                <form
                  action={async (fd) => {
                    await updateVenueNoteAction(n.id, fd);
                    setEditing(null);
                  }}
                  className="space-y-2"
                >
                  <textarea name="body" required rows={3} maxLength={2000} defaultValue={n.body} autoFocus className={field} />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-full bg-burgundy px-3 py-1 text-xs font-medium text-cream hover:bg-burgundy/90">
                      Opslaan
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="rounded-full px-3 py-1 text-xs text-wine/60 hover:text-wine">
                      Annuleren
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={n.id} className="group flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-wine/45">{when(n.createdAt)}</p>
                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-wine/80">{n.body}</p>
                </div>
                <div className="flex shrink-0 gap-1 text-xs">
                  <button type="button" onClick={() => setEditing(n.id)} className="px-1 text-wine/40 hover:text-burgundy">
                    Bewerk
                  </button>
                  <form
                    action={deleteVenueNoteAction.bind(null, n.id)}
                    onSubmit={(e) => {
                      if (!window.confirm("Notitie verwijderen?")) e.preventDefault();
                    }}
                  >
                    <button type="submit" aria-label="Notitie verwijderen" className="px-1 text-wine/35 hover:text-burgundy">
                      ×
                    </button>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      ) : null}

      {adding ? (
        <form
          action={async (fd) => {
            await add(fd);
            setAdding(false);
          }}
          className={`${notes.length > 0 ? "mt-3" : ""} space-y-2`}
        >
          <textarea name="body" required rows={2} maxLength={2000} autoFocus className={field} />
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-burgundy px-3 py-1 text-xs font-medium text-cream hover:bg-burgundy/90">
              Toevoegen
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-full px-3 py-1 text-xs text-wine/60 hover:text-wine">
              Annuleren
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`${notes.length > 0 ? "mt-2.5" : ""} text-xs font-medium text-burgundy hover:underline`}
        >
          + Notitie
        </button>
      )}
    </div>
  );
}
