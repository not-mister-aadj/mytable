import { render } from "@react-email/render";
import { BookingConfirmationEmail } from "../emails/BookingConfirmationEmail";
import { sampleBookingConfirmationProps } from "../emails/sample-data";
import { emailIcons } from "../emails/icons";
import { embedEmailIcons } from "../src/lib/email/embed-email-icons";

async function main() {
  const raw = await render(BookingConfirmationEmail(sampleBookingConfirmationProps));
  const { html, attachments } = await embedEmailIcons(raw);

  console.log("icon urls in module:", emailIcons);
  console.log("attachments:", attachments.length);
  console.log("still has /email/icons/:", html.includes("/email/icons/"));
  console.log("cid count:", (html.match(/cid:mt-/g) ?? []).length);

  const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  console.log("image srcs:", srcs.filter((s) => s.includes("cid") || s.includes("email/icons")));

  console.log("sample attachment:", attachments[0]?.contentId, attachments[0]?.content.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
