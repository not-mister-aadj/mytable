"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "mytable-admin-preview-width";
const DEFAULT_WIDTH = 400;
const MIN_PREVIEW = 280;
const MIN_FORM = 360;
const MAX_PREVIEW_RATIO = 0.72;

function readStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= MIN_PREVIEW ? n : DEFAULT_WIDTH;
}

interface AdminEditorSplitProps {
  form: ReactNode;
  preview: ReactNode;
}

export function AdminEditorSplit({ form, preview }: AdminEditorSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);

  useEffect(() => {
    setPreviewWidth(readStoredWidth());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const update = () => setSplitEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const clampWidth = useCallback((next: number) => {
    const container = containerRef.current;
    if (!container) return Math.max(MIN_PREVIEW, next);
    const total = container.getBoundingClientRect().width;
    const maxPreview = Math.max(
      MIN_PREVIEW,
      Math.min(total * MAX_PREVIEW_RATIO, total - MIN_FORM - 12),
    );
    return Math.min(maxPreview, Math.max(MIN_PREVIEW, next));
  }, []);

  const startResize = useCallback(
    (clientX: number) => {
      const startX = clientX;
      const startWidth = previewWidth;

      const onMove = (e: PointerEvent) => {
        setPreviewWidth(clampWidth(startWidth + (e.clientX - startX)));
      };

      const onUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setPreviewWidth((w) => {
          localStorage.setItem(STORAGE_KEY, String(Math.round(w)));
          return w;
        });
      };

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [previewWidth, clampWidth],
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-10 xl:flex-row xl:items-start ${isResizing ? "xl:select-none" : ""}`}
    >
      <div className="min-w-0 flex-1">{form}</div>

      {splitEnabled ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Pas breedte live preview aan"
          title="Sleep om preview breder of smaller te maken"
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            startResize(e.clientX);
          }}
          className={`hidden shrink-0 cursor-col-resize xl:block xl:w-2 xl:self-stretch ${
            isResizing ? "bg-burgundy/20" : "bg-transparent hover:bg-burgundy/10"
          }`}
        >
          <div
            className={`mx-auto h-full min-h-[120px] w-1 rounded-full transition-colors ${
              isResizing ? "bg-burgundy" : "bg-border-subtle hover:bg-burgundy/50"
            }`}
          />
        </div>
      ) : null}

      <div
        className="w-full shrink-0 xl:max-w-[72%]"
        style={splitEnabled ? { width: previewWidth } : undefined}
      >
        {preview}
      </div>
    </div>
  );
}
