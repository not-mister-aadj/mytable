import { render } from "@react-email/render";
import { SundayTablePlusOneEmail } from "@/emails/SundayTablePlusOneEmail";
import {
  sampleSundayTablePlusOneAddedProps,
  sampleSundayTablePlusOneRemovedProps,
} from "@/emails/sample-data";
import { requireAdmin } from "@/lib/admin-auth";
import {
  sundayTablePlusOneAddedSubject,
  sundayTablePlusOneRemovedSubject,
} from "@/lib/email/subjects";

export default async function SundayTablePlusOneEmailPreviewPage() {
  await requireAdmin();
  const addedHtml = await render(
    SundayTablePlusOneEmail(sampleSundayTablePlusOneAddedProps),
  );
  const removedHtml = await render(
    SundayTablePlusOneEmail(sampleSundayTablePlusOneRemovedProps),
  );
  const addedSubject = sundayTablePlusOneAddedSubject(
    sampleSundayTablePlusOneAddedProps.city,
    sampleSundayTablePlusOneAddedProps.date,
  );
  const removedSubject = sundayTablePlusOneRemovedSubject(
    sampleSundayTablePlusOneRemovedProps.city,
    sampleSundayTablePlusOneRemovedProps.date,
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-burgundy">
          E-mail preview · Sunday Table +1
        </h1>
      </div>

      <div className="mb-10">
        <p className="mb-3 text-sm text-wine/60">Onderwerp: {addedSubject}</p>
        <div
          className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
          dangerouslySetInnerHTML={{ __html: addedHtml }}
        />
      </div>

      <div>
        <p className="mb-3 text-sm text-wine/60">Onderwerp: {removedSubject}</p>
        <div
          className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
          dangerouslySetInnerHTML={{ __html: removedHtml }}
        />
      </div>
    </div>
  );
}
