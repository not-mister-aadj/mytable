import Image from "next/image";

export type PartnerSelection = {
  eyebrow: string;
  title: string;
  body: string;
  memberTitle: string;
  memberBody: string;
  memberCta: string;
  memberHref: string;
  partners: { id: string; name: string; area: string | null; atmosphere: string | null; imageUrl: string | null }[];
};

/** Every partner bar of the city. Which ones we reserved only a member sees,
 * in the booking card. */
export function SundayTablePartnerSelection({ selection }: { selection: PartnerSelection }) {
  if (selection.partners.length === 0) return null;
  return (
    <section id="partners" className="mt-10 scroll-mt-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{selection.eyebrow}</p>
      <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">{selection.title}</h2>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-wine/70">{selection.body}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {selection.partners.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-2xl border border-wine/10 bg-white/70">
            <div className="relative aspect-[4/3] bg-beige">
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center font-serif text-2xl text-wine/40">
                  {p.name}
                </div>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="font-serif text-lg text-wine">{p.name}</p>
              <p className="text-sm text-wine/60">{[p.area, p.atmosphere].filter(Boolean).join(" · ")}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4">
        <div className="min-w-0">
          <p className="font-serif text-lg text-wine">{selection.memberTitle}</p>
          <p className="mt-0.5 text-sm text-wine/70">{selection.memberBody}</p>
        </div>
        <a
          href={selection.memberHref}
          className="shrink-0 text-sm font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
        >
          {selection.memberCta}
        </a>
      </div>
    </section>
  );
}
