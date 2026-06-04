"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateImageFile } from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { createImageSettings } from "@/lib/image-settings";

export type MediaItem = {
  path: string;
  url: string;
  name: string;
  tag?: string;
  createdAt?: string;
};

const TAGS = [
  "wine",
  "dinner",
  "cocktails",
  "brunch",
  "sports",
  "cozy",
  "city",
  "sunset",
] as const;

interface MediaLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaItem) => void;
  multi?: boolean;
  selected?: string[];
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function MediaLibrary({
  open,
  onClose,
  onSelect,
  multi = false,
  selected = [],
}: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tag, setTag] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Laden mislukt");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    if (tag) form.append("tag", tag);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload mislukt");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload mislukt");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(path: string) {
    if (!confirm("Afbeelding verwijderen?")) return;
    const res = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Verwijderen mislukt");
      return;
    }
    await load();
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-border-subtle bg-beige shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <h2 className="font-serif text-xl text-burgundy">Media library</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-wine/60 hover:text-burgundy"
            >
              Sluiten
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-6 py-3">
            <label className="cursor-pointer rounded-full bg-burgundy px-4 py-2 text-sm text-cream hover:opacity-90">
              {uploading ? "Uploaden…" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-full border border-border-subtle bg-cream px-3 py-2 text-sm"
            >
              <option value="">Tag (optioneel)</option>
              {TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="text-xs text-wine/50">JPG, PNG, WebP, GIF · max 10 MB</span>
            {error ? <p className="w-full text-sm text-red-800">{error}</p> : null}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <p className="text-sm text-wine/60">Laden…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-wine/60">
                Nog geen uploads. Upload je eerste afbeelding of controleer de
                Supabase-bucket &quot;media&quot;.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <AnimatePresence>
                  {items.map((item) => {
                    const isSelected = selected.includes(item.url);
                    const shortName =
                      item.name.length > 28
                        ? `${item.name.slice(0, 25)}…`
                        : item.name;
                    return (
                      <motion.div
                        key={item.path}
                        layout
                        className={`group flex flex-col overflow-hidden rounded-xl border-2 bg-cream ${
                          isSelected ? "border-burgundy" : "border-border-subtle"
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={item.url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                          {item.tag ? (
                            <span className="absolute bottom-1 left-1 z-20 rounded bg-wine/70 px-1.5 py-0.5 text-[10px] text-cream">
                              {item.tag}
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-1 p-2">
                          <p className="truncate text-xs font-medium text-wine" title={item.name}>
                            {shortName}
                          </p>
                          {item.createdAt ? (
                            <p className="text-[10px] text-wine/50">
                              {formatDate(item.createdAt)}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onSelect(item.url, item);
                                if (!multi) onClose();
                              }}
                              className="rounded-full bg-burgundy px-2.5 py-1 text-[10px] text-cream"
                            >
                              Selecteer
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              className="rounded-full border border-border-subtle px-2.5 py-1 text-[10px] text-wine/70"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.path)}
                              className="rounded-full border border-red-800/20 px-2.5 py-1 text-[10px] text-red-900"
                            >
                              Verwijder
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {previewItem ? (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-wine/60 p-6"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl bg-cream"
            onClick={(e) => e.stopPropagation()}
          >
            <PositionedImage
              src={previewItem.url}
              alt={previewItem.name}
              settings={createImageSettings(previewItem.url, "gallery")}
              sizes="500px"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
