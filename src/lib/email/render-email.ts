import { render } from "@react-email/render";
import type { ReactElement } from "react";

/** Render email HTML with hosted icon URLs (no CID attachments — Gmail lists those separately). */
export async function renderEmailForDelivery(element: ReactElement) {
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}
