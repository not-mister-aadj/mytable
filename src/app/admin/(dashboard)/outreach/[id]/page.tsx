import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { isDbConfigured } from "@/db/index";
import { OutreachProspectView } from "@/components/admin/outreach/OutreachProspectView";
import { getOutreachProspect } from "@/lib/outreach/prospects-data";
import { nextSequenceTemplate } from "@/lib/outreach/send";
import { getOutreachTemplates } from "@/lib/outreach/templates-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOutreachProspectPage({ params }: PageProps) {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const { id } = await params;
  const [prospect, templates] = await Promise.all([
    getOutreachProspect(id),
    getOutreachTemplates(),
  ]);

  if (!prospect) {
    notFound();
  }

  const nextTemplate = nextSequenceTemplate(templates, prospect.sequenceStep);

  return (
    <OutreachProspectView
      prospect={prospect}
      templates={templates}
      nextTemplateId={nextTemplate?.id ?? null}
    />
  );
}
