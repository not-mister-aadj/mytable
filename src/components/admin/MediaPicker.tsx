"use client";

import Image from "next/image";
import { useState } from "react";
import { MediaLibrary } from "./MediaLibrary";

export function MediaPicker({
  value,
  onChange,
  label = "Afbeelding",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <span className="text-sm font-medium text-wine">{label}</span>
      <div className="mt-2 flex items-start gap-4">
        {value ? (
          <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-border-subtle">
            <Image src={value} alt="" fill className="object-cover" sizes="144px" />
          </div>
        ) : (
          <div className="flex h-24 w-36 items-center justify-center rounded-xl border border-dashed border-border-subtle bg-cream text-xs text-wine/50">
            Geen beeld
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-burgundy px-4 py-2 text-sm text-cream"
          >
            Kies uit library
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-wine/50 hover:text-burgundy"
            >
              Verwijderen
            </button>
          ) : null}
        </div>
      </div>
      <MediaLibrary
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
}
