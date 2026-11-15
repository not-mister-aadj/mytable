/** The rule for a seat in one short paragraph, for the confirmation and
 * location mails (src/lib/missed-sundays/logic.ts). `fixed`: moving has
 * closed already (the location mail goes out 7 days before). */
export function missedSundayNote(locale: "nl" | "en", fixed = false): { title: string; body: string } {
  return locale === "en"
    ? {
        title: "Can't make it after all?",
        body: fixed
          ? "Your seat is fixed and your table is made around you. If you really can't come, let someone come in your place through your table page. We understand it can happen. Whoever does it more often pays more for their next seat."
          : "Until 7 days before, you can move your seat to another Sunday for free. After that your seat is fixed: let someone come in your place through your table page. We understand it can happen. Whoever does it more often pays more for their next seat.",
      }
    : {
        title: "Kun je toch niet?",
        body: fixed
          ? "Je plek ligt vast en je tafel is op jou ingedeeld. Kun je echt niet, laat dan iemand in jouw plaats komen via je tafelpagina. Dat het kan gebeuren, snappen we. Wie het vaker doet, betaalt voor de volgende plek meer."
          : "Tot 7 dagen vooraf verzet je je plek kosteloos naar een andere zondag. Daarna ligt je plek vast: laat dan iemand in jouw plaats komen via je tafelpagina. Dat het kan gebeuren, snappen we. Wie het vaker doet, betaalt voor de volgende plek meer.",
      };
}
