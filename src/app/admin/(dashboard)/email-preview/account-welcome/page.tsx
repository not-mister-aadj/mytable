import { render } from "@react-email/render";
import { JouwTafelWelcomeEmail } from "@/emails/JouwTafelWelcomeEmail";
import { requireAdmin } from "@/lib/admin-auth";
import { jouwTafelWelcomeSubject } from "@/lib/email/subjects";

type Props = { searchParams: Promise<{ taal?: string }> };

/** The "Jouw tafel" account welcome, both variants (?taal=en for English). */
export default async function AccountWelcomePreviewPage({ searchParams }: Props) {
  await requireAdmin();
  const locale = (await searchParams).taal === "en" ? "en" : "nl";
  const base = "https://www.mytable.club";
  const urls = {
    kiesUrl: `${base}${locale === "en" ? "/en/your-table/start" : "/jouw-tafel/start"}?stap=kies`,
    settingsUrl: `${base}${locale === "en" ? "/en/your-table/settings" : "/jouw-tafel/instellingen"}`,
  };
  const variants = [
    { label: "A: tafels open in haar steden", html: await render(JouwTafelWelcomeEmail({ locale, firstName: "Siraadj", variant: "open", cities: locale === "en" ? "Rotterdam and The Hague" : "Rotterdam en Den Haag", ...urls })) },
    { label: "B: nog geen tafel in haar steden", html: await render(JouwTafelWelcomeEmail({ locale, firstName: "Siraadj", variant: "none", cities: "Zwolle", ...urls })) },
  ];
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl text-burgundy">E-mail preview · Welkom account ({locale.toUpperCase()})</h1>
        <p className="mt-1 text-sm text-wine/60">Onderwerp: {jouwTafelWelcomeSubject("Siraadj", locale)} · Engels: ?taal=en</p>
      </div>
      {variants.map((v) => (
        <section key={v.label}>
          <h2 className="mb-3 font-serif text-xl text-burgundy">{v.label}</h2>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm" dangerouslySetInnerHTML={{ __html: v.html }} />
        </section>
      ))}
    </div>
  );
}
