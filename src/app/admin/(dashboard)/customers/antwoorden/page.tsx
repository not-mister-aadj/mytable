import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { getWaitlistAnswerPeople } from "@/lib/admin-waitlist-answers-data";
import { WaitlistAnswersOverview } from "@/components/admin/WaitlistAnswersOverview";

export default async function AdminWaitlistAnswersPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const people = await getWaitlistAnswerPeople();

  return <WaitlistAnswersOverview people={people} />;
}
