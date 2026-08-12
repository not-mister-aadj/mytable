import { render } from "@react-email/render";
import { SundayTableWaitlistInviteEmail } from "@/emails/SundayTableWaitlistInviteEmail";
import { sampleSundayTableWaitlistInviteProps } from "@/emails/sample-data";
import { requireAdmin } from "@/lib/admin-auth";
import { sundayTableWaitlistInviteSubject } from "@/lib/email/subjects";

export default async function SundayTableWaitlistInviteEmailPreviewPage() {
  await requireAdmin();
  const html = await render(
    SundayTableWaitlistInviteEmail(sampleSundayTableWaitlistInviteProps),
  );
  const subject = sundayTableWaitlistInviteSubject(
    sampleSundayTableWaitlistInviteProps.city,
    sampleSundayTableWaitlistInviteProps.dateLabel,
    sampleSundayTableWaitlistInviteProps.locale,
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-burgundy">
            E-mail preview · Wachtlijst uitnodiging
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
