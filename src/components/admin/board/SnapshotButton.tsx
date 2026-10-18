"use client";

/** Prints the Board page (or saves it as PDF from the print dialog). */
export function SnapshotButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
    >
      Board snapshot
    </button>
  );
}
