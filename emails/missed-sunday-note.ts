/** The missed-Sundays rule in one short paragraph, for the confirmation,
 * location and Saturday mails (src/lib/missed-sundays/logic.ts). */
export function missedSundayNote(locale: "nl" | "en"): { title: string; body: string } {
  return locale === "en"
    ? {
        title: "Can't make it after all?",
        body: "Email info@mytable.club up to 48 hours before and we'll move your seat for free. Cancelling later or not showing up counts as a missed Sunday. After two, you can't book for a while.",
      }
    : {
        title: "Kun je toch niet?",
        body: "Mail info@mytable.club tot 48 uur van tevoren, dan verplaatsen we je plek gratis. Later afzeggen of niet komen telt als een gemiste zondag. Na twee keer kun je een tijd niet boeken.",
      };
}
