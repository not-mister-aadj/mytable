import type { BlogPost } from "./blog-types";

/**
 * Long-form SEO guides adapted from drafts into MyTable voice.
 * Pricing: solo €49, duo from €39, group from €44. No em dashes.
 */
export const blogGuidePosts: BlogPost[] = [
  {
    slug: "25-sociale-activiteiten-voor-volwassenen",
    category: "tips",
    publishedAt: "2026-07-21",
    readMinutes: 11,
    image: "/blog/25-sociale-activiteiten-voor-volwassenen.png",
    featured: true,
    relatedPaths: [
      {
        path: "/agenda",
        label: {
          nl: "Bekijk beschikbare tafels",
          en: "See available tables",
        },
      },
      {
        path: "/blog/solo-naar-een-girls-only-wijnproeverij",
        label: {
          nl: "Solo naar een girls-only proeverij",
          en: "Going solo to a girls-only tasting",
        },
      },
    ],
    title: {
      nl: "25 sociale activiteiten voor volwassenen in Nederland",
      en: "25 social activities for adults in the Netherlands",
    },
    excerpt: {
      nl: "School en sportclub regelden vroeger vanzelf contact. Als volwassene moet je het zelf doen. 25 concrete activiteiten, platforms en een plan om binnen twee weken mee te doen.",
      en: "School and sports clubs used to create contact for you. As an adult you have to arrange it yourself. 25 concrete activities, platforms and a two-week plan to join in.",
    },
    metaDescription: {
      nl: "25 sociale activiteiten voor volwassenen in Nederland: sport, creatief, vrijwilligerswerk en girls-only wijnproeverijen. Inclusief apps en stappenplan.",
      en: "25 social activities for adults in the Netherlands: sport, creative, volunteering and girls-only wine tastings. Including apps and a simple plan.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Als kind hoefde je er niet over na te denken. School, sportclub, de buurt: contact ontstond vanzelf. Als volwassene verdwijnen die structuren. Je wilt wel iets doen, maar weet niet waar, hoe of met wie. Dat is heel gewoon. En oplosbaar.",
        },
        {
          type: "p",
          text: "Bijna de helft van de Nederlandse volwassenen ervaart eenzaamheid. Niet omdat ze niet sociaal kunnen zijn, maar omdat het lastiger is activiteiten te vinden die passen bij wie je nu bent. Hieronder: 25 concrete opties, gegroepeerd op type, plus platforms en een plan om binnen twee weken te starten.",
        },
        {
          type: "p",
          text: "Sommige formats zijn zo slim opgezet dat je niemand hoeft te kennen en tóch niet alleen zit. MyTable doet dat elke zondag: aanschuiven, een host die de sfeer bewaakt, vier wijnen en hapjes. Eerst de volle lijst.",
        },
        { type: "h2", text: "Bewegen: de makkelijkste manier om contact te maken" },
        {
          type: "p",
          text: "In een groep hoef je niet interessant te zijn. Je bent bezig, het gesprek komt vanzelf, en de activiteit haalt sociale druk weg.",
        },
        {
          type: "ul",
          items: [
            "Wandelgroepen via wijkcentra, Klup of lokale initiatieven tegen eenzaamheid",
            "Fietsclubs zonder zware verplichtingen",
            "Yoga, zwemmen, koersbal of jeu de boules: het echte sociale moment zit vaak in de koffie daarna",
          ],
        },
        {
          type: "h2",
          text: "Creatieve workshops die stilletjes verbinden",
        },
        {
          type: "p",
          text: "Je aandacht zit op de taak. Het gesprek ontstaat organisch, niet geforceerd.",
        },
        {
          type: "ul",
          items: [
            "Kookworkshops (vaak €60 tot €120 p.p.)",
            "Schilderen en dansles",
            "Schrijfclub, amateurmuziek of een taalcursus: gedeelde leerdoelen binden snel",
          ],
        },
        {
          type: "h2",
          text: "Laagdrempelig als sociale situaties spannend voelen",
        },
        {
          type: "h3",
          text: "Wijnproeverij met host aan tafel",
        },
        {
          type: "p",
          text: "MyTable organiseert girls-only wijnproeverijen op zondag van 14:00 tot 17:00 in meerdere steden. Vier wijnen, vier chef's special bites, een host die het gesprek op gang houdt. Solo €49, duo vanaf €39, groep vanaf €44. Alles all-in. Niemand hoeft het gesprek te redden: dat is al geregeld.",
        },
        {
          type: "ul",
          items: [
            "Spelletjesavonden in wijkcentra",
            "Boekenclubs via de bibliotheek",
            "Koffieochtenden en buurtmaaltijden",
          ],
        },
        {
          type: "h2",
          text: "Vrijwilligerswerk en buurtinitiatieven",
        },
        {
          type: "ul",
          items: [
            "Buurtmoestuin, reparatiecafé of klussenhulp via NLvoorelkaar",
            "Vrijwilligerswerk bij vereniging, bibliotheek of cultureel centrum",
            "Telefonische hulplijn: contact met betekenis",
          ],
        },
        {
          type: "h2",
          text: "Platforms om snel iets in jouw stad te vinden",
        },
        {
          type: "ul",
          items: [
            "Klup: veel leden, wekelijks honderden activiteiten",
            "Meet5: focus op persoonlijke ontmoetingen",
            "SBG-app: sportief en cultureel",
            "Gemeentelijke sociale kaarten: zoek je stad plus ontmoet",
          ],
        },
        {
          type: "h2",
          text: "Van voornemen naar aanwezigheid in twee weken",
        },
        {
          type: "ul",
          items: [
            "Kies één activiteit dicht bij je comfortzone",
            "Meld je binnen 24 uur aan",
            "Zet het in je agenda alsof het een vaste afspraak is",
            "Kom vijf minuten te vroeg en geef jezelf toestemming om daarna gewoon naar huis te gaan",
          ],
        },
        {
          type: "p",
          text: "Dezelfde mensen twee of drie keer zien verandert vreemden in bekenden. Herhaling is de stille motor achter nieuwe vriendschappen.",
        },
        {
          type: "h2",
          text: "Het aanbod is groter dan je denkt",
        },
        {
          type: "p",
          text: "Van wandelgroepen tot workshops en georganiseerde tafels: er is een format dat bij jou past. Zoek je een zachte landing zonder ankers? Boek een girls-only tafel bij MyTable. Kies één optie uit deze lijst, meld je vandaag aan, en geef het drie weken.",
        },
      ],
      en: [
        {
          type: "p",
          text: "As a kid you did not have to think about it. School, sports club, the neighbourhood: contact happened on its own. As an adult those structures fade. You want to do something, but not where, how or with whom. That is normal. And fixable.",
        },
        {
          type: "p",
          text: "Nearly half of Dutch adults experience loneliness. Not because they cannot be social, but because it is harder to find activities that fit who you are now. Below: 25 concrete options by type, plus platforms and a plan to start within two weeks.",
        },
        {
          type: "p",
          text: "Some formats are built so you do not need to know anyone and still do not sit alone. MyTable does that every Sunday: take a seat, a host holds the vibe, four wines and bites. First the full list.",
        },
        { type: "h2", text: "Moving: the easiest way to make contact" },
        {
          type: "p",
          text: "In a group you do not need to be interesting. You are busy, conversation follows, and the activity removes social pressure.",
        },
        {
          type: "ul",
          items: [
            "Walking groups via community centres, Klup or local loneliness initiatives",
            "Cycling clubs without heavy commitments",
            "Yoga, swimming, boules: the real social moment is often the coffee afterwards",
          ],
        },
        {
          type: "h2",
          text: "Creative workshops that quietly connect",
        },
        {
          type: "p",
          text: "Your attention stays on the task. Conversation grows organically, not forced.",
        },
        {
          type: "ul",
          items: [
            "Cooking workshops (often €60 to €120 pp)",
            "Painting and dance classes",
            "Writing clubs, amateur music or a language course: shared learning goals bond fast",
          ],
        },
        {
          type: "h2",
          text: "Low threshold if social settings feel intense",
        },
        {
          type: "h3",
          text: "Wine tasting with a host at the table",
        },
        {
          type: "p",
          text: "MyTable hosts girls-only wine tastings on Sunday from 14:00 to 17:00 in multiple cities. Four wines, four chef's special bites, a host who keeps conversation moving. Solo €49, duo from €39, group from €44. All-in. Nobody has to rescue the chat: that is already handled.",
        },
        {
          type: "ul",
          items: [
            "Game nights in community centres",
            "Book clubs via the library",
            "Coffee mornings and neighbourhood meals",
          ],
        },
        {
          type: "h2",
          text: "Volunteering and neighbourhood initiatives",
        },
        {
          type: "ul",
          items: [
            "Community gardens, repair cafés or neighbour help via NLvoorelkaar",
            "Volunteering at a club, library or cultural centre",
            "Phone helplines: contact with meaning",
          ],
        },
        {
          type: "h2",
          text: "Platforms to find something in your city fast",
        },
        {
          type: "ul",
          items: [
            "Klup: large community, hundreds of weekly activities",
            "Meet5: focus on personal meetups",
            "SBG app: sport and culture",
            "Municipal social maps: search your city plus meet",
          ],
        },
        {
          type: "h2",
          text: "From intention to showing up in two weeks",
        },
        {
          type: "ul",
          items: [
            "Pick one activity close to your comfort zone",
            "Sign up within 24 hours",
            "Put it in your calendar like a fixed appointment",
            "Arrive five minutes early and give yourself permission to leave afterwards",
          ],
        },
        {
          type: "p",
          text: "Seeing the same people two or three times turns strangers into familiar faces. Repetition is the quiet engine behind new friendships.",
        },
        {
          type: "h2",
          text: "The offer is bigger than you think",
        },
        {
          type: "p",
          text: "From walking groups to workshops and organised tables: there is a format that fits you. Want a soft landing without anchors? Book a girls-only table with MyTable. Pick one option from this list, sign up today, and give it three weeks.",
        },
      ],
    },
  },
  {
    slug: "leuk-uitje-met-vriendinnen",
    category: "tips",
    publishedAt: "2026-07-20",
    readMinutes: 9,
    image: "/blog/leuk-uitje-met-vriendinnen.png",
    relatedPaths: [
      {
        path: "/agenda",
        label: {
          nl: "Boek een vriendinnentafel",
          en: "Book a friends table",
        },
      },
      {
        path: "/blog/met-vriendinnen-een-eigen-tafel",
        label: {
          nl: "Met vriendinnen een eigen tafel",
          en: "Your own table with friends",
        },
      },
    ],
    title: {
      nl: "Leuk uitje met vriendinnen: de beste ideeën voor elke smaak",
      en: "Fun outing with friends: the best ideas for every taste",
    },
    excerpt: {
      nl: "De groepsapp staat vol hartjes, maar niemand boekt. Culinaire, creatieve, wellness- en actieve ideeën plus een plan om het binnen tien minuten geregeld te hebben.",
      en: "The group chat is full of hearts, but nobody books. Culinary, creative, wellness and active ideas plus a plan to get it sorted in ten minutes.",
    },
    metaDescription: {
      nl: "Leuk uitje met vriendinnen plannen? Ideeën per smaak, eerlijke prijzen en hoe je zonder groepsapp-chaos boekt. Inclusief MyTable vanaf €39.",
      en: "Planning a fun outing with friends? Ideas by taste, honest prices and how to book without group-chat chaos. Including MyTable from €39.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Je kent het scenario. De groepsapp explodeert van emoji's: we moeten echt afspreken. Drie weken later is de enige update een slapende kat. Niemand heeft een datum geprikt. Motivatie is er wel. Keuzestress en niemand die doorpakt, dat is het probleem.",
        },
        {
          type: "p",
          text: "Hieronder: concrete ideeën per type uitje, wat het kost, en een aanpak om het binnen tien minuten geregeld te hebben. Wil je gewoon iets dat al klaarstaat? Dan is MyTable verderop precies dat.",
        },
        {
          type: "h2",
          text: "Culinair: proeven, lachen en bijpraten",
        },
        {
          type: "h3",
          text: "Wijnproeverij waarbij alles al geregeld is",
        },
        {
          type: "p",
          text: "MyTable: zondag 14:00 tot 17:00, vier wijnen met vier chef's special bites, een host aan tafel. Vaste prijzen: solo €49, duo vanaf €39, groep vanaf €44. Geen rekening splitsen, geen eindeloze datumprikker. Ideaal voor een kleine vriendinnengroep, een verjaardag, of als iemand solo meedoet.",
        },
        {
          type: "h3",
          text: "Foodtours en kookworkshops",
        },
        {
          type: "p",
          text: "Liever lopen en proeven? Culinaire stadstours in Rotterdam of Amsterdam werken goed. Kookworkshops geven meer structuur. Reken op €45 tot €85 p.p. en reserveer weekenden op tijd.",
        },
        {
          type: "h2",
          text: "Creatief: samen iets maken dat bijblijft",
        },
        {
          type: "ul",
          items: [
            "Keramiek voor een rustiger tempo",
            "Sip-and-paint met een glas erbij",
            "Cocktailworkshops voor groepen met energie",
            "Prijzen vaak €30 tot €80 p.p.; check groepsgrootte en of btw inbegrepen is",
          ],
        },
        {
          type: "h2",
          text: "Wellness: bijpraten zonder haast",
        },
        {
          type: "p",
          text: "Sauna of wellnessdag: €30 tot €70 p.p. werkt goed voor twee tot zes personen. Liever geen hitte? Groepsyoga of meditatie (€15 tot €35) met thee achteraf.",
        },
        {
          type: "h2",
          text: "Actief: voor vriendinnen met pit",
        },
        {
          type: "ul",
          items: [
            "Escape rooms: €20 tot €35 p.p., groepen van 2 tot 8",
            "Citygames voor grotere gezelschappen",
            "SUP of kano in voorjaar en zomer",
            "Indoor klimmen, bowlen of lasergamen in het laagseizoen (€10 tot €30)",
          ],
        },
        {
          type: "h2",
          text: "Wat kost een vriendinnenuitje écht?",
        },
        {
          type: "ul",
          items: [
            "Budget €10 tot €25: picknick, bowlen, yoga, wildplukwandeling",
            "Midden €39 tot €85: MyTable, workshops, escape rooms, stadstours",
            "Luxe €100+: wellnessarrangement, chef-workshop, sterrendiner",
          ],
        },
        {
          type: "p",
          text: "Spreek vooraf een maximum af. Laat één persoon boeken en Tikkie sturen. Kies aanbieders met een vaste prijs per persoon. MyTable werkt precies zo.",
        },
        {
          type: "h2",
          text: "Zo plan je het zonder groepsapp-chaos",
        },
        {
          type: "ul",
          items: [
            "Eén persoon neemt het initiatief",
            "Deel twee opties, niet tien",
            "Deadline van 48 uur voor reacties",
            "Boek daarna zonder verder overleg",
          ],
        },
        {
          type: "p",
          text: "Sluit de groepsapp even, kies een uitje, en reserveer vandaag. Bij MyTable kies je een datum, betaal je online en loop je zondag om 14:00 binnen.",
        },
      ],
      en: [
        {
          type: "p",
          text: "You know the scenario. The group chat explodes with emojis: we really need to meet. Three weeks later the only update is a sleeping cat. Nobody picked a date. Motivation is there. Choice overload and nobody taking the lead is the problem.",
        },
        {
          type: "p",
          text: "Below: concrete ideas by outing type, what it costs, and a way to sort it in ten minutes. Want something that is already set up? MyTable further down is exactly that.",
        },
        {
          type: "h2",
          text: "Culinary: taste, laugh and catch up",
        },
        {
          type: "h3",
          text: "A wine tasting where everything is handled",
        },
        {
          type: "p",
          text: "MyTable: Sunday 14:00 to 17:00, four wines with four chef's special bites, a host at the table. Fixed prices: solo €49, duo from €39, group from €44. No splitting bills, no endless date polls. Ideal for a small friend group, a birthday, or when someone joins solo.",
        },
        {
          type: "h3",
          text: "Food tours and cooking workshops",
        },
        {
          type: "p",
          text: "Prefer walking and tasting? Culinary city tours in Rotterdam or Amsterdam work well. Cooking workshops add more structure. Expect €45 to €85 pp and book weekends early.",
        },
        {
          type: "h2",
          text: "Creative: make something that sticks",
        },
        {
          type: "ul",
          items: [
            "Ceramics for a calmer pace",
            "Sip-and-paint with a glass in hand",
            "Cocktail workshops for high-energy groups",
            "Prices often €30 to €80 pp; check group size and VAT",
          ],
        },
        {
          type: "h2",
          text: "Wellness: catch up without rushing",
        },
        {
          type: "p",
          text: "Sauna or wellness day: €30 to €70 pp suits two to six people. Prefer no heat? Group yoga or meditation (€15 to €35) with tea afterwards.",
        },
        {
          type: "h2",
          text: "Active: for friends with energy",
        },
        {
          type: "ul",
          items: [
            "Escape rooms: €20 to €35 pp, groups of 2 to 8",
            "City games for larger groups",
            "SUP or canoeing in spring and summer",
            "Indoor climbing, bowling or laser tag off-season (€10 to €30)",
          ],
        },
        {
          type: "h2",
          text: "What does a friends outing really cost?",
        },
        {
          type: "ul",
          items: [
            "Budget €10 to €25: picnic, bowling, yoga, foraging walk",
            "Mid €39 to €85: MyTable, workshops, escape rooms, city tours",
            "Luxe €100+: wellness package, chef workshop, fine dining",
          ],
        },
        {
          type: "p",
          text: "Agree a maximum upfront. Let one person book and send a payment request. Prefer fixed per-person prices. MyTable works exactly like that.",
        },
        {
          type: "h2",
          text: "How to plan without group-chat chaos",
        },
        {
          type: "ul",
          items: [
            "One person takes the lead",
            "Share two options, not ten",
            "48-hour deadline for replies",
            "Book afterwards without more debate",
          ],
        },
        {
          type: "p",
          text: "Close the chat for a moment, pick an outing, and reserve today. With MyTable you pick a date, pay online and walk in Sunday at 14:00.",
        },
      ],
    },
  },
  {
    slug: "vriendinnenuitje-in-nederland",
    category: "tips",
    publishedAt: "2026-07-19",
    readMinutes: 9,
    image: "/blog/vriendinnenuitje-in-nederland.png",
    relatedPaths: [
      {
        path: "/agenda",
        label: {
          nl: "Bekijk open zondagen",
          en: "See open Sundays",
        },
      },
      {
        path: "/blog/leuk-uitje-met-vriendinnen",
        label: {
          nl: "Leuk uitje met vriendinnen",
          en: "Fun outing with friends",
        },
      },
    ],
    title: {
      nl: "De beste ideeën voor een vriendinnenuitje in Nederland",
      en: "The best ideas for a girls' day out in the Netherlands",
    },
    excerpt: {
      nl: "Shortlist in vijf minuten: actief, creatief, culinair of wellness. Wat het kost, hoe je een datum prikt, en het uitje waarbij jij niets hoeft te regelen.",
      en: "A shortlist in five minutes: active, creative, culinary or wellness. What it costs, how to lock a date, and the outing where you arrange nothing.",
    },
    metaDescription: {
      nl: "Vriendinnenuitje in Nederland: beste ideeën per type, budgetten van €15 tot €120, plannings tips en MyTable als all-in optie.",
      en: "Girls' day out in the Netherlands: best ideas by type, budgets from €15 to €120, planning tips and MyTable as an all-in option.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "De WhatsApp-groep staat weken vol hartjes, maar een datum ontbreekt. Iedereen wil, niemand pakt door. Goed nieuws: jij leest dit, dus jij hakt vandaag de knoop door. In vijf minuten heb je een shortlist, weet je wat het kost, en kun je boeken.",
        },
        {
          type: "h2",
          text: "Actief: van escape room tot suppen",
        },
        {
          type: "p",
          text: "Als iedereen ergens mee bezig is, gaat het gesprek vanzelf. Escape rooms en citygames werken voor twee tot zes personen. Buiten: SUP, elektrische chopper of wildplukwandeling. Reken op €30 tot €60 p.p. Amsterdam, Rotterdam en Utrecht hebben het breedste aanbod; buiten de Randstad zijn Veluwe, Zeeland en Limburg sterk voor een weekend.",
        },
        {
          type: "h2",
          text: "Creatieve workshops: iets om mee naar huis te nemen",
        },
        {
          type: "p",
          text: "Sieraden, tassen, cocktails of koken: je leert iets nieuws en gaat naar huis met een aandenken. Vaak €40 tot €75 p.p. inclusief materiaal. Creatief talent is geen vereiste.",
        },
        {
          type: "h2",
          text: "Culinair voor de lekkerbekken",
        },
        {
          type: "p",
          text: "Wijnproeverijen zijn al jaren favoriet: luxe maar laagdrempelig, leren zonder college-sfeer. Kwalitatieve proeverijen liggen vaak tussen €35 en €65. Culinaire stadswandelingen combineren ontdekken en proeven. High tea is een goed alcoholvrij alternatief.",
        },
        {
          type: "h2",
          text: "Wellness: niets hoeven doen, samen",
        },
        {
          type: "p",
          text: "Sauna blijft een klassieker (€13 tot €45 entre). Met lunch of een kleine proeverij voelt het als een minivakantie. Budgetvriendelijk: begeleide natuurwandeling of buitenyoga (€15 tot €30).",
        },
        {
          type: "h2",
          text: "Zo prik je eindelijk een datum",
        },
        {
          type: "ul",
          items: [
            "Drie datums in een poll, reageren binnen 24 uur",
            "Meeste stemmen wint, geen eindeloos onderhandelen",
            "Eén organisator boekt en stuurt één overzichtsbericht",
            "Budget afspreken: €15–30 / €40–70 / €80–120+",
          ],
        },
        {
          type: "p",
          text: "Tel vervoer en drankjes erbij. Bij all-in prijzen weet je vooraf waar je aan toe bent.",
        },
        {
          type: "h2",
          text: "Het vriendinnenuitje waarbij jij niets regelt",
        },
        {
          type: "p",
          text: "MyTable organiseert girls-only wijnspijs-proeverijen op vaste zondagen in meerdere steden. Eigen tafel voor jullie groepje, host voor sfeer en uitleg, vier wijnen en bites. Solo €49, duo vanaf €39, groep vanaf €44. Geen datumprikker, geen menu-discussie. Jij komt opdagen.",
        },
        {
          type: "h2",
          text: "Kort beantwoord",
        },
        {
          type: "h3",
          text: "Wat werkt voor een kleine groep?",
        },
        {
          type: "p",
          text: "Escape rooms, creatieve workshops en wijnproeverijen: compact, intiem, genoeg structuur.",
        },
        {
          type: "h3",
          text: "Hoe plan je zonder eindeloos appen?",
        },
        {
          type: "p",
          text: "Datumpoll met deadline, één organisator, vaste prijs. Klaar.",
        },
        {
          type: "p",
          text: "Kies één uitje, stuur de link naar de groep, zet een echte datum. Bij MyTable staat het programma al klaar.",
        },
      ],
      en: [
        {
          type: "p",
          text: "The WhatsApp group has been full of hearts for weeks, but there is still no date. Everyone wants to, nobody takes the lead. Good news: you are reading this, so you decide today. In five minutes you have a shortlist, know the cost, and can book.",
        },
        {
          type: "h2",
          text: "Active: from escape room to SUP",
        },
        {
          type: "p",
          text: "When everyone is busy with something, conversation follows. Escape rooms and city games suit two to six people. Outside: SUP, e-chopper or foraging walk. Expect €30 to €60 pp. Amsterdam, Rotterdam and Utrecht have the widest offer; outside the Randstad, Veluwe, Zeeland and Limburg work well for a weekend.",
        },
        {
          type: "h2",
          text: "Creative workshops: something to take home",
        },
        {
          type: "p",
          text: "Jewellery, bags, cocktails or cooking: you learn something and leave with a keepsake. Often €40 to €75 pp including materials. Creative talent is not required.",
        },
        {
          type: "h2",
          text: "Culinary for the food lovers",
        },
        {
          type: "p",
          text: "Wine tastings have been a favourite for years: luxe but accessible, learning without lecture vibes. Quality tastings often sit between €35 and €65. Culinary city walks combine exploring and tasting. High tea is a strong alcohol-free alternative.",
        },
        {
          type: "h2",
          text: "Wellness: doing nothing, together",
        },
        {
          type: "p",
          text: "Sauna remains a classic (€13 to €45 entry). Add lunch or a small tasting and it feels like a mini break. Budget-friendly: guided nature walk or outdoor yoga (€15 to €30).",
        },
        {
          type: "h2",
          text: "How to finally lock a date",
        },
        {
          type: "ul",
          items: [
            "Three dates in a poll, reply within 24 hours",
            "Most votes wins, no endless negotiation",
            "One organiser books and sends one summary message",
            "Agree a budget: €15–30 / €40–70 / €80–120+",
          ],
        },
        {
          type: "p",
          text: "Add transport and drinks. With all-in prices you know the cost upfront.",
        },
        {
          type: "h2",
          text: "The girls' day where you arrange nothing",
        },
        {
          type: "p",
          text: "MyTable hosts girls-only wine-and-bite tastings on fixed Sundays in multiple cities. Your own table for the group, a host for vibe and notes, four wines and bites. Solo €49, duo from €39, group from €44. No date poll, no menu debate. You just show up.",
        },
        {
          type: "h2",
          text: "Quick answers",
        },
        {
          type: "h3",
          text: "What works for a small group?",
        },
        {
          type: "p",
          text: "Escape rooms, creative workshops and wine tastings: compact, intimate, enough structure.",
        },
        {
          type: "h3",
          text: "How do you plan without endless chats?",
        },
        {
          type: "p",
          text: "Date poll with a deadline, one organiser, fixed price. Done.",
        },
        {
          type: "p",
          text: "Pick one outing, send the link to the group, set a real date. With MyTable the programme is already ready.",
        },
      ],
    },
  },
  {
    slug: "leuke-activiteiten-alleen",
    category: "girls-only",
    publishedAt: "2026-07-18",
    readMinutes: 8,
    image: "/blog/leuke-activiteiten-alleen.png",
    relatedPaths: [
      {
        path: "/agenda",
        label: {
          nl: "Solo een tafel boeken",
          en: "Book a table solo",
        },
      },
      {
        path: "/blog/solo-naar-een-girls-only-wijnproeverij",
        label: {
          nl: "Solo naar een girls-only proeverij",
          en: "Going solo to a girls-only tasting",
        },
      },
    ],
    title: {
      nl: "Leuke activiteiten alleen: de beste solo-uitjes in Nederland",
      en: "Fun things to do alone: the best solo outings in the Netherlands",
    },
    excerpt: {
      nl: "Alleen iets doen is geen troostprijs. Cultuur, natuur, zelfzorg en sociale solo-uitjes die wél werken, plus hoe je de eerste keer zonder zenuwen aangaat.",
      en: "Doing something alone is not a consolation prize. Culture, nature, self-care and social solo outings that work, plus how to do the first time without nerves.",
    },
    metaDescription: {
      nl: "Leuke activiteiten alleen in Nederland: musea, wandelen, workshops en girls-only wijnproeverijen. Praktische tips voor je eerste solo-uitje.",
      en: "Fun solo activities in the Netherlands: museums, walks, workshops and girls-only wine tastings. Practical tips for your first solo outing.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Zondagmiddag, vrienden hebben andere plannen, lege agenda. De meeste mensen scrollen. Anderen gaan gewoon zelf. Alleen iets ondernemen is geen troostprijs: het is vrijheid in je eigen tempo, en soms onverwachte gesprekken.",
        },
        {
          type: "h2",
          text: "Culturele solo-uitjes",
        },
        {
          type: "p",
          text: "In een museum met een groep doe je altijd concessies. Solo ga je zo snel of langzaam als jij wilt. Audiotours bij Rijksmuseum of Van Gogh helpen. Museumkaart rond €65 per jaar maakt vaker gaan goedkoper. Filmhuizen zoals Eye geven hetzelfde: telefoon uit, focus aan.",
        },
        {
          type: "p",
          text: "Workshops (koken, pottenbakken, schilderen) werken verrassend goed solo: je komt voor de ervaring, contact is bijproduct. Vaak €35 tot €75.",
        },
        {
          type: "h2",
          text: "Buiten: wandelen en fietsen",
        },
        {
          type: "ul",
          items: [
            "NS-wandelingen: vanaf een station, goed gemarkeerd",
            "Knapzakroutes in Drenthe: zelf bepalen hoe lang",
            "Een etappe van het Pieterpad is al een complete dag",
            "Streetart-routes in Rotterdam of Amsterdam: wandelen, kijken, foto's",
          ],
        },
        {
          type: "h2",
          text: "Sociale solo-uitjes: alleen gaan, toch verbinding",
        },
        {
          type: "p",
          text: "Alleen zijn is niet hetzelfde als eenzaam zijn. Bij een girls-only wijnproeverij van MyTable schuif je aan, staat er een glas, en begint de host over de wijn. Binnen vijf minuten praat je met je buur. Het gespreksonderwerp ligt al op tafel.",
        },
        {
          type: "p",
          text: "Format: zondag 14:00 tot 17:00, vier wijnen, vier bites, host die de sfeer bewaakt. Solo €49 all-in. Boeken online zonder groepsplanning. Na een kwartier is het gevoel is dit niet raar meestal weg.",
        },
        {
          type: "h2",
          text: "Zelfzorg en ontspanning",
        },
        {
          type: "ul",
          items: [
            "Sauna: €20 tot €35 voor een dagdeel",
            "Massage of behandeling: €40 tot €70",
            "Gratis of bijna gratis: park, bibliotheek, dagkaart sportschool",
          ],
        },
        {
          type: "h2",
          text: "Zo pak je de eerste keer aan",
        },
        {
          type: "ul",
          items: [
            "Deel je plan met iemand thuis",
            "Opgeladen telefoon en powerbank",
            "Begin in een omgeving die je al kent",
            "Bouw op: koffie → museum → gedeelde tafel",
          ],
        },
        {
          type: "p",
          text: "Leuke activiteiten alleen gaan over vrijheid, niet over eenzaamheid. Wil je solo beginnen maar niet alleen blijven? Boek een MyTable-zondag. Kom gewoon. De zondagmiddag wacht niet.",
        },
      ],
      en: [
        {
          type: "p",
          text: "Sunday afternoon, friends have other plans, empty calendar. Most people scroll. Others just go. Doing something alone is not a consolation prize: it is freedom at your own pace, and sometimes unexpected conversations.",
        },
        {
          type: "h2",
          text: "Cultural solo outings",
        },
        {
          type: "p",
          text: "In a museum with a group you always compromise. Solo you go as fast or slow as you want. Audio tours at the Rijksmuseum or Van Gogh help. A Museumkaart around €65 a year makes frequent visits cheaper. Film houses like Eye give the same: phone off, focus on.",
        },
        {
          type: "p",
          text: "Workshops (cooking, pottery, painting) work surprisingly well solo: you come for the experience, contact is a byproduct. Often €35 to €75.",
        },
        {
          type: "h2",
          text: "Outdoors: walking and cycling",
        },
        {
          type: "ul",
          items: [
            "NS walks: start at a station, clearly marked",
            "Knapzak routes in Drenthe: choose your own length",
            "One stage of the Pieterpad is already a full day",
            "Street-art routes in Rotterdam or Amsterdam: walk, look, shoot",
          ],
        },
        {
          type: "h2",
          text: "Social solo outings: go alone, still connect",
        },
        {
          type: "p",
          text: "Being alone is not the same as being lonely. At a MyTable girls-only wine tasting you sit down, a glass is waiting, and the host starts on the wine. Within five minutes you are talking to your neighbour. The conversation topic is already on the table.",
        },
        {
          type: "p",
          text: "Format: Sunday 14:00 to 17:00, four wines, four bites, a host holding the vibe. Solo €49 all-in. Book online without group planning. After fifteen minutes the is this weird feeling is usually gone.",
        },
        {
          type: "h2",
          text: "Self-care and downtime",
        },
        {
          type: "ul",
          items: [
            "Sauna: €20 to €35 for a half day",
            "Massage or treatment: €40 to €70",
            "Free or almost free: park, library, day pass at the gym",
          ],
        },
        {
          type: "h2",
          text: "How to handle the first time",
        },
        {
          type: "ul",
          items: [
            "Share your plan with someone at home",
            "Charged phone and power bank",
            "Start somewhere you already know",
            "Build up: coffee → museum → shared table",
          ],
        },
        {
          type: "p",
          text: "Fun solo activities are about freedom, not loneliness. Want to start solo but not stay alone? Book a MyTable Sunday. Just go. Sunday afternoon will not wait.",
        },
      ],
    },
  },
  {
    slug: "solo-uitjes-in-nederland",
    category: "girls-only",
    publishedAt: "2026-07-17",
    readMinutes: 8,
    image: "/blog/solo-uitjes-in-nederland.png",
    relatedPaths: [
      {
        path: "/agenda",
        label: {
          nl: "Reserveer een solo-plek",
          en: "Reserve a solo seat",
        },
      },
      {
        path: "/blog/leuke-activiteiten-alleen",
        label: {
          nl: "Leuke activiteiten alleen",
          en: "Fun things to do alone",
        },
      },
    ],
    title: {
      nl: "Solo uitjes in Nederland: de beste ideeën voor jou",
      en: "Solo outings in the Netherlands: the best ideas for you",
    },
    excerpt: {
      nl: "Solo is geen plan B. Cultuur, natuur, culinair en sociaal: ideeën per type, slimme voorbereiding en waarom een gedeelde tafel zo goed werkt.",
      en: "Solo is not plan B. Culture, nature, food and social: ideas by type, smart prep and why a shared table works so well.",
    },
    metaDescription: {
      nl: "Solo uitjes in Nederland: musea, wandelroutes, stadstours en girls-only wijnproeverijen. Tips, budgetten en hoe je dit weekend nog boekt.",
      en: "Solo outings in the Netherlands: museums, walking routes, city tours and girls-only wine tastings. Tips, budgets and how to book this weekend.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Vrije dag, zon, lege kalender. Vrienden hebben het druk. Thuisblijven of toch dat solo-uitje? De bank wint te vaak. Solo in Nederland is een eigen categorie met voordelen die je pas snapt als je het een keer doet.",
        },
        {
          type: "h2",
          text: "Waarom alleen op pad onderschat is",
        },
        {
          type: "p",
          text: "Niemand staart naar je in het museum. Iedereen is met zichzelf bezig. Jij bepaalt tempo, zalen en lunch. En je bent aanspreekbaarder: interessante gesprekken ontstaan sneller als je niet in een gesloten groep zit.",
        },
        {
          type: "h2",
          text: "Cultuur en stad op jouw tempo",
        },
        {
          type: "ul",
          items: [
            "Musea met audiogids: Rijksmuseum, Mauritshuis, Voorlinden",
            "Doordeweeks rustiger; Museumkaart loont bij vaker gaan",
            "Gratis of fooi-based stadstours in grote steden",
            "Compacte steden als Haarlem, Utrecht en Delft zijn makkelijk solo",
          ],
        },
        {
          type: "h2",
          text: "Natuur en beweging",
        },
        {
          type: "p",
          text: "Veluwe, Drentse heide, Bollenstreek: klassiekers met reden. NS-wandelingen zijn duidelijk bewegwijzerd. Wadlopen of SUP doen vaak in groepsverband met gids: jij komt solo, maar bent nooit alleen. Boulderen in een klimhal vraagt geen partner.",
        },
        {
          type: "h2",
          text: "Culinair: alleen aan tafel zonder eenzaam gevoel",
        },
        {
          type: "p",
          text: "Barkrukken aan een open keuken helpen. Nog sterker: formats waarin verbinding is ingebouwd. MyTable is girls-only, elke zondag, meerdere steden. Je schuift aan bij een gedeelde tafel, een host begeleidt vier wijnen met hapjes van 14:00 tot 17:00. Solo €49. De setting forceert het gesprek niet; ze maakt het makkelijk.",
        },
        {
          type: "h2",
          text: "Zo plan je het zonder gedoe",
        },
        {
          type: "ul",
          items: [
            "Boek vooraf: weekenden raken snel vol",
            "OV voorkomt parkeerstress",
            "Budget: stadstour bijna gratis, museum €15–25, proeverij vanaf €39",
            "Deel je route met iemand thuis",
          ],
        },
        {
          type: "h2",
          text: "Kort beantwoord",
        },
        {
          type: "h3",
          text: "Leuke solo-opties voor een weekend?",
        },
        {
          type: "p",
          text: "Museum in Amsterdam of Den Haag, Veluwe-wandeling, wadlopen, of een culinaire proeverij aan een gedeelde tafel.",
        },
        {
          type: "h3",
          text: "Is solo geschikt als je single bent?",
        },
        {
          type: "p",
          text: "Absoluut. Je hebt geen rekening te houden met andermans voorkeuren, en groepsactiviteiten met structuur maken contact bijna vanzelfsprekend.",
        },
        {
          type: "p",
          text: "Kies nu één idee en reserveer voor aankomend weekend. Solo is niet stoer of zielig. Het is iets wat je voor jezelf doet.",
        },
      ],
      en: [
        {
          type: "p",
          text: "Free day, sun, empty calendar. Friends are busy. Stay home or finally take that solo outing? The sofa wins too often. Solo in the Netherlands is its own category, with benefits you only get once you try it.",
        },
        {
          type: "h2",
          text: "Why going alone is underrated",
        },
        {
          type: "p",
          text: "Nobody is staring at you in the museum. Everyone is busy with themselves. You set the pace, the rooms and the lunch. And you are more approachable: interesting conversations start faster when you are not in a closed group.",
        },
        {
          type: "h2",
          text: "Culture and city at your pace",
        },
        {
          type: "ul",
          items: [
            "Museums with audio guides: Rijksmuseum, Mauritshuis, Voorlinden",
            "Weekdays are quieter; a Museumkaart pays off if you go often",
            "Free or tip-based city tours in major cities",
            "Compact cities like Haarlem, Utrecht and Delft are easy solo",
          ],
        },
        {
          type: "h2",
          text: "Nature and movement",
        },
        {
          type: "p",
          text: "Veluwe, Drenthe heath, bulb region: classics for a reason. NS walks are clearly marked. Mudflat walking or SUP often run in guided groups: you arrive solo but are never alone. Bouldering in a climbing gym needs no partner.",
        },
        {
          type: "h2",
          text: "Food: alone at the table without feeling lonely",
        },
        {
          type: "p",
          text: "Bar seats at an open kitchen help. Stronger still: formats where connection is built in. MyTable is girls-only, every Sunday, multiple cities. You join a shared table, a host guides four wines with bites from 14:00 to 17:00. Solo €49. The setting does not force conversation; it makes it easy.",
        },
        {
          type: "h2",
          text: "How to plan it without hassle",
        },
        {
          type: "ul",
          items: [
            "Book ahead: weekends fill up fast",
            "Public transport avoids parking stress",
            "Budget: city tour almost free, museum €15–25, tasting from €39",
            "Share your route with someone at home",
          ],
        },
        {
          type: "h2",
          text: "Quick answers",
        },
        {
          type: "h3",
          text: "Good solo options for a weekend?",
        },
        {
          type: "p",
          text: "A museum in Amsterdam or The Hague, a Veluwe walk, mudflat walking, or a culinary tasting at a shared table.",
        },
        {
          type: "h3",
          text: "Is solo suitable if you are single?",
        },
        {
          type: "p",
          text: "Absolutely. You do not have to match someone else's preferences, and structured group activities make contact almost automatic.",
        },
        {
          type: "p",
          text: "Pick one idea now and reserve for this weekend. Solo is not brave or sad. It is something you do for yourself.",
        },
      ],
    },
  },
];
