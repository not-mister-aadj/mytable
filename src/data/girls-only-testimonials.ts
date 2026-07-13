import type { Locale } from "@/i18n/config";
import type { Testimonial, TestimonialAvatar } from "@/data/testimonials";

const avatars: TestimonialAvatar[] = ["rose", "burgundy", "gold", "wine"];

function pickAvatar(index: number): TestimonialAvatar {
  return avatars[index % avatars.length]!;
}

/** SGC-style voice: pain-first, solo normalized, surprise > expectation, conversational Dutch. */
const girlsOnlyNl: Testimonial[] = [
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "Ik kwam solo en was echt nerveus. Maar aan tafel zaten groepen én andere girls die alleen kwamen. Binnen tien minuten zat ik al hard te lachen.",
    initials: "N",
    avatar: pickAvatar(0),
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "Mijn vriendinnen konden niet, dus dacht ik: whatever, ik ga gewoon solo. En het voelde alsof ik met gezellige meiden uit eten was. Solo komen is hier echt normaal.",
    initials: "NA",
    avatar: pickAvatar(1),
  },
  {
    name: "Britt",
    detail: "Den Haag · solo",
    quote:
      "Geen volle groep, dus alleen gegaan. Ik was bang dat ik de enige zou zijn die dat deed, maar dat was totaal niet zo. Gewoon opdagen en genieten. Zo makkelijk kan het zijn.",
    initials: "B",
    avatar: pickAvatar(2),
  },
  {
    name: "Emma",
    detail: "Amsterdam · net verhuisd",
    quote:
      "Net verhuisd en ik ken hier nog niemand echt. Toch een hele fijne middag gehad. Niet per se om nieuwe vriendinnen te maken, maar gewoon om er even uit te zijn. En ja, de wijn was ook echt goed.",
    initials: "E",
    avatar: pickAvatar(3),
  },
  {
    name: "Meera",
    detail: "Rotterdam · solo",
    quote:
      "Ik ben best introvert en ging met tegenzin alleen. Maar het draaide vooral om de wijn en de sfeer, niet om constant praten. Dat maakte het juist relaxed voor mij.",
    initials: "M",
    avatar: pickAvatar(4),
  },
  {
    name: "Lisa",
    detail: "Rotterdam · met 3 vriendinnen",
    quote:
      "Mijn vriendinnen zijn allemaal druk met kids, dus met mijn zus en twee vriendinnen gereserveerd. Oké wacht… veel leuker dan ik had verwacht. Geen datumprikkers, gewoon zondagmiddag wijn en kletsen.",
    initials: "L",
    avatar: pickAvatar(5),
  },
  {
    name: "Sanne",
    detail: "Den Haag · groep van 4",
    quote:
      "We wilden iets leuks op zondag, maar niemand kon mee. Dus met z'n vieren zelf geboekt. Binnen een kwartier zaten we al te lachen alsof we al jaren samen uit eten.",
    initials: "S",
    avatar: pickAvatar(6),
  },
  {
    name: "Fleur",
    detail: "Utrecht · met vriendinnen",
    quote:
      "Eindelijk geen 'waar gaan we eten?'-groepchat meer. Eén reservering, vier wijnen, en een middag die gewoon gezellig was. Zo doen we het voortaan.",
    initials: "FL",
    avatar: pickAvatar(7),
  },
  {
    name: "Carmen",
    detail: "Maastricht · verjaardag met meiden",
    quote:
      "Verjaardag met mijn meiden gevierd. Ik dacht dat het misschien awkward zou worden met allemaal wijnpraat, maar het was vooral lachen en bijpraten. Iedereen vroeg meteen wanneer de volgende was.",
    initials: "C",
    avatar: pickAvatar(8),
  },
  {
    name: "Priya",
    detail: "Amsterdam · groep van 5",
    quote:
      "Vijf vriendinnen, één tafel, nul stress. De wijnen waren verrassend goed en we hoefden nergens over na te denken. Waarom hebben we dit niet eerder gedaan?",
    initials: "P",
    avatar: pickAvatar(9),
  },
  {
    name: "Sophie",
    detail: "Rotterdam · met beste vriendinnen",
    quote:
      "Ging met mijn twee beste vriendinnen. Precies dat gevoel van uit eten met je meiden, zonder dat iemand de rekening hoeft te splitsen of het menu hoeft te kiezen.",
    initials: "SO",
    avatar: pickAvatar(10),
  },
  {
    name: "Anouk",
    detail: "Utrecht · met vriendin",
    quote:
      "Ik dacht: dit wordt vast heel wine-y en serieuze wijnpraat. Was het niet. Gewoon kletsen over werk, leven en af en toe iets over de wijn. Precies goed.",
    initials: "A",
    avatar: pickAvatar(11),
  },
];

const girlsOnlyEn: Testimonial[] = [
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "I came solo and was genuinely nervous. But there were groups and other girls who came alone too. Within ten minutes I was laughing hard.",
    initials: "N",
    avatar: pickAvatar(0),
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "My friends couldn't make it, so I thought: whatever, I'll just go solo. And it felt like dining out with fun girls. Coming alone is totally normal here.",
    initials: "NA",
    avatar: pickAvatar(1),
  },
  {
    name: "Britt",
    detail: "The Hague · solo",
    quote:
      "No full group, so I went alone. I was scared I'd be the only one doing that, but that wasn't the case at all. Just show up and enjoy. It can be that easy.",
    initials: "B",
    avatar: pickAvatar(2),
  },
  {
    name: "Emma",
    detail: "Amsterdam · new in town",
    quote:
      "Just moved and I don't really know anyone here yet. Still had a lovely afternoon. Not necessarily to make new friends, just to get out. And yes, the wine was really good too.",
    initials: "E",
    avatar: pickAvatar(3),
  },
  {
    name: "Meera",
    detail: "Rotterdam · solo",
    quote:
      "I'm pretty introverted and went alone reluctantly. But it was mostly about the wine and the vibe, not constant talking. That actually made it relaxed for me.",
    initials: "M",
    avatar: pickAvatar(4),
  },
  {
    name: "Lisa",
    detail: "Rotterdam · with 3 friends",
    quote:
      "All my friends are busy with kids, so I booked with my sister and two friends. Okay wait… way more fun than I expected. No date polls, just Sunday afternoon wine and chatting.",
    initials: "L",
    avatar: pickAvatar(5),
  },
  {
    name: "Sanne",
    detail: "The Hague · group of 4",
    quote:
      "We wanted something fun on Sunday, but nobody could make it. So the four of us booked ourselves. Within fifteen minutes we were laughing like we'd been dining out together for years.",
    initials: "S",
    avatar: pickAvatar(6),
  },
  {
    name: "Fleur",
    detail: "Utrecht · with friends",
    quote:
      "Finally no more 'where should we eat?' group chat. One reservation, four wines, and an afternoon that just felt cozy. This is how we do it from now on.",
    initials: "FL",
    avatar: pickAvatar(7),
  },
  {
    name: "Carmen",
    detail: "Maastricht · birthday with the girls",
    quote:
      "Celebrated my birthday with my crew. I thought it might feel awkward with all the wine talk, but it was mostly laughing and catching up. Everyone immediately asked when the next one was.",
    initials: "C",
    avatar: pickAvatar(8),
  },
  {
    name: "Priya",
    detail: "Amsterdam · group of 5",
    quote:
      "Five friends, one table, zero stress. The wines were surprisingly good and we didn't have to think about anything. Why didn't we do this sooner?",
    initials: "P",
    avatar: pickAvatar(9),
  },
  {
    name: "Sophie",
    detail: "Rotterdam · with best friends",
    quote:
      "Went with my two best friends. Exactly that dinner-out-with-your-girls feeling, without anyone splitting the bill or picking the menu.",
    initials: "SO",
    avatar: pickAvatar(10),
  },
  {
    name: "Anouk",
    detail: "Utrecht · with a friend",
    quote:
      "I thought it would be very wine-y and serious wine talk. It wasn't. Just chatting about work, life, and the wine now and then. Exactly right.",
    initials: "A",
    avatar: pickAvatar(11),
  },
];

export function getGirlsOnlyTestimonials(locale: Locale): Testimonial[] {
  return locale === "nl" ? girlsOnlyNl : girlsOnlyEn;
}

export function splitGirlsOnlyTestimonialRows(items: Testimonial[]): {
  top: Testimonial[];
  bottom: Testimonial[];
} {
  const top = items.filter((_, i) => i % 2 === 0);
  const bottom = items.filter((_, i) => i % 2 === 1);
  return { top, bottom };
}
