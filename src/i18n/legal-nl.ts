import type { LegalDocumentContent } from "@/i18n/legal-types";

export const termsNl: LegalDocumentContent = {
  metaTitle: "Algemene voorwaarden",
  title: "Algemene voorwaarden",
  updatedLabel: "Laatst bijgewerkt",
  sections: [
    {
      title: "1. Identiteit van de aanbieder",
      blocks: [
        {
          type: "p",
          text: "{{legalName}}\n{{addressBlock}}\nE-mail: {{email}}\nKvK-nummer: {{kvk}}\nBTW-nummer: {{btw}}",
        },
        {
          type: "p",
          text: "{{legalName}} organiseert via {{tradeName}} culinaire tafels, wijnproeverijen en aanverwante food- en drinkervaringen in Nederland.",
        },
      ],
    },
    {
      title: "2. Waarop deze voorwaarden van toepassing zijn",
      blocks: [
        {
          type: "p",
          text: "Deze voorwaarden gelden voor:",
        },
        {
          type: "ul",
          items: [
            "boekingen voor tafels, proeverijen en aanverwante evenementen via {{websiteUrl}};",
            "communicatie die direct samenhangt met je reservering; en",
            "andere aankopen die wij via {{website}} of door ons goedgekeurde verkoopkanalen aanbieden.",
          ],
        },
        {
          type: "p",
          text: "Als wij voor een specifieke tafel of campagne afzonderlijke voorwaarden publiceren, gelden die aanvullend op deze algemene voorwaarden.",
        },
      ],
    },
    {
      title: "3. Totstandkoming van de overeenkomst",
      blocks: [
        {
          type: "p",
          text: "De informatie op onze website is een uitnodiging om een reservering te plaatsen en geen bindend aanbod van onze kant.",
        },
        {
          type: "p",
          text: "Wanneer je de checkout afrondt, doe je een aanbod om de geselecteerde tafel of het geselecteerde evenement af te nemen. De overeenkomst komt tot stand zodra wij je betaling hebben ontvangen en je per e-mail een boekingsbevestiging sturen.",
        },
        {
          type: "p",
          text: "Wij mogen een bestelling weigeren of annuleren voordat zij is geaccepteerd als er sprake is van een duidelijke prijsfout, ontbrekende beschikbaarheid, een betaalprobleem of een redelijke aanwijzing voor misbruik of fraude.",
        },
      ],
    },
    {
      title: "4. Prijzen en betaling",
      blocks: [
        {
          type: "p",
          text: "Tenzij wij uitdrukkelijk anders vermelden, zijn onze prijzen inclusief btw voor zover van toepassing.",
        },
        {
          type: "p",
          text: "Betaling vindt volledig vooraf plaats via de betaalmethoden die tijdens het afrekenen worden getoond (waaronder iDEAL, creditcard en Bancontact). Je bent zelf verantwoordelijk voor het aanleveren van correcte contact- en betaalgegevens.",
        },
        {
          type: "p",
          text: "Als een betaling wordt teruggedraaid, gestorneerd of anderszins niet definitief wordt voltooid, mogen wij je reservering opschorten of annuleren totdat het probleem is opgelost.",
        },
      ],
    },
    {
      title: "5. Deelname aan tafels en evenementen",
      blocks: [
        {
          type: "p",
          text: "{{tradeName}}-avonden vinden plaats bij zorgvuldig gekozen partnerlocaties. Je bent zelf verantwoordelijk voor:",
        },
        {
          type: "ul",
          items: [
            "het controleren van de tafelgegevens tijdens checkout en in je bevestigingsmail;",
            "het op tijd arriveren van alle deelnemers in je gezelschap; en",
            "het tijdig en correct doorgeven van dieetwensen of andere informatie die wij nodig hebben voor de uitvoering.",
          ],
        },
        {
          type: "p",
          text: "Alcoholische dranken mogen alleen worden geschonken aan deelnemers die daar wettelijk oud genoeg voor zijn. Partnerlocaties mogen alcohol weigeren als de wet of verantwoord schenken dat vereist.",
        },
        {
          type: "p",
          text: "Om het evenement te kunnen uitvoeren mogen wij beperkte gastinformatie delen met de partnerlocatie, zoals de naam op de boeking, de groepsgrootte en dieetnotities.",
        },
        {
          type: "p",
          text: "Foto- en video-opnames: tijdens {{tradeName}}-avonden kunnen foto's en video's worden gemaakt door ons of door door ons ingeschakelde fotografen of videografen. Door je betaling af te ronden stem je ermee in dat je aanwezig kunt zijn op beeldmateriaal dat wij gebruiken voor marketing, waaronder onze website, social media, e-mail en online advertenties.",
        },
        {
          type: "p",
          text: "Wil je liever niet (duidelijk) in beeld? Meld dat bij aankomst aan de host of het team ter plaatse. Wij doen ons best om daar rekening mee te houden, maar kunnen niet garanderen dat je nergens op de achtergrond verschijnt in groeps- of sfeeropnames.",
        },
        {
          type: "p",
          text: "Je kunt altijd vragen om redelijke aanpassing of verwijdering van specifieke beelden waarop je herkenbaar in beeld bent, via {{email}}. Meer hierover staat in ons privacybeleid op {{websiteUrl}}/privacy.",
        },
      ],
    },
    {
      title: "6. Ruilen door jou",
      blocks: [
        {
          type: "p",
          text: "Annuleren is niet mogelijk. Wel kun je kosteloos ruilen naar een andere beschikbare datum.",
        },
        {
          type: "p",
          text: "Voor Sunday Table kan dat tot 7 dagen (168 uur) voor de start. Daarna reserveren wij de wijnbar op basis van het definitieve aantal gasten en ligt je plek vast.",
        },
        {
          type: "p",
          text: "Voor andere tafels en evenementen kan dat tot {{exchangeDeadlineHours}} uur voor de start.",
        },
        {
          type: "p",
          text: "Ruilen doe je via {{email}}, of via je account zodra dat mogelijk is. Vermeld daarbij je reserveringscode.",
        },
        {
          type: "p",
          text: "Na de deadline is ruilen niet meer mogelijk en is geen restitutie verschuldigd, ook niet als je niet komt.",
        },
        {
          type: "p",
          text: "Voor boekingen die zijn gedaan voordat deze versie van de voorwaarden inging (zie de datum bovenaan), blijft voor Sunday Table de deadline van {{exchangeDeadlineHours}} uur gelden.",
        },
        {
          type: "p",
          text: "Dwingende wettelijke consumentenrechten blijven onverminderd van toepassing.",
        },
      ],
    },
    {
      title: "7. Sunday Table: minimum aantal gasten, locatie en tafel",
      blocks: [
        {
          type: "p",
          text: "Een Sunday Table gaat door vanaf 4 betalende gasten. Uiterlijk 7 dagen voor de start laten wij je per e-mail weten of je tafel doorgaat.",
        },
        {
          type: "p",
          text: "Gaat de tafel niet door, dan annuleren wij je boeking en betalen wij het volledige bedrag dat je voor je plek hebt betaald automatisch terug, binnen 14 dagen en via de betaalmethode die je gebruikte. Wij bieden je ook een andere datum of een tafel in een stad in de buurt aan.",
        },
        {
          type: "p",
          text: "Wij kiezen de wijnbar zodra het aantal gasten bekend is. De tafel vindt plaats in een wijnbar in de stad die bij de datum staat. Het adres krijg je uiterlijk 7 dagen voor de start per e-mail.",
        },
        {
          type: "p",
          text: "De prijs per plek omvat je plek aan tafel en de organisatie. Eten en drinken zijn niet inbegrepen: die bestel en betaal je zelf bij de wijnbar.",
        },
        {
          type: "p",
          text: "Wij delen tafels in per leeftijdsgroep (zoals 20-39 en 35+) en streven naar een gezellige, gemengde tafel van ongeveer 4 tot 6 personen. Wij kunnen geen exacte leeftijden, man/vrouw-verhouding of groepsgrootte garanderen.",
        },
      ],
    },
    {
      title: "8. Niet gezellig? Volgende op ons",
      blocks: [
        {
          type: "p",
          text: "Vond je je Sunday Table niet gezellig, laat het ons dan binnen 2 dagen na de tafel weten via {{email}}, met je reserveringscode. Je krijgt dan een gratis plek aan een volgende Sunday Table.",
        },
        {
          type: "p",
          text: "Daarvoor geldt:",
        },
        {
          type: "ul",
          items: [
            "je was aanwezig bij de tafel (bij niet komen opdagen geldt deze regeling niet);",
            "je kunt deze regeling één keer per persoon gebruiken;",
            "de gratis plek is 6 maanden geldig, voor een Sunday Table naar keuze, zolang er plek is;",
            "de gratis plek is persoonlijk en kan niet worden ingewisseld voor geld of worden overgedragen.",
          ],
        },
        {
          type: "p",
          text: "Bij misbruik mogen wij deze regeling weigeren.",
        },
      ],
    },
    {
      title: "9. Niet komen opdagen",
      blocks: [
        {
          type: "p",
          text: "Kom je niet zonder op tijd te ruilen, dan vervalt je plek zonder terugbetaling. Gebeurt dat herhaaldelijk, dan mogen wij toekomstige boekingen weigeren.",
        },
      ],
    },
    {
      title: "10. Aan tafel",
      blocks: [
        {
          type: "p",
          text: "Onze tafels draaien om een gezellige middag of avond. Daarom vragen wij iedereen:",
        },
        {
          type: "ul",
          items: [
            "respectvol te zijn naar andere gasten en het personeel van de zaak;",
            "geen producten, diensten of investeringen aan te bieden aan tafel;",
            "niet aan te dringen op persoonlijke of contactgegevens van anderen;",
            "alleen te komen met de personen voor wie geboekt is;",
            "met mate te drinken; de zaak mag alcohol weigeren.",
          ],
        },
        {
          type: "p",
          text: "Wie zich hier niet aan houdt, kan door ons of door de zaak worden verzocht te vertrekken, zonder terugbetaling, en kan worden uitgesloten van toekomstige tafels.",
        },
      ],
    },
    {
      title: "11. Wijzigingen of annulering door ons",
      blocks: [
        {
          type: "p",
          text: "Wij mogen redelijke wijzigingen aanbrengen in een tafel of evenement als dat nodig is om operationele, veiligheids- of kwaliteitsredenen. Dat kan bijvoorbeeld gaan om een wijziging in tijd, locatie binnen dezelfde stad of een vergelijkbare vervanging.",
        },
        {
          type: "p",
          text: "Als wij een evenement volledig annuleren of niet kunnen uitvoeren zoals afgesproken, bieden wij een omboeking of terugbetaling aan, afhankelijk van de omstandigheden.",
        },
        {
          type: "p",
          text: "Wanneer de niet-uitvoering wordt veroorzaakt door omstandigheden buiten onze redelijke invloedssfeer, zijn wij niet verder aansprakelijk dan wettelijk verplicht.",
        },
        {
          type: "p",
          text: "Voor Sunday Table geldt daarnaast artikel 7: gaat een tafel niet door wegens te weinig gasten, dan betalen wij altijd het volledige bedrag terug.",
        },
      ],
    },
    {
      title: "12. Je account",
      blocks: [
        {
          type: "p",
          text: "Om te boeken kun je een account aanmaken met je e-mailadres (je logt in met een eenmalige code die wij per e-mail sturen) of met je Google-account.",
        },
        {
          type: "p",
          text: "Je moet 18 jaar of ouder zijn en je mag per persoon één account hebben. Zorg dat je e-mailadres klopt: je boekingen, de bevestiging van je tafel en het adres sturen wij daarheen.",
        },
        {
          type: "p",
          text: "Je kunt je account laten verwijderen via {{email}}. Lopende boekingen blijven dan geldig. Gegevens die wij wettelijk moeten bewaren, bijvoorbeeld voor de administratie, bewaren wij volgens ons privacybeleid.",
        },
      ],
    },
    {
      title: "13. Klachten en support",
      blocks: [
        {
          type: "p",
          text: "Als er iets misgaat, neem dan zo snel mogelijk contact op via {{email}}, zodat wij kunnen onderzoeken wat er is gebeurd en je kunnen helpen.",
        },
        {
          type: "p",
          text: "Vermeld daarbij bij voorkeur je reserveringscode, de datum van het evenement en een korte omschrijving van het probleem.",
        },
      ],
    },
    {
      title: "14. Aansprakelijkheid",
      blocks: [
        {
          type: "p",
          text: "Niets in deze voorwaarden sluit aansprakelijkheid uit of beperkt aansprakelijkheid voor schade die op grond van dwingend recht niet mag worden uitgesloten, waaronder schade door opzet of bewuste roekeloosheid.",
        },
        {
          type: "p",
          text: "Met inachtneming daarvan is onze aansprakelijkheid beperkt tot schade die een voorzienbaar gevolg is van een toerekenbare tekortkoming in onze uitvoering.",
        },
        {
          type: "p",
          text: "Wij zijn niet aansprakelijk voor indirecte of gevolgschade, of voor handelen of nalaten van partnerlocaties, behalve voor zover die schade is veroorzaakt door onze eigen tekortkoming of het niet betrachten van redelijke zorg bij de organisatie van het evenement.",
        },
        {
          type: "p",
          text: "Eten, drinken en service komen van de zaak zelf. Wij kiezen de zaken met zorg, maar zijn niet verantwoordelijk voor wat de zaak serveert of in rekening brengt.",
        },
      ],
    },
    {
      title: "15. Privacy",
      blocks: [
        {
          type: "p",
          text: "Persoonsgegevens verwerken wij in overeenstemming met ons privacybeleid op {{websiteUrl}}/privacy.",
        },
      ],
    },
    {
      title: "16. Toepasselijk recht",
      blocks: [
        {
          type: "p",
          text: "Op deze voorwaarden is Nederlands recht van toepassing, tenzij dwingend consumentenrecht van het land waar jij woont iets anders voorschrijft.",
        },
        {
          type: "p",
          text: "Geschillen worden voorgelegd aan de bevoegde rechter volgens het toepasselijke consumentenrecht.",
        },
        {
          type: "p",
          text: "Herroepingsrecht: een boeking voor een tafel of evenement op een vaste datum is een vrijetijdsactiviteit. Daarvoor geldt wettelijk geen herroepingstermijn van 14 dagen. Je kunt wel ruilen volgens artikel 6.",
        },
      ],
    },
  ],
};

export const privacyNl: LegalDocumentContent = {
  metaTitle: "Privacybeleid",
  title: "Privacybeleid",
  updatedLabel: "Laatst bijgewerkt",
  sections: [
    {
      title: "Wie wij zijn",
      blocks: [
        {
          type: "p",
          text: "{{legalName}}\n{{addressBlock}}\nE-mail: {{email}}\nKvK-nummer: {{kvk}}\nBTW-nummer: {{btw}}",
        },
        {
          type: "p",
          text: "Wij bieden {{tradeName}} aan via {{websiteUrl}}. In deze privacyverklaring leggen wij uit welke persoonsgegevens wij verzamelen, waarom wij die gebruiken, met wie wij die delen en welke rechten je hebt.",
        },
      ],
    },
    {
      title: "Verantwoordelijke",
      blocks: [
        {
          type: "p",
          text: "Voor klanten en bezoekers van {{website}} is {{legalName}} de verwerkingsverantwoordelijke voor de persoonsgegevens die in deze privacyverklaring worden beschreven.",
        },
      ],
    },
    {
      title: "Welke gegevens wij verzamelen",
      subsections: [
        {
          title: "Gegevens die je aan ons verstrekt",
          blocks: [
            {
              type: "ul",
              items: [
                "Reservering plaatsen: je naam, e-mailadres, aantal plaatsen en optioneel dieetwensen;",
                "Contact per e-mail: je naam, e-mailadres en de inhoud van je bericht;",
                "Account: je e-mailadres, en als je inlogt met Google ook de naam die bij je Google-account hoort;",
                "Quiz: je antwoorden, zoals je geboortedatum, gender, tafelvoorkeur, steden en voorkeuren;",
                "Wachtlijst of nieuwsbrief (indien beschikbaar): je e-mailadres en voorkeursstad, als je je hiervoor aanmeldt.",
                "Tijdens evenementen: foto's en video's waarop deelnemers (mogelijk herkenbaar) in beeld kunnen zijn, als je daarvoor toestemming geeft bij het boeken.",
              ],
            },
          ],
        },
        {
          title: "Gegevens die wij automatisch verzamelen",
          blocks: [
            {
              type: "ul",
              items: [
                "Technische gegevens: je IP-adres, browsertype, besturingssysteem en apparaatgegevens;",
                "Gebruiksgegevens: welke pagina's je bezoekt en wanneer je onze website bezoekt, voor zover nodig voor beveiliging en stabiliteit;",
                "Cookies: zie het gedeelte Cookies hieronder.",
              ],
            },
          ],
        },
        {
          title: "Gegevens die wij van anderen ontvangen",
          blocks: [
            {
              type: "p",
              text: "Van Stripe, onze betaaldienstverlener, ontvangen wij de status van je betaling, transactiereferenties, het betaalde bedrag en de valuta. Wij slaan geen kaart- of bankgegevens zelf op.",
            },
            {
              type: "p",
              text: "Als je inlogt met Google, ontvangen wij van Google je naam, e-mailadres en (indien beschikbaar) profielfoto. Wij krijgen geen toegang tot je Google-wachtwoord of andere gegevens in je Google-account.",
            },
          ],
        },
      ],
      blocks: [],
    },
    {
      title: "Moet je deze gegevens verstrekken?",
      blocks: [
        {
          type: "p",
          text: "Naam en e-mailadres zijn nodig om een reservering te plaatsen. Als je die niet verstrekt, kunnen wij je boeking niet verwerken. Gegevens voor een wachtlijst of marketing zijn altijd optioneel.",
        },
      ],
    },
    {
      title: "Waarom wij je gegevens gebruiken",
      subsections: [
        {
          title: "Om je reservering uit te voeren",
          blocks: [
            {
              type: "p",
              text: "Wij gebruiken je naam, e-mailadres en boekingsgegevens om je reservering te verwerken, je bevestiging te sturen en je te informeren over praktische details.",
            },
            {
              type: "p",
              text: "Grondslag: uitvoering van een overeenkomst.",
            },
          ],
        },
        {
          title: "Om partnerlocaties voor te bereiden",
          blocks: [
            {
              type: "p",
              text: "Wij delen beperkte gastinformatie met de partnerlocatie van je tafel, zoals de naam op de boeking, groepsgrootte en dieetwensen. Wij delen je e-mailadres, telefoonnummer of betaalgegevens niet met partnerlocaties voor dit doel.",
            },
            {
              type: "p",
              text: "Dieetwensen kunnen informatie over gezondheid onthullen. Het doorgeven hiervan is optioneel; als je ervoor kiest, behandelen wij dat als je uitdrukkelijke toestemming om dit te delen met de partnerlocatie.",
            },
            {
              type: "p",
              text: "Grondslag: uitvoering van een overeenkomst.",
            },
          ],
        },
        {
          title: "Financiële administratie",
          blocks: [
            {
              type: "p",
              text: "Wij bewaren bestel- en factuurgegevens om te voldoen aan onze wettelijke verplichtingen, waaronder de fiscale bewaarplicht.",
            },
            {
              type: "p",
              text: "Grondslag: wettelijke verplichting.",
            },
          ],
        },
        {
          title: "Websitebeveiliging en stabiliteit",
          blocks: [
            {
              type: "p",
              text: "Wij verwerken technische loggegevens om misbruik te voorkomen, onze website stabiel te houden en storingen op te lossen.",
            },
            {
              type: "p",
              text: "Grondslag: gerechtvaardigd belang.",
            },
          ],
        },
        {
          title: "Kaarten tonen",
          blocks: [
            {
              type: "p",
              text: "Op sommige pagina's tonen wij interactieve kaarten via Apple MapKit, zodat je locaties kunt bekijken.",
            },
            {
              type: "p",
              text: "Grondslag: gerechtvaardigd belang.",
            },
          ],
        },
        {
          title: "Marketingfoto's en -video's",
          blocks: [
            {
              type: "p",
              text: "Tijdens {{tradeName}}-avonden maken wij soms foto's en video's voor promotie. Daarin kunnen deelnemers herkenbaar in beeld zijn.",
            },
            {
              type: "p",
              text: "Grondslag: toestemming, gegeven door een reservering af te ronden en daarmee akkoord te gaan met de algemene voorwaarden.",
            },
            {
              type: "p",
              text: "Bewaartermijn: zolang het beeldmateriaal commercieel relevant blijft voor onze marketing, doorgaans maximaal 3 jaar, tenzij wettelijk anders vereist.",
            },
            {
              type: "p",
              text: "Je kunt bezwaar maken, toestemming intrekken of verwijdering vragen via {{email}}. Intrekken heeft geen terugwerkende kracht voor reeds gepubliceerd materiaal waar redelijke verwijdering niet meer haalbaar is.",
            },
          ],
        },
      ],
      blocks: [],
    },
    {
      title: "Met wie wij je gegevens delen",
      blocks: [
        {
          type: "p",
          text: "Wij verkopen je gegevens nooit. Wij delen ze alleen met partijen die ons helpen onze diensten uit te voeren:",
        },
        {
          type: "ul",
          items: [
            "Partnerlocaties: beperkte gastinformatie voor de uitvoering van je tafel;",
            "Stripe (betalingen): verwerkt je betaling; wij slaan geen kaart- of bankgegevens op;",
            "Supabase (database, opslag en inloggen): slaat boekingsgegevens, accounts en media op;",
            "Vercel (hosting): host onze website;",
            "Resend (e-mail): verstuurt boekingsbevestigingen en inlogcodes namens ons;",
            "Google (inloggen): alleen als je ervoor kiest om in te loggen met je Google-account;",
            "PostHog (productanalytics, EU): pageviews, conversie-events, heatmaps en sessie-opnames om de website te verbeteren; formulierinvoer wordt gemaskeerd;",
            "Apple MapKit (kaarten): toont kaarten op evenementpagina's, indien ingeschakeld.",
          ],
        },
        {
          type: "p",
          text: "Sommige verwerkers kunnen persoonsgegevens buiten de Europese Economische Ruimte verwerken. In dat geval baseren wij de doorgifte op een passend mechanisme, zoals het EU-VS Data Privacy Framework of standaardcontractbepalingen van de Europese Commissie.",
        },
      ],
    },
    {
      title: "Cookies",
      blocks: [
        {
          type: "p",
          text: "Wij gebruiken strikt noodzakelijke cookies voor het functioneren van de website (bijvoorbeeld sessie en taalvoorkeur).",
        },
        {
          type: "p",
          text: "Voor productanalytics gebruiken wij PostHog (EU-cloud). Dat kan een cookie of vergelijkbare opslag (localStorage) plaatsen om gebruik te meten: welke pagina's je bekijkt, hoe ver je scrollt, waar je klikt, en, met sessie-opname, hoe je door de site navigeert. Formuliervelden (zoals e-mail en wachtwoord) worden gemaskeerd in opnames. Wij gebruiken deze gegevens niet voor advertentieprofilering.",
        },
        {
          type: "p",
          text: "Betalingen verlopen via de beveiligde checkout van Stripe. Stripe kan tijdens het afrekenen eigen cookies plaatsen op stripe.com.",
        },
        {
          type: "p",
          text: "Als wij marketingcookies of tracking voor advertenties toevoegen, vragen wij daarvoor apart toestemming via een cookiebanner.",
        },
      ],
    },
    {
      title: "Hoe lang wij je gegevens bewaren",
      blocks: [
        {
          type: "ul",
          items: [
            "Bestel- en factuurgegevens bewaren wij ten minste 7 jaar om te voldoen aan fiscale bewaarplichten.",
            "Boekingsgegevens bewaren wij zolang nodig voor de uitvoering van je reservering en eventuele nazorg.",
            "Accountgegevens bewaren wij zolang je account bestaat. Laat je je account verwijderen, dan verwijderen wij die gegevens binnen 30 dagen, behalve wat wij wettelijk moeten bewaren.",
            "Marketingfoto's en -video's bewaren wij doorgaans maximaal 3 jaar, of korter als je toestemming intrekt en redelijke verwijdering mogelijk is.",
            "Technische loggegevens bewaren wij kort, alleen zolang nodig voor beveiliging en foutopsporing.",
          ],
        },
      ],
    },
    {
      title: "Je rechten",
      blocks: [
        {
          type: "p",
          text: "Op grond van de AVG heb je recht op inzage, rectificatie, wissing, beperking, overdraagbaarheid en bezwaar. Je kunt een verzoek sturen naar {{email}}. Wij reageren binnen 1 maand.",
        },
        {
          type: "p",
          text: "Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens: autoriteitpersoonsgegevens.nl.",
        },
      ],
    },
    {
      title: "Kinderen",
      blocks: [
        {
          type: "p",
          text: "Onze diensten zijn niet gericht op kinderen jonger dan 18 jaar. Wij verzamelen niet bewust persoonsgegevens van kinderen.",
        },
      ],
    },
    {
      title: "Beveiliging",
      blocks: [
        {
          type: "p",
          text: "Wij nemen passende technische en organisatorische maatregelen om je gegevens te beschermen tegen ongeoorloofde toegang, verlies of misbruik.",
        },
      ],
    },
    {
      title: "Wijzigingen",
      blocks: [
        {
          type: "p",
          text: "Wij kunnen deze privacyverklaring van tijd tot tijd wijzigen. De datum bovenaan laat zien wanneer deze voor het laatst is aangepast. Bij belangrijke wijzigingen informeren wij je via onze website.",
        },
      ],
    },
  ],
};
