"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

/**
 * Crop a profile photo to a circle: drag to move, slider (or pinch/wheel)
 * to zoom. Returns a 512×512 JPEG, so every photo is small and the same shape.
 */

const VIEW = 280;
const OUT = 512;

const COPY = {
  nl: { title: "Kies je uitsnede", hint: "Sleep om te verschuiven, zoom met de schuif.", zoom: "Zoom", save: "Opslaan", cancel: "Annuleren" },
  en: { title: "Choose your crop", hint: "Drag to move, zoom with the slider.", zoom: "Zoom", save: "Save", cancel: "Cancel" },
} as const;

export function PhotoCropper({
  file,
  locale,
  onCancel,
  onDone,
}: {
  file: File;
  locale: "nl" | "en";
  onCancel: () => void;
  onDone: (cropped: File) => void;
}) {
  const t = COPY[locale];
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      // Start centred, a bit above the middle (faces sit there in portraits).
      const s = VIEW / Math.min(image.width, image.height);
      const iw = image.width * s;
      const ih = image.height * s;
      setPos({ x: (VIEW - iw) / 2, y: Math.min(0, Math.max(VIEW - ih, (VIEW - ih) / 3)) });
      setImg(image);
      setSrc(url);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // At zoom 1 the short side fills the circle.
  const base = img ? VIEW / Math.min(img.width, img.height) : 1;
  const w = img ? img.width * base * zoom : VIEW;
  const h = img ? img.height * base * zoom : VIEW;
  const clamp = (p: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(VIEW - w, p.x)),
    y: Math.min(0, Math.max(VIEW - h, p.y)),
  });

  function setZoomKeepCentre(next: number) {
    const z = Math.min(4, Math.max(1, next));
    const cx = VIEW / 2 - pos.x;
    const cy = VIEW / 2 - pos.y;
    const k = z / zoom;
    setZoom(z);
    const nw = img ? img.width * base * z : VIEW;
    const nh = img ? img.height * base * z : VIEW;
    setPos({
      x: Math.min(0, Math.max(VIEW - nw, VIEW / 2 - cx * k)),
      y: Math.min(0, Math.max(VIEW - nh, VIEW / 2 - cy * k)),
    });
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }));
  }

  function save() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = base * zoom;
    ctx.drawImage(img, -pos.x / scale, -pos.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUT, OUT);
    canvas.toBlob((blob) => blob && onDone(new File([blob], "profile.jpg", { type: "image/jpeg" })), "image/jpeg", 0.88);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-wine/40 p-4 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="w-full max-w-sm rounded-3xl bg-cream p-6 shadow-xl">
        <p className="font-serif text-xl text-wine">{t.title}</p>
        <p className="mt-1 text-xs text-wine/55">{t.hint}</p>
        <div
          className="relative mx-auto mt-5 cursor-grab touch-none overflow-hidden rounded-2xl bg-wine/10 active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => setZoomKeepCentre(zoom - e.deltaY * 0.002)}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
              style={{ width: w, height: h, transform: `translate(${pos.x}px, ${pos.y}px)` }}
            />
          ) : null}
          {/* The circle that ends up as the photo; outside it darkened. */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(43,13,18,0.45)] ring-2 ring-white/80" />
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm text-wine">
          <span className="text-wine/60">{t.zoom}</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomKeepCentre(Number(e.target.value))}
            className="flex-1 accent-burgundy"
          />
        </label>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-2 text-sm text-wine/60 hover:text-wine">
            {t.cancel}
          </button>
          <button type="button" disabled={!img} onClick={save} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-50">
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
