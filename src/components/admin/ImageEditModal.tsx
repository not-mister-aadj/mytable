"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type {
  ImageAspectRatio,
  ImageSettings,
  ImageUsage,
} from "@/lib/image-settings";
import {
  DEFAULT_FOCAL,
  RATIO_OPTIONS,
  aspectRatioToCss,
  createImageSettings,
  defaultAspectForUsage,
} from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";

type ImageEditModalProps = {
  open: boolean;
  onClose: () => void;
  usage: ImageUsage;
  initial: ImageSettings;
  onSave: (settings: ImageSettings) => void;
};

function PreviewFrame({
  label,
  ratio,
  settings,
}: {
  label: string;
  ratio: ImageAspectRatio;
  settings: ImageSettings;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-wine/50">
        {label}
      </p>
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border-subtle bg-wine/5"
        style={{ aspectRatio: aspectRatioToCss(ratio) }}
      >
        <PositionedImage
          src={settings.url}
          alt=""
          settings={{ ...settings, aspectRatio: ratio }}
          sizes="200px"
        />
      </div>
    </div>
  );
}

export function ImageEditModal({
  open,
  onClose,
  usage,
  initial,
  onSave,
}: ImageEditModalProps) {
  const [settings, setSettings] = useState<ImageSettings>(initial);

  useEffect(() => {
    if (open) setSettings(initial);
  }, [open, initial]);

  const setFocal = useCallback((x: number, y: number) => {
    setSettings((s) => ({
      ...s,
      focalPoint: {
        x: Math.round(Math.min(100, Math.max(0, x))),
        y: Math.round(Math.min(100, Math.max(0, y))),
      },
    }));
  }, []);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocal(x, y);
  }

  if (!open) return null;

  const ratioOptions = RATIO_OPTIONS[usage];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-wine/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border-subtle bg-beige shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="font-serif text-xl text-burgundy">Afbeelding aanpassen</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-wine/60 hover:text-burgundy"
          >
            Sluiten
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-sm text-wine/70">
              Klik op het belangrijkste deel van de foto (focal point).
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={handleImageClick}
              onKeyDown={() => {}}
              className="relative mt-3 w-full cursor-crosshair overflow-hidden rounded-2xl border border-border-subtle bg-wine/10"
              style={{ aspectRatio: aspectRatioToCss(settings.aspectRatio) }}
            >
              <PositionedImage
                src={settings.url}
                alt="Bewerken"
                settings={settings}
                sizes="600px"
              />
              <span
                className="pointer-events-none absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream bg-burgundy shadow-md"
                style={{
                  left: `${settings.focalPoint.x}%`,
                  top: `${settings.focalPoint.y}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-wine/50">
              Focal point: {settings.focalPoint.x}% · {settings.focalPoint.y}%
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => setFocal(DEFAULT_FOCAL.x, DEFAULT_FOCAL.y)}
              >
                Reset
              </button>
            </p>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-wine">Beeldverhouding</span>
            <select
              value={settings.aspectRatio}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  aspectRatio: e.target.value as ImageAspectRatio,
                }))
              }
              className="mt-1.5 w-full rounded-xl border border-border-subtle bg-cream px-4 py-2.5"
            >
              {ratioOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-wine">
              Zoom ({settings.zoom?.toFixed(1) ?? "1.0"}×)
            </span>
            <input
              type="range"
              min={1}
              max={2}
              step={0.05}
              value={settings.zoom ?? 1}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  zoom: Number.parseFloat(e.target.value),
                }))
              }
              className="mt-2 w-full"
            />
          </label>

          <div>
            <p className="mb-3 text-sm font-medium text-wine">Live previews</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(usage === "agenda-card" || usage === "hero" || usage === "gallery") && (
                <PreviewFrame
                  label="Agenda-kaart"
                  ratio="16:10"
                  settings={settings}
                />
              )}
              {(usage === "hero" || usage === "agenda-card") && (
                <>
                  <PreviewFrame
                    label="Desktop hero"
                    ratio="21:9"
                    settings={settings}
                  />
                  <PreviewFrame
                    label="Mobiele hero"
                    ratio="4:5"
                    settings={settings}
                  />
                </>
              )}
              {(usage === "gallery" || usage === "hero") && (
                <PreviewFrame
                  label="Gallery-tegel"
                  ratio="4:3"
                  settings={settings}
                />
              )}
              {usage === "venue" && (
                <PreviewFrame label="Venue-kaart" ratio="4:3" settings={settings} />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border-subtle px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-subtle px-5 py-2 text-sm"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(
                createImageSettings(settings.url, usage, {
                  ...settings,
                  aspectRatio:
                    settings.aspectRatio || defaultAspectForUsage(usage),
                }),
              );
              onClose();
            }}
            className="rounded-full bg-burgundy px-6 py-2 text-sm font-medium text-cream"
          >
            Opslaan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
