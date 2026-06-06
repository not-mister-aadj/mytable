import {
  emailIconPngBase64,
  type EmailIconDataName,
} from "@/emails/icon-data";
import { emailIconVariants } from "@/emails/icon-urls";

export type InlineEmailIconAttachment = {
  filename: string;
  /** Resend API expects base64-encoded content, not a Buffer object. */
  content: string;
  contentType: "image/png";
  contentId: string;
};

/** Replace icon URLs with cid: refs and attach PNG bytes (works on Vercel, no filesystem). */
export async function embedEmailIcons(html: string): Promise<{
  html: string;
  attachments: InlineEmailIconAttachment[];
}> {
  const attachments: InlineEmailIconAttachment[] = [];
  let output = html;

  for (const name of Object.keys(emailIconPngBase64) as EmailIconDataName[]) {
    const contentId = `mt-${name}`;
    const content = emailIconPngBase64[name];

    attachments.push({
      filename: `${name}.png`,
      content,
      contentType: "image/png",
      contentId,
    });

    for (const url of emailIconVariants(name)) {
      output = output.split(url).join(`cid:${contentId}`);
    }
  }

  return { html: output, attachments };
}
