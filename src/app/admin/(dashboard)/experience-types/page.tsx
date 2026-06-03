import Link from "next/link";
import { adminPath } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllExperienceTypes } from "@/lib/experience-types";
import { fetchVenuesByIds } from "@/lib/venues";

export default async function ExperienceTypesPage() {
  await requireAdmin();
  const types = await getAllExperienceTypes();

  const cards = await Promise.all(
    types.map(async (t) => {
      const venues = await fetchVenuesByIds(t.venueIds ?? []);
      return { type: t, venues };
    }),
  );

  return (
    <div>
      <h1 className="font-serif text-3xl text-burgundy">Experience types</h1>
      <p className="mt-2 max-w-xl text-sm text-wine/70">
        Vaste venues, paginatekst, gallery, FAQ en kaart per type. Elke
        wijnproeverij deelt hetzelfde sjabloon.
      </p>

      <div className="mt-8 space-y-4">
        {cards.map(({ type: t, venues }) => (
          <Link
            key={t.slug}
            href={adminPath(`/experience-types/${t.slug}`)}
            className="block rounded-2xl border border-border-subtle bg-beige p-6 transition hover:border-burgundy/30"
          >
            <h2 className="font-serif text-xl text-burgundy">{t.nameNl}</h2>
            <p className="mt-1 text-sm text-wine/60">{t.nameEn}</p>
            <p className="mt-3 text-sm text-wine/70">
              {venues.length === 0
                ? "Nog geen venues gekoppeld"
                : `${venues.length} venue${venues.length === 1 ? "" : "s"}: ${venues.map((v) => v.name).join(", ")}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
