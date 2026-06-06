import { render } from "@react-email/render";
import { BookingConfirmationEmail } from "../emails/BookingConfirmationEmail";
import { sampleBookingConfirmationProps } from "../emails/sample-data";
import { emailIcons } from "../emails/icons";

async function main() {
  const html = await render(
    BookingConfirmationEmail(sampleBookingConfirmationProps),
  );

  console.log("icon urls:", emailIcons);
  console.log("uses hosted www urls:", html.includes("https://www.mytable.club/email/icons/"));
  console.log("no cid refs:", !html.includes("cid:mt-"));

  const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  console.log("image srcs:", srcs.filter((s) => s.includes("mytable.club/email/icons")));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
