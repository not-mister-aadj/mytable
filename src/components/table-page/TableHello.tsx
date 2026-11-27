"use client";

import { useRef, useState } from "react";
import { PhotoCropper } from "@/components/PhotoCropper";
import { uploadTablePhotoAction } from "@/app/[locale]/aan-tafel/[token]/actions";

/**
 * Top of the "Tafel" tab on the day: "Hallo {name}" with their profile
 * photo, and a way to add one. Tablemates see it only in the feedback form,
 * where they pick who to add as a table friend.
 */
export function TableHello({
  token,
  locale,
  name,
  photoUrl,
  labels,
}: {
  token: string;
  locale: "nl" | "en";
  name: string;
  photoUrl: string | null;
  labels: { title: string; add: string; change: string; who: string; note: string; failed: string };
}) {
  const [photo, setPhoto] = useState<string | null>(photoUrl);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [cropping, setCropping] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pick = () => input.current?.click();

  async function upload(file: File) {
    setBusy(true);
    setFailed(false);
    try {
      const form = new FormData();
      form.set("photo", file);
      const r = await uploadTablePhotoAction(token, form);
      if (r.ok) setPhoto(r.url);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const first = name.trim();
  return (
    <section className="flex items-start gap-4 px-1">
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        aria-label={photo ? labels.change : labels.add}
        className="group relative h-14 w-14 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 active:scale-[0.97] disabled:opacity-60"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-14 w-14 rounded-full object-cover ring-1 ring-burgundy/15" />
        ) : (
          <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-burgundy/[0.1] font-serif text-2xl text-burgundy ring-1 ring-burgundy/15">
            {first.charAt(0).toLocaleUpperCase() || "·"}
          </span>
        )}
        {photo ? null : (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-burgundy text-cream shadow-[0_3px_10px_rgba(90,15,27,0.3)] ring-2 ring-beige transition group-hover:bg-wine"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
          </span>
        )}
      </button>
      <div className="min-w-0 pt-1">
        <p className="font-serif text-2xl font-medium leading-tight text-wine">
          {first ? labels.title.replace("{name}", first) : labels.title.replace(" {name}", "")}
        </p>
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="mt-1 text-sm font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 disabled:opacity-60"
        >
          {photo ? labels.change : labels.add}
        </button>
        {photo ? (
          <details className="mt-1.5 max-w-sm text-[0.8rem] leading-snug">
            <summary className="cursor-pointer list-none font-medium text-wine/60 [&::-webkit-details-marker]:hidden">{labels.who}</summary>
            <p className="mt-1 text-wine/55">{labels.note}</p>
          </details>
        ) : (
          <div className="mt-2 max-w-sm text-[0.8rem] leading-snug">
            <p className="font-semibold text-wine/75">{labels.who}</p>
            <p className="mt-0.5 text-wine/55">{labels.note}</p>
          </div>
        )}
        {failed ? <p className="mt-1.5 text-[0.8rem] text-burgundy">{labels.failed}</p> : null}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) setCropping(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {cropping ? (
        <PhotoCropper
          file={cropping}
          locale={locale}
          onCancel={() => setCropping(null)}
          onDone={(f) => {
            setCropping(null);
            void upload(f);
          }}
        />
      ) : null}
    </section>
  );
}
