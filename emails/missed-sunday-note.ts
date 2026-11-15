/** The missed-Sundays rule in one short paragraph, for the confirmation,
 * location and Saturday mails (src/lib/missed-sundays/logic.ts). */
export function missedSundayNote(locale: "nl" | "en"): { title: string; body: string } {
  return locale === "en"
    ? {
        title: "Can't make it after all?",
        body: "Let us know as early as possible at info@mytable.club, so we can give your seat to someone else. Cancelling less than 48 hours before or not showing up counts as a missed Sunday. After two, you can't book for a while.",
      }
    : {
        title: "Kun je toch niet?",
        body: "Laat het ons zo vroeg mogelijk weten via info@mytable.club, dan geven we je plek aan iemand anders. Afzeggen minder dan 48 uur van tevoren of niet komen telt als een gemiste zondag. Na twee keer kun je een tijd niet boeken.",
      };
}
