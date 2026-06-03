"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MediaItem = {
  path: string;
  url: string;
  name: string;
  tag?: string;
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
  onSelect: (url: string) => void;
  multi?: boolean;
  selected?: string[];
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
    if (res.ok) await load();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border-subtle bg-beige shadow-2xl"
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
              accept="image/*"
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
          {error ? <p className="text-sm text-red-800">{error}</p> : null}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-sm text-wine/60">Laden…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-wine/60">
              Nog geen uploads. Maak in Supabase een public bucket &quot;media&quot; aan,
              of upload je eerste afbeelding.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              <AnimatePresence>
                {items.map((item) => {
                  const isSelected = selected.includes(item.url);
                  return (
                    <motion.div
                      key={item.path}
                      layout
                      className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                        isSelected ? "border-burgundy" : "border-transparent"
                      }`}
                    >
                      <button
                        type="button"
                        className="absolute inset-0 z-10"
                        onClick={() => {
                          onSelect(item.url);
                          if (!multi) onClose();
                        }}
                      />
                      <Image
                        src={item.url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                      {item.tag ? (
                        <span className="absolute bottom-1 left-1 z-20 rounded bg-wine/70 px-1.5 py-0.5 text-[10px] text-cream">
                          {item.tag}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.path)}
                        className="absolute right-1 top-1 z-20 rounded bg-red-900/80 px-1.5 py-0.5 text-[10px] text-cream opacity-0 transition group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
