import Link from "next/link";
import { notFound } from "next/navigation";
import { adminPath } from "@/lib/admin-url";
import { ExperienceTypeEditor } from "@/components/admin/ExperienceTypeEditor";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getExperienceType,
  getExperienceTypeDefinition,
  isValidExperienceType,
} from "@/lib/experience-types";
import { getAllVenues } from "@/lib/venues";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function ExperienceTypePage({ params, searchParams }: Props) {
  await requireAdmin();
  const { slug } = await params;
  const { saved } = await searchParams;

  if (!isValidExperienceType(slug)) notFound();

  const def = getExperienceTypeDefinition(slug);
  const row = await getExperienceType(slug);
  if (!row || !def) notFound();

  const allVenues = await getAllVenues();

  return (
    <div>
      <Link
        href={adminPath("/experience-types")}
        className="text-sm text-wine/60 hover:text-burgundy"
      >
        ← Types
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-burgundy">{row.nameNl}</h1>
      <p className="mt-2 text-sm text-wine/70">{def.descriptionNl}</p>
      {saved ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          Opgeslagen. Geldt voor alle {row.nameNl} events.
        </p>
      ) : null}
      <div className="mt-8">
        <ExperienceTypeEditor experienceType={row} allVenues={allVenues} />
      </div>
    </div>
  );
}
