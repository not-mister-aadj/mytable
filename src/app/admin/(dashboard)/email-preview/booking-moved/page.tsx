import { render } from "@react-email/render";
import { BookingMovedEmail } from "@/emails/BookingMovedEmail";
import { sampleBookingMovedProps } from "@/emails/sample-data";
import { requireAdmin } from "@/lib/admin-auth";

export default async function BookingMovedEmailPreviewPage() {
  await requireAdmin();
  const html = await render(BookingMovedEmail(sampleBookingMovedProps));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-burgundy">
            E-mail preview · Verplaatst
          </h1>
          <p className="mt-1 text-sm text-wine/60">
            Onderwerp: Je MyTable boeking is verplaatst
          </p>
        </div>
      </div>
      <div
        className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
