import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { emailIcons, type EmailIconName } from "@/emails/icons";

export type InlineEmailIconAttachment = {
  filename: string;
  content: Buffer;
  contentType: "image/png";
  contentId: string;
};

/** Replace icon URLs with cid: refs and attach PNG bytes (Gmail-safe, no external hosting). */
export async function embedEmailIcons(html: string): Promise<{
  html: string;
  attachments: InlineEmailIconAttachment[];
}> {
  const iconDir = join(process.cwd(), "public", "email", "icons");
  const attachments: InlineEmailIconAttachment[] = [];
  let output = html;

  for (const name of Object.keys(emailIcons) as EmailIconName[]) {
    const url = emailIcons[name];
    const contentId = `mt-${name}`;
    const content = await readFile(join(iconDir, `${name}.png`));

    attachments.push({
      filename: `${name}.png`,
      content,
      contentType: "image/png",
      contentId,
    });

    output = output.split(url).join(`cid:${contentId}`);
  }

  return { html: output, attachments };
}
