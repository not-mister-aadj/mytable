import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { embedEmailIcons } from "@/lib/email/embed-email-icons";

export async function renderEmailForDelivery(element: ReactElement) {
  const htmlWithUrls = await render(element);
  const { html, attachments } = await embedEmailIcons(htmlWithUrls);
  const text = await render(element, { plainText: true });
  return { html, text, attachments };
}
