# Venue outreach

De sectie `/admin/outreach` is de CRM voor de zaken die we als partner willen:
welke wijnbar of restaurant we benaderd hebben, met welke mail, of die geopend
is, en wat ze terugschreven.

## Hoe het werkt

1. **Lijst.** Prospects komen uit een CSV (de Apify Google Maps-scrape van
   `scripts/scrape-venue-prospects.ts`, of elke andere lijst met een `naam`-kolom).
   Importeren kan met `npm run outreach:import -- tmp/prospects-rotterdam.csv Rotterdam`
   of door de CSV in het dashboard te plakken. Upsert gaat op stad + naam: een
   tweede import ververst contactgegevens en laat status, sequence en notities staan.
2. **Templates.** Onder `/admin/outreach/templates` staan de mails. Een template
   van soort *sequence* heeft een stap (1, 2, 3…) en een wachttijd in dagen. Een
   template van soort *antwoord* stuur je met de hand als iemand reageert.
   Placeholders: `{{naam}}`, `{{stad}}`, `{{categorie}}`, `{{contact}}`, `{{website}}`.
   Een PDF-bijlage upload je bij het template; die gaat met elke verzending mee.
3. **Versturen.** Selecteer zaken in de lijst en klik *Verstuur volgende stap*.
   Per zaak wordt de sequence-stap gepakt die aan de beurt is (`sequence_step + 1`),
   en wordt meteen berekend wanneer de volgende stap klaarstaat. Verzenden gaat
   met 600 ms tussenpauze om onder Resends rate limit te blijven.
4. **Tracking.** Resend stuurt afgeleverd / geopend / geklikt / bounce naar
   `/api/webhooks/resend`. Die events landen op de mail en op de zaak. Een bounce
   of spamklacht zet de zaak op *Bounce* of *Afgemeld* en stopt de sequence.
5. **Antwoorden.** Reacties log je met de hand op de detailpagina (plakken +
   sentiment). Zodra er een antwoord staat, stopt de sequence — er gaat dus nooit
   een "nog even checken" achteraan.

## Instellen

| Env var | Waarvoor |
| --- | --- |
| `OUTREACH_EMAIL_FROM` | Afzender voor koude mail. **Gebruik een apart geverifieerd subdomein** (bijv. `Siraadj van MyTable <siraadj@partners.mytable.club>`). Zonder deze variabele gaat outreach over hetzelfde domein als de boekingsbevestigingen, en dat zet de bezorging van je transactionele mail op het spel. |
| `OUTREACH_REPLY_TO` | Waar antwoorden binnenkomen. Valt terug op `EMAIL_REPLY_TO`. |
| `RESEND_WEBHOOK_SECRET` | Signing secret van de webhook-endpoint in Resend (`whsec_…`). Zonder deze variabele wordt elk event geweigerd. |

In Resend zelf:

- Voeg het verzendsubdomein toe en zet de DNS-records (SPF, DKIM, DMARC).
- Zet **Open tracking** en **Click tracking** aan voor dat domein — zonder die
  instelling vuren `email.opened` en `email.clicked` nooit.
- Maak een webhook naar `https://<site>/api/webhooks/resend` met de events
  `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`,
  `email.complained`.

Database: `npm run db:migrate-outreach` (of `npm run dev`, die past het
dev-schema automatisch toe).

## Wat je moet weten over de cijfers

- **Opens zijn een indicatie, geen waarheid.** Apple Mail Privacy Protection
  laadt de tracking-pixel vooraf, dus een deel van de "geopend" is de mailserver
  en niet de eigenaar van de zaak. Kliks en antwoorden zijn de harde signalen.
- **Koude B2B-mail mag**, maar alleen met een echte opt-out. Elke mail draagt een
  `List-Unsubscribe`-header en een regel onderaan: één "nee" en je stopt. Zet die
  zaak dan ook echt op *Afgemeld* — dat is de hele reden dat die status bestaat.
- **Stuur in kleine batches.** Een nieuw verzenddomein dat op dag één 180 mails
  uitspuugt, wordt door Gmail als spam gezien. Begin met 20 tot 30 per dag en
  bouw op.
