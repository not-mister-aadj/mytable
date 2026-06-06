import Link from "next/link";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";

export default async function EmailPreviewIndexPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl text-burgundy">E-mail previews</h1>
      <p className="mb-8 text-sm text-wine/60">
        Bekijk transactionele e-mails in de browser voordat je ze verstuurt.
      </p>
      <ul className="space-y-3 text-sm">
        <li>
          <Link
            href={adminPath("/email-preview/booking-confirmation")}
            className="font-medium text-burgundy underline-offset-2 hover:underline"
          >
            Boekingsbevestiging
          </Link>
        </li>
        <li>
          <Link
            href={adminPath("/email-preview/booking-moved")}
            className="font-medium text-burgundy underline-offset-2 hover:underline"
          >
            Boeking verplaatst
          </Link>
        </li>
      </ul>
    </div>
  );
}
