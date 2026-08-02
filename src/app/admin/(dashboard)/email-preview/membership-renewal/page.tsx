import { render } from "@react-email/render";
import { MembershipRenewalReminderEmail } from "@/emails/MembershipRenewalReminderEmail";
import { sampleMembershipRenewalReminderProps } from "@/emails/sample-data";
import { requireAdmin } from "@/lib/admin-auth";
import { membershipRenewalReminderSubject } from "@/lib/email/subjects";

export default async function MembershipRenewalEmailPreviewPage() {
  await requireAdmin();
  const html = await render(
    MembershipRenewalReminderEmail(sampleMembershipRenewalReminderProps),
  );
  const subject = membershipRenewalReminderSubject(
    sampleMembershipRenewalReminderProps.renewalDateLabel,
    sampleMembershipRenewalReminderProps.locale,
    sampleMembershipRenewalReminderProps.variant,
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-burgundy">
            E-mail preview · Trial upsell (7 dagen)
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
