"use client";

import { useState } from "react";

const EMAIL = "info@mytable.club";

/** Renders `text` with "{email}" as a button that copies the address. */
export function CopyEmailText({ text, copiedLabel }: { text: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const [before, after = ""] = text.split("{email}");

  async function copy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // Older browsers: select-and-copy fallback.
      const field = document.createElement("textarea");
      field.value = EMAIL;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {before}
      <button
        type="button"
        onClick={copy}
        className="font-medium text-beige underline decoration-beige/50 underline-offset-4 hover:decoration-beige"
      >
        {copied ? copiedLabel : EMAIL}
      </button>
      {after}
    </>
  );
}
