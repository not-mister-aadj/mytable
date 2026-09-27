import { render } from "@react-email/render";
import { SundayTableIntroRequestEmail } from "@/emails/SundayTableIntroRequestEmail";
import { requireAdmin } from "@/lib/admin-auth";
import { sundayTableIntroRequestSubject } from "@/lib/email/subjects";
import { absoluteUrl } from "@/lib/seo/site";

export default async function SundayTableIntroRequestEmailPreviewPage() {
  await requireAdmin();
  const html = await render(
    SundayTableIntroRequestEmail({
      locale: "nl",
      firstName: "Anne",
      city: "Rotterdam",
      dateLabel: "zondag 25 oktober 2026",
      // The preview page, so every button in this preview opens something.
      introUrl: absoluteUrl("/boeking/intro?voorbeeld=1"),
    }),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-burgundy">
          E-mail preview · Meet your table (herinnering)
        </h1>
        <p className="mt-1 text-sm text-wine/60">
          Onderwerp: {sundayTableIntroRequestSubject("Rotterdam", "nl")}
        </p>
        <p className="mt-1 text-sm text-wine/60">
          Gaat ongeveer 15 minuten na een Sunday Table-boeking uit, alleen als de
          vragen op de bevestigingspagina niet zijn ingevuld.
        </p>
      </div>
      <div
        className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
