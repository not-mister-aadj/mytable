import { render } from "@react-email/render";
import { SundayTableReviewEmail } from "@/emails/SundayTableReviewEmail";
import { sampleSundayTableReviewProps } from "@/emails/sample-data";
import { requireAdmin } from "@/lib/admin-auth";

export default async function SundayTableReviewEmailPreviewPage() {
  await requireAdmin();
  const html = await render(
    SundayTableReviewEmail(sampleSundayTableReviewProps),
  );
  const subject = `Hoe was Sunday Table in ${sampleSundayTableReviewProps.city}?`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-burgundy">
            E-mail preview · Sunday Table review (dag 1)
          </h1>
          <p className="mt-1 text-sm text-wine/60">Onderwerp: {subject}</p>
        </div>
      </div>
      <div
        className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
